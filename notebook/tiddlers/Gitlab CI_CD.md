# GitLab CI



Gitlab 使用 `.gitlab-ci.yml` 文件来定义用来持续集成的 Pipeline。

配置 Gitlab 的 CI pipeline 只需要两步：

1. Add `.gitlab-ci.yml` to the root directory of your repository
2. Configure a Runner

配置完成以后，当你每次 push 到 Gitlab 仓库时，Gitlab 都会自动进行 CI 流程，并且在界面上显示每一个 stage 与 job 的运行情况。



## 配置 `.gitlab-ci.yml` 文件

`.gitlab-ci.yml` 用来配置 CI 需要做什么，该文件必须位于仓库的根目录。

Gitlab 会在你每一次 push 时检查 `.gitlab-ci.yml` 文件并且在 Runner 上执行配置的任务。



在文件中，一个 pipeline 又分为多个 stage，默认情况下有三个 stage：`build`, `test`, and `deploy`。在每个 stage中，又可以定义多个 job。

stage 之间是串行，每个 stage 完成才能运行下一个 stage；同一个 stage 之间的 job 是可以并行执行的。

> 参考文档： https://docs.gitlab.com/ee/ci/yaml/README.html

例如：

```yaml
stages:
  - test

nose2:
  stage: test
  before_script:
    - pip install -r requirements.txt
  script:
    - nose2 -v tests

flake8:
  stage: test
  image: python:3.7-stretch
  before_script:
    - pip install flake8

  script:
    - python -m flake8 notebook_sdk
```

## 配置 Runner

Runner 用来运行 `.gitlab-ci.yml` 中配置的 job，Runner 可以是虚拟机或者 docker container 或者部署在 k8s 上。

配置一个 Runner 需要两个步骤：

1. 安装 Runner
2. 配置 Runner

这里通过 Helm 将 Runner 安装在 K8S 集群上。

首先增加 gitlab 的 Charts repository：

```bash
helm repo add gitlab https://charts.gitlab.io
helm update
```

到处 gitlab runner 的 values 配置：

```bash
helm show values gitlab/gitlab-runner > values.yaml
```

修改 配置文件 `values.yaml`:

必须配置的选项有两个：



* `gitlabUrl` - the GitLab server full URL (e.g., `https://example.gitlab.com`) to register the Runner against.
* `runnerRegistrationToken` - The registration token for adding new Runners to GitLab. This must be [retrieved from your GitLab instance](https://docs.gitlab.com/ee/ci/runners/).

> 对于 配置了 RABC 的 K8s 集群，需要将rabc 设置为 true：
>
> ```yaml
> rbac:
> 	create: true
> ```



> 配置 Helm Gitlab-runner `values.yaml` : https://docs.gitlab.com/runner/install/kubernetes.html#running-privileged-containers-for-the-runners

配置完毕以后，创建  k8s 命名空间：

 ```bash
kubectl create namespace gitlab
 ```

使用 Helm 安装 gitlab-runner：

```bash
helm install gitlab-runner gitlab/gitlab-runner -f values.yaml --namespace gitlab
```

至此，在 Gitlab 的webUi上已经可以看到 Pipeline 在运行。

在 Helm 中可以查看这个 releasse：

```bash
helm -n gitlab list
```


如果修改了某些 Values，需要更新，可以使用 `upgrade` 命令：

```bash
helm -n gitlab upgrade -f gitlab-runner.yaml gitlab-runner gitlab/gitlab-runner
```

---

Kubernetes runner 没有问题，但是要想在 Runner 内使用集群上的 docker，只有两种方法：

> https://docs.gitlab.com/runner/executors/kubernetes.html#using-docker-in-your-builds

* Docker in docker
* expose socket

其中 Docker in docker 无法和宿主机共享 docker 环境，导致镜像的 cache 无法使用。

第二种方法需要将 `/var/run/docker.sock` 映射到 Runner 里，kubernetes executor 提供了 volume 的配置项：https://docs.gitlab.com/runner/executors/kubernetes.html#using-docker-dind



但是目前 Helm 版本的 Gitlab-runner 还没有 volume 这个配置项，详情见ISSUE：https://gitlab.com/gitlab-org/charts/gitlab-runner/issues/83

## SHell Executor

>  由于上述方法目前使用 Docker-in-docker 比较复杂，暂时使用 Shell Executor 代替，等上面的 ISSUE 解决了就可以方便的使用 K8S Executor
>
> 这里的 Shell Executor 也选择安装在 Docker 镜像中，通过映射 docker 的方式实现和宿主机的docker 环境互通。

安装 shell Executor Gitlab Runner：

* 下载对应 amd64 的二进制包：

  > https://docs.gitlab.com/runner/install/linux-manually.html

  ```bash
  curl -LJO https://gitlab-runner-downloads.s3.amazonaws.com/latest/deb/gitlab-runner_amd64.deb
  ```

* 安装包：

  ```bash
  dpkg -i gitlab-runner_amd64.deb
  ```
  

注册 Runner：

```bash
gitlab-runner register \
  --non-interactive \
  --url "http://192.168.10.143/" \
  --registration-token "2v-myPpeE1cphsB3raXT" \
  --executor "shell" \
  --tag-list "docker" \
  --run-untagged="true" \
  --locked="true" \
  --access-level="not_protected" \
  --name "docker-in-docker"
```

启动：

```bash
gitlab-runner start
```

> 在 docker 镜像中使用 `gitlab-runner run`, 因为start 是在后台运行，会自动退出。

使用 list 命令查看正在运行的 runner：

```bash
gitlab-runner list
```

> 这里的 gitlab-runner 其实是一个 controller，控制着不同的 Runner, 其中每一个 Runner 又可以起多个 Executor。

> 暂时将 shell executor 部署在 kubernetes 上来使用 docker in docker。



## Runner Tags

配置 runner 的时候可以给runner 添加 tag，同样的 也可以对 job 添加 tag，这样可以指定一个 job 必须由带有对应 tag 的 runner 来执行。



暂时将 上面的 shell executor tag 为 `docker` 代表可以运行 docker。



## Gitlab 增加 K8S 集群

Gitlab 可以直接增加 K8S集群，并自动创建 Runner，添加步骤：



1. Navigate to your project's **Operations > Kubernetes** page.

   NOTE: **Note:** You need Maintainer [permissions](../../permissions.md) and above to access the Kubernetes page.

2. Click **Add Kubernetes cluster**.

3. Click **Add an existing Kubernetes cluster** and fill in the details。



填写以下配置项：

* Kubernetes cluster name ： 设置集群名称

* API URL： 配置集群的 API 地址：

```bash
$ kubectl cluster-info
```

* CA certificate: 有效的 K8S 证书

  * 使用 `kubectl get secrets` ，获取 `default-token-xxxxx` 格式的 secret 名称

  * 通过命令获取证书：

    ```bash
    kubectl get secret <secret name> -o jsonpath="{['data']['ca\.crt']}" | base64 --decode
    ```

* Token：创建 Gitlab ServiceAccount 并获取证书：

  * 创建 ServiceAccount：

    ```yaml
    apiVersion: v1
    kind: ServiceAccount
    metadata:
      name: gitlab-admin
      namespace: kube-system
    ```
  
  * 创建 ClusterRoleBinding：
    
    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1beta1
    kind: ClusterRoleBinding
    metadata:
      name: gitlab-admin
    roleRef:
      apiGroup: rbac.authorization.k8s.io
      kind: ClusterRole
      name: cluster-admin
    subjects:
    - kind: ServiceAccount
      name: gitlab-admin
      namespace: kube-system
    ```
    
  * 使用命令获取 Token：
    
    ```bash
    kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep gitlab-admin | awk '{print $1}')
    ```
    
  * **Project namespace** (optional) : 命名空间名称
  
  
  > 配置完毕以后，点击添加 Kubernetes 集群，报错：
  >
  > Platform kubernetes api url is blocked: Requests to the local network are not allowed
  >
  > 可以修改 admin 配置解决： **Admin -> Settings -> Network -> Outbound Requests -> Allow requests to the local network from hooks and services**
  >
  > https://gitlab.com/gitlab-org/gitlab-foss/issues/57948
  

在 Gitlab 添加了集群以后，需要首先在界面上安装 Helm-tiller，才能安装其他应用。

> Helm Tiller 的官方镜像 `gcr.io/kubernetes-helm/tiller:v2.12.3` 不翻墙可能拉取不了。




