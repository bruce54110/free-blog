# Rust入门之并发编程基础（一）

## 无畏并发

**[本文源码](https://github.com/BruceZhang54110/free_rs/tree/main/crates/thread_demo/examples)**

安全且高效地处理并发编程是 Rust 的另一个主要目标。**并发编程**（*Concurrent programming*），代表程序的不同部分相互独立地执行，而 **并行编程**（*parallel programming*）代表程序不同部分同时执行，这两个概念随着计算机越来越多的利用多处理器的优势而显得愈发重要。由于历史原因，在此类上下文中编程一直是困难且容易出错的：Rust 希望能改变这一点。

起初，Rust 团队认为确保内存安全和防止并发问题是两个分别需要不同方法应对的挑战。随着时间的推移，团队发现所有权和类型系统是一系列解决内存安全 **和** 并发问题的强有力的工具！通过利用所有权和类型检查，在 Rust 中很多并发错误都是 **编译时** 错误，而非运行时错误。因此，相比花费大量时间尝试重现运行时并发 bug 出现的特定情况，Rust 会拒绝编译不正确的代码并提供解释问题的错误信息。因此，你可以在开发时修复代码，而不是在部署到生产环境后修复代码。我们给 Rust 的这一部分起了一个绰号 **无畏并发**（*fearless concurrency*）。无畏并发令你的代码免于出现诡异的 bug 并可以轻松重构且无需担心会引入新的 bug。本文重点介绍了以下内容：

1. **多线程基础**
   - 使用`thread::spawn`创建线程，通过`JoinHandle`的`join`方法确保线程同步，避免主线程提前退出。
   - **`move`闭包**强制转移变量所有权到子线程，避免悬垂引用，保障跨线程数据安全。
2. **消息传递机制**
   - 通过`mpsc`通道（多生产者单消费者模型）实现线程间通信，发送端（`Sender`）与接收端（`Receiver`）解耦。
   - 发送数据时自动转移所有权，防止发送后篡改，天然规避数据竞争问题。
3. **灵活性与扩展性**
   - 支持`clone`生成多个发送端，实现多生产者场景；接收端通过迭代器循环读取消息，简化代码逻辑。

### Rust 无畏并发的特点

- 目标：安全高效的并发编程
- 独特方法：利用所有权和类型系统在编译时防止并发错误
- 优势：在开发阶段而非生产环境中发现错误
- 灵活性：为不同并发模型提供多种工具

## 使用多线程同时执行代码

在操作系统中，正在执行的一个独立程序是一个进程，而程序中可以存在多个同时运行的独立单元，这些独立单元被称之为线程。例如：web 服务器可以有多个线程以便可以同时响应多个请求。

**多线程运行可能导致的问题：**

- 竞态条件（Race conditions），多个线程以不一致的顺序访问数据或资源
- 死锁（Deadlocks）两个线程相互等待对方，这会阻止两个继续运行
- 只会发生在特定情况且难以稳定重现和修复的bug

Rust 尝试减轻使用线程的负面影响。不过在多线程上下文中编程仍需格外小心，同时其所要求的代码结构也不同于运行于单线程的程序。

编程语言有一些不同的方法来实现线程，而且很多**操作系统提供了创建新线程的 API。Rust 标准库使用 *1:1* 线程实现，这代表程序的每一个语言级线程使用一个系统线程。**有一些 crate 实现了其他有着不同于 1:1 模型取舍的线程模型。

### 使用spawn 创建新线程

创建新线程可以使用`thread::spawn` 函数并传递一个闭包。

代码示例：

```rust
#[cfg(test)]
mod tests {
    use std::{thread, time::Duration};


    #[test]
    fn test_thread() {

        thread::spawn(|| {
            for i in 1..10 {
                println!("hi number {} from the spawn thread!", i);
                thread::sleep(Duration::from_millis(1));
            }
        });

        for i in 1..5 {
            println!("hi number {} from the main thread!", i);
            thread::sleep(Duration::from_millis(1));
        }

    }

}
```

**执行单元测试：**

```bash
successes:

---- thread_code::tests::test_thread stdout ----
hi number 1 from the main thread!
hi number 1 from the spawn thread!
hi number 2 from the main thread!
hi number 2 from the spawn thread!
hi number 3 from the main thread!
hi number 3 from the spawn thread!
hi number 4 from the main thread!
hi number 4 from the spawn thread!


successes:
    thread_code::tests::test_thread
```

主线程打印到4，子线程打印到了4，如果再多试几次，我们会发现子线程始终无法打印完for循环的从1到9。原因是当Rust程序主线程结束的时候，所有已经创建的其他线程都会关闭掉。

如果希望所有子线程执行结束后，程序再关闭，该如何实现呢？就要使用下面介绍的方法了。

### 使用`join Handles` 等待所有线程完成

- 我们可以通过将`thread::spawn` 的返回值保存到一个变量中，来解决生成的线程无法运行或过早结束的问题
- `thread::spawn` 的返回值是 `JoinHandle`
- `JoinHandle` 是一个拥有的值，当我们调用它的join方法时，它会等待其线程完成
- 在`Handle` 上调用`join` 会阻塞当前正在运行的线程，直到该`Hande`代表的线程终止
  - 阻塞一个线程意味着该线程被阻止执行工作或退出

**代码示例：**

```rust
#[cfg(test)]
mod tests {
    use std::{thread, time::Duration};


    #[test]
    fn test_thread() {

        let join_handle = thread::spawn(|| {
            for i in 1..10 {
                println!("hi number {} from the spawn thread!", i);
                thread::sleep(Duration::from_millis(1));
            }
        });

        for i in 1..5 {
            println!("hi number {} from the main thread!", i);
            thread::sleep(Duration::from_millis(1));
        }
        join_handle.join().unwrap();
        println!("Thread finished execution");
    }

}
```

**单元测试执行结果如下：**

```bash
---- thread_code::tests::test_thread stdout ----
hi number 1 from the main thread!
hi number 1 from the spawn thread!
hi number 2 from the main thread!
hi number 2 from the spawn thread!
hi number 3 from the main thread!
hi number 3 from the spawn thread!
hi number 4 from the main thread!
hi number 4 from the spawn thread!
hi number 5 from the spawn thread!
hi number 6 from the spawn thread!
hi number 7 from the spawn thread!
hi number 8 from the spawn thread!
hi number 9 from the spawn thread!
Thread finished execution
```

通过调用`join` 方法，使得子线程打印完了从1到9，整个程序才结束。

### 在线程中使用 move 闭包

我们经常会在传递给`thread::spawn` 的闭包中使用`move` 关键字，因为这样闭包会接管它从环境中使用的值的所有权，从而**将这些值的所有权从一个线程转移到另一个线程。**

再看这样一个例子，定义一个数组`v`，我们在子线程中打印这个数组`v`，最后调用`join` 方法，

```rust
    #[test]
    fn test_thread_move() {
        let v = vec![1, 2, 3];
        let handle = thread::spawn(|| {
            println!("Here's a vector:{v:?}");
        });
        handle.join().unwrap();
    }
```

**编译报错：**

```
  --> crates/thread_demo/src/thread_code.rs:27:36
   |
27 |         let handle = thread::spawn(|| {
   |                                    ^^ may outlive borrowed value `v`
28 |             println!("Here's a vector:{v:?}");
   |                                        - `v` is borrowed here
   |
note: function requires argument type to outlive `'static`
  --> crates/thread_demo/src/thread_code.rs:27:22
   |
27 |           let handle = thread::spawn(|| {
   |  ______________________^
28 | |             println!("Here's a vector:{v:?}");
29 | |         });
   | |__________^
help: to force the closure to take ownership of `v` (and any other referenced variables), use the `move` keyword
   |
27 |         let handle = thread::spawn(move || {
   |                                    ++++
```

闭包使用了 `v`，所以闭包会捕获 `v` 并使其成为闭包环境的一部分。因为 `thread::spawn` 在一个新线程中运行这个闭包，所以可以在新线程中访问 `v`

Rust 会 **推断** 如何捕获 `v`，因为 `println!` 只需要 `v` 的引用，闭包尝试借用 `v`。然而这有一个问题：Rust 不知道这个新建线程会执行多久，所以无法知晓对 `v` 的引用是否一直有效。

通过在闭包之前增加 `move` 关键字，我们强制闭包获取其使用的值的所有权，而不是任由 Rust 推断它应该借用值。

这样代码就可以正确执行了。

```rust
    #[test]
    fn test_thread_move() {
        let v = vec![1, 2, 3];
        let handle = thread::spawn(move || {
            println!("Here's a vector:{v:?}");
        });
        handle.join().unwrap();
    }
```

## 使用消息传递在线程间传送数据

线程间消息传递或者线程间共享内存是多线程开发中的两种数据通讯方式。Rust 标准库提供了一个 **信道**（*channel*）实现。信道是一个通用编程概念，也可以称之为通道，表示数据从一个线程发送到另一个线程。

- 两个核心部分（transmitter）和接收端（receiver）
- 当通道的任一端（发送端或接收端）被丢弃时，我们说通道被关闭了

**代码示例：**

```rust
fn channel_value() {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let val = String::from("Hi");
        tx.send(val).unwrap();
    });

    let received = rx.recv().unwrap();

    println!("Got: {}", received);
}
```

**执行结果：**

```rust
successes:

---- tests::test_channel_value stdout ----
Got: Hi


successes:
    tests::test_channel_value
```

使用 `mpsc::channel` 函数创建一个新的信道；`mpsc` 是 **多个生产者，单个消费者**（*multiple producer, single consumer*）的缩写。简而言之，Rust 标准库实现信道的方式意味着一个信道可以有多个产生值的 **发送**（*sending*）端，但只能有一个消费这些值的 **接收**（*receiving*）端。

### 信道发送数据的会发生所有权转移

```rust
fn channel_value() {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let val = String::from("Hi");
        tx.send(val).unwrap();
        println!("val is: {}", val); // ========这行会报错==========
    });

    let received = rx.recv().unwrap();

    println!("Got: {}", received);
}
```

**报错提示：**	

```bash
borrow of moved value: `val`
value borrowed here after move
```

send 线程已经将数据发送，在send线程中，发送之后再使用所发送的数据。这在Rust 中是不允许的，因为发生了所有权的转移，数据所有权现在归接收线程所有。想象一下如果A线程发送数据给B线程，A线程依然更改了数据，B线程拿到的数据可能会导致发生数据不一致的情况从而导致意外的结果。



### 发送多个值

```rust
use std::{sync::mpsc, thread, time::Duration};

fn main() {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread")
        ];
        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(2));
        }
    });
    println!("main thread ...");
    for recv in rx {
        println!("Got :{}", recv);
    }

}
```

子线程发送端每隔1s 发送一个 String，主线程接收端同样每隔1s打印接收到的String。

### 通过clone 实现多生产者

**代码示例：**

```rust
use std::{sync::mpsc, thread, time::Duration};

fn main() {
    let (tx, rx) = mpsc::channel();
    let tx1 = mpsc::Sender::clone(&tx);

    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("Tome"),
            String::from("from"),
            String::from("the"),
            String::from("thread")
        ];
        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));

        }
    });
    thread::spawn(move || {
        let vals = vec![
            String::from("hi1"),
            String::from("Tome1"),
            String::from("from1"),
            String::from("the1"),
            String::from("thread1")
        ];
        for val in vals {
            tx1.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    println!("main thread...");
    for received in rx {
        println!("Got: {}", received);
    }


}
```

**执行结果如下：**

```rust
main thread...
Got: hi
Got: hi1
Got: Tome
Got: Tome1
Got: from
Got: from1
Got: the
Got: the1
Got: thread
Got: thread1
```

在创建新线程之前，我们对发送端调用了 `clone` 方法。这会给我们一个可以传递给第一个新建线程的发送端句柄。我们会将原始的信道发送端传递给第二个新建线程。这样就会有两个线程，每个线程将向信道的接收端发送不同的消息。

## 总结

Rust通过**无畏并发**的设计理念，为开发者提供了安全且高效的并发编程工具。其核心优势在于利用**所有权系统**和**类型检查**在编译阶段拦截并发错误（如数据竞争、死锁），而非依赖运行时调试。后续文章将深入探讨共享状态并发、`Sync`/`Send` trait等高级主题，进一步揭示Rust如何通过类型系统简化复杂并发场景的开发。
