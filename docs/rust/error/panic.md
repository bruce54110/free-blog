# 什么是panic ?
Rust 中 panic 是一个非常重要的概念，它是 Rust 中处理错误的一种方式。panic 是 Rust 中的一种错误处理机制，它可以在程序运行时发生错误时停止程序的执行，并输出错误信息。

当程序遇到下列问题的时候，就可以断定程序自身存在bug，故而会引发panic:
- 数组越界访问
- 整数除以0
- 在恰好为Err的Result上调用.expect()
- 断言失败

演示数组下标越界发生panic，代码示例：

```rust
fn main() {
    let v = vec![1, 2, 3];
    v[99];
}
```

输出：

```bash
thread 'main' panicked at crates/error_demo/src/main.rs:4:6:
index out of bounds: the len is 3 but the index is 99
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

设置 `RUST_BACKTRACE=1` 环境变量可以展示出完整的错误栈信息

```bash
thread 'main' panicked at crates/error_demo/src/main.rs:4:6:
index out of bounds: the len is 3 but the index is 99
stack backtrace:
   0: rust_begin_unwind
             at /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/std/src/panicking.rs:652:5
   1: core::panicking::panic_fmt
             at /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/core/src/panicking.rs:72:14
   2: core::panicking::panic_bounds_check
             at /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/core/src/panicking.rs:275:5
   3: <usize as core::slice::index::SliceIndex<[T]>>::index
             at /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/core/src/slice/index.rs:249:10
   4: core::slice::index::<impl core::ops::index::Index<I> for [T]>::index
             at /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/core/src/slice/index.rs:18:9
   5: <alloc::vec::Vec<T,A> as core::ops::index::Index<I>>::index
             at /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/alloc/src/vec/mod.rs:2907:9
   6: error_demo::main
             at ./src/main.rs:4:6
   7: core::ops::function::FnOnce::call_once
             at /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/core/src/ops/function.rs:250:5
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.
```



---



>  panic!() 是一种宏，用于处理程序中出现错误的情况。当你的代码检测到出现错误并需要立即触发panic时，就可以使用这个宏。panic!()可以接收类似println!() 的可选参数表，用于构建错误信息。

直接使用panic!宏，代码示例：

```rust
fn main() {
    panic!("this is a panic!");
}
```

执行结果：

```
thread 'main' panicked at crates/error_demo/src/main.rs:2:5:
this is a panic!
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

# 展开与中止调用栈

默认情况下，当panic发生，程序栈展开调用栈（工作量大），Rust沿着调用栈往回走，清理每个遇到的函数中的数据。

中止调用栈：不进行清理，直接停止程序。内存需要OS进行清理。