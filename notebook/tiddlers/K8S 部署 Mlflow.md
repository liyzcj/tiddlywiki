# 部署 MLFLOW

## 官方镜像



最首先想到是从官方镜像开始构建，首先将 metadata store 连接上 mysql，再将 artifact store 连接到 hdfs 即可。

首先明确的是官方镜像是从 miniconda 的官方镜像上构建的，下面是 Dockerfile：

```dockerfile
# hadolint ignore=DL3006
FROM continuumio/miniconda3 as builder

WORKDIR /app
COPY . /app

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# hadolint ignore=DL3003
RUN apt-get update -qq -y \
&&  apt-get install -qq -y gnupg curl git-core \
&&  curl -sL https://deb.nodesource.com/setup_10.x | bash - \
&&  apt-get update -qq -y && apt-get install -qq -y nodejs \
&&  cd mlflow/server/js \
&&  npm install \
&&  npm run build \
&&  cd /app \
&&  python setup.py bdist_wheel

# hadolint ignore=DL3006
FROM continuumio/miniconda3 as runtime
COPY --from=builder /app/dist/*.whl /tmp/wheel/

WORKDIR /app

# hadolint ignore=DL3013
RUN useradd --create-home --home-dir /app --shell /bin/bash --uid 8888 app \
&&  apt update -qq -y \
&&  apt install -qq -y --no-install-recommends build-essential libpq-dev \
&&  pip install /tmp/wheel/*.whl sqlalchemy psycopg2 \
&&  apt clean \
&&  /bin/rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /root/.cache/

USER app

CMD ["mlflow", "server"]
```



而 miniconda3 的官方镜像是从 `debian:latest` 创建的：



```dockerfile
FROM debian:latest

#  $ docker build . -t continuumio/miniconda3:latest -t continuumio/miniconda3:4.5.11
#  $ docker run --rm -it continuumio/miniconda3:latest /bin/bash
#  $ docker push continuumio/miniconda3:latest
#  $ docker push continuumio/miniconda3:4.5.11

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
ENV PATH /opt/conda/bin:$PATH

RUN apt-get update --fix-missing && \
    apt-get install -y wget bzip2 ca-certificates curl git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-4.5.11-Linux-x86_64.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda && \
    rm ~/miniconda.sh && \
    /opt/conda/bin/conda clean -tipsy && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate base" >> ~/.bashrc

ENV TINI_VERSION v0.16.1
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /usr/bin/tini
RUN chmod +x /usr/bin/tini

ENTRYPOINT [ "/usr/bin/tini", "--" ]
CMD [ "/bin/bash" ]
```

而目前的 `debian:latest` 指的是稳定版本的 `debian:buster`。



### mysql

首先需要部署一个 mysql，这里选择在 k8s 上部署一个 mysql，并使用 secret 来保存密码，使用 root 账户登陆：

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: mlflow-db
  namespace: mlflow
  labels:
    component: db
spec:
  replicas: 1
  template:
    metadata:
      name: mlflow-db
      labels:
        component: db
    spec:
      containers:
      - name: mlflow-db-container
        image: mysql:8.0.3
        args:
        - --datadir
        - /var/lib/mysql/datadir
        env:
          - name: MYSQL_ROOT_PASSWORD
            valueFrom:
              secretKeyRef:
                name: db-secrets
                key: MYSQL_ROOT_PASSWORD
          - name: MYSQL_ALLOW_EMPTY_PASSWORD
            value: "true"
          - name: MYSQL_DATABASE
            value: "mlflowdb"
        ports:
        - name: dbapi
          containerPort: 3306
        readinessProbe:
          exec:
            command:
            - "/bin/bash"
            - "-c"
            - "mysql -D $$MYSQL_DATABASE -p$$MYSQL_ROOT_PASSWORD -e 'SELECT 1'"
          initialDelaySeconds: 5
          periodSeconds: 2
          timeoutSeconds: 1
        volumeMounts:
        - name: mlflow-mysql
          mountPath: /var/lib/mysql
      volumes:
      - name: mlflow-mysql
        persistentVolumeClaim:
          claimName: mlflow-mysql
```

部署好 mysql 服务端以后，就是配置连接到 mysql 的python 客户端。

mysql 的 Python 客户端有很多种，MLflow 采用了 [SQLAlchemy](https://docs.sqlalchemy.org/en/13/core/engines.html#database-urls) 作为统一的连接方式，这种方式可以支持多种客户端与 driver。

这里选择 `mysqlclient` 作为客户端来连接：

需要安装的包有两个，一个 Python 的客户端，一个是drvier ：`default-libmysqlclient-dev`。

> 这里遇到一个问题，mlflow 的官方镜像默认的用户是 app，非root 用户是无法使用 apt 安装系统包的，这里可以使用 `-u` 选项以 root 用户打开一个 shell ，再进行安装操作：
>
> ```bash
> docker exec -u 0 -it container_name bash
> ```

执行以下命令安装：

> 为了加速可以使用 buster 的国内清华镜像源：`/etc/apt/sources.list`
>
> ```bash
> # 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
> deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster main contrib non-free
> # deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ buster main contrib non-free
> deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-updates main contrib non-free
> # deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-updates main contrib non-free
> deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-backports main contrib non-free
> # deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-backports main contrib non-free
> deb https://mirrors.tuna.tsinghua.edu.cn/debian-security buster/updates main contrib non-free
> # deb-src https://mirrors.tuna.tsinghua.edu.cn/debian-security buster/updates main contrib non-free
> ```
>
> conda 也可以使用清华源: `$HOME/.condarc`
>
> ```yaml
> channels:
>   - defaults
> show_channel_urls: true
> default_channels:
>   - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main
>   - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free
>   - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/r
> custom_channels:
>   conda-forge: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
>   msys2: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
>   bioconda: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
>   menpo: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
>   pytorch: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
>   simpleitk: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
> ```
>
> 

```bash
apt update
apt install default-libmysqlclient-dev
conda install mysqlclient
```

> 由于mlflow 的官方镜像是基于 miniconda的，这里使用 conda 来安装python包。

提示：为了测试能否连接到 mysql，需要将已经部署到 k8s 上的 mysql forward 到宿主机上，使得容器可以访问：

```bash
kubectl -n mlflow port-forward --address 0.0.0.0 service/mlflow-db 3306:3306
```

尝试连接mysql 以后又遇到另外一个问题：

> Error: (2026, 'SSL connection error: SSL_CTX_set_tmp_dh failed')

参考[这篇文章](https://zhuanlan.zhihu.com/p/58995940)，发现是 openssl 的版本问题，所以需要降级：

```bash
conda install openssl=1.0.2r
```

降级以后，使用命令测试是否连接成功：

```bash
mkdir /app/mlruns
chown app.app /app/mlruns
mlflow server \
    --backend-store-uri mysql://root:test@172.17.0.1:3306/mlflowdb \
    --default-artifact-root ./mlruns \
    --host 0.0.0.0
```

> 由于这里还没有配置 artifact store 连接hdfs ，所以暂时使用本地目录，使用本地目录的时候需要使用 root 用户才能创建目录，并且修改为 app 用户所属。非root 使用真麻烦。。





## 连接 Hdfs

将 metadata store 连接到 mysql 以后，接下来就是将 artifact store 连接到 hdfs：

首先需要安装 Hadoop，hadoop 需要安装 Openjdk。

### Open jdk

由于 `debian:buster` 版本已经不支持 `openjdk-8-jdk` 所以只能安装 `openjdk-11-jdk`：

```bash
apt-get -y install openjdk-11-jdk
```

> 但是这样安装会报错，需要创建man 文件夹：
>
> ```bash
> mkdir -p /usr/share/man/man1
> ```



接下来就是创建环境变量并且解压安装 hadoop client：

```bash
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export HADOOP_HOME=/app/hadoop-3.1.2
export HADOOP_CONF_DIR=/app/hadoop_config
export PATH=$HADOOP_HOME/bin:$PATH
export HADOOP_USER_NAME=hdfs
tar xzvf /app/hadoop-3.1.2.tar.gz
cp $HADOOP_HOME/etc/hadoop/log4j.properties $HOME/env/hadoop_config \
# 添加到 host 文件
echo 192.168.10.145 ab-node1.senses >> /etc/hosts
```

测试是否能连接到 hadoop。

```bash
mlflow server --backend-store-uri ./mlruns --default-artifact-root hdfs://192.168.10.145:8020/mlflow/mlruns --host 0.0.0.0
```

测试以后，发现mlflow 是客户端直接连接Hadoop上传 artifact 的，而不是传输到服务端再上传到 hdfs。但是服务端也需要 hdfs，因为需要将 artifact 从 hdfs 复制到本地再展示在 UI 界面中。

由于新版的 `openjdk-11-jdk` 的部分文件的位置和旧版不同，导致pyarrow 无法找到 libjvm.so 文件，根据[这个 Commit](https://github.com/apache/arrow/pull/1487/files/7e14923d59013c2ba29987073660c228d9ca83b0) 提供的信息，发现 pyarrow 查找这个文件的路径以后，再将文件复制一份到路径中：

```bash
mkdir $JAVA_HOME/lib/amd64
cp -r $JAVA_HOME/lib/server $JAVA_HOME/lib/amd64/
```

使用 pip 安装 pyarrow：（使用清华源提高速度）

```bash
mkdir $HOME/.pip
echo -e "[global]\nindex-url = https://pypi.tuna.tsinghua.edu.cn/simple" > $HOME/.pip/pip.conf
pip --disable-pip-version-check --no-cache-dir install pyarrow
```

配置完毕以后，在 MLflow 的UI 打开一个 RUN 的详细信息时，出现报错无法加载 native lib。

没有找到错误，所以使用 openjdk-8 版本的 `debian:stretch` 发现并没有问题，所以最后还是决定在 `python:3.7-stretch`的基础上重新构建。



## Python 3.7

### 服务端

使用 `python:3.7-stretch` 作为基础镜像，使用 pip 直接安装 pyarrow，mlflow，mysqlclient等 module，再安装hadoop 等。



```dockerfile
FROM python:3.7-stretch

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

## ARGs =====================================
ARG USER=root
ARG HOME=/root

SHELL ["/bin/bash", "-c"]

## Install Python
COPY requirements.txt /tmp/pip-tmp/
COPY pip.conf.tuna $HOME/.pip/pip.conf
RUN if [ -f "/tmp/pip-tmp/requirements.txt" ]; then pip --disable-pip-version-check --no-cache-dir install -r /tmp/pip-tmp/requirements.txt; fi \
    && rm -rf /tmp/pip-tmp

## apt-get sources.list
COPY sources.list.stretch.ustc /etc/apt/sources.list

## Installl hadoop
ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
ENV HADOOP_HOME=$HOME/env/hadoop-3.1.2
ENV HADOOP_CONF_DIR=$HOME/env/hadoop_config
ENV PATH=$HADOOP_HOME/bin:$PATH
ENV HADOOP_USER_NAME=hdfs
COPY hadoop_config $HOME/env/hadoop_config
ADD --chown=0:0 hadoop-3.1.2.tar.gz $HOME/env
# Install Java
RUN apt-get update \
    && apt-get -y install openjdk-8-jdk \
    && apt-get -y install default-libmysqlclient-dev \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

```



### 客户端

客户端与服务器类似，只是不需要连接 mysql 数据库，并且安装 jupyter 以及 spark 等即可。



## Kubernetes

最后再将所有的资源整合，全部部署到 k8s 上，通过 kustomize 可以方便的进行安装与卸载。

### secret

使用 secret 保存 mysql 数据库的密码，并使的 mlflow 客户端与 mysql 都从 secret 中获取密码：

```yaml
apiVersion: v1
kind: Secret
type: Opaque
metadata:
  name: db-secrets
  namespace: mlflow
data:
  MYSQL_ROOT_PASSWORD: dGVzdA== # "test"

```

### hostaliases

使用 hostalises 管理 deployment 中 pod 的 hosts 文件，增加 hdfs 节点：



```yaml
 spec:
      hostAliases:
      - ip: "192.168.10.145"
        hostnames:
        - "ab-node1.senses"
```



### kustomize 

将所有的资源都放到一个 namespace 中，再使用 kustomize将资源整合起来，kustomize 添加资源命令：

```bash
kustomize edit add resource resource_file.yaml
```

所有的资源如下：`kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- mlflow-namespace.yaml
- mlflow-db-secret.yaml
- mlflow-db-pvc.yaml
- mlflow-db-deployment.yaml
- mlflow-db-service.yaml
- mlflow-deployment.yaml
- mlflow-client-deployment.yaml

```

添加资源以后，直接使用 kubectl 进行快速部署 kustomize 资源：

```bash
kubectl apply -k .
```

## Utils



### 检测数据库端口号

```bash
netstat -an | grep 3306

apt-get install iputils-ping
apt-get install procps
```

### 启动命令

```bash
 docker run --rm -it -p 35000:5000 test:test mlflow server --backend-store-uri mysql://root:test@172.17.0.1:3306/mlflowdb --default-artifact-root hdfs://192.168.10.145:8020/mlflow/mlruns --host 0.0.0.0
```


