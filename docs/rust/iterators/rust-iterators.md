# Rust入门之迭代器（Iterators）

## 前言

迭代器（Iterators）是 Rust 中**最核心的工具之一**，它不仅是遍历集合的抽象，更是 Rust **零成本抽象**（Zero-Cost Abstractions）和**所有权系统**完美结合的典范。与其他语言不同，Rust 的迭代器在提供高效遍历能力的同时，通过编译器的严格检查，确保内存安全和性能优化，从而避免了其他语言中常见的迭代器失效或越界访问等问题。本文将跟随《[Rust 程序设计语言](https://kaisery.github.io/trpl-zh-cn/title-page.html#rust-程序设计语言)》通过剖析迭代器的设计原理、使用方法及底层机制，帮助你掌握这一工具，并写出更符合 Rust 哲学的代码。

## 定义

迭代器模式允许你依次对一个序列中的项执行某些操作。**迭代器**（*iterator*）负责遍历序列中的每一项并确定序列何时结束的逻辑。

在 Rust 中，迭代器是 **惰性的**（*lazy*），这意味着在调用消费迭代器的方法之前不会执行任何操作。

```rust
fn main() {
    let v1 = vec![1, 2, 3];
    // 创建了一个迭代器，这段代码本身并没有执行任何有用的操作。
    let v1_iter = v1.iter();
}

```

- **惰性求值的优势**：避免不必要的计算开销，例如处理无限序列或仅在需要时生成元素。
- **实际应用场景**：处理大型数据集时，惰性迭代器可以节省内存，只在需要时加载数据。
- **显式消费的必要性**：必须调用消费方法（如`collect()`）才能触发实际迭代，否则不会执行任何操作。

使用`for` 关键字打印出数组中的元素。

```rust
fn main() {
    let v1 = vec![1, 2, 3];
    // 创建了一个迭代器，这段代码本身并没有执行任何有用的操作。
    let v1_iter = v1.iter();
    for val in v1_iter {
        println!("Got: {}", val);
    }
}

```

## Iterator Trait 和 next方法

**迭代器都实现了一个叫做 `Iterator` 的定义于标准库的 trait**，源码如下：

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // 此处省略了方法的默认实现
}
```

`type Item` 和 `Self::Item`，它们定义了 trait 的 **关联类型**。意味着实现 `Iterator` trait的时候必须定义一个Item，用于`next` 函数的返回元素的类型。

**next函数**

`next` 是 `Iterator` 实现者被要求定义的唯一方法：`next` 方法，该方法每次返回迭代器中的一个项，封装在 `Some` 中，并且当迭代完成时，返回 `None`。

如果调用`next`函数，迭代器变量**要声明为可变的**。在迭代器上调用 `next` 方法会改变迭代器内部的状态，每次调用`next`函数都会消费迭代器。

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn iterator_demonstration() {
        let v1 = vec![1, 2, 3];
        // 迭代器变量要声明为可变
        let mut v1_iter = v1.iter();

        assert_eq!(v1_iter.next(), Some(&1));
        assert_eq!(v1_iter.next(), Some(&2));
        assert_eq!(v1_iter.next(), Some(&3));
        assert_eq!(v1_iter.next(), None);
    }
}
```

代码中调用了四次`next`函数，如果有值返回的是由Some包着的引用，如果没有值了返回None。

**根据需要可以获取不同引用所有权的迭代器：**

1. `iter()` 创建的是不可变引用的迭代器。
2. `into_iter()` 能获得数组的的所有权，并返回具有所有权的值。
3. `iter_mut()` 创建的是一个可以遍历到可变引用的迭代器。

|     方法      | 元素类型 |   所有权   | 原集合后续可用性 |
| :-----------: | :------: | :--------: | :--------------: |
|   `iter()`    |   `&T`   |    借用    |        是        |
| `iter_mut()`  | `&mut T` |  可变借用  |        是        |
| `into_iter()` |   `T`    | 转移所有权 |        否        |

示例：所有权发生转移，`println!`不能再使用`v1`

```rust
let v1 = vec![1, 2, 3];
let v1_iter = v1.into_iter();
// println!("{:?}", v1); // 编译错误：value borrowed after move
```

## 消费迭代器的方法

`Iterator` trait 有一系列不同的由标准库提供默认实现的方法。我们可以在 `Iterator` trait 的标准库 API 文档中找到所有这些方法。一些方法在其定义中调用了 `next` 方法，这也就是为什么在实现 `Iterator` trait 时要求实现 `next` 方法的原因。这些调用 `next` 方法的方法被称为 **消费适配器**（*consuming adaptors*），因为调用它们会消耗迭代器。一个消费适配器的例子是 `sum` 方法。这个方法获取迭代器的所有权并反复调用 `next` 来遍历迭代器，因而会消费迭代器。在遍历过程中，它将每个项累加到一个总和中，并在迭代完成时返回这个总和。

点开sum函数源码，并没看到调用next方法，这里其实是使用了 `Sum trait`，`Iterator::sum()` 的实现通过将遍历和累加委托给 `Sum trait`，只要能确认迭代器中存放的什么类型就能由对应的trait实现求和。后续这里我专门写一篇文章探究学习一下。

```rust
    #[stable(feature = "iter_arith", since = "1.11.0")]
    fn sum<S>(self) -> S
    where
        Self: Sized,
        S: Sum<Self::Item>,
    {
        Sum::sum(self)
    }
```

- 标准库sum方法文档：https://doc.rust-lang.org/stable/std/iter/trait.Iterator.html#method.sum

使用`sum()` 对集合当中的元素求和

```
		#[test]
    fn test_sum() {
        let v1 = vec![1,2,3];
        let total: i32 = v1.iter().sum();
        assert_eq!(total, 6);
    }
```

## 创建迭代器的方法

`Iterator` trait 中定义了另一类方法，被称为 **迭代适配器**（*iterator adaptors*），它们不会消耗当前的迭代器，而是通过改变原始迭代器的某些方面来生成不同的迭代器，如 `map`方法。

```rust
    #[test]
    fn test_map() {
        let v1 = vec![1,2,3];
        let v3: Vec<_> = v1.iter().map(|i| i + 1).collect();
        assert_eq!(v3, vec![2, 3, 4]);
    }
```

由于 `map` 接受一个闭包，因此我们可以指定希望在每个元素上执行的任何操作。这是一个很好的例子，展示了如何通过闭包来自定义某些行为，同时复用 `Iterator` trait 提供的迭代行为。

可以链式调用多个迭代器适配器来以一种可读的方式进行复杂的操作。不过因为所有的迭代器都是惰性的，你必须调用一个消费适配器方法，才能从这些迭代器适配器的调用中获取结果。

**消费迭代器的方法**叫做消费适配器

**创建迭代器的方法** 叫做迭代适配器



## 使用捕获其环境的闭包

很多迭代器适配器接受闭包作为参数，而我们通常会指定捕获其环境的闭包作为迭代器适配器的参数。

在这里再介绍一个**迭代适配器**`filter()`，也利用了闭包中的一个特性：[**通过闭包捕获定义它的环境中的值**](https://bruce54110.github.io/free-blog/rust/closures/rust-closures.html#%E9%80%9A%E8%BF%87%E9%97%AD%E5%8C%85%E6%8D%95%E8%8E%B7%E5%AE%9A%E4%B9%89%E5%AE%83%E7%9A%84%E7%8E%AF%E5%A2%83%E4%B8%AD%E7%9A%84%E5%80%BC)（跳转闭包相关文章）。

我们使用 `filter` 方法来获取一个闭包。该闭包从迭代器中获取一项并返回一个 `bool`。如果闭包返回 `true`，其值将会包含在 `filter` 提供的新迭代器中。如果闭包返回 `false`，其值不会被包含。

**使用 `filter` 方法和一个捕获 `shoe_size` 的闭包**，示例代码如下：

```rust
#[derive(PartialEq, Debug)]
struct Shoe {
    size:i32,
    style: String,
}

fn shoes_in_size(shoes: Vec<Shoe>, shoe_size: i32) -> Vec<Shoe> {
    // 必须使用into_iter() 获得数组所有权，因为collect 要求生成一个Vec<Shoe>
    shoes.into_iter().filter(|s| s.size == shoe_size).collect()
}
```

```rust

#[test]
    fn filters_by_size() {
        let shoes = vec![
            Shoe {
                size: 10,
                style: String::from("sneaker"),
            },
            Shoe {
                size: 13,
                style: String::from("sandal"),
            },
            Shoe {
                size: 10,
                style: String::from("boot"),
            },
        ];

        let in_my_size = shoes_in_size(shoes, 10);

        assert_eq!(
            in_my_size,
            vec![
                Shoe {
                    size: 10,
                    style: String::from("sneaker")
                },
                Shoe {
                    size: 10,
                    style: String::from("boot")
                },
            ]
        );
    }

```

`shoes_in_size` 函数获取一个鞋子 vector 的所有权和一个鞋码作为参数。它返回一个只包含指定鞋码的鞋子的 vector。

`shoes_in_size` 函数体中调用了 `into_iter` 来创建一个获取 vector 所有权的迭代器。接着调用 `filter` 将这个迭代器适配成一个只含有那些闭包返回 `true` 的元素的新迭代器。

闭包从环境中捕获了 `shoe_size` 变量并使用其值与每一只鞋的大小作比较，只保留指定鞋码的鞋子。最终，调用 `collect` 将迭代器适配器返回的值收集进一个 vector 并返回。

这个测试展示当调用 `shoes_in_size` 时，返回的只会是与我们指定的鞋码相同的鞋子。

---

在代码中使用的是`into_iter()`，没有使用`iter()`是为什么呢？ 这里再分析一下他们的区别：

**`iter()` 与 `into_iter()` 的核心区别**

- **`iter()`**：生成一个 **不可变引用** 的迭代器，元素类型为 `&T`。原集合保留所有权，后续仍可使用。
- **`into_iter()`**：生成一个 **拥有所有权** 的迭代器，元素类型为 `T`。原集合被消耗（所有权转移），后续无法再使用。

调用`collect()`方法 试图将引用类型 `&Shoe` 收集到 `Vec<Shoe>` 中，但 `Vec<Shoe>` 只能存储 `Shoe` 类型的元素，不能存储引用，所以需要获得所有权。使用 `into_iter()` 是为了将元素的所有权从原集合转移到新集合中，确保 `collect()` 可以直接生成 `Vec<Shoe>`，避免类型不匹配和克隆开销。这是 Rust 所有权系统和类型安全性的直接体现。