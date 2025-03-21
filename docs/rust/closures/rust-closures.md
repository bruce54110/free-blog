# Rust 入门之闭包（Closures）

本文相关源码已上传[Github](https://github.com/BruceZhang54110/free_rs/tree/main/crates/closures_demo)

## 前言

**先说概念**

Rust 的 **闭包**（*closures*）是可以保存在变量中或作为参数传递给其他函数的匿名函数。你可以在一个地方创建闭包，然后在不同的上下文中执行闭包运算。不同于函数，闭包允许捕获其被定义时所在作用域中的值。

## Rust 闭包

### 通过闭包捕获定义它的环境中的值

有这样一个示例，我们的 T 恤公司偶尔会向邮件列表中的某位成员赠送一件限量版的独家 T 恤作为促销。邮件列表中的成员可以选择将他们的喜爱的颜色添加到个人信息中。如果被选中的成员设置了喜爱的颜色，他们将获得那个颜色的 T 恤。如果他没有设置喜爱的颜色，他们会获赠公司当前库存最多的颜色的款式。

有很多种方式来实现这一点。例如，使用有 `Red` 和 `Blue` 两个成员的 `ShirtColor` 枚举（出于简单考虑限定为两种颜色）。我们使用 `Inventory` 结构体来代表公司的库存，它有一个类型为 `Vec<ShirtColor>` 的 `shirts` 字段表示库存中的衬衫的颜色。`Inventory` 上定义的 `giveaway` 方法获取免费衬衫得主所喜爱的颜色（如有），并返回其获得的衬衫的颜色。

```rust
#[derive(Debug, PartialEq, Copy, Clone)]
enum ShirtColor {
    Red,
    Blue,
}
struct Inventory {
    shirts: Vec<ShirtColor>,
}

impl Inventory {
    fn giveaway(&self, user_perference: Option<ShirtColor>) -> ShirtColor {
        // 这里是无参闭包的写法
        // unwrap_or_else 函数接受一个闭包作为参数，当Option的值是None时，会调用这个闭包
        user_perference.unwrap_or_else(|| self.most_stocked())
    }
    
    fn most_stocked(&self) -> ShirtColor {
        let mut num_red = 0;
        let mut num_blue = 0;

        for color in &self.shirts {
            match color {
                ShirtColor::Red => num_red += 1,
                ShirtColor::Blue => num_blue += 1,
            }  
        }
        if num_red > num_blue {
            ShirtColor::Red
        } else {
            ShirtColor::Blue
        }

    }
}

fn main() {
    let store = Inventory {
        shirts: vec![ShirtColor::Blue, ShirtColor::Red, ShirtColor::Blue],
    };

    let user_pref1 = Some(ShirtColor::Red);

    let giveaway1 = store.giveaway(user_pref1);

    println!("The user with perference {:?} get {:?}", user_pref1, giveaway1);


    let user_pref2 = None;

    let giveaway2 = store.giveaway(user_pref2);

    println!("The user with perference {:?} get {:?}", user_pref2, giveaway2);
}

```

执行main函数打印结果：

```
The user with perference Some(Red) get Red
The user with perference None get Blue
```



第一个用户也就是`user_pref1` 给定一个Some，Some中是红色，调用`giveaway` 函数，unwrap_or_else 函数接受一个闭包作为参数，当Option的值是Some时，就返回Some中的颜色，当当Option的值是None时，会调用这个闭包。所以第一个用户拿到了红色衬衫，第二个用户因为传进来一个None，所以调用闭包，也就调用了`self.most_stocked()`，返回库存最多的颜色，也就是蓝色。

**闭包表达式 `|| self.most_stocked()` 作为 `unwrap_or_else` 的参数，闭包捕获了对 `self`（即 `Inventory` 实例）的不可变引用.并将其与我们指定的代码一起传递给 `unwrap_or_else` 方法。相比之下，函数无法以这种方式捕获其环境。**

### 闭包不需要指明函数的参数类型和返回类型

- 闭包通常不需要像函数那样标注参数或返回值的类型。
- 不会在暴露给用户的接口中使用。
- 通常很短，只在有限的上下文中使用，以便**编译器可推断其参数和返回值的类型**。
- 可以添加类型注释



这是一个指明函数参数类型和返回类型的例子：

```rust
let expensive_closure = |num: u32| -> u32 {
    println!("calculating slowly...");
    thread::sleep(Duration::from_secs(2));
    num
};
```

对比一下闭包语法与函数语法：

```rust
fn  add_one_v1   (x: u32) -> u32 { x + 1 } // 函数
let add_one_v2 = |x: u32| -> u32 { x + 1 };// 完整标注的闭包定义
let add_one_v3 = |x|             { x + 1 };// 省略了类型标注的闭包
let add_one_v4 = |x|               x + 1  ;// 去掉了可选的大括号的闭包
```

对于第三个和第四个闭包表达式并没有标注出参加类型和返回类型，那么就需要根据程序上下文，编译器推断出其类型。

### 编译器会为每个参数和返回值推断出一个具体类型

```rust
    let e = |x| x;
    let s = e(String::from("hello"));
    let n = e(5);
```

这段代码会报错，执行之后控制台报错信息如下，也就是说编译器已经推断出这里闭包重参数`x` 类型是`String` 类型了，下面再传递一个整数就会报错了。编译器只会推断出一个具体的类型。

```bash
error[E0308]: mismatched types
  --> crates/closures_demo/src/main.rs:57:15
   |
57 |     let n = e(5);
   |             - ^- help: try using a conversion method: `.to_string()`
   |             | |
   |             | expected `String`, found integer
   |             arguments to this function are incorrect
   |
note: expected because the closure was earlier called with an argument of type `String`
  --> crates/closures_demo/src/main.rs:56:15
   |
56 |     let s = e(String::from("hello"));
   |             - ^^^^^^^^^^^^^^^^^^^^^ expected because this argument is of type `String`
   |             |
   |             in this closure call
note: closure parameter defined here
  --> crates/closures_demo/src/main.rs:55:14
   |
55 |     let e = |x| x;
   |              ^

For more information about this error, try `rustc --explain E0308`.
```

### 捕获引用或移动所有权

闭包可以通过三种方式捕获其环境中的值，它们直接对应到函数获取参数的三种方式：

- 不可变借用

- 可变借用

- 获取所有权

闭包将根据函数体中对捕获值的操作来决定使用哪种方式，接下来我们通过示例代码具体讨论这三种情况。

#### 不可变引用

```rust
fn reference_demo() {
    let list = vec![1, 2, 3];
    println!("list: {:?}", list);

    let only_borrow = || println!("from closures list: {:?}", list);

    println!("before only_borrow list: {:?}", list);
    only_borrow();
    println!("after only_borrow list: {:?}", list);

}

#[cfg(test)]
mod test {

    use super::*;

    #[test]
    fn test_reference_demo() {
        reference_demo();
    }

}


```

执行单元测试`test_reference_demo()`，四个`println` 都可以打印：

```bash
test test::test_reference_demo ... ok

successes:

---- test::test_reference_demo stdout ----
list: [1, 2, 3]
before only_borrow list: [1, 2, 3]
from closures list: [1, 2, 3]
after only_borrow list: [1, 2, 3]

```


这段代码展示了 Rust 闭包对变量的不可变借用特性。四个`println!`都能成功打印`list`的原因如下：

1. 闭包捕获方式

闭包`only_borrows`通过`|| println!("...{list:?}")`仅读取`list`的值，因此它默认以**不可变引用（`&T`）**的方式捕获`list`。这种捕获方式不会转移所有权，也不会独占变量，因此闭包外部的代码仍然可以访问`list`。

2. 借用规则的作用

Rust 的借用检查器允许在以下两种情况下同时存在多个不可变引用：
• 在闭包**定义时**，闭包尚未持有任何引用，因此`println!("Before defining closure")`可以直接访问`list`。
• 在闭包**调用前**，由于闭包尚未执行（即未实际持有引用），此时`println!("Before calling closure")`仍然可以访问`list`。

3. 闭包调用时的临时借用

当调用`only_borrows()`时，闭包会临时获取`list`的不可变引用，但：
• 这个借用仅存在于闭包执行期间（即`only_borrows()`的调用过程中）
• 闭包执行完毕后，借用立即释放

因此，`println!("After calling closure")`在闭包调用结束后仍然可以正常访问`list`。

4. 代码时序分析

```rust
let list = vec![1, 2, 3];
// 1. 闭包定义前：list 未被借用
println!("Before defining closure: {list:?}"); 

let only_borrows = || println!("From closure: {list:?}"); 
// 闭包仅声明引用，未实际持有

// 2. 闭包调用前：未实际产生借用
println!("Before calling closure: {list:?}"); 

only_borrows(); // 3. 调用时临时借用
// 闭包执行完毕，借用释放

// 4. 调用后：借用已释放
println!("After calling closure: {list:?}"); 
```

#### 可变引用

```rust
fn mut_reference_demo() {
    let mut list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    let mut brrows_muably = || list.push(4);
    // println!("Before calling closure: {list:?}");
    brrows_muably();
    println!("After calling closure: {list:?}");
    
}
```

执行单元测试，控制台成功打印如下：

```bash
running 1 test
test test::test_mut_reference_demo ... ok

successes:

---- test::test_mut_reference_demo stdout ----
Before defining closure: [1, 2, 3]
After calling closure: [1, 2, 3, 4]

```

如果在`brrows_muably()` 添加`println!` 打印`list` 就会发生报错。

```bash
error[E0502]: cannot borrow `list` as immutable because it is also borrowed as mutable
  --> crates/closures_demo/src/lib.rs:25:38
   |
23 |     let mut brrows_muably = || list.push(4);
   |                             -- ---- first borrow occurs due to use of `list` in closure
   |                             |
   |                             mutable borrow occurs here
24 |     
25 |     println!("Before calling closure: {list:?}");
   |                                      ^^^^^^^^ immutable borrow occurs here
26 |     brrows_muably();
   |     ------------- mutable borrow later used here
```

因为在这里发生了可变的引用，在此期间只能有一个可变的引用，不可以有其他的引用。当 `borrows_mutably` 被定义时，它捕获了对 `list` 的可变引用。闭包在被调用后就不再被使用，这时可变引用结束。**因为当可变引用存在时不允许有其它的引用**，所以在闭包定义和调用之间不能有不可变引用来进行打印。

**可变引用与不可变引用的冲突**

闭包 `brrows_muably` 通过 `|| list.push(4)` 尝试修改 `list`，因此会以 **可变引用（`&mut T`）** 的方式捕获 `list`。根据 Rust 的借用规则：
1. **可变引用是独占的**：闭包定义后即持有 `list` 的可变引用，此时其他代码（包括 `println!`）无法同时访问 `list`。
2. **调用顺序问题**：在闭包 **尚未执行** 时，`println!("After calling closure: {list:?}")` 尝试以不可变引用（`&T`）访问 `list`，触发编译错误。

**闭包持有引用的周期**

1. **闭包在定义时即捕获引用**（而非调用时）
2. **可变引用生命周期与闭包对象绑定**（从闭包定义到销毁）

---

#### 移动所有权

```rust
fn get_data_demo() {
    let list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");
    // 新建一个线程
    thread::spawn(move || println!("From thread: {list:?}"))
    .join().unwrap();
}
```

当遇到跨线程操作时，闭包必须通过声明`move`关键字，来转移所有权。闭包中只是打印一下，获取不可变引用就好，为什么要获得所有权呢。这是因为主线程和子线程的结束或者说销毁时机是不同的，如果获取的是引用，主线程先于子线程销毁，子线程要打印`list`时，这个引用就不存在了，成为了非法引用。所以编译器要求把所有权移到新的线程里。

## Fn Traits

闭包捕获了定义它的环境中的某个值的引用或所有权。闭包在执行的时候，可以对捕获的值进行操作，包括：

1. 将捕获的值移出闭包
2. 修改捕获的值
3. 既不移动也不修改值
4. 完全不从环境中捕获值

闭包捕获和处理环境中的值的方式决定了它会实现哪些`Fn Trait`

有3种`Fn Trait`，`FnOnce`, `FnMut`，`Fn` 按照顺序是父子继承的关系，实现了`FuMnut` 也就实现了`FnOnce`，实现了`Fn` 也就实现了`FnOnce`和 `FnMut`。

#### FnOnce

适用于只能被调用一次的闭包。所有闭包至少都实现了这个 trait，因为所有闭包都能被调用。一个会将捕获的值从闭包体中**移出所有权**的闭包只会实现 `FnOnce` trait，而不会实现其他 `Fn` 相关的 trait，因为它只能被调用一次。

#### FnMut

适用于不会将捕获的值移出闭包体，但可能会修改捕获值的闭包。这类闭包可以被调用多次。

#### Fn

适用于既不将捕获的值移出闭包体，也不修改捕获值的闭包，同时也包括不从环境中捕获任何值的闭包。这类闭包可以被多次调用而不会改变其环境，这在会多次并发调用闭包的场景中十分重要。

看一个例子，在 `Option<T>` 上的 `unwrap_or_else` 方法的定义：

```rust
impl<T> Option<T> {
    pub fn unwrap_or_else<F>(self, f: F) -> T
    where
        F: FnOnce() -> T
    {
        match self {
            Some(x) => x,
            None => f(),
        }
    }
}
```

`T` 是表示 `Option` 中 `Some` 成员中的值的类型的泛型。类型 `T` 也是 `unwrap_or_else` 函数的返回值类型：举例来说，在 `Option<String>` 上调用 `unwrap_or_else` 会得到一个 `String`。

接着注意到 `unwrap_or_else` 函数有额外的泛型参数 `F`。`F` 是参数 `f` 的类型，`f` 是调用 `unwrap_or_else` 时提供的闭包。

泛型 `F` 的 trait bound 是 `FnOnce() -> T`，这意味着 `F` 必须能够被调用一次，没有参数并返回一个 `T`。在 trait bound 中使用 `FnOnce` 表示 `unwrap_or_else` 最多只会调用 `f` 一次。在 `unwrap_or_else` 的函数体中可以看到，如果 `Option` 是 `Some`，`f` 不会被调用。如果 `Option` 是 `None`，`f` 将会被调用一次。由于所有的闭包都实现了 `FnOnce`，`unwrap_or_else` 接受所有三种类型的闭包，十分灵活。

再看一个关于`FnMut`的例子：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn sort_rectangle() {
    let mut list = [
        Rectangle { width: 10, height: 1 },
        Rectangle { width: 3, height: 5 },
        Rectangle { width: 7, height: 12 },
    ];

    list.sort_by_key(|r| r.width);
    println!("{list:#?}");
}

#[cfg(test)]
mod test {

    use super::*;
    #[test]
    fn test_sort_rectangle() {
        sort_rectangle();
    }

}


```

`list.sort_by_key(|r| r.width)`源码：

```rust
    pub fn sort_by_key<K, F>(&mut self, mut f: F)
    where
        F: FnMut(&T) -> K,
        K: Ord,
    {
        stable_sort(self, |a, b| f(a).lt(&f(b)));
    }
```

对`list`进行排序，这里`trait bound` 使用了`FnMut`。

`sort_by_key` 被定义为接收一个 `FnMut` 闭包的原因是它会多次调用这个闭包：对 slice 中的每个元素调用一次。闭包 `|r| r.width` 不捕获、修改或将任何东西移出它的环境，所以它满足 trait bound 的要求。

如果修改一下代码如下，为了计数，在闭包体中捕获`value`并push到`sort_operations`中：

```rust

fn sort_rectangle() {
    let mut list = [
        Rectangle { width: 10, height: 1 },
        Rectangle { width: 3, height: 5 },
        Rectangle { width: 7, height: 12 },
    ];
    let mut sort_operations = vec![];
    let value = String::from("closure called");
    
    list.sort_by_key(|r| {
        sort_operations.push(value);
        r.width;
    });
    println!("{list:#?}");
}
```

执行这个代码就会报错如下：

```bash
error[E0507]: cannot move out of `value`, a captured variable in an `FnMut` closure
  --> crates/closures_demo/src/lib.rs:58:30
   |
55 |     let value = String::from("closure called");
   |         ----- captured outer variable
56 |     
57 |     list.sort_by_key(|r| {
   |                      --- captured by this `FnMut` closure
58 |         sort_operations.push(value);
   |                              ^^^^^ move occurs because `value` has type `String`, which does not implement the `Copy` trait
   |
help: consider cloning the value if the performance cost is acceptable
   |
58 |         sort_operations.push(value.clone());
   |                                   ++++++++

For more information about this error, try `rustc --explain E0507`.
```

闭包捕获了 `value`，然后通过将 `value` 的所有权转移给 `sort_operations` vector 的方式将其移出闭包。这个闭包只能被调用一次；尝试第二次调用它将无法工作，因为这时 `value` 已经不在闭包的环境中，无法被再次插入 `sort_operations` 中。

所以要修改的话，要避免`value` 移出，使用一个`count` 变量进行计数，闭包中对count+1。

```
fn sort_rectangle() {
    let mut list = [
        Rectangle { width: 10, height: 1 },
        Rectangle { width: 3, height: 5 },
        Rectangle { width: 7, height: 12 },
    ];
    let mut count = 0;
    
    
    list.sort_by_key(|r: &Rectangle| {
        count += 1;
        r.width;
    });
    println!("{list:#?}");
}
```

# 参考

1. [Rust高级函数与闭包](https://mp.weixin.qq.com/s?__biz=Mzg2Njg4OTQ2MA==&mid=2247484308&idx=1&sn=88973a9a870c78e008c784746cf315c4&chksm=cf5b4c409b6e50c95178c05daf1cf5a949d920b70a61075eba8b55453c8b0e9eb6cd4c06bb20#rd)
1. [Rust 程序设计语言 简体中文版](https://kaisery.github.io/trpl-zh-cn/ch13-01-closures.html)
1. [Bilibili Rust 教程](https://www.bilibili.com/video/BV1kiNzeJE4t/)





