# Rust入门之并发编程基础（三）

## 背景

我们平时使用计算机完成某项工作的时候，往往可以同时执行多个任务，比如可以编程的时候同时播放音乐，就算是**单核CPU**也是如此。这是因为现代计算机操作系统会使用**“中断机制”**来执行任务，任务可以分为：

- “CPU 密集型“或者“计算密集型”
- ”IO 密集型“

根据这两种类型，又可以有针对性的利用操作系统的”中断机制“提供计算机同时执行多任务的效率。大多数函数调用都是会发生阻塞的，等待当前执行完成才会继续执行后续的动作，如果在一个程序中有多个任务，多个任务中某些任务阻塞时可以不影响其他任务执行，也就是异步执行多个任务，这样效率就会提高很多了。多线程异步执行程序就显得尤为重要了。

## 讨论一下并发和并行

比如给员工分配任务，如果分配给一个员工多个任务，这个员工在任务一个任务完成前同时处理多个任务，这就类似计算机操作系统的中断机制，这就是**并发**。

当将多个任务在多个员工中分配执行，每个员工分配一个任务并单独处理它，这就是**并行**。每个组员可以真正的同时进行工作。

如果一个任务执行必须依赖另一个任务，那么任务之间必须**串行**的执行，一个处理了再处理下一个任务。并行和并发也会发生相互交叉（阻塞）如果某个程序中的某几个任务的并发执行都需要等待另一个任务的完成，可能就会集中时间做这个任务，那么就都无法并行工作了。

**并发 VS 并行**

| **特征** |        **并发**        |       **并行**       |          **串行**          |
| :------: | :--------------------: | :------------------: | :------------------------: |
| 执行方式 |      任务交替执行      |     任务同时执行     |          顺序执行          |
| 类比模型 | 单员工轮流处理多个任务 | 多员工各处理单个任务 | 单任务完成后才能开始下一个 |
| 资源需求 |       单核或多核       |       多核必需       |         单核或多核         |
| 执行时机 |      任务可能重叠      |     任务真正同时     |        任务顺序执行        |

同样的基础动作也作用于软件和硬件。在单核CPU的计算机上，CPU一次只能执行一个操作，不过它仍然是并发工作，借助像线程，进程和异步（async）等工具，计算机可以暂停一个活动，并在最终切换回第一个活动执行之前切换到其它活动。在一个多核CPU的计算机上，它也可以并行工作，一个核心执行一个任务，同时另一个核心可以执行其他不相关的工作，而且这些工作实际上是同时发生的。

Rust 异步编程主要处理并发性，取决于硬件、操作系统和所使用的异步运行时（async runtime），并发也有可能在底层使用了并行。下面将详细的讨论Rust 异步编程是如何工作的。

## Rust 异步编程的核心组件：future、async、await

Rust 异步编程的三个重要关键元素：

1. futures
2. `async` 关键字
3. `await` 关键字

future 是一个现在还没准备好，未来会返回结果的一个值。类似Java 语言中也有类似的Future概念。Rust提供了 `Future trait` 作为基础组件。

`async` 关键字可以用于代码块或函数，表明它们可以被中断或恢复。在一个`async` 块或者 `async` 函数中，可以使用 `await` 关键字来等待一个 `future` 准备就绪，这个过程称之为等待一个 `future`。每一个等待`future` 的地方都可能是一个`async` 块或`async`函数中断并随后恢复的点。检查一个`future` 并查看其值是否准备就绪的过程被称之为轮询（polling）。

**future 的特点：**

- Rust编译器将 `async/await` 代码转换为使用 `Future trait` 的等效代码
  - 类似 for 循环被转换为使用 `Iterator trait`
- 开发者可以为自定义数据类型实现 `Future trait`
  - 提供统一的接口但允许实现不同的异步操作实现

Rust 官方为了大家学习实验异步操作，创建了一个 `trpl` crate（`trpl` 是 “The Rust Programming Language” 的缩写）。它重导出了你需要的所有类型、traits 和函数，它们主要来自于 [`futures`](https://crates.io/crates/futures) 和 [`tokio`](https://tokio.rs/) crates。

- `futures` crate 是一个 Rust 异步代码实验的官方仓库，也正是 `Future` 最初设计的地方。
- Tokio 是目前 Rust 中应用最广泛的异步运行时（async runtime），特别是（但不仅是！）web 应用。这里还有其他优秀的运行时，它们可能更适合你的需求。我们在 `trpl` 的底层使用 Tokio 是因为它经过了充分测试且广泛使用。

接下来上代码，利用 `trpl` 提供的多种组件来编写第一个异步程序。我们构建了一个小的命令行工具来抓取两个网页，拉取各自的 `<title>` 元素，并打印出第一个完成全部过程的标题。先创建一个rust项目，添加 `trpl` 库。

**Cargo.toml：**

```toml
[package]
name = "hello-async"
version = "0.1.0"
edition = "2021"

[dependencies]
trpl = "0.2.0"

```

**main.rs：**

```rust
use trpl::Html;
use trpl::Either;


async fn page_title(url: &str) -> (&str, Option<String>) {
    // 传入的任意 URL，使用 await 等待响应，因为Rust的futures是惰性的，只有调用await时，才会执行异步操作
    let response = trpl::get(url).await;
    let response_text = response.text().await;
    let title = Html::parse(&response_text)
    .select_first("title")
    .map(|title_element| title_element.inner_html());
    (url, title)
}
 
fn main() {
    // 接收参数，两个参数分别是两个URL
    let args: Vec<String> = std::env::args().collect();
    trpl::run(async {
        let title_fut_1 = page_title(&args[1]);
        let title_fut_2 = page_title(&args[2]);

        let (url, maybe_title) =
            match trpl::race(title_fut_1, title_fut_2).await {
                Either::Left(left) => left,
                Either::Right(right) => right,
            };
        println!("{url} returned first");
        match maybe_title {
            Some(title) => println!("Its page title is: '{title}'"),
            None => println!("Its title could not be parsed."),
        }
        
    });
}

```

`async` 修饰 page_title 函数，说明这个函数是一个异步函数。`trpl::get(url)` 去调用url地址返回响应，这里需要等待时间，这个函数也是用 `async` 修饰了表示它也是一个异步函数并返回future，这里加上`await`，表示我们要等待这个future 返回响应。同样`response.text()` 也是异步的，这里也使用 `await` 等待返回结果。 响应文本拿到后再使用`Html::parse` 解析。

这里要注意因为**Rust的futures是惰性的，只有调用await时，才会执行异步操作**，然后这里也可以改为链式调用，让代码更加简洁。

`page_title` 这个函数使用了`async`修饰，当函数使用`async`的时候，就会将函数转换为返回`Future`的普通函数。

这个示例分别由用户提供的 URL 调用 `page_title` 开始。我们将调用 `page_title` 产生的 future 分别保存为 `title_fut_1` 和 `title_fut_2`。请记住，它们还没有进行任何工作，因为 future 是惰性的，并且我们还没有 `await` 它们。接着我们将 futures 传递给 `trpl::race`，它返回一个值表明哪个传递的 future 最先返回。

## 并发与async

使用异步编程解决一些并发问题，这里更多关注线程与future的区别。

**代码示例：**

```rust
use std::time::Duration;

fn main() {
    trpl::run(async {
            trpl::spawn_task(
                async {
                    for i in 1..10 {
                        println!("hi numnber {i} from the first task!");
                        trpl::sleep(Duration::from_millis(500)).await;
                    }
                }
            );
            for i in 1..5 {
                println!("hi number {i} from the second task!");
                trpl::sleep(Duration::from_millis(500)).await;            
             }

        }
    );
}
```

**执行结果：**

```bash
hi number 1 from the second task!
hi numnber 1 from the first task!
hi number 2 from the second task!
hi numnber 2 from the first task!
hi number 3 from the second task!
hi numnber 3 from the first task!
hi number 4 from the second task!
hi numnber 4 from the first task!
hi numnber 5 from the first task!
```

根据执行结果可以看出。first task 在 second task 执行结束后也停止了，这是因为主任务（second task）已经停止，在主任务中创建的异步任务（first task）也会停止。如果要运行first task 直到结束，就需要一个`join`（join handle）来等待第一个任务完成。对于线程来说，可以使用`join` 方法来阻塞直到线程结束运行。在这里可以使用`await` 达到相同的效果。

**添加handle.await.unwrap()：**

```rust
use std::time::Duration;

fn main() {
    trpl::run(async {
            let handle = trpl::spawn_task(
                async {
                    for i in 1..10 {
                        println!("hi numnber {i} from the first task!");
                        trpl::sleep(Duration::from_millis(500)).await;
                    }
                }
            );
            for i in 1..5 {
                println!("hi number {i} from the second task!");
                trpl::sleep(Duration::from_millis(500)).await;            
            }
            handle.await.unwrap();

        }
    );
}	
```

**执行结果：**

```rust
hi number 1 from the second task!
hi numnber 1 from the first task!
hi number 2 from the second task!
hi numnber 2 from the first task!
hi numnber 3 from the first task!
hi number 3 from the second task!
hi number 4 from the second task!
hi numnber 4 from the first task!
hi numnber 5 from the first task!
hi numnber 6 from the first task!
hi numnber 7 from the first task!
hi numnber 8 from the first task!
hi numnber 9 from the first task!
```

## 消息传递

再使用前面讲过的消息传递的例子，这次使用` future` 演示线程间消息传递，来看看基于 `future` 的并发和基于线程的并发的差异。

`trpl` 中的 `rx.recv() `返回一个`future`，是异步的。之前我们使用`let s = rx.recv();` 是同步阻塞的。

```rust
let s: Result<String, mpsc::RecvError> = rx.recv();
```

**代码示例：**

```rust
fn main() {
    trpl::run(async {
        let (tx, mut rx) = trpl::channel();
        let val = String ::from("hi");
        tx.send(val).unwrap();
        // trpl channel rx.recv() 返回的是一个future, 是异步非阻塞版本
        let received = rx.recv().await.unwrap();
        println!("get: {received}");

    });


}
```

上面的代码中，发送到接收都是顺序执行的也就是同步的，因为它们都在同一个`async` 代码块当中。接下来修改一下代码，我们发送多个消息，让**多个消息异步发送和接收**，而不是都发送完才可以接收。

将发送端和接收端分别放到各自的`async` 块中，返回两个future，再使用trpl::join()，返回一个新的future.，再调用await等待两个future完成。

**代码示例：**

```rust
use std::time::Duration;

fn main() {
    trpl::run(async {
        let (tx, mut rx) = trpl::channel();

        // 发送放到一个future 中
        let tx_future = async move {
            let vals = vec![
                String::from("Hi"),
                String::from("from"),
                String::from("the"),
                String::from("future"),
            ];
            for val in vals {
                tx.send(val).unwrap();
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        let rx_future = async {
            while let Some(value) = rx.recv().await {
                println!("received: {value}");
            }
        };
        // 使用 join 接收两个future，返回一个新的future
        trpl::join(tx_future, rx_future).await;
    });


}
```

**执行结果：**

每隔500 ms 接收一个消息并打印。

```bash
received: Hi
received: from
received: the
received: future
```

`let tx_future = async move {` 这里使用了move 关键字，将 `tx` 移动（move）进异步代码块，它会在代码块结束后立刻被丢弃，这样`tx`销毁了，`rx` 也就在接收后优雅的关闭。

**多生产者代码示例：**

```rust
use std::time::Duration;

fn main() {
    trpl::run(async {
        let (tx, mut rx) = trpl::channel();

        let tx1 = tx.clone();

        // 发送放到一个future 中
        let tx1_future = async move {
            let vals = vec![
                String::from("Hi"),
                String::from("from"),
                String::from("the"),
                String::from("future"),
            ];
            for val in vals {
                tx1.send(val).unwrap();
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        let rx_future = async {
            while let Some(value) = rx.recv().await {
                println!("received: {value}");
            }
        };

        let tx_future = async move {
            let vals = vec![
                String::from("Hi"),
                String::from("from"),
                String::from("the"),
                String::from("future"),
            ];
            for val in vals {
                tx.send(val).unwrap();
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };
        // 使用 join 接收两个future，返回一个新的future
        trpl::join3(tx1_future, tx_future, rx_future).await;
    });


}
```

## 后续

本文讨论了并发和人并行的区别，也讲了 future，await 再异步编程中的作用，future 代表未来会返回结果值的一个变量，await表示要等待future返回结果。

本文记录根据[Rust程序设计语言](https://kaisery.github.io/trpl-zh-cn/title-page.html)（Rust 中文社区翻译）学习笔记，但是发现这个网页版电子书，异步这里讲的很抽象，后续经过更深入的学习会再更新异步编程的部分。

