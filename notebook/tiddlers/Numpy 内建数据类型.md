# Numpy 内建 Array 数据类型



Python 为每个数据类仅仅定义了一种数据类型，例如整数只有一个 int 类型，浮点数只有一个 float 类型。这对于一些应用非常方便，不用考虑这些数据的存储。但是对于精确的科学计算，则需要考虑的更多。

在Numpy 中，新增了24 种数据类型，大多数基于 C 语言的数据类型，还有一些与 Python 兼容的数据类型。

Numpy Array 数据类型采用了一种层级的数据结构（见下图）。这样，数据类型便可以使用数的方式进行推导，例如`isinstance(val, np.generic)` 会返回 `True` 如果这个变量是 generic 类型，然后再依次往下推导。

Array Scalar 的数据类型与 ndarray 有着相同的属性与方法。这样就可以在标量Scalars 与数组混合时进行更平滑的操作。

![](https://s2.ax1x.com/2019/09/29/u3Buwj.png)

> **Figure:** 图像展示了 Numpy 数据类型的树形结构，除了两个类型没有展示：`intp` 和 `uintp`，这两个代表 int 类型，用来保存一个平台的指针，根据平台不同而不同。

> **注意** ： Numpy 的内建数据类型并不是 np.dtype 的实例。



## 内建 Array Scalar 类型



大部分数据类型都是 C 语言的数据类型，同时它们还可以使用一种位宽约定的写法，例如 `int32`，代表 32 位的int类型。还有两种别名就是上面说的 `intp`与`uintp`，指向一个满足要求的可以保存平台指针的 int 类型。此外，每一种数据类型还与一种 Character code 相关联，但是 Numpy 不建议使用。

其中一些数据类型是与 Python 的内建数据类型完全对等的，因为它们就是 Python 数据类型的子类或者是别名。

其中完全对等的如下，即仅仅是 python 数据类的别名, 也有一些是 Python Dtype 的子类：

| Numpy dtype        | Python Dtype | Subclass               |
| ------------------ | ------------ | ---------------------- |
| np.str, np.unicode | str          | np.str_ , np.unicode_  |
| np.int             | int          | np.int_ (Python 2)     |
| np.bool            | bool         | -                      |
| np.float           | float        | np.float_              |
| np.complex         | complex      | np.complex_            |
| np.object          | object       | np.object_             |
| -                  | bytes        | np.bytes_ , np.string_ |

> * 一个例外是 bool 类型，在Python 中，bool 是 int 的子类，而且bool 不允许被继承，所以Numpy 中的`bool_` 并不是 Python bool 的子类。
>
> * 另一个例外是 `int_` 类型，这个在 Python2 中是 Python int 的子类，在Python 3 中不是。因为 Python 3 中的 int 不再是固定宽度的整数类型。

其实位宽写法才是 Numpy 中内建的Array数据类型的真正名字，如下：

![u8FaNV.png](https://s2.ax1x.com/2019/09/29/u8FaNV.png)

而其他的类型都是以上类型的别名：

![u8FdhT.png](https://s2.ax1x.com/2019/09/29/u8FdhT.png)

> 默认的数据类型是 **float_**



## Python 内建类型

| Python 类型                                                  | Numpy 类型                                 |
| ------------------------------------------------------------ | ------------------------------------------ |
| [`int`](https://docs.python.org/dev/library/functions.html#int) | `int_`                                     |
| [`bool`](https://docs.python.org/dev/library/functions.html#bool) | `bool_`                                    |
| [`float`](https://docs.python.org/dev/library/functions.html#float) | `float_`                                   |
| [`complex`](https://docs.python.org/dev/library/functions.html#complex) | `cfloat`                                   |
| [`bytes`](https://docs.python.org/dev/library/stdtypes.html#bytes) | `bytes_`                                   |
| [`str`](https://docs.python.org/dev/library/stdtypes.html#str) | `bytes_` (Python2) or `unicode_` (Python3) |
| `unicode`                                                    | `unicode_`                                 |
| `buffer`                                                     | `void`                                     |
| (all others)                                                 | `object_`                                  |





## 字符码



上面还说到，每一种数据类型都对应着一个字符码，如下：

| 别名       | 字符码 | 类型       |
| ---------- | ------ | ---------- |
| bool_      | `？`   | bool8      |
| byte       | `b`    | int8       |
| short      | `h`    | int16      |
| intc       | `i`    | int32      |
| int_       | `l`    | int64      |
| longlong   | `q`    | int64      |
| intp       | `p`    | int64      |
| ubyte      | `B`    | uint8      |
| ushort     | `H`    | uint16     |
| uintc      | `I`    | uint32     |
| uint       | `L`    | uint64     |
| ulonglong  | `Q`    | uint64     |
| uintp      | `P`    | uint64     |
| half       | `e`    | float16    |
| single     | `f`    | float32    |
| double     |        | float64    |
| float_     | `d`    | float64    |
| longfloat  | `g`    | floag128   |
| csingle    | `F`    | complex64  |
| complex_   | `D`    | complex128 |
| clongfloat | `G`    | complex256 |
| object_    | `O`    |            |
| bytes_     | `S#`   |            |
| unicode_   | `U#`   |            |
| void       | `V#`   |            |

其中包含 `#` 代表这个数据类型是 Flexible 的，即没有固定的大小，在不同的变量里大小可以是不同的，例如unicode 的 # 代表字符的个数。

## 属性



| 属性                                                         | 描述                                            |
| ------------------------------------------------------------ | ----------------------------------------------- |
| [`generic.flags`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.flags.html#numpy.generic.flags) | integer value of flags                          |
| [`generic.shape`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.shape.html#numpy.generic.shape) | tuple of array dimensions                       |
| [`generic.strides`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.strides.html#numpy.generic.strides) | tuple of bytes steps in each dimension          |
| [`generic.ndim`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.ndim.html#numpy.generic.ndim) | number of array dimensions                      |
| [`generic.data`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.data.html#numpy.generic.data) | pointer to start of data                        |
| [`generic.size`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.size.html#numpy.generic.size) | number of elements in the gentype               |
| [`generic.itemsize`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.itemsize.html#numpy.generic.itemsize) | length of one element in bytes                  |
| [`generic.base`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.base.html#numpy.generic.base) | base object                                     |
| [`generic.dtype`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.dtype.html#numpy.generic.dtype) | get array data-descriptor                       |
| [`generic.real`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.real.html#numpy.generic.real) | real part of scalar                             |
| [`generic.imag`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.imag.html#numpy.generic.imag) | imaginary part of scalar                        |
| [`generic.flat`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.flat.html#numpy.generic.flat) | a 1-d view of scalar                            |
| [`generic.T`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.T.html#numpy.generic.T) | transpose                                       |
| [`generic.__array_interface__`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.__array_interface__.html#numpy.generic.__array_interface__) | Array protocol: Python side                     |
| [`generic.__array_struct__`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.__array_struct__.html#numpy.generic.__array_struct__) | Array protocol: struct                          |
| [`generic.__array_priority__`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.__array_priority__.html#numpy.generic.__array_priority__) | Array priority.                                 |
| [`generic.__array_wrap__`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.__array_wrap__.html#numpy.generic.__array_wrap__)() | sc.__array_wrap__(obj) return scalar from array |

## 索引

Array scalar 可以像 0 维数组一样被索引：

- `x[()]` 返回一个副本
- `x[...]` 返回0维 [`ndarray`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.ndarray.html#numpy.ndarray)
- `x['field-name']` 返回 `field-name` 内的 scalar。



## 方法

数组内的标量拥有与数组完全一致的方法。这些方法会将标量转换为 0 维数组并调用数组方法进行处理。

一些例外的方法如下：

| 方法                                                         | 描述                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`generic`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.html#numpy.generic) | Base class for numpy scalar types.                           |
| [`generic.__array__`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.__array__.html#numpy.generic.__array__)() | sc.__array__(dtype) return 0-dim array from scalar with specified dtype |
| [`generic.__array_wrap__`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.__array_wrap__.html#numpy.generic.__array_wrap__)() | sc.__array_wrap__(obj) return scalar from array              |
| [`generic.squeeze`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.squeeze.html#numpy.generic.squeeze)() | Not implemented (virtual attribute)                          |
| [`generic.byteswap`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.byteswap.html#numpy.generic.byteswap)() | Not implemented (virtual attribute)                          |
| [`generic.__reduce__`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.__reduce__.html#numpy.generic.__reduce__)() | Helper for pickle.                                           |
| [`generic.__setstate__`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.__setstate__.html#numpy.generic.__setstate__)() |                                                              |
| [`generic.setflags`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.generic.setflags.html#numpy.generic.setflags)() | Not implemented (virtual attribute)                          |

## 定义新的数据类型



除了从内建类型构成 dtype 以外，还有两种方式构建新的数组scalar 类型：

* 一种方法是简单的继承 ndarray 并重写相应的方法，但是这种方法内部的具体行为由 Array 固定。
* 另一种完全自定义的方法是定义一个新的数据类型并在Numpy中注册。