# 我在 RTMate 里使用的高并发连接管理利器： DashMap（五）

## 背景

RTMate 是我目前使用 Rust 语言自研的一个专注于提供 Websocket 连接服务的项目，用户可以免搭建Websocket 服务器，直接使用RTMate 就可以将自己的服务端和客户端进行Websocket 消息通信了。项目中有一个至关重要的点，那就是如何做好连接的管理，从连接的创建到销毁，从消息生产者到消息消费者的消息通信。Websocket 连接如何管理，对项目能否高效运行十分关键。

## 初出茅庐的 Map 键值对

想做Websocket 连接管理，还想要知道是谁创建了这些连接，将来谁要发消息，谁要断开连接，才能知道如何去找到那个连接去处理业务逻辑。所以使用`Map`键值对，是一个显而易见的办法。键值对，键存储客户ID，值存储连接的集合。通过客户ID就能知道该客户创建的所有Websocket 连接了。

第一步，我们定义一个Map 用于存储客户ID建立的连接，那么 Map 的key 就是客户ID，value 是创建的连接，因为客户可以同时创建多个连接，所以 value 我们使用 HashSet 存客户创建的多个连接，客户`abc` 拥有两个连接，分别是 `a123456` 和 `b123456`。

示例代码如下：

```rust
use std::collections::{HashMap, HashSet};

fn main() {
    let mut connections: HashMap<String, HashSet<String>> = HashMap::new();
    let app_id = "abc".to_string();
    let hash_set: &mut HashSet<String> = connections.entry(app_id).or_insert(HashSet::new());
    hash_set.insert("a123456".to_string());
    hash_set.insert("b123456".to_string());
}

```

第二步，因为要管理不同客户的连接，那么`HashMap` 要作为一个全局状态的变量，每个客户都可以访问它，在Web 应用中就要让每个线程都可以持有这个Map。这时候要就要派**原子引用计数** `Arc<T>` 上场了，`Arc<T>`  帮助我们既可以在线程之间共享也可以保证线程安全。

代码如下：

```rust
let connections: Arc<HashMap<String, HashSet<String>>> = Arc::new(HashMap::new());
connections.insert("aaa".to_string(), HashSet::new());
```

这时出现编译错误：

```bash
cannot borrow data in an `Arc` as mutable
trait `DerefMut` is required to modify through a dereference, but it is not implemented for `Arc<HashMap<String, HashSet<String>>>`rustcClick for full compiler diagnostic
cannot mutate immutable variable `connections`rust-analyzerE0384
```

这里提示我们无法将`Arc` 中的数据作为可变引用。在 Rust 中，`Arc` 的设计目标是让多个线程共享同一块数据。为了保证线程安全，Rust 遵循一个核心原则：**共享即不可变**。想修改 `Arc` 内部的数据，编译器会报错，因为它无法保证在同一时刻没有其他线程也在读取或修改这段数据。如何解决这一问题呢，这时候就需要”锁“上场了。我们使用`RwLock<T>` 读写锁。

代码如下：

```rust
let connections: Arc<RwLock<HashMap<String, HashSet<String>>>>
= Arc::new(RwLock::new(HashMap::new()));
let guard_result = connections.write();
if let Ok(mut map) = guard_result {
map.insert("aaa".to_string(), HashSet::new());
}
```

只有获取了写锁，才能对HashMap 进行写操作，这样就避免了线程安全的问题发生。

## DashMap 登场

`RwLock<T>` 锁的粒度是整个数据，也就是说在某个线程持有锁的过程中，其他线程无法操作 HashMap 中的任意一个数据。在Web 应用中如果有成千上万的连接频繁的来写入HashMap，那么线程会排队等待这个锁，造成了大量的锁争用，产生了并发瓶颈。

说回RTMate 项目， 在高并发场景下，使用HashMap 来实现Websocket 连接池，由于锁的粒度是整个HashMap，所以性能也不会太高。

为了打破这一尴尬局面，我引入了 Rust 并发生态中的利器：**DashMap**。

DashMap 的 Crate 介绍中写道：

> DashMap
>
> Rust 中速度极快的并发映射。
>
> DashMap 是 Rust 中并发关联数组/哈希映射的实现。
>
> DashMap 力求实现一个易于使用的 API，类似于 std::collections::HashMap，并针对并发处理做了一些细微的改动。
>
> DashMap 力求简单易用，并能直接替代 RwLock<HashMap<K, V>>。为了实现这些目标，所有方法都使用 &self 作为参数，而不是修改使用 &mut self 的方法。这使得您可以将 DashMap 放入 Arc<T> 中，并在线程间共享，同时仍然能够对其进行修改。

为什么说DashMap是并发利器呢，原来是DashMap 自己保证了线程安全，而且锁的粒度更小了，采用了“分段锁”的思想。并发性能的高低，往往不取决于“锁”本身有多块，而取决于线程在等待锁上花了多少时间。

假设有100个线程同时尝试写入数据，在全局锁状态下，碰撞率是100%，只有一个线程工作，其他99个线程都在 CPU 上“挂起”或“自旋”，浪费时间。

在DashMap 下，因为是分段锁，每个线程修改的数据不尽相同，那么同时有多个线程都可以加锁成功并修改数据，不会导致大量线程等待。

```rust
    #[test]
    fn test_arc_dash_map() {
        let connections: Arc<DashMap<String, HashSet<String>>> = Arc::new(DashMap::new());
        connections.entry("123".to_string())
            .or_insert(HashSet::new())
            .insert("a123456".to_string());
    }
```

使用DashMap 使得调用方式丝滑了起来，内部会处理分段锁，无需手动调用`.write()` 加锁。

最后这里贴出Websocket 连接池的代码，欢迎指正

RTMate [源码](https://github.com/BruceZhang54110/RTMate)

```rust
/// ConnectionManager: 全局的连接管理中心
pub struct ConnectionManager {
    /// 连接
    connections: DashMap<ClientId, Arc<ClientConnection>>,
    // 保存每个租户下的客户端
    app_connections: DashMap<AppId, ClientIdSet>,
    /// 频道
    channels: DashMap<ChannelId, DashMap<ClientId, Arc<ClientConnection>>>,
    /// 每个客户端订阅的频道
    subscriptions: DashMap<ClientId, ChannelSet>

}
```

