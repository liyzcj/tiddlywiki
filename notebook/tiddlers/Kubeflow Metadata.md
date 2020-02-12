# Kubeflow Metadata

> Note:  kubeflow-metadata version v0.1 -- kubeflow version v0.6
>
> 当前版本还是 Alpha 版本，下一个版本可能会发生巨大变化。

> Metadata 用来追踪和管理机器学习 Pipeline 中的元数据，具体指的是 Executions models datasets 和其他 artifacts 的信息。



Kubeflow Metadata 项目的目标是通过追踪和管理 Pipeline 中的元数据来让用户理解并且管理他们的机器学习 Pipeline。

## Comtponents



Kubeflow Metadata 一共包含几个部分：

* metadata-db：基于 [MLMD](https://www.tensorflow.org/tfx/guide/mlmd) 的 Metadata 数据库，使用的是 Mysql 8 版本的数据库实现。

* metadata-service：一个 Metadata 服务，用来提供 [Restful API](https://www.kubeflow.org/docs/reference/metadata/v1alpha1/kubeflow-metadata-api-spec/) 来操作 metadata。

* meatadata-ui：一个 metadata 的 UI 界面，来显示数据库中的 Artifacts。
* metadata-sdk：用来操作元数据的 Python client。



## Artifact Tracking



建模工程师需要追踪他们在 Pipeline 中产生的各种 Artifacts。通过结合 Artifacts 追踪和版本管理，开发者可以访问完整的历史模型以及数据，这回极大的方便模型的迭代。

Kubeflow Metadata 允许用户自定义需要追踪的 Artifact 类型。而 kubeflow-metadata 提供了三种预定义的 Artifact types：

* Models
* Datasets
* Evaluation Metrics



模型追踪示例：

<img src=" https://miro.medium.com/max/2520/0*WEGlWDgNF9ejrtlE" style="zoom: 50%;" />

## 使用 metadata sdk



### Import

首先需要导入 kubeflow-metadata：

```python
from kubeflow.metadata import metadata
import pandas
from datetime import datetime
```

### WorkSpace

WorkSpace 是一组运行的 Pipeline 的集合。例如对于同一个 Pipeline，运行了多次获得了不同的结果，那么可以将这些 Runs 归为同一个 WorkSpace。

在初始化一个 WorkSpace 的时候需要指定连接的 metadata-service 的地址：

```python
ws1 = metadata.Workspace(
    # Connect to metadata-service in namesapce kubeflow in k8s cluster.
    backend_url_prefix="metadata-service-IP",
    name="ws1",
    description="a workspace for testing",
    labels={"n1": "v1"})
```

### Run

在 WorkSpace 下面就是 Run，创建一个 Run 时需要指定 WorkSpace：

> Run 代表了一个 Pipeline 的运行。

```python
r = metadata.Run(
    workspace=ws1,
    name="run-" + datetime.utcnow().isoformat("T") ,
    description="a run in ws_1",
)
```



### Execution

Run 下面是 Execution，Execution 代表的是一个 Pipeline 中某个组件的执行：

> 注意这里 Execution 必须指定 WorkSpace 而 Run 却是可选的。

```python
exec1 = metadata.Execution(
    name = "execution" + datetime.utcnow().isoformat("T") ,
    workspace=ws1,
    run=r,
    description="execution example",
)
print("An execution is create with id %s" % exec1.id)
```

当注册了一个 Execution 之后，就可以使用这个 Execution 来记录生成的 Model，Datasets或者 evaluation Metrics。



### Log a Dataset

```python
data_set = exec1.log_input(
        metadata.DataSet(
            description="an example data",
            name="mytable-dump",
            owner="owner@my-company.org",
            uri="file://path/to/dataset",
            version="v1.0.0",
            query="SELECT * FROM mytable"))
assert data_set.id
print("data set id is %s" % data_set.id)
```

### Log a model

```python
model = exec1.log_output(
    metadata.Model(
            name="MNIST",
            description="model to recognize handwritten digits",
            owner="someone@kubeflow.org",
            uri="gcs://my-bucket/mnist",
            model_type="neural network",
            training_framework={
                "name": "tensorflow",
                "version": "v1.0"
            },
            hyperparameters={
                "learning_rate": 0.5,
                "layers": [10, 3, 1],
                "early_stop": True
            },
            version="v0.0.1",
            labels={"mylabel": "l1"}))
assert model.id
print("model id is %s" % model.id)
```

### Log an evaluation of a model

```python
metrics = exec1.log_output(
    metadata.Metrics(
            name="MNIST-evaluation",
            description="validating the MNIST model to recognize handwritten digits",
            owner="someone@kubeflow.org",
            uri="gcs://my-bucket/mnist-eval.csv",
            data_set_id=data_set.id,
            model_id=model.id,
            metrics_type=metadata.Metrics.VALIDATION,
            values={"accuracy": 0.95},
            labels={"mylabel": "l1"}))
assert metrics.id
print("metrics id is %s" % model.id)
```



### 获取数据库中的信息

在 Python client 中也可以获取数据库中保存的各种信息：

例如获取所有的模型：

```python
pandas.DataFrame.from_dict(ws1.list(metadata.Model.ARTIFACT_TYPE_NAME))
```

或者查看一个模型相关的执行信息等等：

```python
print("model id is %s\n" % model.id)
    
# Find the execution that produces this model.
output_events = ws1.client.list_events2(model.id).events
assert len(output_events) == 1
execution_id = output_events[0].execution_id

# Find all events related to that execution.
all_events = ws1.client.list_events(execution_id).events
assert len(all_events) == 3

print("\nAll events related to this model:")
pandas.DataFrame.from_dict([e.to_dict() for e in all_events])
```

## Metadata service

Kubeflow 的 Metadata service 提供了一套 RESTful API，Metadata service 接收到请求以后再通过 MLMD 暴露的 API 来实现与数据库的交互。



### MLMD Interfaces

MLMD 暴露的API 有：

```go
// MetadataStore defines the interface of methods exported by mlmetadata.Store.
type MetadataStore interface {
	Close()

	PutArtifactType(atype *mlpb.ArtifactType, opts *mlmetadata.PutTypeOptions) (mlmetadata.ArtifactTypeID, error)
	GetArtifactType(name string) (*mlpb.ArtifactType, error)
	GetArtifactTypesByID(tids []mlmetadata.ArtifactTypeID) ([]*mlpb.ArtifactType, error)
	GetArtifactTypes() ([]*mlpb.ArtifactType, error)

	PutArtifacts(artifacts []*mlpb.Artifact) ([]mlmetadata.ArtifactID, error)
	GetArtifactsByID(aids []mlmetadata.ArtifactID) ([]*mlpb.Artifact, error)
	GetArtifacts() ([]*mlpb.Artifact, error)
	GetArtifactsByType(typeName string) ([]*mlpb.Artifact, error)
	GetArtifactsByURI(uri string) ([]*mlpb.Artifact, error)

	PutExecutionType(etype *mlpb.ExecutionType, opts *mlmetadata.PutTypeOptions) (mlmetadata.ExecutionTypeID, error)
	GetExecutionType(typeName string) (*mlpb.ExecutionType, error)
	GetExecutionTypesByID(tids []mlmetadata.ExecutionTypeID) ([]*mlpb.ExecutionType, error)
	GetExecutionTypes() ([]*mlpb.ExecutionType, error)

	PutExecutions(executions []*mlpb.Execution) ([]mlmetadata.ExecutionID, error)
	GetExecutionsByID(eids []mlmetadata.ExecutionID) ([]*mlpb.Execution, error)
	GetExecutions() ([]*mlpb.Execution, error)
	GetExecutionsByType(typeName string) ([]*mlpb.Execution, error)

	PutEvents(events []*mlpb.Event) error
	GetEventsByArtifactIDs([]mlmetadata.ArtifactID) ([]*mlpb.Event, error)
	GetEventsByExecutionIDs([]mlmetadata.ExecutionID) ([]*mlpb.Event, error)
}
```

### Kubeflow Metadata services API

Kubeflow Metadata service 实现了不同的 API，这些 API 的底层都是调用 MLMD 的接口实现的。

> Kubeflow 定义了许多接口，但是有的没有实现。例如 Delete 相关的 API 都没有实现，这是因为 MLMD 没有提供删除的接口。可能以后会自己实现底层的接口从而摆脱 MLMD，所以预留了这些 DELETE 接口。

Kubeflow MEtadata service 定义的接口有：


| 接口                | 描述                    | 是否实现                                        |
| ------------------- | ----------------------- | ----------------------------------------------- |
| CreateArtifact      | 创建一个 Artifact       | PutArtifacts                                    |
| GetArtifact         | 获取一个 Artifact       | GetArtifactsByID                                |
| ListArtifacts       | 列出 Artifacts          | GetArtifacts，GetArtifactsByType                |
| DeleteArtifact      | 删除一个 Artifact       | Null                                            |
| CreateExecution     | 创建一个 Execution      | PutExecutions                                   |
| GetExecution        | 获取一个 Execution      | GetExecutionsByID                               |
| ListExecutions      | 列出 Executions         | GetExecutions，GetExecutionsByType              |
| DeleteExecution     | 删除一个 Execution      | 未实现                                          |
| UpdateArtifactType  | 修改一个 Artifact type  | PutArtifactType                                 |
| CreateArtifactType  | 创建一个 Artifact type  | PutArtifactType                                 |
| ListArtifactTypes   | 列出 Artifact types     | GetArtifactTypes                                |
| GetArtifactType     | 获取一个 Artifact type  | GetArtifactType                                 |
| DeleteArtifactType  | 删除一个 Artifact type  | 未实现                                          |
| UpdateExecutionType | 修改 Execution type     | PutExecutionType                                |
| CreateExecutionType | 创建一个 Execution type | PutExecutionType                                |
| ListExecutionTypes  | 列出 Execution types    | GetExecutionTypes                               |
| GetExecutionType    | 获取 Execution type     | GetExecutionType                                |
| DeleteExecutionType | 删除 Execution type     | 未实现                                          |
| CreateEvent         | 创建一个 Event          | PutEvents                                       |
| ListEvents          | 列出 Events             | GetEventsByArtifactIDs，GetEventsByExecutionIDs |


可以看到 Kubeflow metadata service 提供的 API 和MLMD 的类似，只是添加了 DELETE 相关方法，但是还没有实现。

> 以上内容对于 kubeflow version 0.6.2,  对应 Kubeflow metadata v0.1



### Metadata Restful API

上述接口都是 RPC 函数，Metadata service 通过 grpc-gateway 实现 RESTful 接口服务。



<img src="https://camo.githubusercontent.com/e75a8b46b078a3c1df0ed9966a16c24add9ccb83/68747470733a2f2f646f63732e676f6f676c652e636f6d2f64726177696e67732f642f3132687034435071724e5046686174744c5f63496f4a707446766c41716d35774c513067677149356d6b43672f7075623f773d37343926683d333730"  />

这样只需要编写一个 `service.proto` 文件，就可以实现两种接口的监听。

普通情况下就是编写一个 proto 文件，并安装 grpc 插件，就可以通过 `protoc`  生成对应语言的服务端与客户端代码，然后再进行服务端函数的具体实现即可。

但是普通情况下只能监听 grpc 的客户端，也就是 grpc 的 stub。

当想要监听 Restful 接口的时候，借助 `grpc-gateway` 工具，只需要根据 proto 文件生成对应的 Proxy，Proxy 就可以将 API client 过来的 RESTful API 请求转换为 gRPC 调用。

调用 gRPC 以后，Proxy 会再将 gRPC 返回的 protobuf 转换为 API Response。

最后就只剩下 API Client 的代码。当设计好了 API 接口以后，可以使用 [swagger](https://swagger.io/) 的套件编写 API 文档，编写 API 文档以后，就可以使用  [swagger codegen](https://swagger.io/tools/swagger-codegen/) 或者 [OpenAPI generator](https://openapi-generator.tech/) 来自动生成各种语言的客户端代码。



### 整体流程

对于实现这一套服务的监听，以及 RESTful API 与客户端 SDK，具体的工作流程应该是这样的：

1. 首先设计 API。
2. 根据设计的 API 文档编写 `service.proto`，实现**Protobuf 的定义**以及 **RPC 函数和 RESTful API 的转换**。
3. 根据编写的 `servcie.proto` ，使用 protoc 生成 go 的服务端，并进行具体实现。
4. 使用 `grpc-gateway` 生成 proxy，可以调用 服务端。并启动 RESTful API 监听服务。
5. 根据 `service.proto` 使用 `protoc-gen-swagger` 生成 `service.swagger.json` 文档。
6. 根据 `service.swagger.json` 生成 Python 的 API client。

最后就可以使用生成的 Python API client 通过 Restful API 进行 RPC 调用。

> 为什么要绕这么一大圈通过 Rest API 去调用 RPC 呢？为什么不直接生成 Python 的 gRPC stub 直接进行 RPC 调用？
>
> 首先设计的 Restful API 可以为前端服务。
>
> 可能是 Python client 为了和前端服务请求入口保持一致，所以 Python 客户端也使用 RESTful API 进行 RPC 调用。

**仅仅编写一个 `service.proto` 文件，就可以轻松的生成一系列的接口与工具。**

## Document

* [Metadata SDK Docs](https://github.com/kubeflow/metadata/tree/master/schema/alpha/docs)

  包含了 SDK 所有的类型的 schema

*  [Restful API](https://www.kubeflow.org/docs/reference/metadata/v1alpha1/kubeflow-metadata-api-spec/)

  Metadata 的 Restful API



## Reference

* [Kubeflow Metadata](https://www.kubeflow.org/docs/components/misc/metadata/)
* [Kubeflow v0.6: support for artifact tracking, data versioning & multi-user](https://medium.com/kubeflow/kubeflow-v0-6-a-robust-foundation-for-artifact-tracking-data-versioning-multi-user-support-9896d329412c)
* https://github.com/kubeflow/metadata


