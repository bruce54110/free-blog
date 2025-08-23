# 深入理解 Rust Axum：两种依赖注入模式的实践与对比（二）

## 前言

我想把使用 Rust 开发Websocket 服务的文章写成一个系列，前面写了一遍如何使用 Axum 搭建一个Websocket 服务的文章，我们可以和前端demo页面进行全双工的 Websocket 消息传输，而且可以启用 HTTP2 的同时启用 TLS。

这时候问题来了，Axum Web 应用和 Java Spring Web 应用一样，在 Axum 中如何依赖其他对象或资源呢。Websocket 服务也是Web服务，面对不同的连客户端接请求，每个连接请求有着不同的后端逻辑。这些后端的逻辑Service如果在每个Websocket 连接处理器中去分别创建Service对象或者数据库对象就会大大拉低服务性能，也会占用更多的内存。能不能像 Java Web 生态中 Spring 框架的单例Bean那样去做依赖注入呢？

## 首先什么是依赖注入?

在软件工程中，**依赖注入**（dependency injection）的意思为，给予调用方它所需要的事物。“依赖”是指可被方法调用的事物。依赖注入形式下，调用方不再直接指使用“依赖”，取而代之是“注入” 。“注入”是指将“依赖”传递给调用方的过程。在“注入”之后，调用方才会调用该“依赖”。传递依赖给调用方，而不是让让调用方直接获得依赖，这个是该设计的根本需求。在编程语言角度下，“调用方”为对象和类，“依赖”为变量。在提供服务的角度下，“调用方”为客户端，“依赖”为服务。

以Java 语言为例，当 class A 使用 class B 的某些功能时，则表示 class A 具有 class B 依赖。在使用其他 class 的方法之前，我们首先需要创建那个 class 的对象（即 class A 需要创建一个 class B 实例）。

**因此，将创建对象的任务转移给其他 class，并直接使用依赖项的过程，被称为“依赖注入”。**

## 为什么需要依赖注入？

如果要在 Axum Websocket 服务中要保证创建的对象是单例的，并且可以有一个全局上下文，有一个bean的资源池，有连接请求需要处理时可以直接拿到全局的单例对象去操作，需要如何实现呢？这就是今天我像在这里讨论的内容。

#### 依赖注入的好处

1. 避免在每个请求中重复创建昂贵的对象（如数据库连接池、外部服务客户端），从而降低服务性能开销和内存占用。
2. 确保某些服务或资源在整个应用生命周期中只有一个实例，统一管理状态和行为。
3. 方便模拟（mock）或替换依赖，进行单元测试。
4. 依赖关系清晰，修改和重构更容易。
5. 在不修改代码的情况下替换不同实现。
6. 集中管理依赖的生命周期和实例化。

## Axum 简介

Rust 生态中一个流行的 Web 框架，以其简洁、高性能和对异步处理的良好支持而闻名。充分利用 tower 和 tower-http 的中间件、服务和工具生态系统。

在Rust Axum框架中，使用 Router（路由） 来创建接口， 和 Java类比的话，那就是Java Spring Web项目中Controller类中定义的接口。创建 Router 时就要指定这个接口对应的 handler 方法。

- 使用 Route 定义接口
- 使用 handler 定义调用接口要执行的方法
- 使用 Extractors 解析传入的请求参数
- 在 handlers 之间共享 state

## 如何在 Axum 不同 handlers 之间共享单例对象

### 如何让每个请求访问共同一份数据

要实现Web应用的依赖注入，首先要保证注入的资源是单例的，是共享的。如何实现，答案就是使用Axum的在handlers 之间共享状态的办法。在 Axum 文档中写了四种 在handlers 之间共享状态的方法：

1. Using the [`State`](https://docs.rs/axum/0.8.4/axum/extract/struct.State.html) extractor：使用 State 提取器
2. Using request extensions：使用请求扩展
3. Using closure captures：使用闭包去捕获
4. Using task-local variables：使用任务局部变量

我们今天使用最常见的使用 State 提取器（`axum::extract::State`）。作用是将应用级别的共享状态（通常是一个结构体，其中包含各种单例服务）通过 `Router` 的 `with_state` 方法绑定，然后在处理器中通过 `State<T>` 提取。这个state 就是一个全局共享的状态，用来管理整个应用的全局状态和单例服务。

官网的简写代码示例如下，`struct AppState` 定义我们想要全局依赖的内容，使用 `Arc` 创建原子引用计数的 `shared_state` ，再传到 `with_state` 中。这样在每个handler 中，都能拿到一个 `state` 在这里就是 `State<Arc<AppState>>`，这就达到了多个handler 共享 `AppState` 的目的。

```
use axum::{ 
    extract::State,
    routing::get,
    Router,
};
use std::sync::Arc;

struct AppState {
    // ...
}

let shared_state = Arc::new(AppState { /* ... */ });

let app = Router::new()
    .route("/", get(handler))
    .with_state(shared_state);

async fn handler(
    State(state): State<Arc<AppState>>,
) {
    // ...
}
```

## 使用Rust为我们带来两种依赖注入方式

代码来自于 Axum Github 代码仓库的依赖注入示例。我们定义一个 User Repo 用来查询用户和创建用户。提供可扩展的 `Trait UserRepo`。通过依赖注入模式，我们可以根据需要注入不同的 UserRepo。

```rust
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| format!("{}=debug", env!("CARGO_CRATE_NAME")).into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let user_repo = InMemoryUserRepo::default();

    let using_dyn = Router::new()
        .route("/users/{id}", get(get_user_dyn))
        .route("/users", post(create_user_dyn))
        .with_state(AppStateDyn {
            user_repo: Arc::new(user_repo.clone()),
        });

    let using_generic = Router::new()
        .route("/users/{id}", get(get_user_generic::<InMemoryUserRepo>))
        .route("/users", post(create_user_generic::<InMemoryUserRepo>))
        .with_state(AppStateGeneric { user_repo });

    let app = Router::new()
        .nest("/dyn", using_dyn)
        .nest("/generic", using_generic);

    let listener = TcpListener::bind("127.0.0.1:3000").await.unwrap();
    tracing::debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

#[derive(Clone)]
struct AppStateDyn {
    user_repo: Arc<dyn UserRepo>,
}

#[derive(Clone)]
struct AppStateGeneric<T> {
    user_repo: T,
}

#[derive(Debug, Serialize, Clone)]
struct User {
    id: Uuid,
    name: String,
}

#[derive(Deserialize)]
struct UserParams {
    name: String,
}

async fn create_user_dyn(
    State(state): State<AppStateDyn>,
    Json(params): Json<UserParams>,
) -> Json<User> {
    let user = User {
        id: Uuid::new_v4(),
        name: params.name,
    };

    state.user_repo.save_user(&user);

    Json(user)
}

async fn get_user_dyn(
    State(state): State<AppStateDyn>,
    Path(id): Path<Uuid>,
) -> Result<Json<User>, StatusCode> {
    match state.user_repo.get_user(id) {
        Some(user) => Ok(Json(user)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn create_user_generic<T>(
    State(state): State<AppStateGeneric<T>>,
    Json(params): Json<UserParams>,
) -> Json<User>
where
    T: UserRepo,
{
    let user = User {
        id: Uuid::new_v4(),
        name: params.name,
    };

    state.user_repo.save_user(&user);

    Json(user)
}

async fn get_user_generic<T>(
    State(state): State<AppStateGeneric<T>>,
    Path(id): Path<Uuid>,
) -> Result<Json<User>, StatusCode>
where
    T: UserRepo,
{
    match state.user_repo.get_user(id) {
        Some(user) => Ok(Json(user)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

trait UserRepo: Send + Sync {
    fn get_user(&self, id: Uuid) -> Option<User>;

    fn save_user(&self, user: &User);
}

#[derive(Debug, Clone, Default)]
struct InMemoryUserRepo {
    map: Arc<Mutex<HashMap<Uuid, User>>>,
}

impl UserRepo for InMemoryUserRepo {
    fn get_user(&self, id: Uuid) -> Option<User> {
        self.map.lock().unwrap().get(&id).cloned()
    }

    fn save_user(&self, user: &User) {
        self.map.lock().unwrap().insert(user.id, user.clone());
    }
}
```

#### 1使用 trait + 泛型

在编译时，Rust 编译器会为每个使用了该泛型函数的具体类型生成一个独立的、优化的版本。这被称为**静态分发**，因为方法调用在编译时就已经确定并硬编码。

1. 定义结构体`AppStateGeneric<T> ` ，它的字段 `user_repo` 的类型是 `T` 。
2. `create_user_generic<T>` 和 `get_user_generic<T>` 函数，它们都是泛型函数，通过 `where T: UserRepo` 约束 `T` 必须实现 `UserRepo` trait。
3. 在 `main` 函数中，它们被实例化为 `create_user_generic::<InMemoryUserRepo>` 和 `get_user_generic::<InMemoryUserRepo>`，这意味着编译器会专门为 `InMemoryUserRepo` 生成一个版本的函数。

**优点**: **零成本抽象**。由于方法调用在编译时就已经确定，运行时没有额外的开销，性能和直接调用具体类型的方法一样快。

**缺点**: **灵活性较差**。所有使用该泛型函数的类型必须在编译时确定。这可能导致生成的代码量增加，因为编译器会为每个具体类型生成一个独立的函数副本。

#### 2. 使用 trait + 动态分发

Arc + dyn 来实现动态分发，使用 `dyn Trait`（如 `Arc<dyn UserRepo>`）来存储一个指向实现了 `UserRepo` trait 的任何具体类型的 trait 对象。在运行时，Rust 会通过虚函数表（vtable）来查找并调用正确的方法。这被称为**动态分发**，因为方法调用是在运行时确定的。

1. `AppStateDyn` 结构体：它的 `user_repo` 字段的类型是 `Arc<dyn UserRepo>`。这意味着它不关心具体是哪种 `UserRepo` 实现，只要它实现了 `UserRepo` trait 即可。

2. `create_user_dyn` 和 `get_user_dyn` 函数：它们接受 `AppStateDyn` 作为状态。方法调用如 `state.user_repo.save_user(&user)` 发生时，会动态地调用 `InMemoryUserRepo` 的 `save_user` 方法。

3. **优点**: **灵活性强**。你可以在运行时切换不同的 `UserRepo` 实现，而不需要改变函数签名。例如，你可以很容易地将 `InMemoryUserRepo` 换成 `PostgresUserRepo` 或 `RedisUserRepo`，而这些 handler 函数（`create_user_dyn` 等）无需修改。

   **缺点**: 有轻微的**性能开销**。因为需要在运行时通过 虚函数表（vtable ）查找方法，这比直接调用具体类型的方法要慢一些。

#### 为什么需要 Arc ？

在Rust 中`Arc` 是 `Atomic Rc` 的缩写，顾名思义：原子化的 `Rc<T>` 智能指针。Rust 所有权机制要求一个值只能有一个所有者，但是当遇到需要多个所有者时，Rust 巧妙的使用引用计数的方式，允许一个数据资源在同一时刻拥有多个所有者。这种实现机制就是 `Rc` 和 `Arc`，前者适用于单线程，后者是原子化实现的引用计数，因此是线程安全的，可以用于多线程中共享数据。

## 总结

结合Rust 强大的类型机制和内存所有权机制，让我们同样可以在 Rust Axum 中使用依赖注入的模式，实现高性能的数据共享。静态分发（泛型）和动态分发（`dyn`）在实践中，这两种模式并非非此即彼。你可以根据具体需求进行选择：如果你的服务依赖非常稳定，且对性能要求严苛，请选择泛型；如果你的应用需要更强的可扩展性和灵活性（比如在不同环境中切换数据库连接），那么动态分发是更好的选择。



