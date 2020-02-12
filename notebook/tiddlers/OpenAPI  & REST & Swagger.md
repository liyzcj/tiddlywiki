# OpenAPI REST Swagger



## 什么是 OpenAPI

**OpenAPI Specification** (formerly Swagger Specification) is an API description format for REST APIs. An OpenAPI file allows you to describe your entire API, including:

- Available endpoints (`/users`) and operations on each endpoint (`GET /users`, `POST /users`)
- Operation parameters Input and output for each operation
- Authentication methods
- Contact information, license, terms of use and other information.

## 什么\是 Swagger

API specifications can be written in YAML or JSON. The format is easy to learn and readable to both humans and machines. The complete OpenAPI Specification can be found on GitHub: [OpenAPI 3.0 Specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md)

**Swagger** is a set of open-source tools built around the OpenAPI Specification that can help you design, build, document and consume REST APIs. The major Swagger tools include:

- [Swagger Editor](http://editor.swagger.io/) – browser-based editor where you can write OpenAPI specs.
- [Swagger UI](https://swagger.io/swagger-ui/) – renders OpenAPI specs as interactive API documentation.
- [Swagger Codegen](https://github.com/swagger-api/swagger-codegen) – generates server stubs and client libraries from an OpenAPI spec.



## 为何使用 OpenAPI

The ability of APIs to describe their own structure is the root of all awesomeness in OpenAPI. Once written, an OpenAPI specification and Swagger tools can drive your API development further in various ways:

- Design-first users: use [Swagger Codegen](https://swagger.io/swagger-codegen/) to **generate a server stub** for your API. The only thing left is to implement the server logic – and your API is ready to go live!
- Use [Swagger Codegen](https://swagger.io/swagger-codegen/) to **generate client libraries** for your API in over 40 languages.
- Use [Swagger UI](https://swagger.io/swagger-ui/) to generate **interactive API documentation** that lets your users try out the API calls directly in the browser.
- Use the spec to connect API-related tools to your API. For example, import the spec to [SoapUI](https://soapui.org/) to create automated tests for your API.
- And more! Check out the [open-source](https://swagger.io/open-source-integrations/) and [commercial tools](https://swagger.io/commercial-tools/) that integrate with Swagger.



## What is the difference between Swagger Codegen and OpenAPI Generator?

Swagger Codegen is driven by SmartBear while OpenAPI Generator is driven by the community. More than 40 top contributors and template creators of Swagger Codegen have joined OpenAPI Generator as the founding team members. For more details, see the [Fork Q&A](https://openapi-generator.tech/docs/fork-qna).

Swagger is a trademark owned by SmartBear and the use of the term "Swagger" in this project is for demo (reference) purposes only.



### Cloud Endpoint

Cloud Endpoints 让我们能够以更快的速度、更一致的方式构建并交付 API。



[gRPC](http://www.grpc.io/) 是一个由 Google 开发的高性能开源通用 RPC 框架。在 gRPC 中，客户端应用可以直接调用其他机器上的服务器应用中的方法，如同调用本地对象一样，从而让您更轻松地创建分布式应用和服务。

使用 gRPC 的主要优势之一是用于生成文档；您可以使用服务配置和 API 接口定义文件来生成 API 的参考文档。如需了解详情，请参阅[开发者门户概览](https://cloud.google.com/endpoints/docs/grpc/dev-portal-overview?hl=zh-cn)。



### API 管理

Endpoints 能与[可扩展服务代理 (ESP)](https://cloud.google.com/endpoints/docs/grpc/glossary?hl=zh-cn#extensible_service_proxy) 配合使用来提供 API 管理功能。

借助适用于 gRPC 的 Endpoints，您可以使用 Endpoints 的 API 管理功能向您的 gRPC 服务添加 API 控制台、监控、托管、跟踪、身份验证等。此外，您指定了特殊的映射规则以后，ESP 会将基于 HTTP 的 RESTful JSON 转换为 gRPC 请求。这意味着您可以部署由 Endpoints 管理的 gRPC 服务器，并通过 gRPC 或 JSON/HTTP 客户端调用其 API，从而为您提供更高的灵活性，也为您将其与其他系统集成提供了便利。

![](https://cloud.google.com/endpoints/docs/images/grpc-endpoints.png?hl=zh-cn)

您可以使用 gRPC 支持的任何语言针对 Endpoints 创建 gRPC 服务。您可以在 [gRPC 网站](http://www.grpc.io/docs/)上找到关于 gRPC 的更多信息，包括用于创建服务器和客户端的快速入门和教程等内容。

### 服务定义和配置

gRPC 基于定义**服务**的思路，指定可以远程调用的方法及其参数和返回类型。默认情况下，gRPC 使用 [Protocol Buffers](https://developers.google.com/protocol-buffers/docs/overview?hl=zh-cn) 作为接口定义语言 (IDL) 来描述服务接口和负载消息的结构。

```
// The greeting service definition.
service Greeter {
  // Sends a greeting
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}

// The request message containing the user's name.
message HelloRequest {
  string name = 1;
}

// The response message containing the greetings
message HelloReply {
  string message = 1;
}
```

要将 gRPC 与 Endpoints 配合使用，您必须提供[服务配置](https://cloud.google.com/endpoints/docs/grpc/grpc-service-config?hl=zh-cn)以及服务定义。这将配置服务的运行时行为，包括身份验证、服务中包含的 API、从 HTTP 请求到 gRPC 方法的映射以及特殊的 Cloud Endpoints 设置。

### 转码

Endpoints 可为您的 gRPC 服务提供协议转换，因而使客户端可以使用 HTTP/JSON 通过可扩展服务代理与 gRPC 服务进行通信。

最常见的使用场景是允许浏览器客户端与 gRPC 服务器通信，而无需 gRPC 服务器库提供特殊支持。Endpoints 提供了一种机制，可在[服务配置](https://cloud.google.com/endpoints/docs/grpc/grpc-service-config?hl=zh-cn)过程中将 HTTP 请求映射到 gRPC 方法。

您可以在[将 HTTP/JSON 转码为 gRPC](https://cloud.google.com/endpoints/docs/grpc/transcoding?hl=zh-cn) 中找到更多相关信息。

### 将 HTTP/JSON 转码为 gRPC

> https://cloud.google.com/endpoints/docs/grpc/transcoding?hl=zh-cn

Cloud Endpoints 支持协议转码，以便客户端可以使用 HTTP/JSON 访问您的 gRPC API。Extensible Service Proxy (ESP) 可将 HTTP/JSON 转码为 gRPC。

- 如何使用 `.proto` 文件中的注释来指定从 HTTP/JSON 到 gRPC 的数据转换
- 如何在 Endpoints 中部署您的服务以使用此功能
- 在哪里可以找到有关为 gRPC 服务设计和实现转码的更多参考信息

假设您已完成我们的 gRPC [教程](https://cloud.google.com/endpoints/docs/grpc/tutorials?hl=zh-cn)并熟悉基本的[适用于 gRPC API 的 Endpoints](https://cloud.google.com/endpoints/docs/grpc/about-grpc?hl=zh-cn) 概念。