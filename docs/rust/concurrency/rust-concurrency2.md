# Rust入门之并发编程基础（二）

[本文源码](https://github.com/BruceZhang54110/free_rs/tree/main/crates/thread_demo/examples)

## 多线程访问共享内存的并发

本文继续Rust 并发编程的下半部分，上一篇文章讲了基于Rust 的所有权机制，我们使用 Rust 创建线程执行任务，在两个线程间传递数据，都很丝滑的帮助我们避免写出有问题的多线程操作代码。接下来我们看一下，对于共享内存，多个线程都去操作同一块内存数据的时候，Rust 又是如何实现的。

## 互斥器（mutex）实现同一时刻只允许一个线程访问数据

互斥锁是一种互斥锁，类比 Java 中的 Synchronized 关键字，同样实现了多线程互斥。在Java等其他语言中我们使用互斥锁时需要遵守两个原则：

1. 访问数据前必须加锁
2. 访问结束数据后，必须释放锁，且必须由当前持有锁的线程释放锁

正确的写出并管理多线程互斥代码经常是一件较难的事情，然而，在 Rust 中，得益于类型系统和所有权，你不可能在锁和解锁上出错。

**代码示例：**

```rust
use std::sync::Mutex;

fn main() {
    let mutex = Mutex::new(5);
    {
        let mut num = mutex.lock().unwrap();
        *num = 6;
    }
    println!("mutex ={mutex:?}");
}
```

**执行结果：**

```rust
mutex =Mutex { data: 6, poisoned: false, .. }
```

使用关联函数`new` 创建一个Mutex<T> ，使用lock函数获取锁，从而可以访问互斥器中的数据，这个调用会阻塞当前线程，直到我们拥有锁为止。

**多个线程间共享Mutex<T>代码示例**

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

**执行结果：**

```rust
Result: 10
```

关键点来了，我们在这里使用了原子引用计数`Arc<T>`，由于我们创建了子线程并且counter 移动到了子线程中，在主线程就无法使用counter了。所以这里使用引用计数来克隆多个所有权传递到子线程中，为什么不使用`Rc<T>` 引用技术呢，因为`Rc`无法保证安全的跨线程操作，无法确保改变引用技术的操作不会被其他线程打断。这可能导致技术错误，导致bug。所以我们需要线程安全的引用计数，也就是 `Arc<T> `。

另外，尽管 `counter` 是不可变的，我们仍然可以获取其内部值的可变引用；这意味着 `Mutex<T>` 提供了**内部可变性**，就像 `Cell` 系列类型那样。使用 `RefCell<T>` 可以改变 `Rc<T>` 中内容，同样地，使用 `Mutex<T>` 我们也可以改变 `Arc<T>` 中的内容。

### 死锁

Rust 不能完全避免使用 `Mutex<T>` 所带来的逻辑错误。使用 `Rc<T>` 就有造成引用循环的风险：两个 `Rc<T>` 值相互引用，造成内存泄漏。同理，`Mutex<T>` 也有造成**死锁**（*deadlock*）的风险：当某个操作需要锁住两个资源，而两个线程分别持有两个资源的其中一个锁时，它们会永远相互等待。

**死锁代码示例：**

```rust
use std::{sync::{Arc, Mutex}, thread, time::Duration};


/// 演示死锁，a, b 两个线程，同时去抢锁，a抢lock1, b抢lock2, 之后再 a抢lock2, b抢lock1。
/// a线程必须等待b线程释放 lock2 锁，才能获取到lock2锁
/// b线程必须等待a线程释放 lock1 锁，才能获取到lock1锁
fn main() {
    // 创建两个互斥锁
    let lock1 = Arc::new(Mutex::new(0));
    let lock2 = Arc::new(Mutex::new(0));

    // 克隆lock1
    let lock1_clone: Arc<Mutex<i32>> = Arc::clone(&lock1);
    // 克隆lock2
    let lock2_clone: Arc<Mutex<i32>> = Arc::clone(&lock2);

    let handler1 = thread::spawn(move || {
        println!("a 线程尝试获取 lock1...");
        let _guard = lock1.lock().unwrap();
        println!("a 线程 获取 lock1 成功...等待10 ms");
        thread::sleep(Duration::from_millis(10));

        println!("a 线程尝试获取 lock2...");
        let _guard2 = lock2_clone.lock().unwrap();
        println!("a 线程获取 lock2 成功...");
        println!("a 线程结束");
    });

    let handler2 = thread::spawn(move || {
        println!("b 线程尝试获取 lock1...");
        let _guard_2 = lock2.lock().unwrap();
        println!("b 线程 获取 lock1 成功...等待10 ms");
        thread::sleep(Duration::from_millis(10));

        println!("b 线程尝试获取 lock2...");
        let _guard2 = lock1_clone.lock().unwrap();
        println!("b 线程获取 lock2 成功...");
        println!("b 线程结束");
    });

    handler1.join().unwrap();
    handler2.join().unwrap();
    println!("程序结束");

}
```

**执行结果：**

```bash
a 线程尝试获取 lock1...
a 线程 获取 lock1 成功...等待10 ms
b 线程尝试获取 lock2...
b 线程 获取 lock2 成功...等待10 ms
a 线程尝试获取 lock2...
b 线程尝试获取 lock1...
```

可以看到 a 线程和 b 线程发生了死锁，双方互相等待对方持有的锁。

### Poisoning “中毒”

上面的代码中，我们使用互斥器加锁，需要调用unwrap()：`lock1.lock().unwrap();`  从`mutex` 源码可以得知，这里实现了一个“中毒” 策略，这里的`lock` 方法或者 try_lock 方法会返回 `Rusult` ，这样我们可以知道是否发生”中毒“情况。 

这里所说的“中毒”是什么意思呢？

在 Rust 中，`Mutex`（互斥锁）的核心职责是确保在任何给定时间只有一个线程可以访问受保护的数据。但如果一个线程在持有 `Mutex` 锁的情况下发生了 panic（也就是程序崩溃或遇到无法恢复的错误），Rust 的 `Mutex` 会被标记为“中毒”状态，这表示**它所保护的数据**可能已经处于一种**不一致或损坏**的状态。

为什么会中毒？

设想一个场景：你的代码在一个 `Mutex` 内部执行一系列操作来修改数据。如果这些操作只执行了一半，线程就 panic 了，那么 `Mutex` 保护的数据就可能处于一个**非预期的、不完整的**状态。其他线程如果直接访问这些数据，就可能会读到错误的值，甚至导致它们也跟着 panic，或者更糟的是，默默地基于错误数据做出错误决策。为了防止这种情况，Rust 的 `Mutex` 采取了“中毒”策略。

如果另一个线程拥有锁，并且那个线程 panic 了，则 `lock` 调用会失败。在这种情况下，没人能够再获取锁，所以我们调用 `unwrap`，使当前线程 panic。

## Send 和 Sync Trait

Rust 语言本身的并发特性非常少，大多数并发功能都是标准库的一部分，而不是语言本身。处理并发的方案并不受标准库或语言所限，我们可以编写自己的或使用他人编写的并发特性。然而，有一些关键的并发概念是内嵌于语言本身而非标准库的，其中就包括`std::marker` 的 `Send` 和 `Sync` trait。可以称之为标记 trait，在`std::marker` 下边。

### Send trait

`Send` 标记 trait 表明实现了 `Send` 的类型值的**所有权可以在线程间转移**。几乎所有的Rust类型都是`Send`，但有一些例外，例如`Rc<T>` 不是`Send` ，`Rc<T>` 只用于单线程场景。

`Rc<T>` 是专门用来实现“多所有权”的目的的，因为如果克隆了 `Rc<T>` 的值并尝试将克隆的所有权转移到另一个线程，这两个线程都可能同时更新引用计数。为此，`Rc<T>` 被实现为用于单线程场景，这时不需要为拥有线程安全的引用计数而付出性能代价。

- Rust 的类型系统和trait 约束确保不会意外地将非Send 类型跨线程发送

- 完全由Send类型组成的任何类型也自动标记为Send
- 几乎所有原始类型都是Send，原始指针除外

### Sync trait

`Sync` 标记 trait ：可以安全的从多个线程**引用**实现该trait类型。`Sync` 标记 trait 表明一个实现了 `Sync` 的类型可以安全的在多个线程中拥有其值的引用。换一种方式来说，对于任意类型 `T`，如果 `&T`（`T` 的不可变引用）实现了 `Send` 的话 `T` 就实现了 `Sync`，这意味着其引用就可以安全的发送到另一个线程。类似于 `Send` 的情况，基本类型都实现了 `Sync`，完全由实现了 `Sync` 的类型组成的类型也实现了 `Sync`。

- `Sync` 是 Rust 最接近“线程安全”的概念

- ”线程安全“ 指特定数据可以被多个并发线程安全正确的使用

通常并不需要手动实现 `Send` 和 `Sync` trait，因为完全由实现了 `Send` 和 `Sync` 的类型组成的类型，自动实现了 `Send` 和 `Sync`。因为它们是标记 trait，甚至都不需要实现任何方法。它们只是用来加强并发相关的不可变性的。

