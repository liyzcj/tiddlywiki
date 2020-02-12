# K8S Secret

`Secret` 对象类型用来保存敏感信息，例如密码、OAuth 令牌和 ssh key。 将这些信息放在 `secret` 中比放在 [Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod-overview/) 的定义或者 [容器镜像](https://kubernetes.io/zh/docs/reference/glossary/?all=true#term-image) 中来说更加安全和灵活。 参阅 [Secret 设计文档](https://git.k8s.io/community/contributors/design-proposals/auth/secrets.md) 获取更多详细信息。

##  概览

Secret 是一种包含少量敏感信息例如密码、token 或 key 的对象。这样的信息可能会被放在 Pod spec 中或者镜像中；将其放在一个 secret 对象中可以更好地控制它的用途，并降低意外暴露的风险。

用户可以创建 secret，同时系统也创建了一些 secret。

要使用 secret，pod 需要引用 secret。Pod 可以用两种方式使用 secret：作为 [volume](https://kubernetes.io/docs/concepts/storage/volumes/) 中的文件被挂载到 pod 中的一个或者多个容器里，或者当 kubelet 为 pod 拉取镜像时使用。

## 内置 Secret

### Service Account 使用 API 凭证自动创建和附加 secret

Kubernetes 自动创建包含访问 API 凭据的 secret，并自动修改您的 pod 以使用此类型的 secret。

如果需要，可以禁用或覆盖自动创建和使用API凭据。但是，如果您需要的只是安全地访问 apiserver，我们推荐这样的工作流程。

参阅 [Service Account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) 文档获取关于 Service Account 如何工作的更多信息。

## 创建您自己的 Secret

### 使用 kubectl 创建 Secret

假设有些 pod 需要访问数据库。这些 pod 需要使用的用户名和密码在您本地机器的 `./username.txt` 和 `./password.txt` 文件里。

```shell
# Create files needed for rest of example.
echo -n 'admin' > ./username.txt
echo -n '1f2d1e2e67df' > ./password.txt
```

`kubectl create secret` 命令将这些文件打包到一个 Secret 中并在 API server 中创建了一个对象。	

```shell
kubectl create secret generic db-user-pass --from-file=./username.txt --from-file=./password.txt
```

```
secret "db-user-pass" created
```

> **注意：**
>
> 特殊字符（例如 `$`, `\*` 和 `!` ）需要转义。 如果您使用的密码具有特殊字符，则需要使用 `\\` 字符对其进行转义。 例如，如果您的实际密码是 `S!B\*d$zDsb` ，则应通过以下方式执行命令： kubectl create secret generic dev-db-secret –from-literal=username=devuser –from-literal=password=S\!B\\*d\$zDsb 您无需从文件中转义密码中的特殊字符（ `--from-file` ）。

您可以这样检查刚创建的 secret：

```shell
kubectl get secrets
NAME                  TYPE                                  DATA      AGE
db-user-pass          Opaque                                2         51s
kubectl describe secrets/db-user-pass
Name:            db-user-pass
Namespace:       default
Labels:          <none>
Annotations:     <none>

Type:            Opaque

Data
====
password.txt:    12 bytes
username.txt:    5 bytes
```

> **注意：**
>
> 默认情况下，`kubectl get`和`kubectl describe`避免显示密码的内容。 这是为了防止机密被意外地暴露给旁观者或存储在终端日志中。
>
> 请参阅 [解码 secret](https://kubernetes.io/zh/docs/concepts/configuration/secret/#解码-secret) 了解如何查看它们的内容。

### 手动创建 Secret

您也可以先以 json 或 yaml 格式在文件中创建一个 secret 对象，然后创建该对象。 [密码](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/#secret-v1-core)包含两中类型，数据和字符串数据。 **数据字段用于存储使用base64编码的任意数据**。 提供stringData字段是为了方便起见，它允许您将机密数据作为未编码的字符串提供。

例如，要使用数据字段将两个字符串存储在 Secret 中，请按如下所示将它们转换为 base64：

```shell
echo -n 'admin' | base64
YWRtaW4=
echo -n '1f2d1e2e67df' | base64
MWYyZDFlMmU2N2Rm
```

现在可以像这样写一个 secret 对象：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=
  password: MWYyZDFlMmU2N2Rm
```

使用 [`kubectl apply`](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#apply) 创建 secret：

```shell
kubectl apply -f ./secret.yaml
secret "mysecret" created
```

对于某些情况，您可能希望改用 stringData 字段。 此字段允许您将非 base64 编码的字符串直接放入 Secret 中， 并且在创建或更新 Secret 时将为您编码该字符串。

下面的一个实践示例提供了一个参考，您正在部署使用密钥存储配置文件的应用程序，并希望在部署过程中填补齐配置文件的部分内容。

如果您的应用程序使用以下配置文件：

```yaml
apiUrl: "https://my.api.com/api/v1"
username: "user"
password: "password"
```

您可以使用以下方法将其存储在Secret中：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
stringData:
  config.yaml: |-
    apiUrl: "https://my.api.com/api/v1"
    username: {{username}}
    password: {{password}}
```

然后，您的部署工具可以在执行 `kubectl apply` 之前替换模板的 `{{username}}` 和 `{{password}}` 变量。 stringData 是只写的便利字段。 检索 Secrets 时永远不会被输出。 例如，如果您运行以下命令：

```shell
kubectl get secret mysecret -o yaml
```

输出将类似于：

```yaml
apiVersion: v1
kind: Secret
metadata:
  creationTimestamp: 2018-11-15T20:40:59Z
  name: mysecret
  namespace: default
  resourceVersion: "7225"
  uid: c280ad2e-e916-11e8-98f2-025000000001
type: Opaque
data:
  config.yaml: YXBpVXJsOiAiaHR0cHM6Ly9teS5hcGkuY29tL2FwaS92MSIKdXNlcm5hbWU6IHt7dXNlcm5hbWV9fQpwYXNzd29yZDoge3twYXNzd29yZH19
```

如果在 data 和 stringData 中都指定了字段，则使用 stringData 中的值。 例如，以下是 Secret 定义：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=
stringData:
  username: administrator
```

secret 中的生成结果：

```yaml
apiVersion: v1
kind: Secret
metadata:
  creationTimestamp: 2018-11-15T20:46:46Z
  name: mysecret
  namespace: default
  resourceVersion: "7579"
  uid: 91460ecb-e917-11e8-98f2-025000000001
type: Opaque
data:
  username: YWRtaW5pc3RyYXRvcg==
```

`YWRtaW5pc3RyYXRvcg==` 转换成了 `administrator`。

data和stringData的键必须由字母数字字符 `-`,  `_` 或者 `.` 组成。

> **编码注意：** 秘密数据的序列化 JSON 和 YAML 值被编码为base64字符串。 换行符在这些字符串中无效，因此必须省略。 在 Darwin / macOS 上使用 `base64` 实用程序时，用户应避免使用 `-b` 选项来分隔长行。 相反，Linux用户 *应该* 在 `base64` 命令中添加选项 `-w 0`， 或者，如果`-w`选项不可用的情况下， 执行 `base64 | tr -d '\n'`。

### 从生成器创建 Secret

Kubectl 从1.14版本开始支持 [使用 Kustomize 管理对象](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/) 使用此新功能，您还可以从生成器创建一个 Secret，然后将其应用于在 Apiserver 上创建对象。 生成器应在目录内的“ kustomization.yaml”中指定。

例如，从文件 `./username.txt` 和 `./password.txt` 生成一个 Secret。

```shell
# Create a kustomization.yaml file with SecretGenerator
cat <<EOF >./kustomization.yaml
secretGenerator:
- name: db-user-pass
  files:
  - username.txt
  - password.txt
EOF
```

应用 kustomization 目录创建 Secret 对象。

```shell
$ kubectl apply -k .
secret/db-user-pass-96mffmfh4k created
```

您可以检查 secret 是否是这样创建的：

```shell
$ kubectl get secrets
NAME                             TYPE                                  DATA      AGE
db-user-pass-96mffmfh4k          Opaque                                2         51s

$ kubectl describe secrets/db-user-pass-96mffmfh4k
Name:            db-user-pass
Namespace:       default
Labels:          <none>
Annotations:     <none>

Type:            Opaque

Data
====
password.txt:    12 bytes
```

例如，要从文字 `username=admin` 和 `password=secret` 生成密钥，可以在 `kustomization.yaml` 中将密钥生成器指定为

```shell
# Create a kustomization.yaml file with SecretGenerator
$ cat <<EOF >./kustomization.yaml
secretGenerator:
- name: db-user-pass
  literals:
  - username=admin
  - password=secret
EOF
```

Apply the kustomization directory to create the Secret object.

```shell
$ kubectl apply -k .
secret/db-user-pass-dddghtt9b5 created
```

> **注意：**
>
> 通过对内容进行序列化后，生成一个后缀作为 Secrets 的名称。 这样可以确保每次修改内容时都会生成一个新的Secret。

### 解码 Secret

可以使用 `kubectl get secret` 命令获取 secret。例如，获取在上一节中创建的 secret：

```shell
kubectl get secret mysecret -o yaml
apiVersion: v1
kind: Secret
metadata:
  creationTimestamp: 2016-01-22T18:41:56Z
  name: mysecret
  namespace: default
  resourceVersion: "164619"
  uid: cfee02d6-c137-11e5-8d73-42010af00002
type: Opaque
data:
  username: YWRtaW4=
  password: MWYyZDFlMmU2N2Rm
```

解码密码字段：

```shell
echo 'MWYyZDFlMmU2N2Rm' | base64 --decode
1f2d1e2e67df
```

### 编辑 Secret

可以通过下面的命令编辑一个已经存在的 secret 。

```shell
kubectl edit secrets mysecret
```

这将打开默认配置的编辑器，并允许更新 `data` 字段中的base64编码的 secret：

```yaml
# Please edit the object below. Lines beginning with a '#' will be ignored,
# and an empty file will abort the edit. If an error occurs while saving this file will be
# reopened with the relevant failures.
#
apiVersion: v1
data:
  username: YWRtaW4=
  password: MWYyZDFlMmU2N2Rm
kind: Secret
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: { ... }
  creationTimestamp: 2016-01-22T18:41:56Z
  name: mysecret
  namespace: default
  resourceVersion: "164619"
  uid: cfee02d6-c137-11e5-8d73-42010af00002
type: Opaque
```

## 使用 Secret

Secret 可以作为数据卷被挂载，或作为[环境变量](https://kubernetes.io/docs/concepts/containers/container-environment-variables.md) 暴露出来以供 pod 中的容器使用。它们也可以被系统的其他部分使用，而不直接暴露在 pod 内。 例如，它们可以保存凭据，系统的其他部分应该用它来代表您与外部系统进行交互。

### 在 Pod 中使用 Secret 文件

在 Pod 中的 volume 里使用 Secret：

1. 创建一个 secret 或者使用已有的 secret。多个 pod 可以引用同一个 secret。
2. 修改您的 pod 的定义在 `spec.volumes[]` 下增加一个 volume。可以给这个 volume 随意命名，它的 `spec.volumes[].secret.secretName` 必须等于 secret 对象的名字。
3. 将 `spec.containers[].volumeMounts[]` 加到需要用到该 secret 的容器中。指定 `spec.containers[].volumeMounts[].readOnly = true` 和 `spec.containers[].volumeMounts[].mountPath` 为您想要该 secret 出现的尚未使用的目录。
4. 修改您的镜像并且／或者命令行让程序从该目录下寻找文件。Secret 的 `data` 映射中的每一个键都成为了 `mountPath` 下的一个文件名。

这是一个在 pod 中使用 volume 挂在 secret 的例子：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: mypod
    image: redis
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
      readOnly: true
  volumes:
  - name: foo
    secret:
      secretName: mysecret
```

您想要用的每个 secret 都需要在 `spec.volumes` 中指明。

如果 pod 中有多个容器，每个容器都需要自己的 `volumeMounts` 配置块，但是每个 secret 只需要一个 `spec.volumes`。

您可以打包多个文件到一个 secret 中，或者使用的多个 secret，怎样方便就怎样来。

**向特性路径映射 secret 密钥**

我们还可以控制 Secret key 映射在 volume 中的路径。您可以使用 `spec.volumes[].secret.items` 字段修改每个 key 的目标路径：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: mypod
    image: redis
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
      readOnly: true
  volumes:
  - name: foo
    secret:
      secretName: mysecret
      items:
      - key: username
        path: my-group/my-username
```

将会发生什么呢：

- `username` secret 存储在 `/etc/foo/my-group/my-username` 文件中而不是 `/etc/foo/username` 中。
- `password` secret 没有被映射

如果使用了 `spec.volumes[].secret.items`，只有在 `items` 中指定的 key 被映射。要使用 secret 中所有的 key，所有这些都必须列在 `items` 字段中。所有列出的密钥必须存在于相应的 secret 中。否则，不会创建卷。

**Secret 文件权限**

您还可以指定 secret 将拥有的权限模式位文件。如果不指定，默认使用 `0644`。您可以为整个保密卷指定默认模式，如果需要，可以覆盖每个密钥。

例如，您可以指定如下默认模式：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: mypod
    image: redis
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
  volumes:
  - name: foo
    secret:
      secretName: mysecret
      defaultMode: 256
```

然后，secret 将被挂载到 `/etc/foo` 目录，所有通过该 secret volume 挂载创建的文件的权限都是 `0400`。

您还可以使用映射，如上一个示例，并为不同的文件指定不同的权限，如下所示：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: mypod
    image: redis
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
  volumes:
  - name: foo
    secret:
      secretName: mysecret
      items:
      - key: username
        path: my-group/my-username
        mode: 511
```

在这种情况下，导致 `/etc/foo/my-group/my-username` 的文件的权限值为 `0777`。**由于 JSON 限制，必须以十进制格式指定模式。**

**从 Volume 中消费 secret 值**

在挂载的 secret volume 的容器内，secret key 将作为文件，并且 secret 的值使用 base-64 解码并存储在这些文件中。这是在上面的示例容器内执行的命令的结果：

```shell
ls /etc/foo/
username
password
cat /etc/foo/username
admin
cat /etc/foo/password
1f2d1e2e67df
```

容器中的程序负责从文件中读取 secret。

**挂载的 secret 被自动更新**

当已经在 volume 中被消费的 secret 被更新时，被映射的 key 也将被更新。 Kubelet 在周期性同步时检查被挂载的 secret 是不是最新的。 但是，它正在使用其本地缓存来获取 Secret 的当前值。

缓存的类型可以使用 (`ConfigMapAndSecretChangeDetectionStrategy` 中的 [KubeletConfiguration 结构](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/kubelet/config/v1beta1/types.go)). 它可以通过基于 ttl 的 watch(默认)传播，也可以将所有请求直接重定向到直接kube-apiserver。 结果，从更新密钥到将新密钥投射到 Pod 的那一刻的总延迟可能与 kubelet 同步周期 + 缓存传播延迟一样长，其中缓存传播延迟取决于所选的缓存类型。 (它等于观察传播延迟，缓存的ttl或相应为0)

> **注意：**
>
> 使用 Secret 作为[子路径](https://kubernetes.io/docs/concepts/storage/volumes#using-subpath)卷安装的容器将不会收到 Secret 更新。

### Secret 作为环境变量

将 secret 作为 pod 中的[环境变量](https://kubernetes.io/docs/concepts/containers/container-environment-variables.md)使用：

1. 创建一个 secret 或者使用一个已存在的 secret。多个 pod 可以引用同一个 secret。
2. 修改 Pod 定义，为每个要使用 secret 的容器添加对应 secret key 的环境变量。消费secret key 的环境变量应填充 secret 的名称，并键入 `env[x].valueFrom.secretKeyRef`。
3. 修改镜像并／或者命令行，以便程序在指定的环境变量中查找值。

这是一个使用 Secret 作为环境变量的示例：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-env-pod
spec:
  containers:
  - name: mycontainer
    image: redis
    env:
      - name: SECRET_USERNAME
        valueFrom:
          secretKeyRef:
            name: mysecret
            key: username
      - name: SECRET_PASSWORD
        valueFrom:
          secretKeyRef:
            name: mysecret
            key: password
  restartPolicy: Never
```

**消费环境变量里的 Secret 值**

在一个消耗环境变量 secret 的容器中，secret key 作为包含 secret 数据的 base-64 解码值的常规环境变量。这是从上面的示例在容器内执行的命令的结果：

```shell
echo $SECRET_USERNAME
admin
echo $SECRET_PASSWORD
1f2d1e2e67df
```

### 使用 imagePullSecret

imagePullSecret 是将包含 Docker（或其他）镜像注册表密码的 secret 传递给 Kubelet 的一种方式，因此可以代表您的 pod 拉取私有镜像。

**手动指定 imagePullSecret**

imagePullSecret 的使用在 [镜像文档](https://kubernetes.io/docs/concepts/containers/images/#specifying-imagepullsecrets-on-a-pod) 中说明。

### 安排 imagePullSecrets 自动附加

您可以手动创建 imagePullSecret，并从 serviceAccount 引用它。使用该 serviceAccount 创建的任何 pod 和默认使用该 serviceAccount 的 pod 将会将其的 imagePullSecret 字段设置为服务帐户的 imagePullSecret 字段。有关该过程的详细说明，请参阅 [将 ImagePullSecrets 添加到服务帐户](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#adding-imagepullsecrets-to-a-service-account)。

#### 自动挂载手动创建的 Secret

手动创建的 secret（例如包含用于访问 github 帐户的令牌）可以根据其服务帐户自动附加到 pod。请参阅 [使用 PodPreset 向 Pod 中注入信息](https://kubernetes.io/docs/tasks/run-application/podpreset/) 以获取该进程的详细说明。

## 详情

### 限制

- **验证 secret volume 来源确保指定的对象引用实际上指向一个类型为 Secret 的对象。**因此，需要在依赖于它的任何 pod 之前创建一个 secret。
- **Secret API 对象驻留在命名空间中。它们只能由同一命名空间中的 pod 引用。**
- **每个 secret 的大小限制为1MB。**这是为了防止创建非常大的 secret 会耗尽 apiserver 和 kubelet 的内存。然而，创建许多较小的 secret 也可能耗尽内存。更全面得限制 secret 对内存使用的功能还在计划中。
- Kubelet 仅支持从 API server 获取的 Pod 使用 secret。这包括使用 kubectl 创建的任何 pod，或间接通过 replication controller 创建的 pod。它不包括通过 kubelet `--manifest-url` 标志，其 `--config` 标志或其 REST API 创建的pod（这些不是创建 pod 的常用方法）。
- **必须先创建 secret，除非将它们标记为可选项，否则必须在将其作为环境变量在 pod 中使用之前创建 secret。对不存在的 secret 的引用将阻止其启动。**
- **使用 `secretKeyRef` ，引用指定的 secret 中的不存在的 key ，这会阻止 pod 的启动。**
- **对于通过 `envFrom` 填充环境变量的 secret，这些环境变量具有被认为是无效环境变量名称的 key 将跳过这些键。**该 pod 将被允许启动。将会有一个事件，其原因是 `InvalidVariableNames`，该消息将包含被跳过的无效键的列表。该示例显示一个 pod，它指的是包含2个无效键，1badkey 和 2alsobad 的默认/mysecret ConfigMap。

### Secret 与 Pod 生命周期的联系

通过 API 创建 Pod 时，不会检查应用的 secret 是否存在。一旦 Pod 被调度，kubelet 就会尝试获取该 secret 的值。如果获取不到该 secret，或者暂时无法与 API server 建立连接，kubelet 将会定期重试。Kubelet 将会报告关于 pod 的事件，并解释它无法启动的原因。一旦获取到 secret，kubelet将创建并装载一个包含它的卷。在所有 pod 的卷被挂载之前，都不会启动 pod 的容器。

## 案例

### 使用案例：包含 ssh 密钥的 pod

创建一个包含 ssh key 的 secret：

```shell
kubectl create secret generic ssh-key-secret --from-file=ssh-privatekey=/path/to/.ssh/id_rsa --from-file=ssh-publickey=/path/to/.ssh/id_rsa.pub
secret "ssh-key-secret" created
```

>**警告:**
>
>发送自己的 ssh 密钥之前要仔细思考：集群的其他用户可能有权访问该密钥。使用您想要共享 Kubernetes 群集的所有用户可以访问的服务帐户，如果它们遭到入侵，可以撤销。

现在我们可以创建一个使用 ssh 密钥引用 secret 的pod，并在一个卷中使用它：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-test-pod
  labels:
    name: secret-test
spec:
  volumes:
  - name: secret-volume
    secret:
      secretName: ssh-key-secret
  containers:
  - name: ssh-test-container
    image: mySshImage
    volumeMounts:
    - name: secret-volume
      readOnly: true
      mountPath: "/etc/secret-volume"
```

当容器中的命令运行时，密钥的片段将可在以下目录：

```shell
/etc/secret-volume/ssh-publickey
/etc/secret-volume/ssh-privatekey
```

### 使用案例：Secret 卷中以点号开头的文件

为了将数据“隐藏”起来（即文件名以点号开头的文件），简单地说让该键以一个点开始。例如，当如下 secret 被挂载到卷中：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: dotfile-secret
data:
  .secret-file: dmFsdWUtMg0KDQo=
---
apiVersion: v1
kind: Pod
metadata:
  name: secret-dotfiles-pod
spec:
  volumes:
  - name: secret-volume
    secret:
      secretName: dotfile-secret
  containers:
  - name: dotfile-test-container
    image: k8s.gcr.io/busybox
    command:
    - ls
    - "-l"
    - "/etc/secret-volume"
    volumeMounts:
    - name: secret-volume
      readOnly: true
      mountPath: "/etc/secret-volume"
```

`Secret-volume` 将包含一个单独的文件，叫做 `.secret-file`，`dotfile-test-container` 的 `/etc/secret-volume/.secret-file` 路径下将有该文件。

> **注意：**
>
> 以点号开头的文件在 `ls -l` 的输出中被隐藏起来了；列出目录内容时，必须使用 `ls -la` 才能查看它们。

## 安全属性

### 保护

因为 `secret` 对象可以独立于使用它们的 `pod` 而创建，所以在创建、查看和编辑 pod 的流程中 secret 被暴露的风险较小。系统还可以对 `secret` 对象采取额外的预防措施，例如避免将其写入到磁盘中可能的位置。

只有当节点上的 pod 需要用到该 secret 时，该 secret 才会被发送到该节点上。它不会被写入磁盘，而是存储在 tmpfs 中。一旦依赖于它的 pod 被删除，它就被删除。

同一节点上的很多个 pod 可能拥有多个 secret。但是，只有 pod 请求的 secret 在其容器中才是可见的。因此，一个 pod 不能访问另一个 Pod 的 secret。

Pod 中有多个容器。但是，pod 中的每个容器必须请求其挂载卷中的 secret 卷才能在容器内可见。 这可以用于 [在 Pod 级别构建安全分区](https://kubernetes.io/zh/docs/concepts/configuration/secret/#使用案例secret-仅对-pod-中的一个容器可见)。

在大多数 Kubernetes 项目维护的发行版中，用户与 API server 之间的通信以及从 API server 到 kubelet 的通信都受到 SSL/TLS 的保护。通过这些通道传输时，secret 受到保护。

**FEATURE STATE:** `Kubernetes v1.13` [beta](https://kubernetes.io/zh/docs/concepts/configuration/secret/#)

你可以为 secret 数据开启[静态加密](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/)，这样秘密信息就不会以明文形式存储到[etcd](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)。

### 风险

- API server 的 secret 数据以纯文本的方式存储在 etcd 中，因此：
  - 管理员应该为集群数据开启静态加密(需求 v1.13 或者更新)。
  - 管理员应该限制 admin 用户访问 etcd；
  - API server 中的 secret 数据位于 etcd 使用的磁盘上；管理员可能希望在不再使用时擦除/粉碎 etcd 使用的磁盘
  - 如果 etcd 运行在集群内，管理员应该确保 etcd 之间的通信使用 SSL/TLS 进行加密。
- 如果您将 secret 数据编码为 base64 的清单（JSON 或 YAML）文件，共享该文件或将其检入代码库，这样的话该密码将会被泄露。 Base64 编码不是一种加密方式，一样也是纯文本。
- 应用程序在从卷中读取 secret 后仍然需要保护 secret 的值，例如不会意外记录或发送给不信任方。
- 可以创建和使用 secret 的 pod 的用户也可以看到该 secret 的值。即使 API server 策略不允许用户读取 secret 对象，用户也可以运行暴露 secret 的 pod。
- 目前，任何节点的 root 用户都可以通过模拟 kubelet 来读取 API server 中的任何 secret。只有向实际需要它们的节点发送 secret 才能限制单个节点的根漏洞的影响，该功能还在计划中。