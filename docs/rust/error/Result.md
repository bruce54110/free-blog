# Result

## Result 枚举

使用Result枚举作为方法返回值，来控制错误的处理方式

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

