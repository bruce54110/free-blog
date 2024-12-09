# Rust的面向对象特性

Rust在设计的时候受到很多编程范式的影响，包括面向对象。**面向对象的语言共有一些共同的特征，即对象、封装和继承。**

## 封装

一个对象的实现细节对使用该对象的代码不可访问。因此，对象交互的唯一方式是通过其公共 API；使用对象的代码不应能直接触及对象的内部并改变数据或行为。这使得程序员能够更改和重构一个对象的内部实现，而无需改变使用该对象的代码。

使用`pub` 关键字来控制封装，Rust语言使用 `pub` 关键字来决定代码中的哪些模块、类型、函数和方法是公有的，而默认情况下其他所有内容都是私有的。

示例：

```rust
pub struct AveragedCollection {
    // 集合
    list: Vec<i32>,
    // 平均数
    average: f64,
}

impl AveragedCollection {
    pub fn add(&mut self, value: i32) {
        self.list.push(value);
        self.update_average();
    }

    pub fn remove(&mut self) -> Option<i32> {
        let result = self.list.pop();
        match result {
            Some(value) => {
                self.update_average();
                Some(value)
            }
            None => None,
        }
    }

    pub fn average(&self) -> f64 {
        self.average
    }

    fn update_average(&mut self) {
        let total: i32 = self.list.iter().sum();
        self.average = total as f64 / self.list.len() as f64;
    }


}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test() {
        let mut c = AveragedCollection {
            list: Vec::new(),
            average: 0.0,
        };
        c.add(1);
        c.add(5);
        println!("average value: {}", c.average());
        c.remove();
        println!("remove a node, and now average value: {}", c.average());


    }

}
```

结构体`AveragedCollection`中有`list`和 `average`两个字段，因为没有`pub` 关键字修饰，默认是私有的，也就是在结构体外部不能直接访问到。通过定义由`pub`关键字修饰的方法，使得可以通过方法访问并操作结构体中的字段。示例中添加元素，和移除元素是公共的方法，更新平均数方法是私有的。因为不希望外部可以修改平均数，这就是封装。

## 继承

继承：使得对象可以沿用另外一个对象的数据或行为，且无需重复定义相关代码。

**Rust 语言没有继承**

使用继承的场景：

1. 代码复用，Rust可以使用trait，默认的trait方法可以进行代码共享
1. 多态：泛型和trait约束（限定参数化多态 bounded parametric）

## 为共有行为定义一个trait

创建一个GUI工具：

1. 它会遍历某个元素的列表，依次调用元素的draw方法进行绘制，例如：Button，TextField等元素。

在面向对象语言中，惯例是定义一个父类Component，声明一个draw方法。定义Button，TextField 等类，继承Component类。

在Rust中需要trait来实现：

**注意：**

1. Rust避免将struct和enum 称之为对象，因为它们与impl块是分开的。
2. Trait 对象有些类似于其他语言的对象，因为在某种程度上组合了数据与行为。trait 对象与传统对象不同的地方：无法为trait对象添加数据。

3. trait对象被专门用于抽象某些共有行为，它没有其他语言的对象那么通用。

类比Java 的接口（interface）,接口定义方法声明，不同的实现类实现接口来提供不同的具体实现。比如一个Draw接口，定义了一个draw方法，不同的实现类实现Draw接口后，draw方法执行的内容不一样的。

这在Rust中通过 trait也可以实现同样的效果，示例如下：

**同一个方法，不同结构体的方法可以进行不同的具体实现**

示例代码：

```rust
pub trait Draw {
    fn draw(&self);
}

/// `Vec<Box<dyn Draw>>` 在这里的用法含义：无法再编译期确定单一类型，就要使用智能指针在堆上分配
pub struct Screen {
    pub components: Vec<Box<dyn Draw>>,
}

// 为结构体Screen 实现一个方法
impl Screen {
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();
        }
    }
}

pub struct Button {
    pub width: u32,
    pub height: u32,
    pub label: String,
}

impl Draw for Button {
    fn draw(&self) {
        println!("Button drawing")
    }
}

pub struct SelectBox {
    pub width: u32,
    pub height: u32,
    pub options: Vec<String>,
}

impl Draw for SelectBox {
    fn draw(&self) {
        println!("SelectBox drawing")
    }
    
}
```

```rust
    #[test]
    fn test_trait_oop() {

        let screen = Screen {
            components: vec![
                Box::new(SelectBox {
                    width: 75,
                    height: 10,
                    options: vec![String::from("Yes"), String::from("No"),]
                }),
                Box::new(Button {
                    width: 50,
                    height: 10,
                    label: String::from("OK"),
                }),
            ]
        };
        screen.run();
    }
```

执行结果：

```bas
running 1 test
test tests::test_trait_oop ... ok

successes:

---- tests::test_trait_oop stdout ----
SelectBox drawing
Button drawing


successes:
    tests::test_trait_oop
```

示例代码中有 `SelectBox`和 `Button` 两个结构体，同时为两个结构体都实现了`Draw` 这个trait。

通过 `Screen` 这个结构体的run方法执行传入trait对象的方法。`pub components: Vec<Box<dyn Draw>>` 这里使用`Box`表示这个数组中的对象是动态的。

>  我们在执行代码的时候，是动态像数组中填充对象的，这无法在编译期确定具体的对象类型。所以这里使用Box<dyn Draw>

当Button执行draw方法时，执行的是 Button 结构体中的draw方法实现，当SelectBox执行draw方法时，执行的是SelectBox中draw方法的实现。

#### Trait对象执行的是动作派发

 将trait约束作用于泛型时，Rust编译期会执行单态化：

编译器会为我们用来替换泛型类型参数的每一个具体类型生成对应函数和方法的非泛型实现。通过单态化生成的代码会执行静态派发（static dispatch），在编译过程中确定调用的具体方法。

动态派发（dynamic dispach）:无法在编译过程中确定调用的究竟是哪一个方法，编译器会产生额外的代码以便运行时找出希望调用的方法。

使用trait对象，会执行动态派发：

产生运行时开销，阻止编译器内联方法代码，使得部分优化操作无法进行

#### Trait对象必须保证对象安全

只能把满足对象安全（object-safe）的trait转化为trait对象。

**Rust采用一系列规则来判定某个对象是否安全，只需要记住两条：**

1. **方法的返回不是self**
2. **方法中不包含任何泛型类型参数**

## 后记
>有网友在csdn上评论提问trait如何实现多态？这里根据自己的理解再总结一遍。

先说复用，trait类型中声明的方法，可以只是方法声明也可以有方法体实现。当有方法体实现时，往往作为默认方法。不同的struct实现该trait，可以选择不实现trait 中的默认方法。程序运行时，会调用trait中的默认方法。这体现了代码复用，如果struct 无需有自己的特定的方法实现那就复用 trait的方法实现好了。
再说多态，当trait类型中只有方法声明，没有方法体时，Rust会强制 实现该trait的struct 必须有自己的对trait的具体方法实现。这样程序执行时，传入不同struct，调用的是不同struct的自己的具体方法实现，这体现了多态。

