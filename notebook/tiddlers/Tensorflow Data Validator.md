# Tensorflow Data Validation

TFDV 可以用来分析训练数据并实现：

* 计算数据统计信息
* 推算数据的 schema
* 检测数据异常

核心的 API 为每一个功能都提供了方便的函数，并且可以在 Notebook 中调用。

## 计算统计信息

TFDV 可以根据数据中的特征计算统计信息来对数据进行一个快速的了解。

 [Facets Overview](https://pair-code.github.io/facets/) 可以为这些统计信息提供简洁的可视化。

例如，对一个 `TFRecord`  格式的文件进行分析：

```python
stats = tfdv.generate_statistics_from_tfrecord(data_location=path)
```

返回值是一个Protobuf [DatasetFeatureStatisticsList](https://github.com/tensorflow/metadata/tree/master/tensorflow_metadata/proto/v0/statistics.proto)。在 Notebook 中可以通过  [Facets Overview](https://pair-code.github.io/facets/) 来进行简单可视化：

```python
tfdv.visualize_statistics(stats)
```

![stats](https://www.tensorflow.org/tfx/data_validation/images/stats.png)



除了 TFRecord 文件，TFDV 还支持 CSV 格式。使用 `tfdv.coders.csv_decoder`可以进行 decode CSV。

此外 TFDV 还提供了一个函数  [`tfdv.generate_statistics_from_dataframe`](https://www.tensorflow.org/tfx/data_validation/api_docs/python/tfdv/generate_statistics_from_dataframe) 来直接从 Pandas Dataframe 中计算统计信息。

所以支持的数据类型包括：

* TFRecord
* CSV
* Pandas Dataframe

> TFDV 内部使用 Beam 进行数据并行处理来提高性能。

## Schema 推理

[Schema](https://github.com/tensorflow/metadata/tree/master/tensorflow_metadata/proto/v0/schema.proto) 描述了数据的属性。包含：

* 那些特征需要被使用
* 这些特征的类型
* 每个特征的值的个数
* 每条数据中特征的 Miss 情况
* 每个特征期望的 domain，即特征的取值范围

简而言之，Schema 描述了可以用来进行错误检测的**准确数据**的期望。Scheme 可以被  [Tensorflow Transform](https://github.com/tensorflow/transform) 用来进行数据转换。

Schema 是静态的，同样 Schema 的数据集的统计信息可能非常不同。

如果一个数据集有大量的 Features，为每一个 feature 编写 schema 是非常累的，TFDV 提供了一个方法来自动生成一个**初始版本**的 schema：

```python
schema = tfdv.infer_schema(stats)
```

TFDV 采用**保守的启发式**方法来进行 Schema 推理来避免 Schema 产生过拟合。TFDV 强烈推荐对推导出的 Scheme 根据需要进行再次修改，因为**保守的启发式方法可能会丢弃许多数据的领域知识**。

> 默认情况下， [`tfdv.infer_schema`](https://www.tensorflow.org/tfx/data_validation/api_docs/python/tfdv/infer_schema) 会推导出每个必要特征的范围，前提是特征的  `value_count.min` 等于 `value_count.max` 。 将参数 `infer_feature_shape` 设置为 False 来关闭这个特性。

推理出的 Schma 同样以 Protobuf 的形式保存。TFDV 提供了 [一些方便的方法](https://github.com/tensorflow/data-validation/tree/master/tensorflow_data_validation/utils/schema_util.py) 来修改生成的 schema。例如一个 schema 如下：

```json
feature {
  name: "payment_type"
  value_count {
    min: 1
    max: 1
  }
  type: BYTES
  domain: "payment_type"
  presence {
    min_fraction: 1.0
    min_count: 1
  }
}
```

有如果想要让这个特征至少出现在 50% 的样本中：

```python
tfdv.get_feature(schema, 'payment_type').presence.min_fraction = 0.5
```

TFDV 还提供了一个简单的表格式可视化：

```python
tfdv.display_schema(schema)
```

![schema](https://www.tensorflow.org/tfx/data_validation/images/schema.png)

## 检查错误样本

### 根据 Schema 检测异常样本

当有了 Schema 以后，可以使用 Schema 对数据进行验证。TFDV 可以根据 Schema 对数据集进行验证并标记处所有的异常样本：

```python
# 假设 other_path 指向另一个 TFRecord 文件。
other_stats = tfdv.generate_statistics_from_tfrecord(data_location=other_path)
anomalies = tfdv.validate_statistics(statistics=other_stats, schema=schema)
```

检测出的异常同样是 Protobuf 的数据。 例如如果特征 `other_path` 中包含一个不再 Domain 内的数据：

```python
   payment_type  Unexpected string values  Examples contain values missing from the schema: Prcard (<1%).
```

表示发现了小于 1% 的域外值：`Prcard` 。如果这个值是应该包含的，可以更新 Schema：

```python
tfdv.get_domain(schema, 'payment_type').value.append('Prcard')
```

如果检测出的异常数据确实是一个错误，那么应该在训练之前对数据进行修复。

>  [这里](https://github.com/tensorflow/metadata/tree/master/tensorflow_metadata/proto/v0/anomalies.proto)是所有的可以被检测出的异常类型。

异常在 Notebook 中也可以通过表格的形式展示出来：

![anomaly](https://www.tensorflow.org/tfx/data_validation/images/anomaly.png)

### 检测数据偏差错误

TFDV 还提供了一种方法来验证每条样本的偏差，而不是用 Schema 与整个数据集的统计信息比较。TFDV 提供了一个函数来验证每条样本的偏差，并生成总的统计信息：

```python
options = tfdv.StatsOptions(schema=schema)
anomalous_example_stats = tfdv.validate_tfexamples_in_tfrecord(
       	data_location=input, stats_options=options)
```

`validate_tfexamples_in_tfrecord` 返回了一个 [DatasetFeatureStatisticsList](https://github.com/tensorflow/metadata/tree/master/tensorflow_metadata/proto/v0/statistics.proto) protocol buffer，其中每个 Dataset 包含了特定的异常数据。你可以用这个函数来确定数据集中的异常的样本数量以及这些样本的特点。

TFDV 还提供了 `validate_instance` 函数来验证单条样本是否符合某个 Schema。

> 这个函数的输入样本必须是一个字典包含了特征名称以及 Numpy 数组。你可以使用 `TFExampleDecoder` 来将 `tf.train.Example` 解码为这种格式。

```python
decoder = tfdv.TFExampleDecoder()
example = decoder.decode(serialized_tfexample)
options = tfdv.StatsOptions(schema=schema)
anomalies = tfdv.validate_instance(example, options)
```

函数 `validate_instance` 的结果也是  [Anomalies](https://github.com/tensorflow/metadata/tree/master/tensorflow_metadata/proto/v0/anomalies.proto) protocol buffer，包含了所有这条样本中出现的异常。

## Schema Environments

默认情况下，TFDV 假设 Pipeline 中的所有数据集都符合同一个 Schema。例如 label 列在训练时是必须的，但是在上线 serving 的时候却不是。

**Environments** 可以用来实现这种需求。Schema 中的特征可以使用 `default_environment`, `in_environment` 和 `not_in_environment` 与一组环境关联起来。

例如，如果 `tips`  特征在训练时作为label 使用，但是在 serving 时不需要。如果不指定环境，这条数据在预测时会被标记为异常：

```python
serving_stats = tfdv.generate_statistics_from_tfrecord(data_location=serving_data_path)
    serving_anomalies = tfdv.validate_statistics(serving_stats, schema)
```

![serving_anomaly](https://www.tensorflow.org/tfx/data_validation/images/serving_anomaly.png)

可以将所有的特征都标记为`TRAINING` `SERVING`，并将 tips 仅仅标记为 `TRAINING`:

```python
# 所有特征默认都在 TRAINING 和 SERVING 环境中
schema.default_environment.append('TRAINING')
schema.default_environment.append('SERVING')

# 指定特征 `tips` 不在 `SERVING` 环境中
tfdv.get_feature(schema, 'tips').not_in_environment.append('SERVING')

serving_anomalies_with_env = tfdv.validate_statistics(
        serving_stats, schema, environment='SERVING')
```

## 检测数据倾斜以及数据偏移

TFDV 除了检查数据是否符合 Schema 之外还提供了以下功能：

* 训练数据与线上数据之间的偏差
* 不同日期之间的数据偏移

TFDV 通过 Schema 中指定的 倾斜/偏移比较器来比较不同数据集之间的统计信息，然后检测出数据倾斜/偏移。例如，对于特征 `payment_type` 要检测训练数据与预测数据集之间是否有倾斜：

```python
# 假设我们已经计算出了训练集的统计信息以及生成了 schema
serving_stats = tfdv.generate_statistics_from_tfrecord(data_location=serving_data_path)
# 增加一个对于特征 payment_type 的倾斜比较器到 Schema，并设置 L♾ 正则阈值为 0.01
tfdv.get_feature(schema, 'payment_type').skew_comparator.infinity_norm.threshold = 0.01
skew_anomalies = tfdv.validate_statistics(
        statistics=train_stats, schema=schema, serving_statistics=serving_stats)
```

与检测数据是否符合 Schema 中的 “期望” 相同，结果也是  [Anomalies](https://github.com/tensorflow/metadata/tree/master/tensorflow_metadata/proto/v0/anomalies.proto) protocol buffer 并且包含所有训练集与预测数据集之间的偏差。

例如，假设预测数据中大量样本的 `payement_type` 值为 `Cash`，这样就会产生数据倾斜异常：

```python
   payment_type  High L-infinity distance between serving and training  The L-infinity distance between serving and training is 0.0435984 (up to six significant digits), above the threshold 0.01. The feature value with maximum difference is: Cash
```

如果能够检测出异常，那么对于改善模型的性能是非常有效的。

检测不同日期间的偏移和数据倾斜类似：

```python
# 假设我们已经计算出了 day 2 的统计信息以及生成了 schema
train_day1_stats = tfdv.generate_statistics_from_tfrecord(data_location=train_day1_data_path)
# 增加一个对于特征 payment_type 的偏移比较器到 Schema，并设置 L♾ 正则阈值为 0.01
tfdv.get_feature(schema, 'payment_type').drift_comparator.infinity_norm.threshold = 0.01
drift_anomalies = tfdv.validate_statistics(
        statistics=train_day2_stats, schema=schema, previous_statistics=train_day1_stats)
```



## 编写自定义 data connector

要计算数据的统计信息，TFDV 提供了一些[方便的方法](https://github.com/tensorflow/data-validation/tree/master/tensorflow_data_validation/utils/stats_gen_lib.py)来处理不同的格式（TFRecord，tf.train.Example，CSV等）。如果不支持你自己的数据格式，你需要自己编写一个 data Connector 来读取输入数据并将数据连接到 TFDV 的核心 API。

TFDV 计算统计信息的[核心 API](https://github.com/tensorflow/data-validation/tree/master/tensorflow_data_validation/api/stats_api.py) 是一个 [Beam PTransform](https://beam.apache.org/contribute/ptransform-style-guide/)，它接受 PCollection 的批量数据（一批输入数据表示为一个 [Arrow](https://arrow.apache.org/) table）并且输出一个 PCollection 包含单个的 `DatasetFeatureStatisticsList` Protobuf.

一旦你实现了自定义 data connector 来将你的批数据转换为 Arrow table，你只需要将它连接到 [`tfdv.GenerateStatistics`](https://www.tensorflow.org/tfx/data_validation/api_docs/python/tfdv/GenerateStatistics) 来计算统计信息。以 `TFRecord` 格式的 [`tf.train.Example`](https://www.tensorflow.org/api_docs/python/tf/train/Example)  为例。TFDV 提供了 [TFExampleDecoder](https://github.com/tensorflow/data-validation/tree/master/tensorflow_data_validation/coders/tf_example_decoder.py) data connector，下面是一个如何将这个 data connector 与 [`tfdv.GenerateStatistics`](https://www.tensorflow.org/tfx/data_validation/api_docs/python/tfdv/GenerateStatistics) API 连接：

```python
import tensorflow_data_validation as tfdv
import apache_beam as beam
from tensorflow_metadata.proto.v0 import statistics_pb2

DATA_LOCATION = ''
OUTPUT_LOCATION = ''

with beam.Pipeline() as p:
    _ = (
    p
    # 1. 从输入文件中读取数据
    | 'ReadData' >> beam.io.ReadFromTFRecord(file_pattern=DATA_LOCATION)
    # 2. 将数据转换为 Arrow tables, 表示一批数据.
    | 'DecodeData' >> tf_example_decoder.DecodeTFExample()
    # 3. 调用 `GenerateStatistics` API 计算统计信息
    | 'GenerateStatistics' >> tfdv.GenerateStatistics()
    # 4. 保存生成的统计信息.
    | 'WriteStatsOutput' >> beam.io.WriteToTFRecord(
        file_path_prefix = OUTPUT_LOCATION,
        shard_name_template='',
        coder=beam.coders.ProtoCoder(
            statistics_pb2.DatasetFeatureStatisticsList)))
```

## 对分片计算统计信息

TFDV 还可以用来计算分片数据的统计信息。通过一个 slicing 函数将 Arrow table 处理为一系列元组 `(slice key, Arrow table)`，就可以实现计算基于分片的统计信息。

TFDV 提供了一个简单的方式来[生成基于特征值的 Slicing 函数](https://github.com/tensorflow/data-validation/blob/master/tensorflow_data_validation/utils/slicing_util.py#L47)，并作为 [`tfdv.StatsOptions`](https://www.tensorflow.org/tfx/data_validation/api_docs/python/tfdv/StatsOptions) 的一个参数来计算统计信息。

当参数包含 slicing 函数时，TFDV 默认计算整个数据集的信息以及每个 Slicing 函数对应的部分数据集的统计信息，返回值为一个包含多个 [DatasetFeatureStatistics](https://github.com/tensorflow/metadata/blob/master/tensorflow_metadata/proto/v0/statistics.proto#L41) 的 [DatasetFeatureStatisticsList](https://github.com/tensorflow/metadata/blob/master/tensorflow_metadata/proto/v0/statistics.proto#L36) 中。每个数据集可以通过 [DatasetFeatureStatistics](https://github.com/tensorflow/metadata/blob/master/tensorflow_metadata/proto/v0/statistics.proto#L41) 中的数据集名称来找到。

```python
import tensorflow_data_validation as tfdv
from tensorflow_data_validation.utils import slicing_util

# 基于特征 country 的每一种取值分片
slice_fn1 = slicing_util.get_feature_value_slicer(features={'country': None})

# 基于特征 country 以及 state 联合特征的每一种取值分片
slice_fn2 = slicing_util.get_feature_value_slicer(
    features={'country': None, 'state': None})

# 基于特征 age 指定的值分片
slice_fn3 = slicing_util.get_feature_value_slicer(
    features={'age': [10, 50, 70]})

stats_options = tfdv.StatsOptions(
    slice_functions=[slice_fn1, slice_fn2, slice_fn3])
```

## Reference

https://www.tensorflow.org/tfx/data_validation/get_started