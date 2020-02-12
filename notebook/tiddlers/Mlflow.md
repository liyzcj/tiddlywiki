# MLFlow

## MLflow Tracking Servers



使用 `server` 命令运行一个 MLflow Tracking 服务：

```bash
mlflow server \
    --backend-store-uri /mnt/persistent-disk \
    --default-artifact-root s3://my-mlflow-bucket/ \
    --host 0.0.0.0
```



### 存储

MLflow 有两个关于存储的组件：**后台存储** 和 **Artifacts 存储** 。



#### 后台存储

后台存储是用来保存 experiments 和 runs 的元数据的，其中包含超参数，metrics，tags 等等。

> 像 tfx kubeflow 等将 Metrics 也归为 Artifacts 的一种。MLflow 将 metrics 作为元数据存储。

MLflow 支持两种类型的后台存储：**文件系统类型** 和 **数据库类型**。

使用参数 `--backend-store-uri` 来配置后台存储的类型。

如果使用文件系统存储，使用 `./path_to_store` 或者 `file:/path_to_store` 后者可以指定不同类型的文件系统。

如果使用数据库类型存粗，指定一个[SQLAlchemy database URI](https://docs.sqlalchemy.org/en/latest/core/engines.html#database-urls)。通常的格式是：

```
<dialect>+<driver>://<username>:<password>@<host>:<port>/<database>
```

其中，Mlflow 支持的 dialects 有：`mysql`, `mssql`, `sqlite`, and `postgresql`。

> 如果 Database 使用的过时的 schema，`mlflow server` 会启动失败。你可以使用  `mlflow db upgrade [db_uri]` 解决这个问题。但是在执行前，请备份好数据库，如果数据库较大，可能需要执行很长时间。

默认情况下 `--backend-store-uri` 设置为运行目录的 `./mlruns` 。



#### Artifact store

Artifact 适合保存在一个适合存储大数据的位置。使用来保存客户端 log 的 数据集与模型的地方。`artifact_location` 是 [`mlflow.entities.Experiment`](https://mlflow.org/docs/latest/python_api/mlflow.entities.html#mlflow.entities.Experiment) 的一个参数。同时也是  [`mlflow.entities.RunInfo`](https://mlflow.org/docs/latest/python_api/mlflow.entities.html#mlflow.entities.RunInfo) 的一个参数用来保存这次运行中产生的 artifacts。

使用 `--default-artifact-root` 来指定默认的 artifact store（默认为 `./mlruns`）。如果在  [`mlflow.entities.Experiment`](https://mlflow.org/docs/latest/python_api/mlflow.entities.html#mlflow.entities.Experiment) 中没有指定 `artifact_localtion` 那么会使用这个作为默认值。

> 注意，一旦你创建了一个 [`mlflow.entities.Experiment`](https://mlflow.org/docs/latest/python_api/mlflow.entities.html#mlflow.entities.Experiment) 以后，`--default-artifact-root` 参数就没有作用了。



对于需要访问权限的数据集群，需要配置对应的 credential。



支持的存储类型：

- [Amazon S3](https://mlflow.org/docs/latest/tracking.html#amazon-s3)
- [Azure Blob Storage](https://mlflow.org/docs/latest/tracking.html#azure-blob-storage)
- [Google Cloud Storage](https://mlflow.org/docs/latest/tracking.html#google-cloud-storage)
- [FTP server](https://mlflow.org/docs/latest/tracking.html#ftp-server)
- [SFTP Server](https://mlflow.org/docs/latest/tracking.html#sftp-server)
- [NFS](https://mlflow.org/docs/latest/tracking.html#nfs)
- [HDFS](https://mlflow.org/docs/latest/tracking.html#hdfs)



如果想要保存到 HDFS 中，需要指定一个 `hdfs:`  URI。这有可能包含主机和端口号：

* `hdfs://<host>:<port>/<path>`

* `hdfs://<path>`

有两种方式可以设置访问权限：

* 使用当前的 UNIX 账户授权。
* 使用 `kerberos credentials` 环境变量

```bash
export MLFLOW_KERBEROS_TICKET_CACHE=/tmp/krb5cc_22222222
export MLFLOW_KERBEROS_USER=user_name_to_use
```

大部分集群的 context 都是从 `hdfs-site.xml` 中读取，并且通过 `CLASSPATH`被 HDFS driver 访问。

你也可以指定不同的访问的驱动：

```bash
export MLFLOW_HDFS_DRIVER=libhdfs3
```

默认的驱动是 `libhdfs`。

###  网络

`--host` 会将服务暴露在所有的接口中。如果在生产环境中，推荐使用 NGINX 或者 Apache httpd这样的反向代理来确保服务的安全性与保密性。



### 连接到 Tracking 服务器

要在客户端上连接到 Tracking 服务器，可以通过配置环境变量 `MLFLOW_TRACKING_URI`来指向服务器的 URI。也可以通过在代码中调用 [`mlflow.set_tracking_uri()`](https://mlflow.org/docs/latest/python_api/mlflow.html#mlflow.set_tracking_uri) 方法来连接。

 [`mlflow.start_run()`](https://mlflow.org/docs/latest/python_api/mlflow.html#mlflow.start_run), [`mlflow.log_param()`](https://mlflow.org/docs/latest/python_api/mlflow.html#mlflow.log_param) 和 [`mlflow.log_metric()`](https://mlflow.org/docs/latest/python_api/mlflow.html#mlflow.log_metric) 会向服务器发送请求。

```python
import mlflow
remote_server_uri = "..." # set to your server URI
mlflow.set_tracking_uri(remote_server_uri)
# Note: on Databricks, the experiment name passed to mlflow_set_experiment must be a
# valid path in the workspace
mlflow.set_experiment("/my-experiment")
with mlflow.start_run():
    mlflow.log_param("a", 1)
    mlflow.log_metric("b", 2)
```



除了 `MLFLOW_TRACKING_URI`环境变量以外，还有一些环境变量可以配置：

* `MLFLOW_TRACKING_USERNAME` 和 `MLFLOW_TRACKING_PASSWORD` 用来配置账户名和密码。
* `MLFLOW_TRACKING_TOKEN` : 使用 HTTP bearer 授权认证。
* `MLFLOW_TRACKING_INSECURE_TLS` 如果设置为 `true` MLflow 不会验证 TLS 连接。即不会验证 `https://`的证书。

### 

### System Tags

你可以使用自定义的 Tag 来标记 Run。由 `mlflow.` 开头的 Tag 是 MLflow 系统内部使用的标签。会被系统自动添加：



| Key                         | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| `mlflow.runName`            | Human readable name that identifies this run.                |
| `mlflow.parentRunId`        | The ID of the parent run, if this is a nested run.           |
| `mlflow.user`               | Identifier of the user who created the run.                  |
| `mlflow.source.type`        | Source type. Possible values: `"NOTEBOOK"`, `"JOB"`, `"PROJECT"`, `"LOCAL"`, and `"UNKNOWN"` |
| `mlflow.source.name`        | Source identifier (e.g., GitHub URL, local Python filename, name of notebook) |
| `mlflow.source.git.commit`  | Commit hash of the executed code, if in a git repository.    |
| `mlflow.source.git.branch`  | Name of the branch of the executed code, if in a git repository. |
| `mlflow.source.git.repoURL` | URL that the executed code was cloned from.                  |
| `mlflow.project.env`        | The runtime context used by the MLflow project. Possible values: `"docker"` and `"conda"`. |
| `mlflow.project.entryPoint` | Name of the project entry point associated with the current run, if any. |
| `mlflow.docker.image.name`  | Name of the Docker image used to execute this run.           |
| `mlflow.docker.image.id`    | ID of the Docker image used to execute this run.             |








