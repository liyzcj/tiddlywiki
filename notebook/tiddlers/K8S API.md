# K8S API



> [API协议文档](https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md)描述了主系统和API概念。
>
> [API参考文档](https://kubernetes.io/docs/reference)描述了API整体规范。
>
> [访问文档](https://kubernetes.io/docs/admin/accessing-the-api)讨论了通过远程访问API的相关问题。

- Kubernetes API是系统描述性配置的基础。 [Kubectl](https://kubernetes.io/docs/user-guide/kubectl/) 命令行工具被用于创建、更新、删除、获取API对象。
- Kubernetes 通过API资源存储自己序列化状态(现在存储在[etcd](https://coreos.com/docs/distributed-configuration/getting-started-with-etcd/))。
- Kubernetes 被分成多个组件，各部分通过API相互交互。

## API 变更

根据经验，任何成功的系统都需要随着新的用例出现或现有用例发生变化的情况下，进行相应的进化与调整。因此，我们希望Kubernetes API也可以保持持续的进化和调整。同时，在较长一段时间内，我们也希望与现有客户端版本保持良好的向下兼容性。一般情况下，增加新的API资源和资源字段不会导致向下兼容性问题发生；但如果是需要删除一个已有的资源或者字段，那么必须通过[API废弃流程](https://kubernetes.io/docs/reference/deprecation-policy/)来进行。

参考[API变更文档](https://git.k8s.io/community/contributors/devel/sig-architecture/api_changes.md)，了解兼容性变更的要素以及如何变更API的流程。

## OpenAPI 和 API Swagger 定义

完整的 API 详细文档使用 [OpenAPI](https://www.openapis.org/)生成.

随着 Kubernetes 1.10 版本的正式启用，Kubernetes API 服务通过 `/openapi/v2` 接口提供 OpenAPI 规范。 通过设置 HTTP 标头的规定了请求的结构。

| Header          | Possible Values                                              |
| :-------------- | :----------------------------------------------------------- |
| Accept          | `application/json`, `application/com.github.proto-openapi.spec.v2@v1.0+protobuf` (the default content-type is `application/json` for `*/*` or not passing this header) |
| Accept-Encoding | `gzip` (not passing this header is acceptable)               |

>  在1.14版本之前，区分结构的接口通过(`/swagger.json`, `/swagger-2.0.0.json`, `/swagger-2.0.0.pb-v1`, `/swagger-2.0.0.pb-v1.gz`) 提供不同格式的 OpenAPI 规范。但是这些接口已经被废弃，并且已经在 Kubernetes 1.14 中被删除。

| 1.10 之前                   | 从 1.10 开始                                                 |
| :-------------------------- | :----------------------------------------------------------- |
| GET /swagger.json           | GET /openapi/v2 **Accept**: application/json                 |
| GET /swagger-2.0.0.pb-v1    | GET /openapi/v2 **Accept**: application/com.github.proto-openapi.spec.v2@v1.0+protobuf |
| GET /swagger-2.0.0.pb-v1.gz | GET /openapi/v2 **Accept**: application/com.github.proto-openapi.spec.v2@v1.0+protobuf **Accept-Encoding**: gzip |

Kubernetes实现了另一种基于Protobuf的序列化格式，该格式主要用于集群内通信，并在[设计方案](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/api-machinery/protobuf.md)中进行了说明，每个模式的IDL文件位于定义API对象的Go软件包中。 在 1.14 版本之前， Kubernetes apiserver 也提供 API 服务用于返回 [Swagger v1.2](http://swagger.io/) Kubernetes API 规范通过 `/swaggerapi` 接口. 但是这个接口已经被废弃，并且在 Kubernetes 1.14 中已经被移除。

## API 版本

为了使删除字段或者重构资源表示更加容易，Kubernetes 支持 多个API版本。每一个版本都在不同API路径下，例如 `/api/v1` 或者 `/apis/extensions/v1beta1`。

我们选择在API级别进行版本化，而不是在资源或字段级别进行版本化，以确保API提供清晰，一致的系统资源和行为视图，并控制对已废止的API和/或实验性API的访问。 JSON和Protobuf序列化模式遵循架构更改的相同准则 - 下面的所有描述都同时适用于这两种格式。

> 请注意，API版本控制和软件版本控制只有间接相关性。 API和发行版本建议 描述了API版本与软件版本之间的关系。

版本内容主要概括如下：

- Alpha 测试版本：
  - 版本名称包含了 **`alpha`** (例如：**`v1alpha1`**)。
  - 可能是有缺陷的。启用该功能可能会带来隐含的问题，默认情况是关闭的。
  - 支持的功能可能在没有通知的情况下随时删除。
  - API的更改可能会带来兼容性问题，但是在后续的软件发布中不会有任何通知。
  - 由于bugs风险的增加和缺乏长期的支持，推荐在短暂的集群测试中使用。
- Beta 测试版本：
  - 版本名称包含了 **`beta`** (例如: **`v2beta3`**)。
  - 代码已经测试过。启用该功能被认为是安全的，功能默认已启用。
  - 所有已支持的功能不会被删除，细节可能会发生变化。
  - 对象的模式和/或语义可能会在后续的beta测试版或稳定版中以不兼容的方式进行更改。 发生这种情况时，我们将提供迁移到下一个版本的说明。 这可能需要删除、编辑和重新创建API对象。执行编辑操作时需要谨慎行事，这可能需要停用依赖该功能的应用程序。
  - 建议仅用于非业务关键型用途，因为后续版本中可能存在不兼容的更改。 如果您有多个可以独立升级的集群，则可以放宽此限制。
  - **请尝试我们的 beta 版本功能并且给出反馈！一旦他们退出 beta 测试版，我们可能不会做出更多的改变。**
- 稳定版本：
  - 版本名称是 **`vX`**，其中 **`X`** 是整数。
  - 功能的稳定版本将出现在许多后续版本的发行软件中。

为了更容易地扩展Kubernetes API，我们实现了API组。 API组在REST路径和序列化对象的 apiVersion 字段中指定。

## API 组

为了更容易地扩展Kubernetes API，我们实现了[*`API组`*](https://git.k8s.io/community/contributors/design-proposals/api-machinery/api-group.md)。 API组在REST路径和序列化对象的 **`apiVersion`** 字段中指定。

目前有几个API组正在使用中：

1. **核心组**（通常被称为遗留组）位于REST路径 `/api/v1` 并使用 `apiVersion：v1`。
2. 指定的组位于REST路径 `/apis/$GROUP_NAME/$VERSION`，并使用 `apiVersion：$GROUP_NAME/$VERSION` （例如 `apiVersion：batch/v1`）。 在[Kubernetes API参考](https://kubernetes.io/docs/reference/)中可以看到支持的API组的完整列表。

社区支持使用以下两种方式来提供自定义资源对API进行扩展[自定义资源](https://kubernetes.io/docs/concepts/api-extension/custom-resources/)：

1. [CustomResourceDefinition](https://kubernetes.io/docs/tasks/access-kubernetes-api/extend-api-custom-resource-definitions/) 适用于具有非常基本的CRUD需求的用户。
2. 需要全套Kubernetes API语义的用户可以实现自己的apiserver， 并使用[聚合器](https://kubernetes.io/docs/tasks/access-kubernetes-api/configure-aggregation-layer/) 为客户提供无缝的服务。

## 启用 API 组

某些资源和API组默认情况下处于启用状态。 可以通过在apiserver上设置 `--runtime-config` 来启用或禁用它们。 `--runtime-config` 接受逗号分隔的值。 例如：要禁用batch/v1，请设置 `--runtime-config=batch/v1=false`，以启用batch/v2alpha1，请设置`--runtime-config=batch/v2alpha1`。 该标志接受描述apiserver的运行时配置的逗号分隔的一组键值对。

重要：启用或禁用组或资源需要重新启动apiserver和控制器管理器来使得 `--runtime-config` 更改生效。

## 启用组中资源

DaemonSets，Deployments，HorizontalPodAutoscalers，Ingress，Jobs 和 ReplicaSets是默认启用的。 其他扩展资源可以通过在apiserver上设置 `--runtime-config` 来启用。 `--runtime-config` 接受逗号分隔的值。 例如：要禁用 Deployment 和 Ingress， 请设置 `--runtime-config=extensions/v1beta1/deployments=false,extensions/v1beta1/ingress=false`