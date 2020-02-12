# 调研Tensorflow Extended

> **TensorFlow Extended (TFX) 是一个端到端平台，用于部署生产型机器学习流水线**。
>
> 它提供了一个框架和共享库用来集成各种组件，通过这些组件来定义，启动和监控你的机器学习系统。





## 安装

```bash
pip install tensorflow
pip install tfx
```

> **Note:** [TensorFlow Serving](https://www.tensorflow.org/serving/), [TensorFlow JS](https://js.tensorflow.org/), 和 [TensorFlow Lite](https://www.tensorflow.org/lite) 是可选组件，需要单独安装。

> **Note:** This installs [Apache Beam](https://www.tensorflow.org/tfx/guide/beam) with the Direct runner. You will need to install streaming runners such as [Flink](https://flink.apache.org/) separately.

## 核心概念

### TFX pipelines

pipeline 定义了一个基于一部分组件的工作流。其中的组件 TFX 提供或者基于 TFX 的库编写的自定义组件。pipeline 运行的结果是一个部署的目标或者是一个服务的接口。

### Artifacts

在一个 pipeline 中，artifacts 指的是在组件之间传递的数据。通常一个组件至少包含一个输入的 artifacts 和一个输出的 artifacts，所有的 artifact 都必须有相关联的 metadata，包含 artifact 的类型与属性。artifact 的类型必须是在 [ML Metadata](https://www.tensorflow.org/tfx/guide/mlmd) store 中注册过的类型。 [这个文件](https://github.com/google/ml-metadata/blob/master/g3doc/get_started.md#concepts)定义了artifact 和 artifact type 的概念。在 TFX 0.14 版本中，实现了[十种类型](https://github.com/tensorflow/tfx/blob/1e931c461ed38de51ae3e9975fd10a0cba75e58b/tfx/types/standard_artifacts.py)的 artifacts 供组件来使用。

一个 artifact type 有一个 unique 的名字和一个包含属性的 schema。TFX 使用 artifacts type 来决定组件如何使用这个 artifacts 而不是关心 artifacts 的内容。

例如，Example artifact type 代表不同存储格式的 TFRecord 数据，例如 `tensorflow::Example` protocol buffer, CSV, JSON，或者其他的存储格式。相应的，在pipeline 中使用 Example artifact type 的方法也都相同：分析或计算统计数据，通过 schema 进行数据验证，预处理以供训练或者被用于训练。

同样的 Model artifact type 可能代表了一个模型，它的格式可以是 TensorFlow SavedModel, ONNX, PMML 或者PKL，但是不论任何存储方式，Model 总是被用来 evaluate ，analysed 或者 deployed。

> **NOTE:** 在 0.14 的 TFX 中，目前 Example 只支持 `tensorflow::Example` protocol buffer in gzip-compressed TFRecord format。Model 只支持 TensorFlow SavedModel。未来版本会支持更多格式。

为了区分同一个 artifact type 中的各种不同格式，ML Metadata 定义了 artifact type 的一些属性，例如 Exapme 的一个属性就是 format，它的值可以从 `TFRecord`, `JSON`, `CSV` 中选择。Example 类型的 artifact 总是被传递给接受这个类型的组件，但是具体使用 Example 数据的方法可以根据俄 format 属性值的不同而改变。当没有实现 format 对应的方法的时候，可以 raise 一个 runtime error。

总的来说 artifact type 定义了 artifacts 的本体，它的属性描述了这个 artifacts 的 spec。用户可以自定义 artifact type 的属性，或者直接自定义一个 artifact type。



### TFX pipeline 组件

一个pipeline 描述了一个特定的机器学习任务。包含建模，训练，上线和管理等等。

通常一个 pipeline 包含以下组件：

* [**ExampleGen**](https://www.tensorflow.org/tfx/guide/examplegen) pipeline 的输入数据集，并可以选择进行 split；
* [**StatisticsGen**](https://www.tensorflow.org/tfx/guide/statsgen) 计算数据集的统计数据；
* [**SchemaGen**](https://www.tensorflow.org/tfx/guide/schemagen) 检测统计数据并创建一个 data schema；
* [**ExampleValidator**](https://www.tensorflow.org/tfx/guide/exampleval) 查找数据集中的异常或者丢失数据；
* [**Transform**](https://www.tensorflow.org/tfx/guide/transform) 在数据集上进行特征工程；
* [**Trainer**](https://www.tensorflow.org/tfx/guide/trainer) 训练模型；
* [**Evaluator**](https://www.tensorflow.org/tfx/guide/evaluator) 对训练结果进行深度分析；
* [**ModelValidator**](https://www.tensorflow.org/tfx/guide/modelval) 用来训练导出的模型，确保模型足够好；
* [**Pusher**](https://www.tensorflow.org/tfx/guide/pusher) 根据不同的服务框架部署模型。

<img src="https://s2.ax1x.com/2019/10/11/ubq31s.png" alt="ubq31s.png" style="zoom:20%;" />

#### 组件结构

组件主要包含三个部分：

* Driver
* Executor
* Publisher



其中 Driver 通过 query Metadata Store 来获取 Metadata 并传递给 Executor，Publisher 接受 Executor 产生的输出并保存到 Metadata 中。开发者除了 Debug 一般不需要接触这两个部件。

Executor 是组件执行其代码的部分，开发者只需要编写 Executor 内执行的代码。不同的组件对编写的代码有不同的要求，例如 Transform 组件需要你实现一个`preprocessing_fn`.

<img src="https://s2.ax1x.com/2019/10/11/ubLmvR.png" alt="ubLmvR.png" style="zoom:20%;" />

### TFX Libraries

TFX 不仅包含组件，还包含一些库。如下图所示：



[<img src="https://s2.ax1x.com/2019/10/11/ubq1pj.png" alt="ubq1pj.png" style="zoom:20%;" />

TFX 提供了一些 Python包用来创建组件，你可以使用这些包来创建组件，这可以使得一个组件仅仅 focus 这条 pipeline 的一个方面。

TFX 包含一下 libraries：

- [**TensorFlow Data Validation (TFDV)**](https://www.tensorflow.org/tfx/guide/tfdv) 是用来分析和验证数据的库， 它包含：
  - 训练和测试数据的统计信息的 Scalable calculation；
  - 整合了一个数据分布与分析的 viewer， 包括数据的各方面对比；
  - 自动生成数据的 schema，来描述数据的值，范围，字典等；
  - 用来查看 schema 的schema viewer；
  - 异常检测，检测特征异常，OOV 等等；
  - 一个展示特征异常值的 viewer。
- [**TensorFlow Transform (TFT)**](https://www.tensorflow.org/tfx/guide/tft) 进行数据的预处理，对于需要 full- pass的数据很有用，例如：
  - 通过均值和方差 Normalize 数据；
  - 通过一个词汇表将 string 转换为 int；
  - 将 float 转换为 int 并进行分桶。
- [**TensorFlow**](https://www.tensorflow.org/tfx/guide/train) 被用来训练模型。它以训练集和模型代码为输入，并创建一个 SavedModel 作为结果。它还整合了一个由 Transform 生成的特征工程 pipeline。
- [**TensorFlow Model Analysis (TFMA)**](https://www.tensorflow.org/tfx/guide/tfma) 是一个评估 Tensorflow 模型的库，它产生一个 EvalSavedModel，并可以使用户对模型进行大规模的验证，并且使用和 Trainer 相同的 metrics。这些指标可以针对任何一个数据片段进行计算并在 jupyter notebook 中可视化。
- [**TensorFlow Metadata (TFMD)**](https://github.com/tensorflow/metadata) 提供了元数据的标准表示，这些元数据在训练 tensorflow 模型时非常有用。这些元数据可以手动创建或者根据 数据集分析自动创建，并可以在 数据验证，数据挖掘和数据转换时使用。格式包括:
  - 一个描述输入数据集的 schema；
  - 描述数据集的一组统计信息的summaries。
- [**ML Metadata (MLMD)**](https://www.tensorflow.org/tfx/guide/mlmd) 是一个记录和提取元数据的库。 MLMD 使用 [SQL-Lite](https://www.sqlite.org/index.html), [MySQL](https://www.mysql.com/), 或其他数据库来保存持久化数据。

##Custom component

自定义分为两种情况：

* 如果只需要自定义 processing 的 logic，即 input output 和 execution properties 和已有的组件是相同的，则只需要 自定义 executor；
* 如果 input output 和 execution properties 都需要自定义，则应该自定义 component 

### 如何创建自定义组件

> 以下代码的完整示例在 [这里](https://github.com/tensorflow/tfx/blob/r0.14/tfx/examples/custom_components/slack/slack_component/executor.py)

创建一个自定义组件需要两个条件：

* 一组输入输出的 artifacts 的规范的定义。主要是为了保证 artifacts 在上下游组件中的一致性；
* 不属于 artifacts 的一些参数。

#### ComponentSpec

`ComponentSpec` 类定义了组件输入输出的 artifacts 以及 parameters。总共三个部分：

* **INPUTS：** 输入的 artifacts 的规范，它会被传递给 component executor。一般可以从上游组件的输出获取，这样可以共享相同的 Spec；
* **OUTPUTS：**组件输出的 artifacts 的规范；
* **PARAMETERS：**不属于 artifacts 的一些参数，这些参数是灵活可变的且同样传递给 component executor。

```python
class SlackComponentSpec(types.ComponentSpec):
  """ComponentSpec for Custom TFX Slack Component."""

  INPUTS = {
      'model_export': ChannelParameter(type=standard_artifacts.Model),
      'model_blessing': ChannelParameter(type=standard_artifacts.ModelBlessing),
  }
  OUTPUTS = {
      'slack_blessing': ChannelParameter(type=standard_artifacts.ModelBlessing),
  }
  PARAMETERS = {
      'slack_token': ExecutionParameter(type=Text),
      'slack_channel_id': ExecutionParameter(type=Text),
      'timeout_sec': ExecutionParameter(type=int),
  }
```

####Executor

下一步是编写组件 executor 的代码。一般会继承 [`base_executor.BaseExecutor`](https://www.tensorflow.org/tfx/api_docs/python/tfx/components/base/base_executor/BaseExecutor) 并重写 `Do` 函数。`Do` 函数的三个输入 `input_dict`,  `output_dict` 和 `exec_properties` 分别对应了上面 `ComponentSpec` 的三部分  `INPUTS`, `OUTPUTS` 和 `PARAMETERS`。

对于  `input_dict`,  `output_dict`  中的 artifacts，有方便的函数来获取 URL 内的 artifacts （如下面例子中的`model_export_uri` 和 `model_blessing_uri`）或者直接获取 artifacts 的对象（如 `slack_blessing`）

```python
 
class Executor(base_executor.BaseExecutor):
  """Executor for Slack component."""
  ...
  def Do(self, input_dict: Dict[Text, List[types.TfxArtifact]],
         output_dict: Dict[Text, List[types.TfxArtifact]],
         exec_properties: Dict[Text, Any]) -> None:
    ...
    # Fetch execution properties from exec_properties dict.
    slack_token = exec_properties['slack_token']
    slack_channel_id = exec_properties['slack_channel_id']
    timeout_sec = exec_properties['timeout_sec']

    # Fetch input URIs from input_dict.
    model_export_uri = types.get_single_uri(input_dict['model_export'])
    model_blessing_uri = types.get_single_uri(input_dict['model_blessing'])

    # Fetch output artifact from output_dict.
    slack_blessing =
        types.get_single_instance(output_dict['slack_blessing'])
    ...
```

Executor 的 Unittest 可以参考[这里](https://github.com/tensorflow/tfx/blob/r0.14/tfx/components/transform/executor_test.py)。

#### Component interface

组件的核心部分已经在上面的步骤完成了，现在是将这个组件集成到通用的组件接口中，使它能够在 pipeline 中被使用。这部分分为以下几步：

* 定义 [`base_component.BaseComponent`](https://www.tensorflow.org/tfx/api_docs/python/tfx/components/base/base_component/BaseComponent) 的一个子类；
* 定义一个类属性：`SPEC_CLASS` 并指向之前定义的 `ComponentSpec` 类；
* 定义一个类属性：`EXECUTOR_SPEC` 指向之前定义的 `Executor` 的子类`executor_spec.ExecutorClassSpec(executor.Executor)`；
* 定义构造函数 `__init__()`，接受 `ComponentSpec` 的所有需要的变量和一些可选参数例如 name，然后使用这些变量实例化一个 `ComponentSpec` 的对象，并使用该对象与 name 构造基类 `BaseComponent`。

当自定义的组件完成并实例化的时候， [`base_component.BaseComponent`](https://www.tensorflow.org/tfx/api_docs/python/tfx/components/base/base_component/BaseComponent) 内的类型检查逻辑会检查输入到该组件的参数是否符合 `ComponentSpec` 的定义。

```python
from slack_component import executor

class SlackComponent(base_component.BaseComponent):
  """Custom TFX Slack Component."""

  SPEC_CLASS = SlackComponentSpec
  EXECUTOR_SPEC = executor_spec.ExecutorClassSpec(executor.Executor)

  def __init__(self,
               model_export: channel.Channel,
               model_blessing: channel.Channel,
               slack_token: Text,
               slack_channel_id: Text,
               timeout_sec: int,
               slack_blessing: Optional[channel.Channel] = None,
               name: Optional[Text] = None):
    slack_blessing = slack_blessing or channel.Channel(
        type_name='ModelBlessingPath',
        artifacts=[types.TfxArtifact('ModelBlessingPath')])
    spec = SlackComponentSpec(
        slack_token=slack_token,
        slack_channel_id=slack_channel_id,
        timeout_sec=timeout_sec,
        model=model_export,
        model_blessing=model_blessing,
        slack_blessing=slack_blessing)
    super(SlackComponent, self).__init__(spec=spec, name=name)
```

#### 集成到 TFX pipeline

最后一步是将自定义的组件集成到 TFX 的 pipeline 中使用，出来要实例化一个组件对象以外，还需要以下几步：

* 将组件的输入输出与上下游的组件对接；
* 在构建 pipeline 时将新的 组件添加到返回的组件列表中。

```python
def _create_pipeline():
  ...
  model_validator = ModelValidator(
      examples=example_gen.outputs['examples'], model=trainer.outputs['model'])

  slack_validator = SlackComponent(
      model=trainer.outputs['model'],
      model_blessing=model_validator.outputs['blessing'],
      slack_token=_slack_token,
      slack_channel_id=_slack_channel_id,
      timeout_sec=3600,
  )

  pusher = Pusher(
      ...
      model_blessing=slack_validator.outputs['slack_blessing'],
      ...)

  return pipeline.Pipeline(
      ...
      components=[
          ..., model_validator, slack_validator, pusher
      ],
      ...
  )
```



### 部署组定义组件

除了修改代码以外，重要的是将编写自定义组件代码放到 Python 的运行环境中使得运行时可以被 Python 访问到。