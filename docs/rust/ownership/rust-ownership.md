# Rust 所有权机制

所有权是Rust中最独特的特性，它让Rust无需GC就可以保证内存安全。

## 什么是所有权？

**所有权**（*ownership*）是 Rust 用于如何管理内存的一组规则。所有程序都必须管理其运行时使用计算机内存的方式。一些语言中具有垃圾回收机制，在程序运行时有规律地寻找不再使用的内存；在另一些语言中，程序员必须亲自分配和释放内存。**Rust 则选择了第三种方式：通过所有权系统管理内存，编译器在编译时会根据一系列的规则进行检查。如果违反了任何这些规则，程序都不能编译。在运行时，所有权系统的任何功能都不会减慢程序。**

摘自：[什么是所有权](https://kaisery.github.io/trpl-zh-cn/ch04-01-what-is-ownership.html#什么是所有权)

### 栈内存和堆内存（Stack vs Heap）

在Rust语言中，一个值在栈内存还是堆内存，对语言的行为和编码时要为此做的操作有更大的影响。

栈和堆都是代码在运行时可供使用的内存，但是它们的结构不同。栈以放入值的顺序存储值并以相反顺序取出值。这也被称作 **后进先出**（*last in, first out*）。

增加数据叫做 **进栈**（*pushing onto the stack*），而移出数据叫做 **出栈**（*popping off the stack*）。栈中的所有数据都必须占用已知且固定的大小。在编译时大小未知或大小可能变化的数据，要改为存储在堆上。 堆是缺乏组织的：当向堆放入数据时，你要请求一定大小的空间。内存分配器（memory allocator）在堆的某处找到一块足够大的空位，把它标记为已使用，并返回一个表示该位置地址的 **指针**（*pointer*）。这个过程称作 **在堆上分配内存**（*allocating on the heap*），有时简称为 “分配”（allocating）。

### 所有权规则

1. Rust 中的每一个值都有一个 **所有者**（*owner*）。
2. 值在任一时刻有且只有一个所有者。
3. 当所有者（变量）离开作用域，这个值将被丢弃。

### 变量的作用域

字符串字面值是被硬编码进程序里的字符串值，不可变，存储在栈当中，并且当离开作用域时被移出栈。String类型存储在堆当中，可变，所以在这里更适合用来讨论所有权机制以及变量作用域的情况。

**Rust释放无用内存的策略：内存在拥有它的变量离开作用域后就被自动释放。**

使用大括号可以自定义变量的作用域范围，以下分别是字符串字面值和String类型的关于作用域的示例：

```rust
// 字符串字面值
{                      // s 在这里无效，它尚未声明
    let s = "hello";   // 从此处起，s 是有效的

    // 使用 s
}                      // 此作用域已结束，s 不再有效
```

```rust
// String 类型
{
    let s = String::from("hello"); // 从此处起，s 是有效的

    // 使用 s
}                                  // 此作用域已结束，
                                   // s 不再有效
```

### String类型

演示String类型的变量作用域，y和x 指向堆中的同一块内存区域，Rust为了保证内存安全，如果x赋值给了y，就会结束x的作用域，代码示例：

```
    let x = String::from("5");
    let y = x;
    println!("x:{}", x);
```

执行结果：

```
   |
11 |     let x = String::from("5");
   |         - move occurs because `x` has type `String`, which does not implement the `Copy` trait
12 |     let y = x;
   |             - value moved here
13 |     println!("x:{}", x);
   |                      ^ value borrowed here after move
```

两个数据指针指向了同一位置。这就有了一个问题：当 `x` 和 `y` 离开作用域，它们都会尝试释放相同的内存。这是一个叫做 **二次释放**（*double free*）的错误，也是之前提到过的内存安全性 bug 之一。两次释放（相同）内存会导致内存污染，它可能会导致潜在的安全漏洞。

为了确保内存安全，在 `let y = x;` 之后，Rust 认为 `x` 不再有效，因此 Rust 不需要在 `x` 离开作用域后清理任何东西。此时，只有 `s2` 是有效的，当其离开作用域，它就释放自己的内存。

### clone

如果我们 **确实** 需要深度复制 `String` 中堆上的数据，而不仅仅是栈上的数据，可以使用一个叫做 `clone` 的通用函数。

```
    let x = String::from("5");
    let y = x.clone();
    println!("x:{}", x);
```

存放在栈上的整形变量，经过移动后，依然有效。因为默认实现了 `Copy` trait，代码示例：

```rust
    let x = 5;
    let y = x;
    println!("x:{}", x
```

执行结果：

```
x:5
```

如果一个类型实现了 `Copy` trait，那么一个旧的变量在将其赋值给其他变量后仍然可用。

如下是一些 `Copy` 的类型：

- 所有整数类型，比如 `u32`。
- 布尔类型，`bool`，它的值是 `true` 和 `false`。
- 所有浮点数类型，比如 `f64`。
- 字符类型，`char`。
- 元组，当且仅当其包含的类型也都实现 `Copy` 的时候。比如，`(i32, i32)` 实现了 `Copy`，但 `(i32, String)` 就没有。

### 所有权与函数

和变量之间进行赋值类似，变量在函数中的移动也会发生作用域的变化，代码示例：

```rust
fn takes_ownership(some_string: String) {
    println!("{}", some_string);
}

#[cfg(test)]
mod tests {
    use super::*;


    #[test]
    fn test_takes_ownership() {
        let s = String::from("hello");
        takes_ownership(s);
        println!("s:{}", s); // 这里发生报错
    }

}
```

执行 `test_takes_ownership()`

```
error[E0382]: borrow of moved value: `s`
  --> crates/ownership_demo/src/lib.rs:14:26
   |
12 |         let s = String::from("hello");
   |             - move occurs because `s` has type `String`, which does not implement the `Copy` trait
13 |         takes_ownership(s);
   |                         - value moved here
14 |         println!("s:{}", s);
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
13 |         takes_ownership(s.clone());
   |   
```

当 `s` 传入到函数当中时，s的作用域就到了函数中，函数后面再获取s将不被允许，发生编译错误，执行也会发生异常。

但是对于类型是i32类型的参数，情况不同，代码示例如下：

```
fn takes_ownership(some_string: String) {
    println!("{}", some_string);
}

fn takes_ownership_i32(value: i32) {
    println!("{}", value);
}

#[cfg(test)]
mod tests {
    use super::*;


    #[test]
    fn test_takes_ownership() {
        let s = String::from("hello");
        takes_ownership(s);
        //println!("s:{}", s);
    }

    #[test]
    fn test_takes_ownership_i32() {
        let value = 12;
        takes_ownership_i32(value);
        println!("value:{}", value);
    }

}
```

执行 `test_takes_ownership_i32()` 

```
running 1 test
test tests::test_takes_ownership_i32 ... ok

successes:

---- tests::test_takes_ownership_i32 stdout ----
12
value:12


successes:
    tests::test_takes_ownership_i32

```

同理，如果一个类型实现了 `Copy` trait，那么一个变量在将其传递到函数当中后，函数之后可以再读取该变量。

### 返回值与作用域

返回值也可以转移所有权。

```rust
// 返回一个String 类型
fn gives_ownership() -> String {
    let s = String::from("hello"); // s进入作用域
    s                              // s 返回给调用函数
}

#[test]
fn test_gives_ownership() {
    let s = gives_ownership(); // s进入作用域
    takes_ownership(s); // s作用域移到takes_ownership函数中
    println!("s:{}", s); // s 已经被移走，这里会报错  borrow of moved value: `s`
}
```

由此可见，变量在函数调用过程中，作用域会随着函数传入变量，函数返回变量发生变化，无法顺畅的在函数调用后继续使用变量。

这里就引入了**引用**的概念，可以使用**引用**实现丝滑的使用变量和函数。

