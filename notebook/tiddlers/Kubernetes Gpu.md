# K8S 调度 GPU

## 官网方法



1. Kubernetes 节点必须预先安装好 NVIDIA 驱动，否则，Kubelet 将检测不到可用的GPU信息；如果节点的 Capacity 属性中没有出现 NIVIDA GPU 的数量，有可能是驱动没有安装或者安装失败，请尝试重新安装
2. 在整个 Kubernetes 系统中，feature-gates 里面特定的 **alpha** 特性参数 `Accelerators` 必须设置为 true：`--feature-gates="Accelerators=true"`
3. Kubernetes 节点必须使用 `docker` 引擎作为容器的运行引擎

上述预备工作完成后，节点会自动发现它上面的 NVIDIA GPU，并将其作为可调度资源暴露

> 尝试在启动时加入 feature-gates 参数。

```bash
[root@ml-master liyanzhe]# kubelet --feature-gates="Accelerators=true"
Flag --feature-gates has been deprecated, This parameter should be set via the config file specified by the Kubelet's --config flag. See https://kubernetes.io/docs/tasks/administer-cluster/kubelet-config-file/ for more information.
F0928 00:34:47.869700  303818 server.go:182] unrecognized feature gate: Accelerators
```

`--feature-gates` 已经被弃用，必须通过 `--config` 参数指定一个 config 文件来配置 features。

---

在 `--config`指定的配置文件中加入 `Accelerators: true` ,仍然不起作用



## 当前版本



官网提供的文档版本过于落后，已经不再适用。



> https://blog.csdn.net/hunyxv/article/details/92988788

* 从Kubernetes 1.8开始，官方推荐使用Device Plugins方式来使用GPU。

* 需要在Node上 pre-install NVIDIA Driver，并建议通过Daemonset部署[NVIDIA Device Plugin](https://github.com/NVIDIA/k8s-device-plugin)，完成后Kubernetes才能发现nvidia.com/gpu

* 因为device plugin通过extended resources来expose gpu resource的，所以在container请求gpu资源的时候要注意[resource QoS为Guaranteed](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/#create-a-pod-that-gets-assigned-a-qos-class-of-guaranteed)。

  > Quality of Service (QoS)

* Containers目前仍然不支持共享同一块gpu卡。每个Container可以请求多块gpu卡，但是不支持gpu fraction。

* Node 上要有nvidia-docker >= 2.0

* 显卡驱动版本大于361.93

* 将nvidia配置为Docker默认的runtime，编辑/etc/docker/daemon.json文件，增加"default-runtime": "nvidia"键值对，此时该文件的内容应该如下所示）：

  ```json
  {
      "default-runtime": "nvidia",
      "runtimes": {
          "nvidia": {
              "path": "nvidia-container-runtime",
              "runtimeArgs": []
          }
      }
  }
  ```

> **在很多教程中都说明若要使用GPU，需要设置Accelerators为true，而实际上该参数在1.11版本之后就弃用了。而将DevicePlugins设置为true也是在1.9版本之前需要做的事情，在1.10版本之后默认就为true。**
>
> [API文档](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/)



## 关于 Nvidia-docker

Nvidia-docker 一共有三个版本：

* Nvidia-docker 1 （弃用）
* Nvidia-docker 2 （弃用）
* Nvidia-container-toolkit



> 由于在 Docker 版本 19.03 以后，Docker [原生支持了 GPu](https://docs.docker.com/config/containers/resource_constraints/#gpu)， 只需要在安装了 Nvidia 驱动和 `nvidia-container-runtime` 之后，并确保 `nvidia-container-runtime-hook` 在 `$PATH`路径中。
>
> ```bash
> which nvidia-container-runtime-hook
> ```
>
> 便可以使用 `--gpus`参数向容器暴露 GPU以便使用。
>
> [所以前两个版本被弃用了](https://github.com/NVIDIA/nvidia-docker/wiki/Installation-(Native-GPU-Support))。



第三个版本 Nvidia-container-toolkit 包含一个 runtime library， `nvidia-container-runtime-hook`, [只是被重新命名为 Nvidia-container-toolkit.](https://github.com/NVIDIA/nvidia-container-runtime/releases/tag/3.1.0) 

在 Docker 原生支持 GPU以后，就只需要这么一个 hook 来进行 GPu 的暴露与使用。

**那么 K8s 一个要求就是 docker 的默认runtime为 `nvidia-container-runtime` 。**按照上面的方法，将 `nvidia-container-runtime` 设置为docker 的默认 runtime。就不需要在创建 Container 时使用 `--gpus` 参数指定可用GPU。

如果要设置 默认 runtime，仅仅安装 Nvidia-container-toolkit 还不够，还需要额外安装  [nvidia-container-runtime](https://github.com/NVIDIA/nvidia-container-runtime), 这个 runtime 在 Nvidia-docker 2 中是包含的，但是在 Docker 原生支持 GPu 以后，新版的 Nvidia-container-toolkit 就仅仅包含 `nvidia-container-runtime-hook`了。



> ⚠️ GPU 分配紧紧是将 GPU driver 与 CUDA driver 暴露给 Pod，如果进行 模型的训练，还需要CUDA toolkit 安装在容器内。

![](https://cloud.githubusercontent.com/assets/3028125/12213714/5b208976-b632-11e5-8406-38d379ec46aa.png)

## 调度GPU

当根据上述条件正确安装以后，在 describe node 的 capacity 字段应该显示可用的 GPU 数目。

```
Capacity:
 cpu:                40
 ephemeral-storage:  7165962Mi
 hugepages-1Gi:      0
 hugepages-2Mi:      0
 memory:             131409476Ki
 nvidia.com/gpu:     2
 pods:               110
```

也可以通过 get 命令查看 可用的 GPU：

```bash
kubectl get nodes "-o=custom-columns=NAME:.metadata.name,GPU:.status.allocatable.nvidia\.com/gpu"
```



配置正确之后，容器可以通过名称为 `nvidia.com/gpu` 的标识来申请需要使用的 NVIDIA GPU 的数量：



> 注意 `nvidia.com/gpu`标识需要配置在 limits 字段中，因为分配GPU需要 [resource QoS为Guaranteed](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/#create-a-pod-that-gets-assigned-a-qos-class-of-guaranteed)，也就是说：
>
> * 你可以只显式设置`limits`，不设置`requests`，那么`requests`其实就等于`limits`。
> * 你可以同时显示设置`limits`和`requests`，但两者必须值相等。
> * 你不能只显示设置`requests`，而不设置`limits`，这种情况属于`Burstable`。



测试应用是否可以运行：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  restartPolicy: Never
  containers:
  - image: nvidia/cuda
    name: cuda    
    command: ["nvidia-smi"]
    resources:
      limits:
        nvidia.com/gpu: 1
```



等待 pod 建立完成：

```bash
kubectl get pod  | grep gpu-pod
```

查看 log 即可：

```bash
kubectl logs gpu-pod -c cude
```

```
Sat Sep 28 10:03:06 2019
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 430.34       Driver Version: 430.34       CUDA Version: 10.1     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  GeForce RTX 208...  Off  | 00000000:3B:00.0 Off |                  N/A |
| 27%   27C    P8     2W / 250W |      0MiB / 11019MiB |      0%      Default |
+-------------------------------+----------------------+----------------------+

+-----------------------------------------------------------------------------+
| Processes:                                                       GPU Memory |
|  GPU       PID   Type   Process name                             Usage      |
|=============================================================================|
|  No running processes found                                                 |
+-----------------------------------------------------------------------------+
```



正常显示即为验证成功。



## 总结

* Docker 在 19.03 版本之后使用GPU 只需要安装 `nvidia container runtime`，在 Container 启动命令中的 `--gpus` 参数来指定所需的 GPU，而这个参数只需要 `nvidia container runtime hook`, 这个属于 `nvidia container runtime` 的一部分。
* `nvidia container runtime hook` 被 重命名为 `nvidia docker toolkit`。
* K8s 的 Gpu 支持需要设置 `nvidia container runtime` 为 Docker 的默认 runtime。
* K8S 需要安装 `nvidia container runtime` 而不紧紧是 `nvidia docker toolkit`。
* 通过在 limits 字段中指定 `nvidia.com/gpu` 来将 GPU 暴露给pod。



## Reference

[调度GPU](https://kubernetes.io/zh/docs/tasks/manage-gpus/scheduling-gpus/)

[K8S 中使用 GPU 资源](https://kubernetes.io/zh/docs/concepts/cluster-administration/addons/)

[Docker安装指南及使用GPU](https://bluesmilery.github.io/blogs/252e6902/)

[Nvidia 官方文档](https://docs.nvidia.com/datacenter/kubernetes/kubernetes-upstream/index.html#kubernetes-beforebegin)

[K8S GPU 分布式集群配置与安装](https://readailib.com/2019/03/20/kubernetes/gpu-device-plugins/)