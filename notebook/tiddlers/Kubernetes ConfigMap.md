# ConfigMap

## Before Begin

在 K8S 中使用 ConfigMap 可以将配置信息与 pod 解耦，来增强容器应用的**可移植性**。

ConfigMap API resource将配置数据以键值对的形式存储。这些数据可以在pod中消费或者为系统组件提供配置，例如controller。ConfigMap与[Secret](https://k8smeetup.github.io/docs/concepts/configuration/secret/)类似，但是通常只保存不包含敏感信息的字符串。用户和系统组件可以以同样的方式在ConfigMap中存储配置数据。

> 注意：ConfigMap只引用属性文件，而不会替换它们。

**ConfigMap** 在运行时会将配置文件、命令行参数、环境变量、端口号以及其他配置工件绑定到 Pod 的容器和系统组件。

## 创建 ConfigMap

### 使用命令创建

```bash
kubectl create configmap [NAME] [DATA]
```

其中 `[DATA]` 可以是：

- 包含一个或多个配置文件的目录的路径，使用 `--from-file` 标志指示
- 键值对，每个键值对都使用 `--from-literal` 标志指定

> 如需详细了解 `kubectl create`，请参阅[参考文档](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#create)。
>
> 还可以通过在 YAML 清单文件中定义 [ConfigMap 对象](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.11/#configmap-v1-core)并使用 `kubectl create -f [FILE]` 部署对象来创建 ConfigMap。

### 基于文件创建

要基于一个或多个文件创建 ConfigMap，请使用 `--from-file`。只要文件包含键值对，您就可以通过任何明文格式指定文件，例如 `.properties`、`.txt` 或 `.env`。

您可以传入单个文件或多个文件：

```bash
kubectl create configmap [NAME] --from-file [/PATH/TO/FILE.PROPERTIES] --from-file [/PATH/TO/FILE2.PROPERTIES]
```

还可以传入包含多个文件的目录：

```bash
kubectl create configmap [NAME] --from-file [/PATH/TO/DIRECTORY]
```

在基于文件创建 ConfigMap 时，**键默认为文件的基名，值默认为文件的内容**。您还可以[指定备用键](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#define-the-key-to-use-when-creating-a-configmap-from-a-file)。

> 对于基于目录的 ConfigMap，基名为目录中的有效键的每个文件都会封装到 ConfigMap。`kubectl` 会忽略非常规文件，例如符号链接、设备和管道。子目录也会被忽略；`kubectl create configmap` 不会递归到子目录中。

## 基于字面创建

要基于字面量值创建 ConfigMap，请使用 `--from-literal`。

例如，以下命令用于创建一个名为 `literal-data` 且具有两个键值对的 ConfigMap：

```bash
kubectl create configmap literal-data --from-literal key1=value1 --from-literal key2=value2
```

为每个键值对指定 `--from-literal`。

运行 `kubectl get configmap literal-data -o yaml` 会返回以下输出：

```yaml
apiVersion: v1
data:
  key1: value1
  key2: value2
kind: ConfigMap
metadata:
  creationTimestamp: ...
  name: literal-data
  namespace: default
  resourceVersion: ....
  selfLink: /api/v1/namespaces/default/configmaps/literal-data
  uid: ...
```

## 使用 ConfigMap

### 从单个 ConfigMap 提取数据定义 Pod 的环境变量

1. 在 ConfigMap 里将环境变量定义为键值对：

   ```bash
   kubectl create configmap special-config --from-literal=special.how=very 
   ```

2. 将 ConfigMap 里的`special.how`值赋给 Pod 的环境变量`SPECIAL_LEVEL_KEY`.

   ```bash
   kubectl edit pod dapi-test-pod
   ```

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: dapi-test-pod
   spec:
     containers:
       - name: test-container
         image: gcr.io/google_containers/busybox
         command: [ "/bin/sh", "-c", "env" ]
         env:
           # Define the environment variable
           - name: SPECIAL_LEVEL_KEY
             valueFrom:
               configMapKeyRef:
                 # The ConfigMap containing the value you want to assign to SPECIAL_LEVEL_KEY
                 name: special-config
                 # Specify the key associated with the value
                 key: special.how
     restartPolicy: Never
   ```

3. 将修改保存到 Pod 的配置里，现在 Pod 的输出会包含`SPECIAL_LEVEL_KEY=very`这么一行.

### 从多个 ConfigMap 读取数据来定义 Pod 环境

1. 跟前面的例子一样，我们先创建 ConfigMap。

   ```yml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: special-config
     namespace: default
   data:
     special.how: very
   ```

   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: env-config
     namespace: default
   data:
     log_level: INFO
   ```

2. 在 Pod 配置里定义环境变量.

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: dapi-test-pod
   spec:
     containers:
       - name: test-container
         image: gcr.io/google_containers/busybox
         command: [ "/bin/sh", "-c", "env" ]
         env:
           - name: SPECIAL_LEVEL_KEY
             valueFrom:
               configMapKeyRef:
                 name: special-config
                 key: special.how
           - name: LOG_LEVEL
             valueFrom:
               configMapKeyRef:
                 name: env-config
                 key: special.type
     restartPolicy: Never
   ```

3. 保存 Pod 的配置，现在 Pod 的输出会包括`SPECIAL_LEVEL_KEY=very`和`LOG_LEVEL=info`.

### 将所有 ConfigMap 的键值对都设置为Pod的环境变量

> 注意: 这个功能只适用于使用 Kubernetes 1.6及以上版本的环境.

1. 创建一个包含多个键值对的 ConfigMap。

   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: special-config
     namespace: default
   data:
     SPECIAL_LEVEL: very
     SPECIAL_TYPE: charm
   ```

2. 使用`env-from`来读取 ConfigMap 的所有数据作为Pod的环境变量。ConfigMap 的键名作为环境变量的变量名。

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: dapi-test-pod
   spec:
     containers:
       - name: test-container
         image: gcr.io/google_containers/busybox
         command: [ "/bin/sh", "-c", "env" ]
         envFrom:
         - configMapRef:
             name: special-config
     restartPolicy: Never
   ```

3. 保存 Pod 的配置，现在 Pod 的输出会包含`SPECIAL_LEVEL=very`和`SPECIAL_TYPE=charm`.

### 在 Pod 命令里使用 ConfigMap 定义的环境变量

我们可以利用`$(VAR_NAME)`这个 Kubernetes 替换变量，在 Pod 的配置文件的`command`段使用 ConfigMap 定义的环境变量。

例子如下:

下面的 Pod 配置

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: gcr.io/google_containers/busybox
      command: [ "/bin/sh", "-c", "echo $(SPECIAL_LEVEL_KEY) $(SPECIAL_TYPE_KEY)" ]
      env:
        - name: SPECIAL_LEVEL_KEY
          valueFrom:
            configMapKeyRef:
              name: special-config
              key: special_level
        - name: SPECIAL_TYPE_KEY
          valueFrom:
            configMapKeyRef:
              name: special-config
              key: special_type
  restartPolicy: Never
```

## 添加ConfigMap数据到卷

当您使用 `--from-file` 创建 ConfigMap 时， 文件名将作为键名保存在 ConfigMap 的 `data` 段，文件的内容变成键值。

下面的例子展示了一个名为 special-config 的 ConfigMap 的配置：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: special-config
  namespace: default
data:
  special.level: very
  special.type: charm
```

### 从 ConfigMap 里的数据生成一个卷

在 Pod 的配置文件里的 `volumes` 段添加 ConfigMap 的名字。 这会将 ConfigMap 数据添加到 `volumeMounts.mountPath` 指定的目录里面（在这个例子里是 `/etc/config`）。 `command` 段引用了 ConfigMap 里的 `special.level`.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: gcr.io/google_containers/busybox
      command: [ "/bin/sh", "-c", "ls /etc/config/" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        # Provide the name of the ConfigMap containing the files you want
        # to add to the container
        name: special-config
  restartPolicy: Never
```

Pod 运行起来后, 执行这个命令 (`"ls /etc/config/"`) 将产生如下的输出：

```
special.level
special.type
```

### 添加 ConfigMap 数据到卷里指定路径

使用 `path` 变量定义 ConfigMap 数据的文件路径。 在我们这个例子里，`special.level` 将会被挂载在 `config-volume` 的文件 `/etc/config/keys` 下.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: gcr.io/google_containers/busybox
      command: [ "/bin/sh","-c","cat /etc/config/keys" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        name: special-config
        items:
        - key: special.level
          path: keys
  restartPolicy: Never
```

Pod 运行起来后，执行命令(`"cat /etc/config/keys"`)将产生下面的结果：

```
very
```

### 绑定 Key 到指定的路径和文件权限

我们可以基于文件来绑定 Key 到指定的路径和文件权限，详情请查阅 [Secrets](https://k8smeetup.github.io/docs/concepts/configuration/secret#using-secrets-as-files-from-a-pod) 这篇文章解释了这个用法。

### 自动更新挂载的 ConfigMap

当一个已经被使用的 ConfigMap 发生了更新时，对应的 Key 也会被更新。Kubelet 会周期性的检查挂载的 ConfigMap 是否是最新的。 然而，它会使用本地基于 ttl 的 cache 来获取 ConfigMap 的当前内容。因此，从 ConfigMap 更新到 Pod 里的新 Key 更新这个时间，等于 Kubelet 的同步周期加 ConfigMap cache 的 tll。

## 了解 ConfigMaps 和 Pods

### 限制

1. **你们必须在 Pod 使用 ConfigMap 之前，创建好 ConfigMap（除非您把 ConfigMap 标志成”optional”）**。如果您引用了一个不存在的 ConfigMap， 那这个Pod是无法启动的。就像引用了不存在的 Key 会导致 Pod 无法启动一样。
2. **如果您使用`envFrom`来从 ConfigMap 定义环境变量，无效的 Key 会被忽略。**Pod可以启动，但是无效的名字将会被记录在事件日志里(`InvalidVariableNames`). 日志消息会列出来每个被忽略的 Key ，比如：

  ```
  kubectl get events
  LASTSEEN FIRSTSEEN COUNT NAME          KIND  SUBOBJECT  TYPE      REASON                            SOURCE                MESSAGE
  0s       0s        1     dapi-test-pod Pod              Warning   InvalidEnvironmentVariableNames   {kubelet, 127.0.0.1}  Keys [1badkey, 2alsobad] from the EnvFrom configMap default/myconfig were skipped since they are considered invalid environment variable names.
  ```

3. **ConfigMaps 存在于指定的 [命名空间](https://k8smeetup.github.io/docs/user-guide/namespaces/).则这个 ConfigMap 只能被同一个命名空间里的 Pod 所引用。**
4. Kubelet 不支持在API服务里找不到的Pod使用ConfigMap，这个包括了每个通过 Kubectl 或者间接通过复制控制器创建的 Pod， 不包括通过Kubelet 的 `--manifest-url` 标志, `--config` 标志, 或者 Kubelet 的 REST API。（注意：这些并不是常规创建 Pod 的方法）