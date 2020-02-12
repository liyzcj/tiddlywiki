# Ray 的解释器机制



## Terminology

后端：ray 的后台，服务器端。

worker： 执行的最小单元，一个 worker 代表一个进程。它是实现并行与可扩展性的基础。

## remote function

远程函数指的是可以将一个函数变为一个远程函数交给后端的 worker 执行。通过在一个 普通的 Python 函数上加上装饰器就能够使得函数变为一个 remote 函数：

```python
# A regular Python function.
def regular_function():
    return 1

# A Ray remote function.
@ray.remote
def remote_function():
    return 1
```

一个 remote function 不能使用普通的方法进行调用，返回的也不是普通的对象：

* remote function 需要使用 remote 方法调用：`remote_function.remote()`。

* remote function 返回时是一个 Object ID，可以理解为是一个后台任务的任务 ID，要获取到真正的结果还需要调用 `ray.get()` 函数。

* 并行执行，后台的任务是并行执行的。

  

### 任务依赖

你可以直接将一个 Object Id 传递给另一个 remote function，这样第二个 remote function 就对第一个任务产生了依赖。

### 嵌套函数

你也可以在一个远程函数中调用另一个远程函数。

```python
@ray.remote
def f():
    return 1

@ray.remote
def g():
    # Call f 4 times and return the resulting object IDs.
    return [f.remote() for _ in range(4)]

@ray.remote
def h():
    # Call f 4 times, block until those 4 tasks finish,
    # retrieve the results, and return the values.
    return ray.get([f.remote() for _ in range(4)])
```

使用 `ray.get()` 获取函数 `g` 的结果，会返回四个 Object ID，而 获取 h 的结果会返回 值。



## Actor

函数是无状态的，它只能接受输出，然后处理并输出信息，而不能持久化数据。而 Actor 完全不同，当我们初始化一个 Actor 的时候，我们在后端创建了一个新的 worker。并且，在一个 Actor 中调用的所有方法都会在这个新的 worker 中执行。这就意味着**单个 Actor 是顺序执行的，多个 Actor 之间可以并行。**

> 一个 Actor 像 Python 的一个对象一样，内部的属性在对象内共享的，所以对象内部的方法必须线性执行。如果并行执行，内部的方法可能会同时修改一个属性，而导致错误。

### 创建一个 Actor

创建 Actor 是通过使用 `@ray.remote` 装饰器装饰一个 Python 类实现的。

```python
@ray.remote
class Example(object):
    def __init__(self, x):
        self.x = x

    def set(self, x):
        self.x = x

    def get(self):
        return self.x
```

像 Python 的 OOP 一样，持久化的信息会被封装在一个 Actor 内部。

而与 Python 不同的有以下几点：

#### 1. 实例化

实例化需要像调用 remote 函数一样，调用一个 remote 方法。

```python
e = Example.remote(1)
```

当实例化一个 Actor 的时候，后端会创建一个新的 worker。

#### 2. 方法调用

所有类中的方法的调用也必须得使用 remote 方法。

```python
e.set.remote(2)
```

#### 3. 返回值

对象方法的返回值也和 remote 函数一样，会在后台创建一个运行任务并**立即返回一个 Object ID**。

```python
ray.get(e.set.remote(2))
```

可以通过 `ray.get()` 方法来获取任务的结果。

### Actor Handles

Actor Handles 意思是在多个任务中调用同一个 Actor。

假设你有一个 Actor 用来记录日志：

```python
@ray.remote
class LoggingActor(object):
    def __init__(self):
        self.logs = defaultdict(lambda: [])
    
    def log(self, index, message):
        self.logs[index].append(message)
    
    def get_logs(self):
        return dict(self.logs)
```

然后你可以定义一个函数来调用这个 Actor：

```python
@ray.remote
def run_experiment(experiment_index, logging_actor):
    for i in range(60):
        time.sleep(1)
        # Push a logging message to the actor.
        logging_actor.log.remote(experiment_index, 'On iteration {}'.format(i))
```

最后，你可以同时调用多次这个函数来实现在多个任务中调用同一个 Actor。

```python
experiment_ids = [run_experiment.remote(i, logging_actor) for i in range(3)]
```

> 注意，虽然多个任务是并行执行的，并且调用的是同一个 Actor，但是在 Actor 的内部还是顺序执行的。意思是，如果多个任务正好同时调用 Actor 的一个方法。那么在这个 Actor 的 worker 中，这些调用会进行 schedule 并且线性执行。

在任务执行的过程中，你也可以去访问 Actor 来获取这个 Actor 的状态。在上面的例子中，如果你在任务执行过程中去获取 Actor 的状态，你会发现 Actor 内记录的 Log 随着三个任务的并行执行三个三个的增加：

```python
logs = ray.get(logging_actor.get_logs.remote())
```

## ray.wait()

`ray.wait()` 用来等待那些执行的慢的任务完成。

```python
ray.wait(object_ids, num_returns=1, timeout=None)
```

参数：

* object_ids：包含多个 Object ID 的列表
* num_returns：返回完成的任务个数
* timeout：超时；如果设置 timeout，且到了 timeout 还没有完成指定个数的任务，就立马返回。否则等待指定个数的任务完成才返回。

> 在 ray 版本 0.6.1 之前，timeout 使用的单位是毫秒，之后使用的是秒。

返回值：

* ready_ids：已经完成的任务的 ID。
* remaining_ids：剩下的任务的 ID。

注意 `ray.wait()` 返回的列表内元素的顺序是按照 object_ids 的顺序来的，而**不是按照执行完成的顺序**。意思是虽然你返回可能是前五个执行完毕的任务，但是这五个结果不是按照任务完成的顺序排序的，而是按照他们在 object_ids 中的顺序排序的。

所以如果你需要一个按照完成顺序排列的列表，那么你可以选择使用 `ray.wait()` 函数每次返回一个完成的任务，然后依次 append 到一个列表中。

## ray.put()

使用 `ray.put()` 函数可以将一个 Python 对象序列化并放到共享内存中。

Object ID 可以以多种方式创建：

* returned by remote function calls
* returned by remote actor method calls
* returned by ray.put

当一个对象传递给 `ray.put()` 的时候，这个对象会使用 Apache Arrow 的格式进行序列化，并且复制进一个共享内存对象存储器中。这时候这个对象可以被这台机器上的其他 workers 通过共享内存访问。当然，如果这个对象需要被其他机器上的 workers 用到，那么这个对象会被自动传递过去。

**当一个对象被传递给一个 remote function 的时候，ray 会自动将它们存储到共享内存中。**

例如，如果下面的函数 `f` 是一个 remote function：

```python
x = np.zeros(1000)
f.remote(x)
```

那么有必要将 x 传递到共享内存中：

```python
x = np.zeros(1000)
x_id = ray.put(x)
f.remote(x_id)
```

`ray.put()` 函数将对象 x 传递到共享内存中，这样如果其他的 workers 也需要访问这个对象，就可以直接从内存中获取。相比之下，如果你将代码写成下面这样：

```python
for i in range(10):
    f.remote(x)
```

那么会有十个 array 被放进共享内存中。这样不仅浪费了空间还浪费了时间。这个代码可以使用一下的方式优化：

```python
x_id = ray.put(x)
for i in range(10):
    f.remote(x_id)
```

> `ray.put()` 可能会比 Python 的 pickle 还要快，这是因为 `ray.put()` 是多线层的。

## GPUs

### 初始化

如果需要访问 GPU 首先需要在初始化 ray 的时候指定使用的 GPU 个数。

```python
ray.init(num_gpus=N)
```

> Ray 不会限制你设置 GPU 的个数，也不会检查你设置的个数是否大于 真正的 GPU 个数。如果你指定的数目多于真实的数目，ray 也不会报错。只有当你尝试去使用不存在的 GPU 时，才会报错。

### Remote function and Actor with GPU

要在 Remote function 或者 Actor 中使用 GPU，需要在装饰器中指定使用 GPU 的个数：

```python
import os

@ray.remote(num_gpus=1)
def use_gpu():
    print("ray.get_gpu_ids(): {}".format(ray.get_gpu_ids()))
    print("CUDA_VISIBLE_DEVICES: {}".format(os.environ["CUDA_VISIBLE_DEVICES"]))
```

```python
@ray.remote(num_gpus=1)
class GPUActor(object):
    def __init__(self):
        return "This actor is allowed to use GPUs {}.".format(ray.get_gpu_ids())
```

在函数或者 Actor 内可以调用 `ray.get_gpu_ids()` 来返回一个包含可用 GPU ID 的列表。通常不需要通过这个 函数获取可用的 GPU ID，因为 ray 会自动设置 `CUDA_VISIBLE_DEVICES` 环境变量。

注意上面的函数没有真正的使用 GPU，ray 只是将 可用的 GPU 分配给执行这个函数的 worker。真正的使用 GPU 的是函数内的一些包，例如 Tensorflow：

```python
@ray.remote(num_gpus=1)
def use_gpu():
    # Create a TensorFlow session. TensorFlow will restrict itself to use the
    # GPUs specified by the CUDA_VISIBLE_DEVICES environment variable.
    tf.Session()
```

而对于 Actor，当一个 Actor 创建时，Ray 会为 Actor 的整个生命周期准备可用的 GPU。如果没有足够的 GPU 资源，则 Actor 不会被创建。

### Fractional GPUs

GPU 也可以使用小数点指定，代表着GPU 显存的限制：

```python
import ray
import time

ray.init(num_cpus=4, num_gpus=1)

@ray.remote(num_gpus=0.25)
def f():
    time.sleep(1)

# The four tasks created here can execute concurrently.
ray.get([f.remote() for _ in range(4)])
```

### worker 不会自动释放 GPU 资源

现在，worker 可能不会在任务完成以后释放 GPU 资源。这样再次运行时可能会产生问题。可以通过设置 `max_calls=1` 来确保 worker 释放 GPU 资源：

```python
import tensorflow as tf

@ray.remote(num_gpus=1, max_calls=1)
def leak_gpus():
    # This task will allocate memory on the GPU and then never release it, so
    # we include the max_calls argument to kill the worker and release the
    # resources.
    sess = tf.Session()
```



## Kubernetes

Ray 是可以部署在 K8S 上的。

### Build-in Autoscaler

最简单的办法是使用 Ray 内置的 autoscaler。首先需要准备好 kubectl 并且连接到集群，然后就可以使用 autoscaler 的[配置文件](https://github.com/ray-project/ray/blob/master/python/ray/autoscaler/kubernetes/example-full.yaml)来部署 Ray了。

该配置文件会创建一个单个 Pod 作为 head 的小集群。并且会 autoscale 最大两个 worker node pods，每一个 pod 需要 1 CPU 和 0.5 GiB 内存。

使用一下命令来测试是否安装成功：

```python
# Create or update the cluster. When the command finishes, it will print
# out the command that can be used to get a remote shell into the head node.
$ ray up ray/python/ray/autoscaler/kubernetes/example-full.yaml

# List the pods running in the cluster. You shoud only see one head node
# until you start running an application, at which point worker nodes
# should be started. Don't forget to include the Ray namespace in your
# 'kubectl' commands ('ray' by default).
$ kubectl -n ray get pods

# Get a remote screen on the head node.
$ ray attach ray/python/ray/autoscaler/kubernetes/example-full.yaml
$ # Try running a Ray program with 'ray.init(address="auto")'.

# Tear down the cluster
$ ray down ray/python/ray/autoscaler/kubernetes/example-full.yaml
```



### 手动创建

手动创建的前提肯定也是已经安装好了 kubectl 并且连接到了集群。这里使用 Ray 代码仓库内的配置文件作为示例。当进行应用的部署的时候，你可能会使用自己的镜像并且配置多个个 Worker 或者使用 Kubernetes 的  [Kubernetes Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)。

#### 创建命名空间

首先需要创建一个命名空间。下面的命令会创建一个新的命名空间。

```bash
$ kubectl create -f ray/doc/kubernetes/ray-namespace.yaml
```

你也可以自己指定一个名字作为命名空间。

#### 启动一个 Ray 集群

一个 Ray 集群包含一个 head 节点和多个 worker 节点。在示例的 kubernetes 配置文件中，集群的配置如下：

* 一个 `ray-head` Kubernetes 服务，使得 worker 节点可以连接到 node 节点。
* 一个 `ray-head` Kubernetes Deployment 提供一个 pod 作为 head 节点。
* 一个 `ray-worker` Kubernetes Deployment 提供多个 pod 作为 worker 节点。

由于 head 和 worker 节点使用的是 Kubernetes 的 Deployment。所以这些节点如果崩溃了会自动重启并保持一个足够的数目。

* 如果 worker 节点崩溃，那么一个代替的 pod 会启动并且加入集群。
* 如果 head 节点崩溃，它会被重新启动。这会启动一个新的 Ray 集群。连接到 旧集群的 Worker 节点会进行重启然后连接到新的集群。

使用一下命令来部署一个 Ray 集群：

```bash
$ kubectl apply -f ray/doc/kubernetes/ray-cluster.yaml
```

验证 Pod 是否正常启动：

```bash
NAME                          READY   STATUS    RESTARTS   AGE
ray-head-5455bb66c9-6bxvz     1/1     Running   0          10s
ray-worker-5c49b7cc57-c6xs8   1/1     Running   0          5s
ray-worker-5c49b7cc57-d9m86   1/1     Running   0          5s
ray-worker-5c49b7cc57-kzk4s   1/1     Running   0     
```

如果需要增加 worker replicas ，只需要在配置文件中修改并且重新 apply 配置就行了。

### 运行 Ray 程序

当在 Kubernetes 上成功部署 Ray 集群以后，接下来就是该研究如何使用它了。一共有三种方法了来使用 Kubernetes 上的 Ray 集群。

1. 使用 `kubectl exec` 来运行一个 Python脚本。
2. 使用 `kubectl exec -it bash` 来启动一个交互 shell 使用。
3. 提交一个 [Kubernetes Job](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/)。

#### 使用  kubectl exec

使用一下命令来测试 节点之间对象的传递：

```bash
# Copy the test script onto the head node.
$ kubectl -n ray cp ray/doc/kubernetes/example.py ray-head-5455bb66c9-7l6xj:/example.py

# Run the example program on the head node.
$ kubectl -n ray exec ray-head-5455bb66c9-7l6xj -- python example.py
# You should see repeated output for 10 iterations and then 'Success!'
```

#### 使用 shell 运行程序

远程连接到其中一个 pod 的 remote shell 上来运行程序也可以：

```bash
# Copy the test script onto the head node.
$ kubectl -n ray cp ray/doc/kubernetes/example.py ray-head-5455bb66c9-7l6xj:/example.py

# Get a remote shell to the head node.
$ kubectl -n ray exec -it ray-head-5455bb66c9-7l6xj -- bash

# Run the example program on the head node.
root@ray-head-6f566446c-5rdmb:/# python example.py
# You should see repeated output for 10 iterations and then 'Success!'
```

也可以启动一个 Ipython ：

```bash
# From your local machine.
$ kubectl -n ray exec -it ray-head-5455bb66c9-7l6xj -- ipython

# From a remote shell on the head node.
$ kubectl -n ray exec -it ray-head-5455bb66c9-7l6xj -- bash
root@ray-head-6f566446c-5rdmb:/# ipython
```

#### 提交一个 Job

最后是提交一个 Kubernetes Job。这个 Job 会启动一个新的 Pod 来运行 Ray 的程序，然后在程序结束后推出。使用 kubectl 提交一个 Job：

```bash
$ kubectl create -f ray/doc/kubernetes/ray-job.yaml
job.batch/ray-test-job-kw5gn created
```

最后如果要清理环境可以使用 delete ：

```bash
# Delete the finished Job.
$ kubectl -n ray delete job ray-test-job-kw5gn
```

### 删除 Ray 集群

直接使用 kubectl 可以方便的删除集群：

```bash
kubectl delete -f ray/doc/kubernetes/ray-cluster.yaml
```



## 手动部署集群

在主节点运行如下命令：

```bash
ray start --head --redis-port=6379
```

然后在其他所有节点运行命令连接主节点：

```bash
ray start --address=<address>
```

> 启动时可以使用参数来配置节点资源，详情参考 [Configuration](https://ray.readthedocs.io/en/latest/configure.html)

### 停止节点

```bash
ray stop
```



## 运行集群任务



登陆任意一个节点，启动 Ipython ，并连接主节点：

```python
import ray
ray.init(address="<address>")
```

> address 为主节点 IP， 端口号默认 6379

使用如下代码检测集群节点：

```python
import time

@ray.remote
def f():
    time.sleep(0.01)
    return ray.services.get_node_ip_address()

# Get a list of the IP addresses of the nodes that have joined the cluster.
set(ray.get([f.remote() for _ in range(1000)]))
```






