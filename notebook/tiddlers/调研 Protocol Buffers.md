# Protobuffer



## 什么是 Protobuffer

> a language-neutral, platform-neutral, extensible way of serializing structured data for use in communications protocols, data storage, and more.
>
> 语言无关，平台无关的结构化数据序列化方法，用来协议交互，数据存储等。

Protocol Buffer 是用来序列化结构数据的一种灵活、高效、自动的机制，类似于 XML 但是更小、更快、更简单。使用 protocol buffers，只需要简单的声明一个对象的属性，它就可以帮你自动编译成各种语言的静态代码，让你可以方便的在各种语言各种平台之间进行结构化数据的读写。你甚至可以在不碰已经部署的程序代码情况下完成数据结构的更新。



## Protobuffer 如何工作



首先需要在 `.proto` 文件中定义数据结构。每个 message 都是一条逻辑上的信息，包含一系列的键值对。例如，下面是一个简单的例子，定义了一个 Person 的数据结构：

```protobuf
/* SearchRequest represents a search query, with pagination options to
 * indicate which results to include in the response. */

syntax = "proto3";

message Person {
    string name = 1;
    int32  age = 2;  // age
    int32 height = 3;  // height
}
```

如上所示，一个message 的结构非常简单，包含一些 field 每个 field 都是**一个名称**和**一个数据类型**。数据类型可以是 int、float、bool、strings、raw bytes 或者其他类型。你可以指定 `optional fields`, [`required fields`](https://developers.google.com/protocol-buffers/docs/proto#required_warning) 或者 `repeated fields`。

> proto 有两个版本 `proto2` 与 `proto3`， 两个语法稍有不同。
>
> 关于 `.proto`详细信息可以查看 [Protocol Buffer Language Guide](https://developers.google.com/protocol-buffers/docs/proto).



当你定义完 `.proto` 以后，你就可以使用 protocol buffers 的编译器将这个 `.proto` 根据选择的语言编译成为一个**数据访问类**。这个数据访问类会提供简单的属性访问方法，例如 `name()` 或者 `set_name()`，它还包含序列化和反序列化方法，可以从 raw data 进行反序列化或者序列化为 raw data。



例如转换为 Python 代码：

```bash
protoc -I src --python_out dest src/test.proto
```



当转换为 Python 代码以后，你就可以导入这个 Proto 的message 类，并进行操作：

```python
>>> from src.test_pb2 import Person
>>> p = Person()
>>> p.name = "nebula"
>>> p.age = 12
>>> s = p.SerializeToString() # 序列化成 string
b'\n\x06nebula\x10\x0c'
```

序列化并进行传递之后，你可以对序列化的 string 进行反序列化：

```python
>>> p_ = Person()
>>> p_.ParseFromString(s)
>>> print(p_)                                                                                                                             
name: "nebula"
age: 12
```

其中 Person 作为**数据访问类** 还有许多实用的方法。

如果使用 protocol buffers 作为传输协议，当你更新数据结构时也不用担心会出现问题，旧的执行程序会忽略新加入的 field 。

> 查看  [API Reference section](https://developers.google.com/protocol-buffers/docs/reference/overview) 获取更多关于 protocol buffer 生成的代码的 API。
>
> 查看 [Protocol Buffer Encoding](https://developers.google.com/protocol-buffers/docs/encoding) 获取 protobuf 是如何 Encode messages 的。

## 为什么不使用 XML

相较于 XML ， protobuf 有很多的优点：

* 更简单
* 体积缩小 3 到10倍
* 速度增快 20 到 100 倍
* 减少歧义
* 生成的数据访问类更易于程序使用

例如 在XML 中，如果你想定义一个拥有 name 和 email 的个人信息：

```xml
  <person>
    <name>John Doe</name>
    <email>jdoe@example.com</email>
  </person>
```

而在 Protobuf 中：

```protobuf
# Textual representation of a protocol buffer.
# This is *not* the binary format used on the wire.
person {
  name: "John Doe"
  email: "jdoe@example.com"
}
```

当上面这条信息被转换为 二进制时，它仅仅需要 28 bytes，解析只需要 100 - 200 毫微秒；而 XML 需要至少 69 bytes， 解析需要 10000 毫微秒 。

而且对 Protobuf 对象的操作更加简单（以 C++ 为例）：

```c++
  cout << "Name: " << person.name() << endl;
  cout << "E-mail: " << person.email() << endl;
```

如果是XML：

```c++
  cout << "Name: "
       << person.getElementsByTagName("name")->item(0)->innerText()
       << endl;
  cout << "E-mail: "
       << person.getElementsByTagName("email")->item(0)->innerText()
       << endl;
```

这显然更加复杂。



但是 Protobuf 在某些方面确实还不如 XML， 例如 Protobuf 显然不适合用来传递文字为主的标记性语言（例如 HTML），XML 是方便阅读并且可以编辑的；第二，在某种意义上，XML 是自描述的，而Protobuf 的信息只有在拥有 `.proto` 文件时才有意义。



## 如何正确开始使用 ProtoBuf



使用 ProtoBuf 需要两个部分：

* protoc
* protobuf （针对不同语言的库）

以 Python 为例：

protoc 应该去 Github 的 [release](https://github.com/protocolbuffers/protobuf/releases/latest) 界面下载，同时也可以下载针对不同元的 protobuf，对于 Python 来说 protobuf 也可以方便的使用 pip 安装：

```bash
pip install protobuf
```



安装完成后就可以根据使用的语言查看 [教程](https://developers.google.com/protocol-buffers/docs/tutorials) 进一步了解。



## 关于 proto3

proto3 是 Protobuf 最新发布的语法规范，之前是 proto2。proto3 简化了 proto 的语法，使得编写 proto 文件更加容易。你可以在 proto 文件内指定使用的语法版本：

```bash
syntax = "proto3";
```

> 需要注意的是，proto2 与 proto3 生成的代码的 API 并不是完全兼容的，这方面官方也在跟进。
>
> 至于为什么没有 proto1， 是因为 google 在开源的时候已经是第二个版本了。

>  [release notes](https://github.com/protocolbuffers/protobuf/releases)  可以查看具体的区别。
>
>  [Proto3 Language Guide](https://developers.google.com/protocol-buffers/docs/proto3) 详细介绍了 proto3。



## 一点历史



Protocol Buffers 最开始是在 Google 内部为了解决服务器之间的请求与反馈而开发的。在 ProtoBuf 之前，是通过手动管理这些 请求和反馈的，而且之间还存在许多不同的版本，就导致了很多很丑的代码：

```python
 if (version == 3) {
   ...
 } else if (version > 4) {
   if (version == 5) {
     ...
   }
   ...
 }
```

显式的定义 protocol 的格式同样增加了版本更换时的复杂度，因为在开发者很难保证所有的服务器都能够理解新的 protocol。

protobuf 的设计解决了许多问题：

* 新的 field 可以被简单的增加，并且中间服务器可以不用去验证数据而是简单的反序列化而不需要知道所有的 field。
* 格式可以更好的 被自描述，并且可以转换为多种语言。



然而，用户仍然需要手写解析的代码，

随着系统的发展，又增加了许多的功能：

* 自动生成 序列化和反序列化代码，而不需要用户编写。
* 为了能够使用 short-lived 的RPC （Remote Procedure Call）请求，人们开始使用 protobuf 作为 小数据持久化的格式。
* 服务器RPC接口开始使用 proto 生成，并且用户再进行重写 protobuf 生成的代码来作为程序使用。

Protobuf 现在已经成为 Google 描述数据的通用语言。现在已经有 306,747 种不同的 message 和 348,952 种 proto 文件，它们既用于RPC系统中，又用于在各种存储系统中持久存储数据。