# 使用 Rust 开发Websocket 服务是什么体验（一）

## 前言

我是后端开发，主语言是Java，断断续续学习Rust有大半年了，Rust 学习的陡峭程度我也算是见识到了。现在想写一个项目，在项目的开发中学习 Rust ，逐渐加深对Rust 技术栈的理解。之前在公司用 Spring Websocket框架 开发过Websocket 服务为前端推送消息。学习了Rust ，了解到Rust 语言的优势主要是内存利用率极高，没有运行时和垃圾回收，Rust 丰富的类型系统和所有权模型保证了内存安全和线程安全。结合我以前做过的项目，使用Rust 开发一个高性能的 Websocket 服务的想法就从脑子里迸发出来了。

## 我的开发项目

> GitHub地址：[RTMate](https://github.com/BruceZhang54110/RTMate)

我选择了 [axum](https://crates.io/crates/axum) 来开发Websocket 服务，源码示例和axum 框架后面都会有介绍。RTMate 这个名字，RT 表示 Real Time，Mate 表示伙伴的意思。取这个名字希望开发一个基于Websocket服务打造的实时Websocket 通信伙伴。

## 为什么选择 Rust 做Websocket ？

首先，Websocket 的核心场景是长连接实时通信，客户端可以使用 Websocket 与服务端建立全双工的通信通道，使用场景有消息推送，聊天软件，实时数据看板等。这类场景有三个硬性要求：

1. 低延迟：数据传输不能有明显卡顿
2. 高并发：能同时支撑成千上万的连接
3. 稳定性：不能因为某个连接异常而导致服务崩溃

而 Rust 正好完美匹配了这些需求，首先 Rust 无垃圾回收机制，避免了 Java 等语言因 垃圾回收时导致的系统波动。Rust 引入所有权，引用，借用规则的机制用以保证无垃圾回收且内存安全。其次，内存安全方面，Rust可以在代码编译期就捕捉到许多常见的内存错误，如悬垂指针，越界访问等。还有零成本抽象特性，既保留高级语言的开发效率，又能达到接近 C 的运行性能。

Rust 的所有权系统从根本上解决了长连接的内存安全问题，当连接关闭时，与该连接相关的`TcpStream`、缓冲区、回调函数等资源会被自动释放，无需手动管理。

性能，安全，效率，这三方面让 Rust 成为开发 Websocket 服务潜力的新星。

## Rust 生态中的 Websocket 库

- [tungstenite-rs](https://crates.io/crates/tungstenite)：Rust 的轻量级基于流的 WebSocket 库，同时也有基于`Tokio` 的异步实现库`tokio-tungstenite`。

示例：

```rust
use std::net::TcpListener;
use std::thread::spawn;
use tungstenite::accept;

/// A WebSocket echo server
fn main () {
    let server = TcpListener::bind("127.0.0.1:9001").unwrap();
    for stream in server.incoming() {
        spawn (move || {
            let mut websocket = accept(stream.unwrap()).unwrap();
            loop {
                let msg = websocket.read().unwrap();

                // We do not want to send back ping/pong messages.
                if msg.is_binary() || msg.is_text() {
                    websocket.send(msg).unwrap();
                }
            }
        });
    }
}
```

- [actix-web](https://crates.io/crates/actix-web)：一个强大、实用且速度极快的 Rust 网络框架，其中也支持Websocket协议。

示例：

```Rust
use actix_web::{rt, web, App, Error, HttpRequest, HttpResponse, HttpServer};
use actix_ws::AggregatedMessage;
use futures_util::StreamExt as _;

async fn echo(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    let (res, mut session, stream) = actix_ws::handle(&req, stream)?;

    let mut stream = stream
        .aggregate_continuations()
        // aggregate continuation frames up to 1MiB
        .max_continuation_size(2_usize.pow(20));

    // start task but don't wait for it
    rt::spawn(async move {
        // receive messages from websocket
        while let Some(msg) = stream.next().await {
            match msg {
                Ok(AggregatedMessage::Text(text)) => {
                    // echo text message
                    session.text(text).await.unwrap();
                }

                Ok(AggregatedMessage::Binary(bin)) => {
                    // echo binary message
                    session.binary(bin).await.unwrap();
                }

                Ok(AggregatedMessage::Ping(msg)) => {
                    // respond to PING frame with PONG frame
                    session.pong(&msg).await.unwrap();
                }

                _ => {}
            }
        }
    });

    // respond immediately with response connected to WS session
    Ok(res)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().route("/echo", web::get().to(echo)))
        .bind(("127.0.0.1", 8080))?
        .run()
        .await
}
```

- [axum](https://crates.io/crates/axum)：axum 是Rust 生态中鼎鼎大名的异步运行时Tokio 旗下的一个库，专注于人体工程学和模块化的 Web 应用程序框架，由 Tokio、Tower 和 Hyper 构建。

示例：

```rust
use axum::{
    extract::ws::{WebSocketUpgrade, WebSocket},
    routing::any,
    response::{IntoResponse, Response},
    Router,
};

let app = Router::new().route("/ws", any(handler));

async fn handler(ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    while let Some(msg) = socket.recv().await {
        let msg = if let Ok(msg) = msg {
            msg
        } else {
            // client disconnected
            return;
        };

        if socket.send(msg).await.is_err() {
            // client disconnected
            return;
        }
    }
}
```

## 开始搭建 Websocket 服务环境

1. 在 cargo.toml 中添加需要的库：

   1. `axum` 要使用Websocket 需要启用 feature "ws"，网络协议启用 feature "http2"。
   2. `axum-server` 用来启动服务器运行时，并启用 "tls-rustls" feature，启用 TLS 加密支持，这样websocket 可以使用 `wss://` 来连接。
   3. `tokio` 异步运行时。
   4. `tower-http`：基于 Tower（Rust 的中间件框架）的 HTTP 中间件集合，为 axum 等框架提供通用的 HTTP 功能扩展。 启用 “trace”  用来结合`tracing` 记录日志。
   5. `tracing`：Rust 的高级日志和追踪库，支持结构化日志、事件级别（info/warn/error）、跨异步任务的上下文追踪。
   6. `tracing-subscriber `：配合 `tracing` 一起使用，负责打印日志。启用 fetures "env-filter"，可以实现环境变量日志过滤功能，使用 `RUST_LOG` 等环境变量灵活控制日志的输出级别和范围。

   

```rust
[dependencies]
axum = { version = "0.8.4", features = ["http2", "ws"] }
axum-server = { version = "0.6", features = ["tls-rustls"] }
tokio = { version = "1.45.1", features = ["full"] }
tower-http = { version = "0.6.6", features = ["trace"] }
tracing = "0.1.41"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

2. 在项目的examples 目录下创建示例代码：

```rust
use axum::{
    extract::{
        ws::{self, WebSocketUpgrade},
        State,
    }, http::{StatusCode, Version}, response::{Html, IntoResponse}, routing::any, Router
};
use std::{env, net::SocketAddr, path::PathBuf};
use tokio::sync::broadcast;
use tower_http::trace::{DefaultMakeSpan, TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use axum_server::tls_rustls::RustlsConfig;



#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| format!("{}=debug", env!("CARGO_CRATE_NAME")).into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // configure certificate and private key used by https
    let cert_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("self_signed_certs")
        .join("cert.pem");

    let key = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("self_signed_certs")
        .join("key.pem");

    tracing::debug!("cert path is:{:?}, key path is {:?}", cert_path, key);

    let config = RustlsConfig::from_pem_file(cert_path, key).await.unwrap();



    // 设置路由，也就是路径地址
    let app = Router::new()
        .fallback(handle_404)
        .route("/ws", any(ws_handler))
        // logging so we can see what's going on
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::default().include_headers(true)),
        )
        .with_state(broadcast::channel::<String>(16).0);
    // run it with hyper

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::debug!("listening on {}", addr);

    let mut server = axum_server::bind_rustls(addr, config);

    // IMPORTANT: This is required to advertise our support for HTTP/2 websockets to the client.
    // If you use axum::serve, it is enabled by default.
    server.http_builder().http2().enable_connect_protocol();

    server.serve(app.into_make_service()).await.unwrap();

}

async fn ws_handler(
    ws: WebSocketUpgrade,
    version: Version,
    State(sender): State<broadcast::Sender<String>>,
) -> axum::response::Response {
    tracing::debug!("accepted a WebSocket using {version:?}");
    let mut receiver = sender.subscribe();
    ws.on_upgrade(|mut ws| async move {
        loop {
            tokio::select! {
                // Since `ws` is a `Stream`, it is by nature cancel-safe.
                res = ws.recv() => {
                    match res {
                        Some(Ok(ws::Message::Text(s))) => {
                            let message = s.to_string();
                            tracing::debug!("accepted a WebSocket message from Client {message:?}");
                            let _ = sender.send(message);
                        }
                        Some(Ok(_)) => {}
                        Some(Err(e)) => tracing::debug!("client disconnected abruptly: {e}"),
                        None => break,
                    }
                }
                // Tokio guarantees that `broadcast::Receiver::recv` is cancel-safe.
                res = receiver.recv() => {
                    match res {
                        Ok(mut msg) => {
                            tracing::debug!("accepted a WebSocket broadcast message {msg:?}");
                            msg = format!("{} {}", msg, "from broadcast");
                            if let Err(e) = ws.send(ws::Message::Text(msg.into())).await {
                            tracing::debug!("client disconnected abruptly: {e}");
                            }

                        }
                        Err(_) => continue,
                    }
                }
            }
        }
    })
}

// 404 处理函数
async fn handle_404() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        Html("<h1>404: Not Found</h1>"),
    )
}
```

3. 前端使用JS 去连接Rust 服务端提供的Websocket 端点

```html
<p>Open this page in two windows and try sending some messages!</p>
<form action="javascript:void(0)">
    <input type="text" name="content" required>
    <button>Send</button>
</form>
<div id="messages"></div>
<script src='script.js'></script>
```

```js
const socket = new WebSocket('wss://127.0.0.1:3000/ws');

socket.addEventListener('message', e => {
    document.getElementById("messages").append(e.data, document.createElement("br"));
});

const form = document.querySelector("form");
form.addEventListener("submit", () => {
    socket.send(form.elements.namedItem("content").value);
    form.elements.namedItem("content").value = "";
});
```



启动项目后打印出`listening on 127.0.0.1:3000` 表示Websocket 服务已经启动成功了，然后使用 JS 去连接，模拟真实客户端消息传输。

```
DEBUG ws: listening on 127.0.0.1:3000
```

## 总结

这样一个Rust 创建的Websocket Demo 就写好了，将来我想把这个发展为一个完整的项目（项目地址前面已经给出），提供更加完善的Websocket 服务，包括连接的管理，认证，消息广播等功能。
