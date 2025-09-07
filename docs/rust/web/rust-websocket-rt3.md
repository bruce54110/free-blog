# Axum 最佳实践：如何构建优雅的 Rust 错误处理系统？（三）

## 引言

作为开发者，我们都经历过这样的场景：项目上线后，你打开日志监控，铺天盖地的 500 Internal Server Error 扑面而来。这些错误像个黑洞，吞噬着你的调试时间，你甚至不知道它们是从数据库查询失败，还是某个第三方 API 调用超时。

更糟的是，这些错误未经处理，直接甩给了前端。用户看到一个冰冷的 500 页面，或者一个包含敏感信息的 JSON 响应，这不仅破坏了用户体验，更暴露了服务器的内部实现。

从异常种类来说，异常的种类有很多，有前端传来的参数不对导致的异常，有数据库连接超时异常，有查询数据查不到需要返回业务异常。不同的异常，我们希望有错误发生时，提供更优雅的响应提示客户。同时，也可以对不同异常设置不同的异常响应码，使前端更方便的处理接口返回值。

Rust 开发 Web 程序时的常见痛点：

1. 大量的 match 语句，代码变得冗长且难以阅读。
2. 错误信息不统一，前端拿到一堆难以处理的 500 错误。
3. 调试困难，服务器内部的详细错误信息没有被记录。
4. 如何优雅区分服务器异常与业务异常。

**我们使用四招来实现优雅处理 Axum Web 应用中的错误处理。**

>  本文相关源码来自本人 Rust Axum 开发 Websocket as a Service 项目。 GitHub 地址：[HTTPS://GitHub.com/BruceZhang54110/RTMate](https://github.com/BruceZhang54110/RTMate)

## 第一招：定义统一接口响应结构

定义一个结构体 RtResponse 统一接口返回结构，代码如下。业务成功时调用 ok_with_data 默认 code 是 200，业务失败时，调用 err 方法。那么如何让系统异常和业务异常都转换为 RtResponse 呢？这时候就要看第二招了。

```
#[derive(Serialize, Debug)]
pub struct RtResponse<T> {
    code: i32,
    message: String,
    data: Option<T>,
}

impl<T> RtResponse<T> {

    /// 创建一个带数据的业务成功响应
    pub fn ok_with_data(data: T) -> Self {
        RtResponse {
            code: 200,
            message: 「success」.to_string(),
            data: Some(data),
        }
    }

    /// 创建一个无数据的业务成功响应
    pub fn ok() -> Self {
        RtResponse {
            code: 200,
            message: 「success」.to_string(),
            data: None,
        }
    }

    /// 创建一个业务失败响应
    pub fn err(code: i32, message: &str) -> Self {
        RtResponse {
            code,
            message: message.to_string(),
            data: None,
        }
    }
}
```

接口返回的 JSON 结果就会是如下 JSON 格式：

```
{
    「code」: 200,
    「message」: 「success」,
    「data」: {
        「app_id」: 「abc」,
        「token」: 「eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcHBfaWQiOiJhYmMiLCJjbGllbnRfaWQiOiJlZDU0ZDE2My1iM2EyLTRhZmMtODc4OC01MjAyODA4Yjk0OTEiLCJpYXQiOjE3NTcxNzYwNjgsImV4cCI6MTc1NzE4MzI2OH0.3LNM7jAeG3YL4jb88p4_Ew96gXvw4AoE38MBEYLvK-s」
    }
}
{
    「code」: 500,
    「message」: 「系统内部错误」,
    「data」: null
}
```

## 第二招：统一异常封装

我们不能将数据库错误或文件写入错误信息原封不动的返回给前端，这时需要有一个统一异常处理。因此我们创建一个 ArrError 结构体：

```
pub struct AppError {
    pub code: i32,
    pub message: String,
    pub source: Option<anyhow::Error>,
}
```

code：业务错误码，用于前端精确判断错误类型。

message：对前端友好的提示信息。

source：一个 anyhow::Error，用于在日志中打印完整的错误链，这个字段永远不会发送给前端。

Axum 提供了一个用来生成响应结果的 IntoResponse trait，一般情况下，使用 Axum 开发接口时不是必须要实现 IntoResponse trait，如果需要处理程序返回的自定义错误类型，这个时候则有必要使用。在这里实现方法中转换为 RtResponse。

```
// Tell axum how to convert `AppError` into a response.
impl IntoResponse for AppError {

    fn into_response(self) -> axum::response::Response {
         // 使用 () 作为 T，表示没有数据
        let response = RtResponse::<()> {
            code: self.code,
            message: self.message,
            data: None,
        };
        (StatusCode::OK, Json(response)).into_response()
    }

}
```

## 第三招：转换服务器异常类型

前面定义了统一异常结构体，这时候就要派上用场了。我们需求是，对于数据库连接失败，文件写入失败这些我们无法预料的错误，我们希望它们都统一返回 500，保证敏感错误信息不展示给前端的同时，在服务端有日志打印可以看到错误异常堆栈信息。

我们可以利用 anyhow  处理不同的错误，因为它能将任何实现了 std::error::Error 的类型封装起来。anyhow 的错误信息如何转换为 AppError 呢，这里我们要用到 From 与 Into，统一转换为 code 是 500， message 是 “系统服务器异常” 的 AppError，代码如下：

```
impl <E> From<E> for AppError
where
    E: Into<anyhow::Error>
{
    fn from(value: E) -> Self {
        let source = value.into();
        tracing::error!(「Internal error: {:?}」, source);
        AppError {
            code: 500, // 500 表示服务器异常
            message: 「系统内部错误」.to_string(),
            source: Some(source),
        }
    }

}
```

在这里有必要讲一下 From trait ，它定义了一个类型定义如何从另一个类型创建自身，从而提供了一种非常简单的在多种类型之间转换的机制。标准库中有许多此 trait 的实现，用于原始类型和常见类型的转换。

例如，我们可以轻松地将 a 转换 str 为 a String

```
let my_str = 「hello」;
let my_string = String::from(my_str);
```

Into trait 可以理解为 From trait 的反转，如果一个类型实现了 From<T>，那么编译器会自动为它实现 Into<T> 。

- From<T> 表示可以从 T 类型转换为实现 From trait 的类型
- Into<T> 表示某个类型可以转换为 T

**所以在我们异常转换的场景中就实现了** **From** **trait ，将其他异常转换为我们统一定义的** **AppErrr****。**

```
impl <E> From<E> for AppError  // AppError 是目标类型
where
    E: Into<anyhow::Error> // 这里被转换类型
```

单元测试：

```
// 测试 anyhow::Error 是否能正确转换为 AppError
    #[test]
    fn test_anyhow_error_to_app_error_conversion() {
        let anyhow_error = anyhow!(「数据库连接失败」);
        let app_error = AppError::from(anyhow_error);
        assert_eq!(app_error.code, 500);
        assert_eq!(app_error.message, 「系统内部错误」);
    }
```

执行结果：

```
running 1 test
test tests::test_anyhow_error_to_app_error_conversion ... ok

successes:

successes:
    tests::test_anyhow_error_to_app_error_conversion

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0.00s
```

这样我们就实现了让它们都统一返回 500，保证敏感错误信息不展示给前端的同时，在服务端有日志打印可以看到错误异常堆栈信息。

## 第四招：转换自定义异常类型

我使用枚举定义一些业务异常，这些业务异常对前端来说是重要的，所以业务异常 code 和 message 需要和系统异常区分开，让前端清晰的判断业务异常。

```
pub enum BizError {
    // 应用未找到
    AppNotFound,
    // 参数错误
    InvalidParams,
    // 非法签名
    InvalidSignature,
}
```

为 AppError 实现 From trait，这样业务异常也能转换为 AppError 了，这里我们使用 match 对于不同的业务异常返回不同的 code 和 message。

```
impl From<BizError> for AppError {
    fn from(value: BizError) -> Self {
        match value {
            BizError::AppNotFound => AppError {
                code: 1004,
                message: 「您的 app 未找到，请检查 appId」.to_string(),
                source: None,
            },
            BizError::InvalidParams => AppError {
                code: 400,
                message: 「参数错误」.to_string(),
                source: None,
            },
            BizError::InvalidSignature => AppError {
                code: 1005,
                message: 「签名验证失败，请检查您的请求是否合法」.to_string(),
                source: None,
            },
        }
    }
}
```

单元测试：

```
// 测试 BizError::AppNotFound 是否能正确转换为 AppError
    #[test]
    fn test_biz_error_to_app_error_conversion() {
        // 创建一个 BizError 实例
        let biz_error = BizError::AppNotFound;
        let app_error = AppError::from(biz_error);
        assert_eq!(app_error.code, 1004);
        assert_eq!(app_error.message, 「您的 app 未找到，请检查 appId」);
    }
```

执行结果：

```
running 1 test
test tests::test_biz_error_to_app_error_conversion ... ok

successes:

successes:
    tests::test_biz_error_to_app_error_conversion
```

## 那么如何使用呢 ？

```
fn get() -> Result<Json<RtResponse<AppAuthResult>>, AppError> {
    /////// 省略
    if signature != rt_app_param.signature {
          // 签名不匹配，返回错误
          return Err(AppError::from(BizError::InvalidSignature));
   	}
   /////// 省略
  Ok(Json(RtResponse::ok_with_data(result)))
}
let rt_app = web_context
  .dao.get_rt_app_by_app_id(&rt_app_param.app_id)
  .await?
  .ok_or(BizError::AppNotFound))?;
```

这里有两点需要注意：

1. 第一是使用了错误传播运算符? ，如果 Result 的值是 Ok，这个表达式将会返回 Ok 中的值而程序将继续执行。如果值是 Err，Err 将作为整个函数的返回值，就好像使用了 return 关键字一样，这样错误值就被传播给了调用者。

所以如果 get_rt_app_by_app_id 返回了 Error，错误就会立马返回，而且因为 AppError 实现了 From trait，会自动将错误类型进行转换。到了上方调用者错误就转换为了 AppError。

1. 第二，如果 get_rt_app_by_app_id 查不到返回 None，在这里使用 了 ok_or 将 None 转换为 Err，参数是自定义的枚举异常。如果查不到 app_id 就会返回 BizError::AppNotFound 业务异常。由于 BizError 实现了 From trait，同样可以转换为 AppError。

方法返回了 AppError 之后，Axum 根据我们实现的 IntoResponse 方法，将 AppError 的 code 和 message 转换为 RtResponse 的 code 和 message，data 是 None。

总结一下，正常结果转换为 RtResponse，业务异常先转换为有业务自定义 code 和 message 的 AppError，AppError 转换为 RtResponse，最后返回给前端响应。如果是系统异常，结合错误传播运算符?，系统异常转换为 AppError，AppError 转换为 RtResponse，最后返回给前端响应。这样我们就以一种简洁优雅的方式统一了错误返回。

初次学习 Axum 开发 Web 应用，虽然 Rust 学习难度大，但是随着学习的深入，发现类似 From trait 这种巧妙的设计，开发出简洁优雅且性能并未打折的代码，还有是小小的爽感的。在学习和写项目过程中，写技术博客帮助自己巩固知识点，后续 Rust 相关技术文章继续更新，欢迎点赞关注。
