# RTMate （WebSocket as A Service）中的消息的发布订阅机制
## 闲聊项目
很久没更新这个项目专栏了，最近几个月闲下来会更新一下代码，大部分时间一直在思考这个项目的方向。后续可能会一直沿着项目最初的 SAAS计划一直开发完整，也有可能朝着易部署/轻量级的方向开发。也希望看到这个项目的朋友给一些建议。
最近项目尝试使用了AI 编程，vibe coding，SDD，来加快我的项目开发，确实效率中提高了不少，但是感觉 vibe coding 过程中逐渐让自己不再思考Rust语言本身，不再通过和编译器斗争来学习巩固Rust 语言。所以后面项目中也不会全部使用 vibe coding，还是要让自己古法编程的同时提高自己的 Rust 语言水平。
## WebSocket 消息的发布与订阅
目前项目中初步实现了 WebSocket 消息的发布与订阅，这次主要写一下项目中发布与订阅的实现原理，以及后续优化方向。

这里的发布与订阅的概念对应我们平时在后端使用的消息中间件的概念。生产者向某个频道生产消息，消费者订阅某个频道并消费消息。在 WebSocket 服务这里就是 WebSocket 服务主动将消息推到已经连接 WebSocket 服务的且订阅了对应频道的客户端。

### 保存频道和客户端的核心容器

在 RTMate 项目要实现发布与订阅的消息模型需要有以下数据结构:
1. 类型别名
```
/// 客户端ID
type ClientId = Arc<String>;
/// 频道ID
type ChannelId = Arc<String>;
/// 频道集合
type ChannelSet = DashSet<ChannelId>;
/// APP_ID
type AppId = Arc<String>;
/// 客户端集合
type ClientIdSet = DashSet<ClientId>;
```
2. 客户端连接对象
```
pub struct ClientConnection {
    pub rt_app: String,
    pub client_id: Arc<String>,
    pub connect_token: Option<String>,
    pub sender: mpsc::Sender<OutboundMessage>,  // 向客户端发消息的通道
}
```
3. 连接与订阅管理器
```
pub struct ConnectionManager {
    connections: DashMap<ClientId, Arc<ClientConnection>>,
    app_connections: DashMap<AppId, ClientIdSet>,

    // --- pub/sub 运行时索引 ---
    channels: DashMap<ChannelId, DashMap<ClientId, Arc<ClientConnection>>>,
    subscriptions: DashMap<ClientId, ChannelSet>,
    known_channels: DashSet<ChannelId>,
}
```
##### 核心运行时频道索引：

**Channels (频道 → 客户端)** ：`DashMap<ChannelId, DashMap<ClientId, Arc<ClientConnection>>>`

**Subscriptions (客户端 → 频道)** ：`DashMap<ClientId, DashSet<ChannelId>>`

RTMate 在数据层采用了**双向索引**的设计思路，通过频道可以找到所有订阅该频道的客户端，通过客户端可以找到该客户端订阅的全部频。
同时基于 `DashMap` 和 `DashSet` 构建了高性能的并发哈希表，在查询时时间复杂度为 $O(1)$ 这里要赞叹 `DashMap` 并发HashMap 的精妙设计了，我在之前一篇文章中分享过 DashMa，这里贴出来文章地址：

[我在 RTMate 里使用的高并发连接管理利器： DashMap](https://juejin.cn/post/7610638998129885230)

**数据结构优势：**
1.  **快速广播**：当有新消息发布到频道时，通过 `Channels` 索引可以实现 $O(1)$ 时间复杂度的订阅者列表定位。
1.  **优雅退场**：当客户端断开连接（Disconnect）时，系统需要快速清理其订阅的所有频道。通过 `Subscriptions` 索引，我们可以立即获取该客户端关联的所有频道并执行清理，避免内存泄漏。
### 发布订阅流程

#### 1. 注册频道
```
    pub fn register_channel(&self, channel_id: ChannelId) {
        self.known_channels.insert(channel_id);
    }
```
#### 2. 发布消息到对应频道

对应发布订阅的消息频道，因为 RTMate 目前还算是一个MVP项目，频道的创建和消息的发布逻辑将来会改，目前频道只能由接口发布消息时创建。将来可以支持多种频道的创建方式如：
1. 生产者首次发布频道消息即创建对应频道
2. 通过接口支持创建频道
3. 管理员通过管理页面创建频道

生产者通过接口发布消息：
```
curl -X POST http://localhost:3000/api/channels/room_001/publish \
  -H "Content-Type: application/json" \
  -d '{"data":{"text":"Hello from backend!"}}'
```
发消息前要检查频道是否存在：
```
    pub fn is_channel_exists(&self, channel_id: &ChannelId) -> bool {
        self.known_channels.contains(channel_id)
    }
```
广播消息到订阅频道的消费者：

每个客户端连接拥有自己的 `mpsc::Sender`消息发送通道，这是在客户端注册连接时初始化的。使用 Tokio 提供的有界通道 `mpsc::channel`进行广播消息传输。 
```
    pub async fn broadcast(&self, channel_id: &ChannelId, message: OutboundMessage) -> (usize, usize) {
        let mut delivered = 0;
        let mut failed = 0;
        
        if let Some(subscribers) = self.channels.get(channel_id) {
            for entry in subscribers.iter() {
                let conn = entry.value();
                match conn.sender.send(message.clone()).await {
                    Ok(_) => delivered += 1,
                    Err(e) => {
                        tracing::warn!(client_id = %conn.client_id, channel_id = %channel_id, "Failed to deliver message: {}", e);
                        failed += 1;
                    }
                }
            }
        }
        
        (delivered, failed)
    }
```

客户端订阅频道源码：
```
pub fn subscribe(
        connection_manager: &ConnectionManager,
        client_id: &str,
        channel_id: &str,
    ) -> Result<SubscribeResult, RtWsError> {
        let cid = Arc::new(client_id.to_string());
        let chid = Arc::new(channel_id.to_string());

        // 1. 验证频道存在
        if !connection_manager.is_channel_exists(&chid) {
            return Err(RtWsError::biz(WsBizCode::ChannelNotFound));
        }

        // 2. 检查是否已订阅（幂等）
        if connection_manager.is_subscribed(&cid, &chid) {
            return Ok(SubscribeResult {
                channel_id: channel_id.to_string(),
                client_id: client_id.to_string(),
            });
        }

        // 3. 执行订阅
        connection_manager.subscribe(cid.clone(), chid.clone())?;

        tracing::info!(
            client_id = %client_id,
            channel_id = %channel_id,
            "Client subscribed to channel"
        );

        Ok(SubscribeResult {
            channel_id: channel_id.to_string(),
            client_id: client_id.to_string(),
        })
    }
```

## 消息传输队列
```
let (tx, mut rx) = mpsc::channel::<OutboundMessage>(100);
```
这里用到的消息传输队列是 Tokio 提供的多生产者、单消费者队列 `mpsc`。每个客户端创建连接是都会创建自己的`mpsc::Sender`，而消息接受者`rx` 只在异步通过`Webskcket`协议给客户端返回消息时`while`循环中。
这里利用了多生产者单消费者的模式，实现了有多渠道消息发来时，消息都会通过该客户端的连接拥有的这单个`rx` 接收者将消息传给前端，完成服务端推送消息到客户端的过程。

更准确的说，这里`mpsc` 用于消息下行，也就是 后端推送消息 -> 后端指定客户端连接 -> 网络发送给前端。

## 后续优化

在对订阅频道中的客户端进行消息推送时，可以使用 tokio 的另一种消息模型 `broadcast` 来实现真正对客户端的广播，先通过 `broadcast` 广播，再经过 `mpsc` 推消息到各自客户端。实现真正的”一发多收“。 并且利用了零拷贝实现了低内存，极大的降低内存开销。