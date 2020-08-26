! ~OpenAPI Swagger



!! 什么是 ~OpenAPI

''O''pen''A''PI ''S''pecification（简称 OAS）是用来描述一套 API 的一系列标准。在一开始，这套标准的名字是 Swagger API Specification，由 Swagger 在 2015 年捐献出来后，重新命名为 ~OpenAPI Specification。作为一个开源标准，~OpenAPI 用来描述完整的 API，包括：

* ''Endpoints'': API 中的 Endpoints 与每一个 Endpoint 的 Operation。（`GET /users`, `POST /users`)
* ''Operation Signature'': Operation 的参数，与每个 Operation 的输入输出。
* ''Secure Authorization'': 安全认证的方法。
* ''Metadata Info'': 一些元数据，联系方式，license 和其他信息。


!! 什么是 Swagger

Swagger API 标准可以使用 [[YAML|Yaml]] 或者 [[JSON|Python Json]]。

''Swagger'' 是一系列工具，有开源工具还有一些商业工具，这些工具都围绕着 Swagger API Specification 构建，来帮助你设计，构建 API，并可以自动生成文档、客户端、服务端等。Swagger 主要的三个开源工具有：


* [[Swagger Editor|http://editor.swagger.io/]] – 基于浏览器的 API 编辑器，可以方便的编写 API 标准
* [[Swagger UI|https://swagger.io/swagger-ui/]] – 自动生成动态 API 文档。
* [[Swagger Codegen|https://github.com/swagger-api/swagger-codegen]] – 根据 API specification 自动生成 客户端和服务端。


!! 为何使用 ~OpenAPI

API 描述自己结构的能力是 ~OpenAPi 中所有出色能力的根源。一旦描述编写完成，~OpenAPI  标准的 Swagger 工具可以让你的 API 开发更加高效。

* 使用 [[Swagger Codegen|https://swagger.io/swagger-codegen/]] 生成一个 stub，你只需要在生成的 Stub 中编写服务端的代码。
* 使用 [[Swagger Codegen|https://swagger.io/swagger-codegen/]] 生成一个 API 客户端，直接就能方便的发送请求。
* 使用 [[Swagger UI|https://swagger.io/swagger-ui/]] 生成动态的交互的文档，可以让你在浏览器中直接发送请求。
* 根据 API Specification，可以连接一系列实用的 API 工具。例如使用 [[SoapUI|https://soapui.org/]] 来创建自动测试。
* 更多工具可以查看：[[开源工具|https://swagger.io/open-source-integrations/]] 与 [[商业工具|https://swagger.io/commercial-tools/]]

!! Swagger Codegen 与 ~OpenAPI Codegen

Swagger Codegen 是由 ~SmartBear 维护的，而 ~OpenAPI Generator 是由社区维护的。但是两个项目中有许多开发者都是共同参与的，更多信息可以查看 [[Fork Q&A](https://openapi-generator.tech/docs/fork-qna)

!! API 标准

OAS 当前一共有两个标准，2.0 和 3.0，其中：

* 2.0 发布于 2014 年 9 月 8 日。  参考文档：https://swagger.io/specification/v2/
* 3.0 发布于 2017 年 7 月 26 日。 参考文档：https://swagger.io/specification/
* 3.0.1 补丁发布于 2017 年 12 月 6 日
* 3.0.2 补丁发布于 2018 年 10 月 8 日
* 3.0.3 补丁发布于 2020 年 02 月 20 日

