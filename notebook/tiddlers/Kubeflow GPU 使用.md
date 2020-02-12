# Kubeflow GPU 训练

## 前置

Kubeflow 通过 kubernetes 来进行 GPU 资源的调度。

第一步就是正确配置 k8s 的 GPU 调度。

## 使用

当建立 pipeline 时，通过 `set_gpu_limit()` 方法来指定一个组件所需要的 GPU 个数。


例如：

```python
import kfp.dsl as dsl
gpu_op = dsl.ContainerOp(name='gpu-op', ...).set_gpu_limit(2)
```

KFP 会在生成 pipeline.yaml 文件时指定所需要的GPU 数目：

```yaml
container:
  ...
  resources:
    limits:
      nvidia.com/gpu: "2"
```

此外，[当集群拥有多种类型的](https://www.kubeflow.org/docs/pipelines/sdk/gcp/enable-gpu-and-tpu/) GPU 时，可以通过以下代码指定 GPU 类型：

```python
import kfp.dsl as dsl
gpu_op = dsl.ContainerOp(name='gpu-op', ...).set_gpu_limit(2)
gpu_op.add_node_selector_constraint('cloud.google.com/gke-accelerator', 'nvidia-tesla-p4')
```

代码在生成 yaml 文件时会被编译到 `nodeSelector` 字段：

```yaml
container:
  ...
  resources:
    limits:
      nvidia.com/gpu: "2"
nodeSelector:
  cloud.google.com/gke-accelerator: nvidia-tesla-p4
```



## Reference

[Enable GPU on kubeflow](https://www.kubeflow.org/docs/pipelines/sdk/gcp/enable-gpu-and-tpu/)