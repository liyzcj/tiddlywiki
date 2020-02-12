# Ray - Under the hood



Ray 作为一个新的分布式计算系统，在性能和灵活性上有着非常大的优势。



## 整体架构



<img src="https://s2.ax1x.com/2019/11/07/MFob0H.png" alt="MFob0H.png" style="zoom: 25%;" />



系统层包含三个主要的组件：

* 一个 Global control store
* 一个分布式 scheduler 
* 一个分布式 object store。

其中，每个执行节点可以包含一个或多个角色执行任务：

* Driver ：用来执行用户程序，当你你在某个节点执行 `ray.init() `的时候就会启动一个 Driver。

* Worker ： 用来进行无状态任务的执行（Remote Function），可以被 Driver 或其他的 Worker 调用。Worker 是由系统层自动创建并且分配任务的。当注册了一个 RemoteFunction 的时候，这个函数会自动分发给所有的 Worker。一个 Worker 只能串行的执行任务，并且是无状态的。
* Actor： 用来执行一个有状态的进程。与 worker 不同，actor 需要被 driver 或者 其他 worker 来实例化。和worker 相同的是，一个 Actor 的执行也是串行的。



当在集群上部署 Ray 的时候，会启动以下进程：

* 在每台机器上启动一些 worker 进程
* 每台机器上启动一个 object store
* 每台机器上启动一个 raylet
* 在 head 节点启动多个 servers

这时候你就可以在其中一个节点上运行 `ray.init()` 连接 head 节点上的 redis 来发布任务。

### 任务处理流程



<img src="https://s2.ax1x.com/2019/11/07/MF77od.png" alt="MF77od.png" style="zoom: 25%;" />

当一个 Driver 上传一个任务以后，首先会通过 Local Scheduler 分发给本地的 Worker，当本地的 Worker 无法满足需求时（例如提交了一百个任务，而本地的 Worker 只有 10 个）那么会通过 Global Scheduler 将任务分发给其他节点的 Worker。



### 具体 RemoteFunction流程

<img src="https://s2.ax1x.com/2019/11/07/MFH5pq.png" alt="MFH5pq.png" style="zoom:25%;" />

> 在 Ray 的论文中，描述的是当生命一个 Remote 函数时，这个函数就会被注册到GCS 的 Function Table 中。而在当前版本的实现中是当这个函数被调用的时候才会将函数注册到 GCS 中。

上图通过一个简单的示例描述了 Ray 工作的整个流程。我们从 Driver 的角度看，这个示例是 Driver 声明了一个 RemoteFunction `add()` ，并且调用了这个 RemoteFunction，将参数 `a,b` 传递给了这个函数，并得到一个返回值 `c`。

> 注意，Driver 所在的节点是 `N1`，而 Worker 所在的节点在 `N2`。并且，变量 `a` 对象在节点 `N1` 中，变量 `b`对象在节点 `N2` 的 object store 中。
>
> 你可能会好奇为什么节点 `N1` 的 Driver 中的 b，为什么会存储在 节点 `N2` 中，你可以假设对象 `b` 是在另一个在 `N2`执行的任务生成的对象，而 Driver 并没有使用 `ray.get()`将具体的对象拉取到当前节点。

在进行上面 RemoteFunction 的调用的时候，Ray 会执行如下的步骤：

1. 使用 [CloudPickle](https://github.com/cloudpipe/cloudpickle) 序列化函数对象（[CloudPickle](https://github.com/cloudpipe/cloudpickle)会将函数以及函数的递归调用同时序列化到一个字符串中）
2. 将序列化以后的函数对象注册到 Redis中，也就是上图的 GCS 中的 Function Table， 是使用 https://redis.io/ 存储的。
3. GCS 会将这个函数分配给所有当前可用的 Worker中。
4. 如果参数 `a` 不在 object store 中，将参数使用 https://arrow.apache.org/ 序列化，并上传到 https://arrow.apache.org/docs/python/plasma.html，也就是本地 Object Store 中。
5. 将任务（包含 参数对象的 Id，以及函数的 FunctionID ）提交到系统层，也就是 Local Scheduler。
6. Local Scheduler 会优先将任务分发给本地的 Worker 如果本地的 Worker 满足不了任务需求，Local Scheduler 会将任务 Forward 到 Global Scheduler。
7. Global Scheduler 接到任务以后，首先在 Global Object Table 中检查查找参数 `a,b` 以及它们的节点位置。（Global Object Table 中保存的是 Object Id 以及对应的节点位置，并不会保存真正的对象）
8. Global Scheduler 决定将任务分配至 N2 节点的一个 Worker。（由于参数 `b` 在节点 N2 上）
9. N2 节点的 Local scheduler 接到 Global Scheduler 分配的任务，并检查本地的 object store 是否包含任务需要的参数 `a,b`
10. N2 节点的 Local Scheduler 发现参数 `a`并不在本地的 Object store 中，于是访问 Global Object Table 去查找参数  `a` 的位置，发现参数 `a` 保存在 N1 节点的 Object store 中。
11. N2 节点的 Local Scheduler 从 N1 节点的 Object store 中拷贝参数 `a` 到本地的 object store 中。
12. 在准备了所有需要的参数以后，N2 的 Local Scheduler 在一个本地的 Woker 上调用函数 `add()`, Worker 通过 shared memory 访问到参数 `a, b` 并执行任务

上面是在 Driver 端调用remote 方法之后的整个过程，在执行完调用 remote方法以后，返回给 Driver 的是一个 Object ID。这个 Object ID 指的是 返回值 `c` 的 Object ID。Driver 端这时候可能会使用 `ray.get()`函数去获取真正的返回值对象 `c`。

> 注意在Driver 端调用 `remote()` 方法之后会立即返回一个返回值 `c`的 Object ID，但是这时候 Worker 的任务才刚刚开始，还没有将真正的返回值 `c` 计算出来。

在执行函数 `rag.get()` 之后，Ray 会执行如下步骤：

1. 首先 Driver 会将这个请求提交给本地（即节点 N1）的 Local Scheduler
2. 节点 N1 的 Local Scheduler 会首先在本地的 Object store 中去查找 Object `c` 。
3. Local Object store 首先查找 Object `c`是否在本地，发现没有，然后 Local Object store 会去 GCS 的 Object Table 中查找 Object `c` 的位置。
4. 由于 Worker 现在还没有执行完任务，所以 GCS 的 Object Table 中也没有 `c` 这条 entry。N1 的local Object store 发现没有 `c` 以后，会在GCS Object table 中注册一个回调函数，当 `c` GCS Object table 中注册时会触发这个回调函数。（`ray.get()` 现在会挂起等待回调函数触发）
5. 这时候 Worker 这边的任务执行完毕，并将返回值存储在节点 N2 的 Local Object store 中。N2 节点的 Local Object store 也会将 `c` 注册到 GCS 的 Object table 中。同时触发了上面的回调函数，结果反馈给 N1 的 Local Object store。
6. 这时候 N1 的 Local Object store 获取到了 `c`   的位置在节点 N2 中，并会去 N2 的 Object store 中拷贝真正的 Object `c`  到本地 Object store。
7. 最后 Object `c` 被返回给 Driver， `ray.get()` 函数到此结束。



> 上面的过程用到了许多 RPC 调用，但是实际执行的时候 Local Scheduler 会优先把 任务分配给本地的 Worker，会大大减少 RPC 调用的次数。





## Apache Arrow vs Cloudpickle

> [Fast Python Serialization with Ray and Apache Arrow](https://arrow.apache.org/blog/2017/10/15/fast-python-serialization-with-ray-and-arrow/)

为什么 Ray 在保存参数等 Object 的时候使用 Apache Arrow 进行序列化，而在保存任务 RemoteFunction的时候使用 Cloudpickle 呢？

Apache Arrow 和 Cloudpickle 的功能目标类似，都是为了实现序列化程序的 Object。例如当我们在 Python 中创建了一个 Object，这个 Object 很可能包含其他的 Objects，并且在内存中，他们都在不同的位置。当我们将这个 Object 序列化时，应该将所有相关的 Object 全部都序列化，这样才能在反序列化时保持内存中保存的信息与序列化之前的一致。

**序列化与反序列化是并行程序与分布式计算的瓶颈，特别是在机器学习中，大量的参数会被序列化与反序列化。**

### 为何使用 Arrow ？

Ray 的序列化方面需求：

1. 大型数据（例如 Numpy Array 或者 Pandas DataFrame）的高效序列化与反序列化。
2. 速度应该媲美 pickle 序列化普通的 Python 类型
3. 支持 Shared Memory，这样在不同 Worker 访问大型数据时不需要进行拷贝。
4. 反序列化应该非常迅速，并且可以选择进行部分反序列化
5. 序列化可以做到 **语言无关**。例如在 Python 中序列化的 Numpy Array 在 Java 中也可以 Load。



最简单的 序列化 Python 对象的方式应该是 Pickle，作为 Pickle 的延伸，[CloudPickle](https://github.com/cloudpipe/cloudpickle) 能够递归的 序列化 Python 对象，从而更加的常用。但是，[CloudPickle](https://github.com/cloudpipe/cloudpickle) 仅仅能够满足第二个要求。对于大型数据，共享内存，语言无关等都无能为力。另一种序列化的方式是 JSON，然而 JSON 只能满足第五条。



为了满足上面的五点需求，Ray 选择使用 Apache Arrow 作为参数等大型数据的 序列化与反序列化功能。并且 Ray 与 Arrow 团队合作将大部分的 Python 类型映射到 Arrow 的对象类型，在保证高效存储的前提下，实现了语言无关等属性：

* 语言无关
* 大型数据的偏移序列化，使得对象可以被部分反序列化
* 支持共享内存，可以被多个进程访问而不需要拷贝。
* 对于无法进行序列化的类型会自动转换为 Pickle

### 一些其他变种

[**Protocol Buffers**](https://developers.google.com/protocol-buffers/) 也可以做到序列化，但是 Protocol buffer 对大型数字的序列化并不合适，并且无法做到 1，3或4.

[**Flatbuffers**](https://google.github.io/flatbuffers/) 也是 Google 的序列化项目，它理论上是可以做到上面的所有要求。但是它需要重新实现许多 Arrow 已经实现的功能。并且没有 Arrow 对 columns 数据支持的那么好。（其实 Arrow 也在部分功能中使用了 [**Flatbuffers**](https://google.github.io/flatbuffers/) ）

### Arrow 的数据表达

Arrow 有一套自己的数据表达方式，而它正是通过这个来实现语言无关的功能的。Arrow 的数据包含两个部分：**schema** 和 **data blob**。 **data blob** 只是简单的将内存中所有与这个 Object 相关的数据拼到一起。而 **schema**  代表了这些数据的类型，嵌套结构等信息。

**技术细节**：Python 的序列数据（字典，列表，元组，set 等） 在 Arrow 中由  [UnionArrays](http://arrow.apache.org/docs/memory_layout.html#dense-union-type)  表达， [UnionArrays](http://arrow.apache.org/docs/memory_layout.html#dense-union-type)  内又包含了其他的数据类型（int float bool tensor等等）。而嵌套的序列数据由  [ListArrays](http://arrow.apache.org/docs/memory_layout.html#list-type) 表示。所有的 Tensor 都被拼接到序列化的对象之后，  [UnionArrays](http://arrow.apache.org/docs/memory_layout.html#dense-union-type)包含了指向这些 tensors 的指针。

> Arrow tensor 是 Numpy Array。

例如如下的 Python 数据：

```python
[(1, 2), 'hello', 3, 4, np.array([5.0, 6.0])]
```

这段数据的结构在 Arrow 中如下表示：

```python
UnionArray(type_ids=[tuple, string, int, int, ndarray],
           tuples=ListArray(offsets=[0, 2],
                            UnionArray(type_ids=[int, int],
                                       ints=[1, 2])),
           strings=['hello'],
           ints=[3, 4],
           ndarrays=[<offset of numpy array>])
```

Arrow 使用 [**Flatbuffers**](https://google.github.io/flatbuffers/) 来编码序列化之后的 Schema。使用这些 Schema 我们就能计算具体的数据在  **data blob**中的偏移量（Pickle 做不到这一点），这样就可以实现部分的反序列化与语言无关。

这些数据在内存中真正的位置如下图所示：

<img src="https://arrow.apache.org/assets/fast_python_serialization_with_ray_and_arrow/python_object.png" alt="python_object" style="zoom: 67%;" />

而对应的 Arrow 序列化 schema 如下图所示：

<img src="https://arrow.apache.org/assets/fast_python_serialization_with_ray_and_arrow/arrow_object.png" alt="arrow_object" style="zoom: 67%;" />



## Plasma vs Redis



> [Plasma In-Memory Object Store](https://arrow.apache.org/blog/2017/08/08/plasma-in-memory-object-store/)

Plasma 本来就是由 Ray 开发的项目，现在已经归入 Apache Arrow 项目之下。

**Plasma 用来在共享内存中保存不可修改的数据对象，以方便并高效的被多个客户进程所访问。**

所以，Plasma 就是为了使 Apache Arrow 实现之前所说的 共享内存的功能的。正是由之前所说，**序列化与反序列化是并行程序与分布式计算的瓶颈**。对于大型数据来说，如果每个进程都拷贝一份在内存中的话，对于内存以及 IO 都是极大的浪费。

使用 Plasma 加 Arrow ，就可以将序列化的数据保存在共享内存中，而需要的进程就可以直接去共享内存读取所需要的内容。



### Plasma API 

最常用的就是 Plasma 提供的三个简单的 API：

* **Object IDs:** 每个 Object 在Plasma 中都有一个 ID。
* **Creating an object:**  将一个 Object 保存到 Plasma。总共包含两步骤：1. Object store 创建一个Object 并且为它分配一个 buffer 2. 客户端这时候可以将数据写入 buffer 中，并且在写入完毕后锁住 Buffer。
* **Getting an object:**根据 Object ID 来读取对应的 Object。

> 如果去 Get 一个还没有被锁住的 Object 时，函数会挂起 直到Buffer 被锁住。

Plasma 运行在一个独立的进程中。并且 Plasma 的事件循环是基于 Redis 的事件循环库编写的。客户端通过[Google Flatbuffers](https://google.github.io/flatbuffers/) 与 Plasma 通信。



### Redis

为什么使用 Redis 来保存函数等元数据，由于函数以及元数据都是小数据，并且不需要共享访问，所以使用 Redis 来保存完全足够，也能有更好的稳定性。

使用 CloudPickle 来进行 RemoteFunction 序列化的原因也是因为 Function都是小数据，并且Pickle 在序列化 Python general Object type 的时候可以做到更好。

**所以 Ray 使用 Redis 作为 Head 节点的元数据库，保存了 Remote 函数等。而 Plasma 作为分布式 Object Store，保存大型的共享参数等。**



## 内存管理

Ray 将内存的使用分为以下这些方面：

![memory](https://ray.readthedocs.io/en/latest/_images/memory.svg)

### Ray 系统内存

* **Redis**：Redis 用来保存任务的血脉和一些 object 的元数据。当 Redis 内存被占满的时候，会开始删除任务血脉，这会导致一些失败的任务不能重新创建。（只存在 head 节点）
* **Raylet**：每个节点上的 C++ 进程 Raylet 使用的内存。这部分内存无法被控制，但通常很小。

### 任务内存

* **Worker heap**：执行的任务或应用占用的内存。
* **Object store memory**：当你的应用通过 `ray.put()` 上传 Object 或者在 remote function 返回结果时会使用  Object store memory。每个节点上都运行着一个 Object store server。
* **Object store shared memory**：当你的应用通过 `ray.get()` 获取 Object 的时候使用的内存。注意如果节点上已经有了相应的 Object，那么不会重新分配内存。这一点使得大型的 Object 可以在多个任务和 Actors 之间进行共享。



> 默认情况下，Ray 会使用 `min(30% of node memory, 10GiB)` 作为 Redis 的内存。使用 `min(10% of node memory, 20GiB)` 作为 Object store 的内存。而剩下的一半内存留给 Worker heap 使用。
>
> 对于以下情况，Ray 不会自动干涉相应的内存：
>
> * Worker Heap 也就是任务或者应用的内存超出了可用的范围。
> * 当某一个Task 或者 Actor 占用大量内存而导致其他任务无法进行。
>
> 面对上面这些情况可以手动对单个任务或者 Actor 进行内存限制。



## Ray Remote Function



### 装饰

当使用 `@ray.remote` 装饰器装饰一个函数的时候，Ray 实例化了一个 RemoteFunction 对象。这个对象主要包含以下属性：

```python
def __init__(self, function, num_cpus, num_gpus, memory,
             object_store_memory, resources, num_return_vals, max_calls):
    self._function = function  # Python Function 对象
    # 一个 FunctionDescriptor 对象，用来保存根据函数内容 hash 之后的字符串。
    # FunctionDescriptor 主要有两个作用，一个是根据 hash_id 确定函数内容是否改变。
    # 第二个作用是作为 Function 在 Redis 中的 FunctionID。
    self._function_descriptor = FunctionDescriptor.from_function(function)
    self._function_name = ( # Function 的名字
        self._function.__module__ + "." + self._function.__name__)
    #############这部分主要是限制这个 RemoteFunction 使用的资源。
    self._num_cpus = (DEFAULT_REMOTE_FUNCTION_CPUS
                      if num_cpus is None else num_cpus)
    self._num_gpus = num_gpus
    self._memory = memory
    if object_store_memory is not None:
        raise NotImplementedError(
            "setting object_store_memory is not implemented for tasks")
    self._object_store_memory = None
    self._resources = resources
    ###############
    # 确定这个 Function 的返回值的个数
    self._num_return_vals = (DEFAULT_REMOTE_FUNCTION_NUM_RETURN_VALS if
                             num_return_vals is None else num_return_vals)
    # 确定 Function 可以被使用的次数。
    # 这个变量可以用来控制释放 GPU 资源，如果这个 Function内使用了 Gpu 资源，如果不限制
    # Call 的次数，这个任务执行完毕也不会释放 GPU 资源。
    self._max_calls = (DEFAULT_REMOTE_FUNCTION_MAX_CALLS
                       if max_calls is None else max_calls)
    # 是否有其他的 Decorator
    self._decorator = getattr(function, "__ray_invocation_decorator__",
                              None)
		# Function 的签名。
    ray.signature.check_signature_supported(self._function)
    self._function_signature = ray.signature.extract_signature(
        self._function)
    # 确认 session 可以优化以避免多次 export 函数对象。
    self._last_export_session_and_job = None
    # Override task.remote's signature and docstring
  	# remote 方法
    @wraps(function)
    def _remote_proxy(*args, **kwargs):
        return self._remote(args=args, kwargs=kwargs)

    self.remote = _remote_prox
```

当一个函数装饰成 RemoteFunction 时，这个函数就只能使用 remote 方法来提交一个 Task。而不能进行本地调用。

> Note: RemoteFunction 中的 `remote()` 方法是使用 `functools.wraps` 进行的装饰，这个装饰器将 Python 原函数的签名与 docstring 等自省特性传递给了 `remote()`方法。

### 调用

当使用 `RemoteFunction.remote()` 函数调用时（其实是在分配任务），会使用传递进来的参数执行 RemoteFunction 的 `_remote()` 方法。

```python
def _remote(self,
            args=None,
            kwargs=None,
            num_return_vals=None,
            num_cpus=None,
            num_gpus=None,
            memory=None,
            object_store_memory=None,
            resources=None):
    """Submit the remote function for execution."""
    worker = ray.worker.get_global_worker()
    worker.check_connected() # 准备 worker，确认 woeker 状态
		# 确认 worker 的session 中是否有这个函数，没有的话将该 RemoteFunction注册到 Redis中。
    # 注册信息会包括 FunctionDescriptor 和 cloudpickle pickle 的函数
    if self._last_export_session_and_job != worker.current_session_and_job:
        # If this function was not exported in this session and job,
        # we need to export this function again, because current GCS
        # doesn't have it.
        self._last_export_session_and_job = worker.current_session_and_job
        worker.function_actor_manager.export(self)
		# 确认参数与返回值
    kwargs = {} if kwargs is None else kwargs
    args = [] if args is None else args

    if num_return_vals is None:
        num_return_vals = self._num_return_vals
		# 确认资源
    resources = ray.utils.resources_from_resource_arguments(
        self._num_cpus, self._num_gpus, self._memory,
        self._object_store_memory, self._resources, num_cpus, num_gpus,
        memory, object_store_memory, resources)
		# 调用函数
    def invocation(args, kwargs):
        args = ray.signature.extend_args(self._function_signature, args,
                                         kwargs)

        if worker.mode == ray.worker.LOCAL_MODE:
            object_ids = worker.local_mode_manager.execute(
                self._function, self._function_descriptor, args,
                num_return_vals)
        else:
          # 将FunctionDescriptor作为任务提交，注意这时候对应的 cloudpickle 函数已经在 Redis 中了。
          # 对应的 Args 的对象会被 Apache arrow 序列化并推到 Object store。
            object_ids = worker.core_worker.submit_task( 
                self._function_descriptor.get_function_descriptor_list(),
                args, num_return_vals, resources)

        if len(object_ids) == 1:
            return object_ids[0]
        elif len(object_ids) > 1:
            return object_ids

    if self._decorator is not None:
        invocation = self._decorator(invocation)

    return invocation(args, kwargs)

```



## Reference

* [Fast Python Serialization with Ray and Apache Arrow](https://arrow.apache.org/blog/2017/10/15/fast-python-serialization-with-ray-and-arrow/)
* [Plasma In-Memory Object Store](https://arrow.apache.org/blog/2017/08/08/plasma-in-memory-object-store/)
* [Ray: A Distributed Framework for Emerging AI Applications](https://arxiv.org/abs/1712.05889) 


