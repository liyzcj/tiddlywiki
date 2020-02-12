# spark submit YARN



当使用 `spark-submit` 提交 pyspark 脚本到 YARN 集群运行的时候，有时候需要一个特定的 Python 环境，这是一个集群没有的环境，这时候就需要从本地上传一个 Python 环境或者从其他的文件系统例如 HDFS 中上传所需要的 Python 环境。



首先使用 conda 创建一个新的环境：

```bash
conda create --name python3.7 python=3.7
```



将需要的包安装到新的 conda 环境以后，将 conda `envs` 目录下的环境打包：

```bash
cd miniconda3/envs
zip -r python3.7.zip python3.7
```

> **注意一定要切到 envs 目录，zip 打包会根据后面的路径进行打包。**



将打包后的 Python 环境上传到 HDFS：

```bash
hdfs dfs -put /path/to/python3.7.zip /hdfs/path/
```

上传以后，只需要在 spark-submit 的 archives 选项中指定需要的 Archives：

> Archives 可以填写多个 archive， 使用逗号隔开。spark 会将 archives 指定的文件复制到每一个 Executor。

最后在提交时设置 Master 的 环境变量：`PYSPARK_PATH`

```bash
spark-submit \
	--master yarn \
	--deploy-mode cluster \
	--executor-memory 1G \
	--num-executors 1 \
	--executor-cores 2 \
	--archives hdfs:///user/conda/python3.7.zip#python \
	--conf spark.yarn.appMasterEnv.PYSPARK_PYTHON=./python/python3.7/bin/python \
	test_spark.py
```



> `hdfs:///user/conda/python3.7.zip#python` 中 # 与 Hdfs 中的用法相同，如果指定 `localtest.txt#appSees.txt` 那么使用的时候应该使用 `appSees.txt` ， 如果前面是 zip 压缩文件，那么会将压缩包解压到后面的文件夹里。

`--archives` 写多个文件，逗号隔开，并且最后的文件不一定是本地，在archive 中的脚本也可以执行。

```python
spark-submit \
	--master yarn \
	--deploy-mode cluster \
	--executor-memory 1G \
	--num-executors 1 \
	--executor-cores 2 \
	--archives "hdfs:///user/ai/liyanzhe/test_spark.py,hdfs:///user/conda/python3.7.zip#python" \
	--conf "spark.yarn.appMasterEnv.PYSPARK_PYTHON=./python/python3.7/bin/python" \
	test_spark.py
```