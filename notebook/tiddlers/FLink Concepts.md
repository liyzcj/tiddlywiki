# Flink	

## Concepts

### Programming Model



#### 抽象层级

![levels_of_abstraction](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/levels_of_abstraction.svg)



* 最底层的抽象提供了 **stateful streaming**。它通过[Process Function](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/stream/operators/process_function.html) 嵌入到 [DataStream API](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/datastream_api.html) 中。 可以是实现 Stream 的灵活控制与高级的实现，但是一般用不到。

* 现实中大多数应用都可以通过 **Core API** 实现。Core API 包括 **DataStream API 和 Dataset API**。他们提供了数据处理的通用组件，例如 Join Aggregation Window 等。这些 API 中处理的数据类型对应不同编程语言的类实现。

  > 底层的 Process Function 与 DataStream API 相结合，使得它可以执行一些底层的操作。Dataset API 还额外提供了一些 Primitives，例如 **loops/iterations**。

* **Table API** 是关于表数据的声明式 DSL，可以动态的修改表数据。主要是根据关系模型，提供一些 Join Aggregation Group-by 等操作，与关系数据库中的表类似。这些操作中也可以使用用户自定义函数。并且这些 API 会**经过优化器优化之后再执行。**

  > DataStream 和 Dataset API 也可以与 Table API 结合使用。

* 最高层级的抽象就是 **SQL** 。**SQL** 类似于 Table API，但是用 SQL 语句表示。SQL 抽象直接与 Table API 交互，并且 SQL 语句可以应用于 Table API 创建出的表。

#### Programs and Dataflows

构建 Flink 程序的基础模块是 **streams** 和 **transformations**。概念上，**streams 是一个永远不结束的数据流，transformation 是以单个或多个 stream 为输入，并且产生一个或多个 stream 的操作。**

在执行时，Flink 程序会 Map 到 **streaming dataflows**，它由 **stream** 和 transformation **operators** 组成。每个 dataflow 由一个或多个 **sources** 开始，并且结束于一个或多个 **sinks**，类似于一个 DAG。尽管可以通过  iteration 等特殊操作来构建环，但简单起见，暂时不讨论这部分。

![program_dataflow](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/program_dataflow.svg)

程序中，transformations 和 operators 通常是一对一的关系，但是也有特殊的时候，一个 transformation 可以由多个 operators 组成。

> * Sources 与 sinks 在 [streaming connectors](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/connectors/index.html) 和 [batch connectors](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/batch/connectors.html) 文档中描述。
> * Transformations 和 documented 在 [DataStream operators](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/stream/operators/index.html) 和 [DataSet transformations](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/batch/dataset_transformations.html) 文档中描述。

#### Parallel Dataflows

Flink 程序本质上就是并行和分布式的。在执行过程中，一个 stream 由一个或多个 **stream partitions** ，每个 operator 有一个或多个 **operator subtasks**。这些 subtasks 是独立的，每个由单独的线程执行，所以可以在不同的机器或容器中执行。

一个 operator 中 subtasks 的数量就是 **parallelism** 。一个 stream 的 **parallelism** 总是由它的 producing operator 决定。**同一个程序的不同 operator 可以拥有不通级别的 parallelism。**

![parallel_dataflow](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/parallel_dataflow.svg)

Streams 在两个 Operators 之间可以以两种方式传输：

* **One-to-one** streams：单对单并行传输，并不修改 **partitions**。

* **Redistributing** streams：会修改流的 partitions。每个 subtask 会**根据命令**将数据发送至不同的 subtasks，例如 `keyBy()` (根据 key re-partation）, `broadcast()`, `rebalance()`（随机 re-partition）。这 re-partition 的过程中，元素仅仅在一对 subtasks 中是有序的。

  > 例如在上面的例子中，每个 key 对应的元素是有序的。
  >
  > * 并行执行文档：[parallel execution](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/parallel.html)

#### Windows

**聚合操作** Aggregating 在 Stream 和 batch 中是不同的。

> 例如，无法对一个流进行 count，因为它是无穷的。

所以，在 Stream 中，**聚合操作是在一个窗口范围内的**。例如根据过去**五分钟**数据进行聚合，根据过去的**一百条**数据进行聚合。

Windows 可以是**时间驱动**（过去五分钟），或者**数据驱动**（过去一百条）的。并且 Windows 可以分为多种类型，例如 **tumbling windows（没有 overlap）**、**sliding windows（有 overlap）**、**session windows（有时间间隔）** 等。

![windows](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/windows.svg)

> Windows 相关文档：[window docs](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/stream/operators/windows.html)

#### Time

当在流式程序中引用时间时（例如定义窗口操作）可以采用**不同的时间概念。**

* **Event Time**：一个 Event 创建时的时间。通常是一个时间戳，由终端产生。Flink 通过 [timestamp assigners](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/event_timestamps_watermarks.html) 访问时间戳。
* **Ingestion Time**：一个 Event 通过 Source Opeartor 进入 Flink 流的时间。
* **Processing Time**：每个 Opeartor 进行时间操作时的本地时间。

![event_ingestion_processing_time](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/event_ingestion_processing_time.svg)

> 文档：[event time docs](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/event_time.html)

#### Stateful Operations

尽管许多 Operation 都是每次只看一个 Event，但是也有一些 Operation 在多个 Events 之间记录状态，称为 **Stateful**。

这些状态可以理解为由一个嵌入的 Key-Value store 维护。状态和对应的 Stream 会严格的被 Stateful Operator 一起读取。因此，**仅仅是 Keyed Stream 才能访问状态，并且是在 `keyBy()` 函数之后，并且严格限制在与当前 Event  key 相关的值。**将 key 与 State 对齐可以保证所有更新都是本地 Operation，以保证一致性和避免 transaction overhead。这样还允许 Flink 透明的重新分配状态与 Re-partition 操作。

![state_partitioning](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/state_partitioning.svg)



> 文档：[state](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/stream/state/index.html)

#### Checkpoints for Fault Tolerance

Flink 通过 **stream replay** 与 **checkpointing** 实现容错。

一个 Checkpoint 与每个 **input streams 中特定的点**和对应的 **Operators 的状态**有关。

一个 Stream DataFlow 可以通过一个 Checkpoint 恢复，并且通过**加载 Operator 状态**和**重放 events** 来保证一致性。

Checkpint 的保存间隔是根据容错开销以及恢复的时间来决定的。

> * 容错机制：[fault tolerance internals](https://ci.apache.org/projects/flink/flink-docs-release-1.10/internals/stream_checkpointing.html)
> * Checkpoints 文档：[checkpointing API docs](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/stream/state/checkpointing.html)

#### Batch on Streaming

Flink 将批处理作为一种特殊的流处理实现，这种流是有限的。一个 Dataset 在内部也是作为一个数据流。上面介绍到的概念在 Batch 模式下仍然类似，除了：

* [Batch 程序的容错](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/batch/fault_tolerance.html)不通过 Checkpoint 实现，而是通过重放整个流。这虽然增加了 Recover 的开销，但是减少了处理过程中保存 Checkpoint 的开销。

* Dataset API 中的 Stateful Operator 采用了简单的内存结构，而不是 Key-Value 索引。

* Dataset API 还提供了特殊的**同步迭代**，这仅仅在有限流上才能实现。

  >  [iteration docs](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/batch/iterations.html)

## 分布式运行环境

### Tasks and Operator Chains

在分布式情况先，Flink **将 Operator subtasks 链接到一起**。**每个 task 由一个线程执行**。将 Operators 链接到一起作为 tasks 是非常有用的优化操作：减少了线程之间的 handover 和 buffering 开销，增加吞吐量，减少延迟。

> 链接操作可以进行配置：[chaining docs](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/stream/operators/#task-chaining-and-resource-groups)

![tasks_chains](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/tasks_chains.svg)

### Job Managers, Task Managers, Clients

一个 Flink 运行环境包含两种进程：

* **JobManagers**（也称为 masters）来协调分布式执行操作。包括编排任务，协调 Checkpoints，协调恢复与容错等。

  > 至少有一个 **JobManager**。一个高可用的方案通常包含多个 JobManagers，其中一个 **leader**，其他的为 **standby**。

* **TaskManagers** （也称为 workers）用来执行 tasks，或者说 subtasks。还用来缓存与交换 data streams 等。

  > 至少有一个 TaskManager 执行任务。

两个进程可以以多种方式部署：

* 单机部署：[standalone cluster](https://ci.apache.org/projects/flink/flink-docs-release-1.10/ops/deployment/cluster_setup.html)
* Docker 容器中部署
* 通过资源管理框架 YARN 或 Mesos 或 K8S 部署

Client 并不属于运行环境的一部分，但是他用来准备和发送 dataflow 给一个 JobManager。发送之后，client 可以断开，或者保持连接以获取结果。

Client 可以作为 Java/Scala 程序的一部分，或者通过命令行工具 `/bin/flink run` 来启动。

![processes](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/processes.svg)

### Task Slots and Resources

每个 TaskManager 是一个 JVM 进程，并且可以在**不同线程中执行一个或者多个 subtasks 。** **task slots** 代表一个 worker 可以同时运行的 tasks 的数量。

每个 **task slot** 代表了一个 TaskManager 资源的子集。例如一个有 3 个 task slots 的 TaskManager 会将内存分为三份。

> 注意 task slot 不会分割 CPu 时间。

通过调整 task slots 的数量，用户可以定义多少个 subtasks 是分别执行的。一个 task slot 代表一个 subtask 采用一个 JVM 进程，多个 task slots 代表多个 subtasks 共享一个 JVM。同一个 JVM 中的 tasks 共享 TCP 连接与心跳信息。而且还可以共享 data sets 和 data structures 减少任务 overhead。

![tasks_slots](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/tasks_slots.svg)

默认情况下，Flink 允许 subtasks 共享 slots，即使他们来自不同的 task，只要他们来自于同一个 Job。这就造成一个 slot 可能会处理整个 Pipeline。这样有两个好处：

* Flink 集群需要的 Slots 数量只需要与 Job 中的最大 parallelism 数目相同。不需要计算一个程序有多少个 tasks。
* 能够简单的提高资源利用率。如果 slot 不能共享，非密集型的 *source/map()* 任务将阻塞一些资源。在共享的情况下，只需要提高 parallelism 就能达到资源的完全利用，并且可以确保密集任务的合理分配。

![slot_sharing](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/slot_sharing.svg)

> *[resource group](https://ci.apache.org/projects/flink/flink-docs-release-1.10/dev/stream/operators/#task-chaining-and-resource-groups)* API 可以用来控制 slot 共享行为。

根据经验，task slots 的数量最好和 cpu 的核心数目相同。然后通过超线程，每个 slots 可以占用两个以上的线程上下文。

### State Backends

Key-Value 的数据结构取决于选择的 [state backend](https://ci.apache.org/projects/flink/flink-docs-release-1.10/ops/state/state_backends.html)。一种 Backend 采用内存中的 hash map 保存，另一个 state Backend 为 [RocksDB](http://rocksdb.org/)。

State Backend 除了用来保存状态，还需要提供将状态保存为快照的功能，作为 Checkpoints 的一部分。

![checkpoints](https://ci.apache.org/projects/flink/flink-docs-release-1.10/fig/checkpoints.svg)

### Savepoints

通过 DataStream API 编写的程序从 **savepoint** 中恢复。

**[Savepoints](https://ci.apache.org/projects/flink/flink-docs-release-1.10/ops/state/savepoints.html) 是手动触发的 Checkpoints，它会将当前程序的快照保存到 state backend 中。**基于普通的 Checkpoints 机制。在执行过程中，程序会定期保存快照并产生 Checkpoints。在恢复过程中，仅仅最后一个完成的 checkpoint 需要，其他旧的都可以在新的 checkpoints 完成时直接丢掉。

SavePoints 与 Checkpoint 类似，只不过他们：

* 由用户手动触发
* 不会自动过期
* 可以通过 [command line](https://ci.apache.org/projects/flink/flink-docs-release-1.10/ops/cli.html#savepoints) 或者 [REST API](https://ci.apache.org/projects/flink/flink-docs-release-1.10/monitoring/rest_api.html#cancel-job-with-savepoint) 创建


