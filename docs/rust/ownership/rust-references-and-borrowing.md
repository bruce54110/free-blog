# 引用与借用

## 引用

Rust语言中，由于所有权机制，在变量传入到函数中，会发生所有权的移动，我们就无法在函数后面继续使用该变量了。

示例代码如下：

```rust
fn takes_ownership(some_string: String) {
    println!("{}", some_string);
}

#[test]
fn test_takes_ownership() {
  let s = String::from("hello");
  takes_ownership(s);
  println!("s:{}", s); // 这里发生编译错误
}
```

执行结果：

```bash
error[E0382]: borrow of moved value: `s`
  --> crates/ownership_demo/src/lib.rs:28:26
   |
26 |         let s = String::from("hello");
   |             - move occurs because `s` has type `String`, which does not implement the `Copy` trait
27 |         takes_ownership(s);
   |                         - value moved here
28 |         println!("s:{}", s);
   |                          ^ value borrowed here after move
   |
note: consider changing this parameter type in function `takes_ownership` to borrow instead if owning the value isn't necessary
  --> crates/ownership_demo/src/lib.rs:1:33
   |
1  | fn takes_ownership(some_string: String) {
   |    ---------------              ^^^^^^ this parameter takes ownership of the value
   |    |
   |    in this function
   = note: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)
help: consider cloning the value if the performance cost is acceptable
   |
27 |         takes_ownership(s.clone());
   |                          ++++++++

For more information about this error, try `rustc --explain E0382`.
error: could not compile `ownership_demo` (lib test) due to 1 previous error
```

错误信息显示值 s 被移动了，无法执行`println!("s:{}", s);` 

这里我们可以使用引用，指向一个地址，通过引用可以直接使用该值，但不获取其所有权。

引用所存储的的值是一个地址，这个地址才是真正指向变量。
## 借用
我们将创建一个引用的行为称为 **借用**（*borrowing*）。正如现实生活中，如果一个人拥有某样东西，你可以从他那里借来。当你使用完毕，必须还回去。我们并不拥有它。

```rust

fn takes_ownership_references(some_string: &String) {
    println!("fn s:{}", some_string);
}

    #[test]
    fn test_gives_ownership() {
        let s = gives_ownership();
        takes_ownership_references(&s);
        println!("打印:{}", s);
    }
```

执行结果：

```bash
running 1 test
test tests::test_gives_ownership ... ok

successes:

---- tests::test_gives_ownership stdout ----
fn s:hello
打印:hello


successes:
    tests::test_gives_ownership
```

## 解引用

与引用相反的是解引用，解引用运算符是 `*`，解引用指针以访问数据。

