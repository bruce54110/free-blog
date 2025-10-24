# Rust + PostgreSQL：deadpool 和 diesel 数据库连接池实战（四）

我使用Rust开发RTMate的想法是实现一个提供Websocket连接服务的平台，免去大家自建Websocket服务。在这当中自然要对不同的租户以及不同租户下的客户端进行管理，对客户端需要认证、连接登记、统计。所以我选择PostgreSQL作为底层数据库。操作数据库需要使用数据库连接，数据库连接的创建对机器性能的消耗较昂贵的，自然要使用连接池来管理数据库连接了。Rust 语言中同步与异步并存，在Rust 当中如何构建一个 PostgreSQL 数据库连接池呢？在项目中使用ORM 框架又如何使用连接池中的数据库连接呢？本文来一探究竟。

GitHub地址：[RTMate](https://github.com/BruceZhang54110/RTMate)

在开发 RTMate 过程中，意识到每次查询都建立新的数据库连接会带来性能问题，于是开始研究 Rust 里的数据库连接池方案。试了几个库之后，最终选择了 deadpool + diesel 的组合。这里记录下使用过程中遇到的问题和解决方案。

## diesel 基础用法回顾

选择 diesel 主要是看中它的类型安全，编译时就能发现 SQL 字段类型错误，比运行时报错强多了。而且 crates.io 官方都在用，应该比较靠谱。

基本用法就不详细说了，官方文档写得挺清楚：https://diesel.rs/guides/getting-started.html

简单回顾下核心概念：

**1. Schema 定义（自动生成）**

用 diesel CLI 生成 schema，直接读数据库表结构：

```bash
diesel print-schema
```

比如这个简单的 posts 表：

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE
)
```

生成的 schema 长这样：

```rust
// @generated automatically by Diesel CLI.

diesel::table! {
    posts (id) {
        id -> Int4,
        title -> Varchar,
        body -> Text,
        published -> Bool,
    }
}
```

**2. Model 定义**

```rust
use diesel::prelude::*;

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::posts)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Post {
    pub id: i32,
    pub title: String,
    pub body: String,
    pub published: bool,
}
```

**3. 基础连接和查询**

最原始的用法是每次都建连接：

```rust
use diesel::prelude::*;
use dotenvy::dotenv;
use std::env;

pub fn establish_connection() -> PgConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    PgConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}
```

然后就可以直接查询了：

```rust
use self::models::*;
use diesel::prelude::*;
use diesel_demo::*;

fn main() {
    use self::schema::posts::dsl::*;

    let connection = &mut establish_connection();
    let results = posts
        .filter(published.eq(true))
        .limit(5)
        .select(Post::as_select())
        .load(connection)
        .expect("Error loading posts");

    println!("Displaying {} posts", results.len());
    for post in results {
        println!("{}", post.title);
        println!("-----------\n");
        println!("{}", post.body);
    }
}
```

## 连接池的必要性

上面这种每次建连接的方式在开发阶段还行，但生产环境绝对不行。PostgreSQL 创建连接的开销比较大，而且有连接数限制。

每次建立连接都需要经过 TCP 握手、身份验证、参数协商等步骤，在高并发场景下会成为性能瓶颈。而且数据库服务器的最大连接数是有限的，如果每个请求都创建新连接，很容易耗尽连接资源。

所以必须用连接池，让连接可以复用，避免重复的连接创建开销。

## deadpool + diesel 连接池实战

研究了几个连接池方案，最终选择 deadpool。主要原因：
1. 原生支持异步
2. 有专门的 deadpool_diesel 包
3. 配置简单，文档还算清楚

先看看我项目中的实际代码，这是客户端连接记录表的定义：

**Schema：**

```rust
diesel::table! {
    rt_client_connection (id) {
        id -> Int8,
        app_id -> Int8,
        #[max_length = 100]
        rt_app -> Varchar,
        #[max_length = 100]
        client_id -> Varchar,
        #[max_length = 100]
        connect_token -> Varchar,
        used -> Bool,
        created_time -> Nullable<Timestamptz>,
        expire_time -> Nullable<Timestamptz>,
    }
}
```

**Model：**

```rust
#[derive(Queryable, Selectable,Deserialize, Serialize, Debug)]
#[diesel(table_name = rt_client_connection)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct RtClientConnection {
    pub id: i64,
    pub app_id: i64,
    pub rt_app: String,
    pub client_id: String,
    pub connect_token: String,
    pub used: bool,
    pub created_time: Option<DateTime<Utc>>,
    pub expire_time: Option<DateTime<Utc>>,
}
```

**连接池封装：**

```rust
use deadpool_diesel::Runtime;
use deadpool_diesel::postgres::BuildError;
use deadpool_diesel::postgres::Manager;
use deadpool_diesel::postgres::Pool;
use deadpool_diesel::Timeouts;
use deadpool_diesel::postgres::Object;

#[derive(Clone)]
pub struct DataSource {
    pool: deadpool_diesel::Pool<deadpool_diesel::Manager<diesel::PgConnection>>,
}

impl DataSource {
    pub async fn new() -> anyhow::Result<Self> {
        dotenvy::dotenv().map_err(PoolError::Env)?;

        let db_config = DbConfig::from_env()
            .map_err(|e| anyhow::anyhow!("Failed to load database configuration: {}", e))?;
        
        let manager = Manager::new(db_config.database_url, Runtime::Tokio1);
        let pool: deadpool_diesel::Pool<deadpool_diesel::Manager<diesel::PgConnection>> = Pool::builder(manager)
            .max_size(db_config.max_connections)
            .timeouts(db_config.timeouts)
            .build()
            .map_err(PoolError::PoolBuildError)?;

        Ok(DataSource { pool })
    }

    pub async fn get_connection(&self) -> anyhow::Result<Object> {
        let conn = self.pool.get().await?;
        Ok(conn)
    }
}
```

**插入操作：**

```rust
async fn save_connect_token(&self, new_connection: NewRtClientConnection) -> anyhow::Result<()> {
    let pg_connection = self.data_source.get_connection().await?;
    pg_connection
        .interact(move |conn: &mut diesel::PgConnection| {
            diesel::insert_into(conn_dsl::rt_client_connection)
                .values(&new_connection)
                .execute(conn)
        })
        .await
        .map_err(|e| anyhow::anyhow!("Insert rt app new_connection failed: {}", e))??;
    Ok(())
}
```

### 关键点解析

最开始用这个 `interact` 方法时完全搞不懂，为什么要这么绕？直接用连接不行吗？

后来才明白原因：
后来才明白原因：

1. `get_connection()` 从池里拿连接是异步的
2. diesel 操作本身是同步的，不能直接在异步上下文中使用  
3. `interact()` 把同步操作丢到专门的线程池执行，返回 Future
4. 用 `move` 把数据移动到线程里，避免生命周期问题

那个双重 `?` 也踩过坑：第一个 `?` 处理 `interact` 自身的错误（比如线程池炸了），第二个 `?` 处理 diesel 操作的错误（比如 SQL 执行失败）。

### 查询操作

```rust
/// 根据 connect_token 查询还未创建成功的 RtClientConnection token
async fn get_rt_client_connection_by_token(&self, query_connect_token: &str) -> anyhow::Result<Option<RtClientConnection>> {
    let pg_connection = self.get_connection().await?;
    let connect_token_query = query_connect_token.to_owned();
    use rtmate_common::schema::rt_client_connection::dsl::*;
    let result = pg_connection.interact(move |conn: &mut diesel::PgConnection| {
        rt_client_connection
            .filter(connect_token.eq(connect_token_query))
            .filter(used.eq(false))
            .select(RtClientConnection::as_select())
            .first::<RtClientConnection>(conn)
            .optional()
    }).await.map_err(|e| anyhow::anyhow!("Query failed: {}", e))??;
    Ok(result)
}
```

注意这里用了 `query_connect_token.to_owned()`，因为要把数据移动到另一个线程，不能用引用。

## 连接池配置

这块配置我调了好久，主要是通过环境变量加载配置：

```rust
#[derive(Debug, Deserialize)]
struct DbConfig {
    pub database_url: String,
    #[serde(default = "default_max_connections")]
    pub max_connections: usize,
    #[serde(default = "default_connect_timeout")]
    pub connect_timeout: u64,
    #[serde(rename = "test_query", default = "default_test_query")]
    pub test_query: String,
    #[serde(flatten)]
    pub timeouts: Timeouts,
}

fn default_max_connections() -> usize {
    5
}

fn default_connect_timeout() -> u64 {
    10
}

fn default_test_query() -> String {
    "SELECT 1".to_string()
}

impl DbConfig {
    pub fn from_env() -> anyhow::Result<Self, ConfigError> {
        config::Config::builder()
            .add_source(config::Environment::default())
            .build()
            .unwrap()
            .try_deserialize()
    }
}

// 创建连接池
let manager = Manager::new(db_config.database_url, Runtime::Tokio1);
let pool: deadpool_diesel::Pool<deadpool_diesel::Manager<diesel::PgConnection>> = Pool::builder(manager)
    .max_size(db_config.max_connections)
    .timeouts(db_config.timeouts)
    .build()
    .map_err(PoolError::PoolBuildError)?;
```

几个重要参数：
- `max_size`：最大连接数，根据数据库配置和并发量调整（项目中默认是5）
- `timeouts`：包含各种超时配置的结构体，通过环境变量配置
- `database_url`：数据库连接URL，从环境变量读取
- `Runtime::Tokio1`：指定异步运行时为Tokio

注意项目中使用了配置结构体和环境变量，而不是硬编码参数值。这样更灵活，可以根据不同环境调整配置。

## 小结

deadpool + diesel 这套组合确实不错：

- 性能提升明显，特别是高并发场景
- diesel 的类型安全很实用，编译期就能发现 SQL 问题  
- deadpool 的异步支持让整个架构更现代化
- 配置相对简单，文档也还行

如果你也在用 Rust 写需要数据库的服务，可以试试这个组合。虽然学习成本比直接用连接稍高一些，但性能收益还是很值得的。
