# Result 枚举

## 使用Result枚举作为方法返回值，来控制错误的处理方式

Result 在Rust源码：

```rust
/// `Result` is a type that represents either success ([`Ok`]) or failure ([`Err`]).
///
/// See the [module documentation](self) for details.
#[derive(Copy, PartialEq, PartialOrd, Eq, Ord, Debug, Hash)]
#[must_use = "this `Result` may be an `Err` variant, which should be handled"]
#[rustc_diagnostic_item = "Result"]
#[stable(feature = "rust1", since = "1.0.0")]
pub enum Result<T, E> {
    /// Contains the success value
    #[lang = "Ok"]
    #[stable(feature = "rust1", since = "1.0.0")]
    Ok(#[stable(feature = "rust1", since = "1.0.0")] T),

    /// Contains the error value
    #[lang = "Err"]
    #[stable(feature = "rust1", since = "1.0.0")]
    Err(#[stable(feature = "rust1", since = "1.0.0")] E),
}
```

Result 枚举类型会指示出可能得失败，Result 枚举作为方法返回值时，如果成功就返回`Ok`结果，如果失败就返回`Err`结果。

### 使用 `match` 处理Result

示例源代码：https://github.com/BruceZhang54110/free_rs/blob/main/crates/error_demo/src/lib.rs

代码示例：

```rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");
    let f = match f {
        Ok(file) => file,
        Err(error) => {
            panic!("Error opening file {:?}", error);
        }
    };
}

```

`cargo run`

```
thread 'main' panicked at crates/error_demo/src/main.rs:12:13:
Error opening file Os { code: 2, kind: NotFound, message: "No such file or directory" }
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

### 匹配不同的错误

```
    let f = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Error creating file {:?}", e),
            },
            other_error => panic!("Error opening the file: {:?}", other_error),
        },
    };
```

使用闭包改进代码：

```
    let f = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("Error creating file {:?}", error);
            })
        } else {
            panic!("Error opening the file: {:?}", error);
        }
    });
```

### unwrap

unwrap 是match表达式匹配Result的一个快捷方法，如果Result结果是Ok，返回Ok里的值，如果Result结果是Err，就会调用panic!宏。

```
use std::fs::File;

fn open_file_unwrap() {
    let f = File::open("hello.txt").unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_open_file_unwrap() {
        open_file_unwrap();
    }
}
```

执行该单元测试

 ```
 ---- tests::test_open_file_unwrap stdout ----
 thread 'tests::test_open_file_unwrap' panicked at crates/error_demo/src/lib.rs:4:37:
 called `Result::unwrap()` on an `Err` value: Os { code: 2, kind: NotFound, message: "No such file or directory" }
 ```

unwrap 有个缺点，无法指定错误信息。

### expect

expect和 unwrap 类似，但是可以指定错误信息

```
use std::fs::File;

fn open_file_expect() {
    let f = File::open("hello.txt").expect("无法打开文件");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_open_file_expect() {
        open_file_expect();
    }
}
```

执行该单元测试

```
---- tests::test_open_file_expect stdout ----
thread 'tests::test_open_file_expect' panicked at crates/error_demo/src/lib.rs:8:37:
无法打开文件: Os { code: 2, kind: NotFound, message: "No such file or directory" }
```

### 错误传递

可以将错误传递给调用者，这里我类比Java的抛出异常会传递上上层调用者。

代码示例：

```rust
fn read_username_from_file() -> Result<String, Error> {
    let username_file_result = File::open("hello.txt");
    let mut user_name_file = match username_file_result {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut username = String::new();

    match user_name_file.read_to_string(&mut username) {
        Ok(_) => Ok(username),
        Err(e) => Err(e),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // 测试错误传递
    #[test]
    fn test_read_username_from_file() { // crates/error_demo/src/lib.rs:43:57
        assert_eq!("my name", read_username_from_file().unwrap());
    }
}
```

执行结果：

```bash
---- tests::test_read_username_from_file stdout ----
thread 'tests::test_read_username_from_file' panicked at crates/error_demo/src/lib.rs:43:57:
called `Result::unwrap()` on an `Err` value: Os { code: 2, kind: NotFound, message: "No such file or directory" }
```

### 传播错误的简写：?运算符

```rust
// 使用 ?运算符传递错误
fn read_username_from_file_two() -> Result<String, Error> {
    let mut username_file = File::open("hello.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Ok(username)
}

// 使用 ?运算符传递错误，链式调用写法
fn read_username_from_file_three() -> Result<String, Error> {
    let mut username = String::new();
    File::open("hello.txt")?.read_to_string(&mut username)?;
    Ok(username)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_open_file_unwrap() {
        open_file_unwrap();
    }

    #[test]
    fn test_open_file_expect() {
        open_file_expect();
    }

    // 测试错误传递
    #[test]
    fn test_read_username_from_file() {
        // assert_eq!("my name", read_username_from_file().unwrap());
        // assert_eq!("my name", read_username_from_file_two().unwrap());
        assert_eq!("my name", read_username_from_file_three().unwrap());
    }
}
```



