# Rust学习之实现命令行小工具minigrep（二）

## 前言

继续记录一下Rust 语言学习过程，上次写了一个命令行查找字符串的小项目`minigrep`。学习完了闭包（Closures）和迭代器（Iterators）之后，我们使用这两个技术来改进`minigrep`这个项目。

本文源码：[代码仓库](https://github.com/BruceZhang54110/free_rs/blob/main/crates/minigrep1/src/main.rs)

## 改进实现

在`minigrep1` 这个项目中，lib.rs文件，我们对`Config`的build方法中进行改进。

上次我们的代码如下：

```rust

pub struct Config {
    pub query: String,
    pub file_path: String,
    pub ignore_case: bool,
}

impl Config {
    pub fn build(args: &[String]) -> Result<Config, &'static str> { // 1
        if args.len() < 3 {
            return Err("Not enouth arguments"); // 传入参数不够
        }
        let query = args[1].clone();
        let file_path = args[2].clone();
        let ignore_case = env::var("IGNORE_CASE=1").is_ok();

        Ok(Config {
            query,
            file_path,
            ignore_case
        })
    }
}
```

代码里`args: &[String]` 表示传进来的是字符串的切片引用，而后面的`Config` 需要拥有`query`，`file_path` 以及`ignore_case`。所以在代码中不得不克隆一份。

### 改进build方法

现在可以使用迭代器（Iterators）代替`&[String]`，对这里build方法进行改进，改进步骤如下：

1. 直接将`env::args()` 传入 `Config::build` 方法，`env::args()` 返回一个Iterator
2. `build` 方法声明中，args 参数类型改为`impl Iterator<Item = String>`
3. 使用迭代器的next方法获取元素并使用match语法进行匹配

**main.rs**

```rust

use std::env;
use std::process;

use minigrep1::Config;


fn main() {
    let args: Vec<String> = env::args().collect();
    // dbg!(args); // stderr
    // 传入两个参数
    // &args 改为 env::args()
    let config = Config::build(env::args()).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {}", err);
        process::exit(1);
    });

    if let Err(e) = minigrep1::run(config) {
        eprintln!("Application error {}", e);
        process::exit(1)
    }
}

```

**lib.rs**

改进前：

```rust

pub fn build(args: &Vec<String>) -> Result<Config, &'static str> {
    if args.len() < 3 {
      return Err("Not enouth arguments"); // 传入参数不够
    }
    let query = args[1].clone();
    let file_path = args[2].clone();
}



```

改进后：

```rust
impl Config {
    pub fn build(mut args: impl Iterator<Item = String>) -> Result<Config, &'static str> {
        args.next(); // skip the first argument
        let query = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a query string"),
        };

        let file_path = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a file_path string"),
        };

        let ignore_case = env::var("IGNORE_CASE=1").is_ok();

        Ok(Config {
            query,
            file_path,
            ignore_case
        })
    }
}
```

### 改进search方法

search方法中，是对文本进行遍历，进行判断查找。这里可以用迭代器，还可以用闭包。`contents.lines()` 返回一个迭代器

用迭代器把之前的for 循环都替换掉，使用filter时使用闭包

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    contents
        .lines()
        .filter(|line| line.contains(query))
        .collect()
}
```

同理，search_case_insensitive方法也同样使用迭代器和闭包进行修改

改进前：

```
pub fn search_case_insensitive<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let mut result = Vec::new();
    let query = query.to_lowercase();
    for line in contents.lines() {
        if line.to_lowercase().contains(&query) {
            result.push(line);
        }
    }
    result
}
```

改进后：

```rust
pub fn search_case_insensitive<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let query: String = query.to_lowercase();
    contents.lines().filter(|line| line.to_lowercase().contains(&query)).collect()
}
```

## 总结

项目使用迭代器和闭包优化之后首先代码效率提高了，为了将引用切片转移到`Config`中需要使用消耗性能的`clone`方法，现在我们就不需要了。**迭代器**和**迭代适配器**`filter` 方法的使用让我们编写更加简明的代码。





 

​	