# Tensorflow with Hadoop

使用 Tensorflow 的 IO 模块可以访问 Hadoop 的 HDFS，不过在访问之前需要进行一些配置。



## 必须的 环境变量

- `JAVA_HOME` —Location of the Java installation.

- `HADOOP_HDFS_HOME` —Location of the HDFS installation. The variable is optional if `libhdfs.so` is available in `LD_LIBRARY_PATH`. This can also be set using:

  ```shell
  source ${HADOOP_HOME}/libexec/hadoop-config.sh
  ```

- `LD_LIBRARY_PATH` —Include the path to `libjvm.so` and, optionally, the path to `libhdfs.so`, if your Hadoop distribution did not install `libhdfs.so` in `${HADOOP_HDFS_HOME}/lib/native`. On Linux:

  ```shell
  export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:${JAVA_HOME}/jre/lib/amd64/server
  ```

- `CLASSPATH` —The Hadoop jars must be added to the class path before running TensorFlow. It's not enough to set CLASSPATH using: `${HADOOP_HOME}/libexec/hadoop-config.sh`. Globs must be expanded, as described in the `libhdfs` documentation:

  ```shell
  CLASSPATH=$(${HADOOP_HOME}/bin/hadoop classpath --glob) python your_script.py
  ```

If the Hadoop cluster is in *secure mode*, set the following environment variable:

- `KRB5CCNAME` —Path of Kerberos ticket cache file. For example:

  ```shell
  export KRB5CCNAME=/tmp/krb5cc_10002
  ```

If using [Distributed TensorFlow](https://github.com/tensorflow/examples/blob/master/community/en/docs/deploy/distributed.md), all workers must have Hadoop installed and the environment variables set.

## 测试

```python
import tensorflow as tf
tf.io.gfile.listdir("hdfs:///")
```


## Reference

> https://github.com/tensorflow/examples/blob/master/community/en/docs/deploy/hadoop.md


