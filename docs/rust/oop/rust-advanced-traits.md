# Rust入门之高级Trait

## 引言

前面学习了迭代器（Iterators），**Iterator源码中就用到了关联类型**的功能。**关联类型**就属于高级trait的内容，这次我们学习一下高级trait，了解关联类型等知识。关联类型看似和泛型相似，与此同时再分析一下关联类型和泛型的区别和作用。

## 在Trait中定义使用关联类型来指定占位类型

关联类型（Associated Types）是 trait 中的类型占位符，它可以用于Trait 的方法签名中：

- 可以定义出包含哪些关联类型的 trait ，而在实现前无需知道这些类型是什么。

可以看一下标准库当中的 `Iterator` 源码，如下：

```rust
pub trait Iterator {
    type Item;
  
    #[lang = "next"]
    #[stable(feature = "rust1", since = "1.0.0")]
    fn next(&mut self) -> Option<Self::Item>;
    //...
}
```

这个`Item` 就是迭代器中所迭代元素的类型。next方法中返回的Option中就是这个Item。

看起来和泛型的功能有些相似，这里列一下关联类型和泛型参数的区别：

|    **特性**    |              关联类型               |              泛型参数               |
| :------------: | :---------------------------------: | :---------------------------------: |
|  **实现数量**  | 每个类型对同一 trait 只能有一个实现 | 可为不同泛型参数多次实现同一 trait  |
|  **类型关系**  |   表达类型与 trait 的固定关联关系   | 表达 trait 对不同类型的通用处理能力 |
|  **典型用途**  |  `Iterator::Item`, `Deref::Target`  |        `From<T>`, `Add<Rhs>`        |
| **代码简洁性** |      减少方法签名中的类型参数       |   需在调用时或定义中携带泛型参数    |

```rust
pub trait Iterator1 {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
    
}
pub trait Iterator2<T> {

    fn next(&mut self) -> Option<T>;
    
}

struct Counter {}

impl Iterator1 for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        None
    }
    
}
/// 会报错，不允许为同一个类型实现多个 trait
// impl Iterator1 for Counter {
//     type Item = String;

//     fn next(&mut self) -> Option<Self::Item> {
//         None
//     }
    
// }

impl Iterator2<u32> for Counter {
    fn next(&mut self) -> Option<u32> {
        None
    }
    
}

impl Iterator2<String> for Counter {
    fn next(&mut self) -> Option<String> {
        None
    }
    
}
```

## 默认泛型参数和运算符重载

- 可以在使用泛型参数时为泛型类指定一个默认的具体类型。
- 语法：`<PlaceholderType=ConcreteType>`。
- 这种技术常用于运算符重载。
- Rust 并不允许创建自定义运算符或重载任意运算符。
-  `std::ops` 中所列出的运算符和相应的 trait 可以通过实现运算符相关 trait 来重载。

```rust
use std::ops::Add;

#[derive(Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        let p1 = Point { x: 1, y: 2 };
        let p2 = Point { x: 3, y: 4 };
        let p3 = p1 + p2;
        assert_eq!(p3, Point { x: 4, y: 6 });
    }
}
```

标准库中的 `Add` trait，这是一个带有一个方法和一个关联类型的 trait。`<Rhs = Self>`这个语法叫做 **默认类型参数**（*default type parameters*）。`RHS` 是一个泛型类型参数（“right hand side” 的缩写），它用于定义 `add` 方法中的 `rhs` 参数。如果实现 `Add` trait 时不指定 `RHS` 的具体类型，`RHS` 的类型将是默认的 `Self` 类型，也就是在其上实现 `Add` 的类型。

在上边的代码示例中，`Rhs`就是`Point`。

**Add trait 源码：**

```rust
#[doc(alias = "+")]
pub trait Add<Rhs = Self> {
    /// The resulting type after applying the `+` operator.
    #[stable(feature = "rust1", since = "1.0.0")]
    type Output;

    /// Performs the `+` operation.
    ///
    /// # Example
    ///
    /// ```
    /// assert_eq!(12 + 1, 13);
    /// ```
    #[must_use = "this returns the result of the operation, without modifying the original"]
    #[rustc_diagnostic_item = "add"]
    #[stable(feature = "rust1", since = "1.0.0")]
    fn add(self, rhs: Rhs) -> Self::Output;
}
```

**再看一个不使用默认类型参数的例子：**

```rust
#[derive(Debug, PartialEq)]
struct Millimeters(u32);
#[derive(Debug, PartialEq)]
struct Meters(u32);

impl Add<Meters> for Millimeters {
    type Output = Millimeters;

    fn add(self, other: Meters) -> Millimeters {
        Millimeters(self.0 + (other.0 * 1000))
    }
}
```

**单元测试：**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_add_millimeters() {
        let m1 = Millimeters(100);
        let m2 = Meters(1);
        let m3 = m1 + m2;
        assert_eq!(m3, Millimeters(1100));
    }
}
```

上面的代码中厘米，米两个struct，有我们希望能够将毫米值与米值相加，并让 `Add` 的实现正确处理转换。可以为 `Millimeters` 实现 `Add` 并以 `Meters` 作为泛型参数而不使用默认的`Self`，以 `Millimeters` 作为关联类型。

**默认参数类型主要用于如下两个方面：**

- 扩展类型而不破坏现有代码。
- 在大部分用户都不需要的特定情况进行自定义。

标准库的 `Add` trait 就是一个第二个目的例子：大部分时候你会将两个相似的类型相加，不过它提供了自定义额外行为的能力。在 `Add` trait 定义中使用默认类型参数意味着大部分时候无需指定额外的参数。换句话说，一小部分实现的样板代码是不必要的，这样使用 trait 就更容易了。

第一个目的是相似的，但过程是反过来的：如果需要为现有 trait 增加类型参数，为其提供一个默认类型将允许我们在不破坏现有实现代码的基础上扩展 trait 的功能。

## 完全限定语法与消歧义：调用相同名称的方法

在Rust中两个trait是可以有相同名称的方法声明的，甚至在结构体上定义的方法也可能同名。

代码示例如下，定义`Pilot`，`Wizard` 两个trait，都定义了相同方法名的`fly` 方法，`fly`方法都有参数`&self`。同时也为结构体`Human` 定义了关联方法`fly`方法。那么结构体调用`fly`方法时，分别如何调用各自的`fly` 方法实现呢？

```rust

trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
    
}

struct Human;

impl Pilot for Human {
    fn fly(&self) {
        println!("Pilot flying");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("Wizard flying");
    }
}

impl Human {
    fn fly(&self) {
        println!("Human flying");
    }
}


trait Animal {
    fn baby_name() -> String;
}

struct Dog;

impl Dog {
    fn baby_name() -> String {
        String::from("Spot")
    }
}

impl Animal for Dog {
    fn baby_name() -> String {
        String::from("Puppy")
    }
}
```

```rust
    #[test]
    fn test_fly() {
        let human = Human;
        human.fly(); // 调用 Human 的 fly 方法
        Pilot::fly(&human); // 调用 Pilot 的 fly 方法
        Wizard::fly(&human); // 调用 Wizard 的 fly 方法

    }

    #[test]
    fn test_baby_name() {

        // 不相等
        assert_ne!(Dog::baby_name(), String::from("Puppy"));
        // 相等
        assert_eq!(Dog::baby_name(), String::from("Spot"));

    }
```

对于有`&self` 的方法可以使用如下调用方式：

```
human.fly(); // 调用 Human 的 fly 方法
Pilot::fly(&human); // 调用 Pilot 的 fly 方法
Wizard::fly(&human); // 调用 Wizard 的 fly 方法
```

对于 `Animal trait`中定义的`baby_name` 方法是没有参数的。

调用`Dog::baby_name()`，打印的是`Spot`，可以知道调用的是`Dog` 自己的`baby_name`方法。那么这时候如何调用为`Dog` 实现`Animal` 中的`baby_name` 方法呢？这里就用到了**完全限定语法**。

完全限定语法定义：

```rust
<Type as Trait>::function(receiver_if_method, next_arg, ...);
```

上面的代码中如何想要调用`Animal` 的实现，就要这么写：

```
// 相等
assert_eq!(<Dog as Animal>::baby_name(), String::from("Puppy"));
```

对于不是方法的关联函数，其没有一个 `receiver`，故只会有其他参数的列表。可以选择在任何函数或方法调用处使用完全限定语法。然而，允许省略任何 Rust 能够从程序中的其他信息中计算出的部分。只有当存在多个同名实现而 Rust 需要帮助以便知道我们希望调用哪个实现时，才需要使用这个较为冗长的语法。

## 父 trait 用于在另一个 trait 中使用某 trait 的功能

有时需要在一个trait中使用其他trait的功能

- 需要被依赖的trait也被实现
- 那个被间接依赖的trait就是当前trait的super trait

```rust
trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}*", " ".repeat(len + 2));
        println!(" {} ", output);
        println!("*{}*", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));

    }
}


impl OutlinePrint for Point { // 此时会报错
    
}
```

只为`Point` 实现`OutlinePrint` 时，会编译错误，提示我们必须为`Point`实现`std::fmt::Display` 这个trait

```bash
`Point` doesn't implement `std::fmt::Display`
the trait `std::fmt::Display` is not implemented for `Point`
in format strings you may be able to use `{:?}` (or {:#?} for pretty-print) insteadrustcClick for full compiler diagnostic
lib.rs(81, 21): required by a bound in `OutlinePrint`
```

这样代码就不会报错了：

```rust
trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}*", " ".repeat(len + 2));
        println!(" {} ", output);
        println!("*{}*", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));

    }
}


impl OutlinePrint for Point { // 此时会报错
    
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}
```

`OutlinePrint` trait 在定义时指定了依赖的 trait是 `fmt::Display`，所以在为` Point` 实现`OutlinePrint`，也必须同时为` Point` 实现`fmt::Display`。

 ## 使用 newtype 模式在外部类型上实现外部 trait

这里需要先引入一个 **“孤儿规则”**，**孤儿规则（Orphan Rule）** 是一种 trait 实现（trait implementation）的限制规则，其核心目的是为了保证类型系统的安全性和一致性。具体规则如下：

**当你为某个类型实现某个 trait 时，必须满足以下条件之一**：

1. **类型（Type）** 是在当前 crate 中定义的
2. **Trait** 是在当前 crate 中定义的

如果**类型和 trait 都来自外部 crate**，则你无法为该类型实现该 trait。这种情况下，编译器会报错，并提示你违反了孤儿规则。

这条规则确保了其他人编写的代码不会破坏你代码，反之亦然。没有这条规则的话，两个 crate 可以分别对相同类型实现相同的 trait，而 Rust 将无从得知应该使用哪一个实现。

现在，想要绕开这个限制方法是使用 **newtype 模式**，使用一个元组结构体对我们想要实现trait的类型封装起来。由于这个封装类型对于 crate 是本地的，这样就可以在这个封装上实现 trait。

**简单来说，newtype 模式是指创建一个包含另一个类型作为其单个字段的新的元组结构体。**

**示例代码：**

```rust
/// newtype pattern
struct Wrapper(Vec<String>);

impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}
```

**单元测试：**

```rust
    #[test]
    fn test_newtype() {

        let w = Wrapper(vec![
            String::from("hello"),
            String::from("world"),
        ]);
        println!("{}", w);

    }
```

**执行结果：**

```bash
running 1 test
test tests::test_newtype ... ok

successes:

---- tests::test_newtype stdout ----
[hello, world]


successes:
    tests::test_newtype

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 5 filtered out; finished in 0.00s
```

newtype有一个缺点，因为`Wrapper` 是一个新类型，它并不具备所封装值的方法。如果要使用封装值的某个方法，必须在`Wrapper` 中同样实现该方法并使用`self.0` 来调用。如果希望新类型拥有其内部类型的每一个方法，可以为封装类型实现`Deref trait`，并返回其内部类型是一种解决方案。 这里查阅参考：[Deref Trait 允许自定义解引用运算符`*`的行为](https://bruce54110.github.io/free-blog/rust/pointers/rust-smart-pointers.html#deref-trait)

**代码示例：**

- 当想调用被封装值的len方法，就同样在`Wrapper` 中实现 `len` 方法。

```rust
impl Wrapper {
    pub fn len(&self) -> usize {
        self.0.len()
    }
}
```

- 如果希望新类型拥有内部类型的每一个方法，可以为封装类型实现`Deref trait`

```rust

impl Deref for Wrapper {
    type Target = Vec<String>;

    fn deref(&self) -> &Vec<String> {
        &self.0
    }
}

impl DerefMut for Wrapper {
    fn deref_mut(&mut self) -> &mut Vec<String> {
        &mut self.0
    }
}
```

同时我们也实现`DerefMut` trait 来保证可变，这样就可以调用被封装类型的其他方法了。

```rust
		#[test]
    fn test_newtype() {

        let mut w = Wrapper(vec![
            String::from("hello"),
            String::from("world"),
        ]);
        println!("{}", w);

        assert_eq!(w.len(), 2);
        w.push(String::from("rust"));

        println!("{}", w);

    }
```

