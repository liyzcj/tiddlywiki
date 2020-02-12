# Metrics and visuallize on Kubeflow



> 如何在组件中输出 Metrics



想要输出组件的 Metrics 到Kubeflow，需要组件输出一个 `/mlpipeline-metrics.json` 文件。



## mlpipeline-metrics.json

输出 `mlpipeline-metrics.json` 的代码如下：

```python
  accuracy = 0.99
  metrics = {
    'metrics': [{
      'name': 'accuracy-score', # metric 的名称
      'numberValue':  accuracy, # metric 的值，必须是数值类型。
      'format': "PERCENTAGE",   # 显示的格式，支持 "RAW":原始 "PERCENTAGE":百分比
    }]
  }
  with file_io.FileIO('/mlpipeline-metrics.json', 'w') as f:
    json.dump(metrics, f)
```



## 正确输出 Metric 所需条件



* 必须输出到 `mlpipeline-metrics.json` 文件。
* name 必须满足 `^[a-z]([-a-z0-9]{0,62}[a-z0-9])?$`
* numberValue 必须是数值类型
* format 必须是 "RAW" "PERCENTAGE" 或者不设置。



## Visualization

Kubeflow Pipeline 的 Web UI 为可视化组件的输出提供了几种方式，使得用户可以通过在组件中输出到特定文件 `/mlpipeline-ui-metadata.json` 的方式来可视化组件的输出。

`mlpipeline-ui-metadata.json` 的一个简单实例：

```json
{
  "version": 1,
  "outputs": [
    {
      "type": "confusion_matrix",
      "format": "csv",
      "source": "my-dir/my-matrix.csv",
      "schema": [
        {"name": "target", "type": "CATEGORY"},
        {"name": "predicted", "type": "CATEGORY"},
        {"name": "count", "type": "NUMBER"},
      ],
      "labels": "vocab"
    },
    {
      ...
    }
  ]
}
```

当用户将数据写入文件时，Kubeflow 的 Pipeline 系统会将文件内的元数据提取出来并提供给 Web UI ，Web UI 会从用户提供的地址读取数据并放进内存，并进行渲染展示。

文件的元数据包含以下field：

| Field Name    | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| format        | Artifact 数据的格式，默认为 csv。当前只有 csv 支持           |
| header        | 包含文件内表头部分的列表                                     |
| labels        | 用于文件行或列的字符串列表                                   |
| predicted_col | 预测列的名称                                                 |
| schema        | {type, name} 组成的列表，指定了 Artifact 的schema            |
| source        | 数据文件的完整路径                                           |
| storage       | 当type为markdown 时指定存储方式，inline则source变为inline markdown |
| target_col    | 目标列的名称                                                 |
| type          | 前端 viewer 的类型。                                         |

### Viewers

目前支持的 Viewers 包含以下几种：



1. Confusion_matrix 混淆矩阵

   **Type**: `confusion_matrix`

   **Required Fields**:

   * format
   * labels
   * schema
   * source

   Confusion matrix 根据schema解析source 给的文件，并根据labels 渲染一个混淆矩阵。

   **Example:**

   ```python
     metadata = {
       'outputs' : [{
         'type': 'confusion_matrix',
         'format': 'csv',
         'schema': [
           {'name': 'target', 'type': 'CATEGORY'},
           {'name': 'predicted', 'type': 'CATEGORY'},
           {'name': 'count', 'type': 'NUMBER'},
         ],
         'source': cm_file,
         # Convert vocab to string because for bealean values we want "True|False" to match csv data.
         'labels': list(map(str, vocab)),
       }]
     }
     with file_io.FileIO('/mlpipeline-ui-metadata.json', 'w') as f:
       json.dump(metadata, f)
   ```

   

2. Markdown

   **Type**: `markdown`

   **Required Fields**: 

   * source
   * storage

   如果 storage 的值为 `inline` 则 source 是一行 inline 的markdown，如果不指定 storage，则source的值是一个指向 markdown 文件的路径

   **Example:**

   ```python
     metadata = {
       'outputs' : [
       # Markdown that is hardcoded inline
       {
         'storage': 'inline',
         'source': '# Inline Markdown\n[A link](https://www.kubeflow.org/)',
         'type': 'markdown',
       },
       # Markdown that is read from a file
       {
         'source': 'gs://your_project/your_bucket/your_markdown_file',
         'type': 'markdown',
       }]
     }
     with file_io.FileIO('/mlpipeline-ui-metadata.json', 'w') as f:
       json.dump(metadata, f)
   ```

   

3. ROC 曲线

   **Type**: roc

   **Required Field:**

   * format
   * schema
   * source

   使用 source 的给定的数据画一条 ROC 曲线，ROC viewer 会假定你的数据包含三列，分别是：

   * fpr (false positive rate)
   * tpr (true positive rate)
   * thresholds

   **Example:**

   ```python
     df_roc = pd.DataFrame({'fpr': fpr, 'tpr': tpr, 'thresholds': thresholds})
     roc_file = os.path.join(args.output, 'roc.csv')
     with file_io.FileIO(roc_file, 'w') as f:
       df_roc.to_csv(f, columns=['fpr', 'tpr', 'thresholds'], header=False, index=False)
   
     metadata = {
       'outputs': [{
         'type': 'roc',
         'format': 'csv',
         'schema': [
           {'name': 'fpr', 'type': 'NUMBER'},
           {'name': 'tpr', 'type': 'NUMBER'},
           {'name': 'thresholds', 'type': 'NUMBER'},
         ],
         'source': roc_file
       }]
     }
     with file_io.FileIO('/mlpipeline-ui-metadata.json', 'w') as f:
       json.dump(metadata, f)
   ```

4. Table 表格

   **Type:** `table`

   **Required Field:**

   * format
   * header
   * source

   Table viewer 会创建一个 HTML 表格，其中表头为 header 指定，表数据由 source 指定的文件给出。

   **Example:**

   ```python
     metadata = {
       'outputs' : [{
         'type': 'table',
         'storage': 'gcs',
         'format': 'csv',
         'header': [x['name'] for x in schema],
         'source': prediction_results
       }]
     }
     with open('/mlpipeline-ui-metadata.json', 'w') as f:
       json.dump(metadata, f)
   ```

5. TensorBoard

   **Tyep:** `tensorboard`

   **Required Field:**

   * source

   Tensorboard viewer 会增加一个按钮 `Start Tensorboard` 在输出页面。 当点击按钮时，Kubeflow 会起一个 Tensorboard Pod。 并且 `logdir` 为 source 。

   **Example:**

   ```python
     metadata = {
       'outputs' : [{
         'type': 'tensorboard',
         'source': args.job_dir,
       }]
     }
     with open('/mlpipeline-ui-metadata.json', 'w') as f:
       json.dump(metadata, f)
   ```

6. Web App

   **Type:** `web-app`

   **Required Field:** 

   * source

   你可以指定显示一个 独立的 HTML 文件，但是该文件不能指向其他文件且无法与 Kubeflow Pipeline UI 进行通信。