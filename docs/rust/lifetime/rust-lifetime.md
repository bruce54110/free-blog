# Rust生命周期

## 概述

Rust的每个引用都有自己的生命周期，生命周期就是引用保持有效的作用域。大多数情况生命周期都是隐式的、可被推断的。

当引用的生命周期可能以不同的方式互相关联时，需要我们手动标注生命周期。

生命周期的目的是为了避免悬垂引用（dangling reference）

示例：

```Rust
fn main() {
    { //1
        let r;
        { //2
            let x = 5;
            r = &x;
        } // 2
        println!("r: {}", r);
    } // 1
}

```

这段代码是有问题的，因为当打印 r时，已经出了注释当中的2号花括号，`r`所指向的 `x`已经被丢弃了。但是`r`的生命周期更长，这里就不允许`r`正常运行。

`borrowed value does not live long enough` 借用的值存活时间不够长

```bash
error[E0597]: `x` does not live long enough
 --> crates/life_time/src/main.rs:6:17
  |
5 |             let x = 5;
  |                 - binding `x` declared here
6 |             r = &x;
  |                 ^^ borrowed value does not live long enough
7 |         }
  |         - `x` dropped here while still borrowed
8 |         println!("r: {}", r);
  |                           - borrow later used here

```

## 借用检查器

Rust 编译器的借用检查器：

比较作用域来判断所有的借用是否合法。

## 函数中的泛型生命周期

示例：

```rust
fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";
    let result = longest(string1.as_str(), string2);
}

fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

执行发生报错，提示缺少生命周期的标注

```bash
error[E0106]: missing lifetime specifier
 --> crates/life_time/src/main.rs:7:33
  |
7 | fn longest(x: &str, y: &str) -> &str {
  |               ----     ----     ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
help: consider introducing a named lifetime parameter
  |
7 | fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
  |           ++++     ++          ++          ++

For more information about this error, try `rustc --explain E0106`.
```

报错的信息中提示，函数的返回值包含一个借用的值，但是没有声明借用是来自`x`还是`y`。可以引入一个命名的生命周期参数。

```Rust
// 使用泛型进行生命周期标注
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

表示有一个生命周期`'a` ，两个参数 `x`，`y` 的存活时间必须不能短于 `'a` ，返回值的存活时间也不能短于`'a'` 。`'a` 实际的生命周期是：`x`, `y`  两个生命周期较小的那个。

## 生命周期标注语法

生命周期的标注不会改变引用的生命周期长度，当指定了泛型生命周期参数，函数可以接收带有任何生命周期的引用。

生命周期的标注：描述了多个引用的生命周期间的关系，但不影响生命周期。

生命周期参数名：以`'` 开头，通常使用全小写字母，且非常短，很多人使用`'a` 

生命周期参数位置：在引用的`&`后边，使用空格将标注与引用类型分开。

示例：

```rust
&i32 // 一个引用
&‘a i32 // 带有显式生命周期的引用
&’a mut i32 // 带有显式生命周期的可变引用
```

单个生命周期的标注没有意义，标注生命周期是就是为了表示多个参数之间的生命周期关系。

## Struct定义中的生命周期标注

Struct结构体里可以是自持有的类型，也可以是引用，如果是引用就需要在每个引用上添加生命周期标注。

示例：

```rust
/// struct 的生命周期标注示例
pub struct ImportRxcerpt<'a> {
    // 表示该字段必须要和struct 这个实例存活时间一样长
    pub part: &'a str,
}

```

```rust
    #[test]
    fn test_struct() {
        let novel = String::from("Call me Ishmael. Some years ago...");
        // 获取第一个句子
        let first_sentence = novel.split('.')
            .next()
            .expect("Could not found a '.' ");

        let i = ImportRxcerpt {
            part: first_sentence
        };
    }
```

## 生命周期的省略

每个引用都有生命周期，需要为使用生命周期的函数或struct 指定生命周期参数。在Rust引用分析中所编入的模式称为生命周期省略规则。

这些规则无需开发者来遵守，它是是一些特殊情况，由编译器来考虑，如果你的代码符合这些情况，那么就无需显示标注生命周期。

示例：

```
    /// 可以省略生命周期标注
    fn test_first_word(s: &str) -> &str {
        let bytes = s.as_bytes();
        for (i, &item) in bytes.iter().enumerate() {
            if item == b' ' {
                return &s[0..i];
            }
        }
        &s[..]
    }
```

### 生命周期省略的三个规则

编译器使用3个规则在没有显示标注生命周期的情况下，来确定引用的生命周期。规则1应用于输入生命周期；规则2，3应用于输出生命周期。如果编译器应用完这3个规则之后，仍然有无法确定生命周期的引用那么就会报错。这些规则适用于`fn`, `impl` 块。

规则：

1. 每个引用类型的参数都有自己的生命周期
2. 如果只有一个生命周期参数，那么该生命周期被赋予给所有输出生命周期参数
3. 如果有多个输入生命周期参数，但其中一个是 `&self` 或 `&mut self` （是方法），那么`self` 的生命周期会被赋予给所有的输出生命周期参数

## 方法定义中的生命周期标注

在`struct` 上使用生命周期实现方法，语法和泛型参数的语法一样。**在哪声明和使用生命周期参数**，依赖于生命周期参数是否和**字段**，方法的**参数**或**返回值**有关。

struct 字段的生命周期名：

- 在`impl` 后声明
- 在`struct` 名后使用
- 这些生命周期是`struct` 类型的一部分

`impl` 块内的方法签名中：

引用必须绑定于`struct` 字段引用的生命周期，或者引用是独立的也可以，声明周期省略规则经常使得方法中的生命周期标注不是必须的。

示例：

```Rust
pub struct ImportRxcerpt<'a> {
    // 表示该字段必须要和struct 这个实例存活时间一样长
    pub part: &'a str,
}

/// 这里的声明周期标注不能省略
impl<'a> ImportRxcerpt<'a> {
    pub fn level(&self) -> i32 {
        3
    }
}
```

尽管 `level` 方法本身并不直接使用任何引用，它的签名仍然需要生命周期标注，因为它属于一个带有生命周期参数的结构体。这是因为该方法可能被调用时结构体的引用有效，而该方法内部可能会访问结构体的其他字段（尽管在这个特定的例子中它没有）。

## 静态生命周期

`'static` 是一个特殊的生命周期：整个程序的持续时间。

例如：所有的字符串字面值都拥有`'static` 生命周期

```rust
let s: &'static str = "I have a static lifetime";
```

带有额外泛型参数的示例：

```
use std::fmt::Display;

pub fn longest_with_an_announcement<'a, T>(x: &'a str, y: &'a str, ann: T) -> &'a str
where
    T: Display,
{
        println!("Announcement! {}", ann);
        if x.len() > y.len() {
            x
        } else {
            y
        }
}
```


