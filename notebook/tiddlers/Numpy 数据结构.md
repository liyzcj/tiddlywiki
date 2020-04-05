# Numpy 数据结构

Numpy 的数据类型（也就是 `numpy.dtyp` 的实例）描述了一个数组项对应的固定大小的内存块中的 bytes 如何被解释。它描述了数据的以下几方面：

1. 数据的类型（int，float，python object 等）
2. 数据的 bytes 数目
3. 数据的 bytes 顺序
4. 如果是[结构化数据](https://docs.scipy.org/doc/numpy/glossary.html#term-structured-data-type)，即其他数据类型的集合，类似于 C 的结构体。则：
    * field 的名称
    * field 的数据类型
    * 每个 field 使用的内存块位置。
5. 如果是一个 Sub-array，则记录 shape 和 数据类型



Array scalar 的数据有一些内建类型，包含不同精度的 Int 与 Float 类型。但是它们本身不属于 `np.dtype` 的实例。

结构化数据则是创建一个数据类型，它的 field 包含其他的数据类型。每个 field 都有一个 name 以便于访问，并且所有field 的 size 应该小于这个结构化数据类型的总的 size。所以一般结构化数据的数据类型是 void，拥有可变的数据大小。

最终，一个数据类型可以描述为另一种数据类型的数组，这些 sub-array 必须是固定大小的。

如果使用描述子数组的数据类型创建一个数据，那么子数组的维度会 apped 到数组中。

子数组在内存中总是连续的。



## 内建 Array scalar 数据类型

内建的数据标量数据类型虽然不是 dtype 的实例，但是每一种内建类型都对应着一个 dtype 实例，例如：



```python
>>> dt = np.dtype('>i4')
>>> dt.byteorder
'>'
>>> dt.itemsize
4
>>> dt.name
'int32'
>>> dt.type is np.int32
True
```

`>i4` 对应 `np.int32`。

虽然内建数据类型不是 dtype 的实例，但是它们可以和 dtype 的实例有相同的用法，它们可以被用来构建新的 dtype：

```python
>>> dt = np.dtype([('name', np.unicode_, 16), ('grades', np.float64, (2,))])
>>> dt['name']
dtype('|U16')
>>> dt['grades']
dtype(('float64',(2,)))
```

在这种自定义数据类型的条目同样有两个 field：

```python
>>> x = np.array([('Sarah', (8.0, 7.0)), ('John', (6.0, 7.0))], dtype=dt)
>>> x[1]
('John', [6.0, 7.0])
>>> x[1]['grades']
array([ 6.,  7.])
>>> type(x[1])
<type 'numpy.void'>
>>> type(x[1]['grades'])
<type 'numpy.ndarray'>
```

### build-in 与python

所有内建数据类型以及Python 的对象都可以作为一种类型传递给dtype，

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

```python
>>> dt = np.dtype(float)   # Python-compatible floating-point number
>>> dt = np.dtype(int)     # Python-compatible integer
>>> dt = np.dtype(object)  # Python object
```

## 字符码

同时每种数据类型都有一个字符码：

| 字符码       | 数据类型                                |
| ------------ | --------------------------------------- |
| `'?'`        | boolean                                 |
| `'b'`        | (signed) byte                           |
| `'B'`        | unsigned byte                           |
| `'i'`        | (signed) integer                        |
| `'u'`        | unsigned integer                        |
| `'f'`        | floating-point                          |
| `'c'`        | complex-floating point                  |
| `'m'`        | timedelta                               |
| `'M'`        | datetime                                |
| `'O'`        | (Python) objects                        |
| `'S'`, `'a'` | zero-terminated bytes (not recommended) |
| `'U'`        | Unicode string                          |
| `'V'`        | raw data (`void`)                       |

也可以使用这些字符码来构建新的数据类型：

```python
>>> dt = np.dtype('i4')   # 32-bit signed integer
>>> dt = np.dtype('f8')   # 64-bit floating-point number
>>> dt = np.dtype('c16')  # 128-bit complex floating-point number
>>> dt = np.dtype('a25')  # 25-length zero-terminated bytes
>>> dt = np.dtype('U25')  # 25-character string
>>> dt = np.dtype('b')  # byte, native byte order
>>> dt = np.dtype('>H') # big-endian unsigned short
>>> dt = np.dtype('<f') # little-endian single-precision float
>>> dt = np.dtype('d')  # double-precision floating-point number
```

> `>` 代表大端存储，高地址存低位字节，低地址存高位字节。
>
> `<` 代表小端存储，高地址存高位字节，低地址存低位字节。

### 逗号分隔字符码



使用逗号将不同类型分隔开，例如：



-  `f0` 包含 32 位整数
-  `f1` 包含 2 x 3 sub-array 的 64位浮点数
-  `f2` 包含 32 位浮点数 

```python
>>> dt = np.dtype("i4, (2,3)f8, f4")
```

-  `f0` 包含 3个字符的字符串
- `f1` 包含一个shape为(3,) 的 sub-array，类型为 64位无符号整数
-  `f2` 包含一个 3 x 4 的 sub-array，其中每个包含10 个字符的字符串。

```python
>>> dt = np.dtype("a3, 3u8, (3,4)a10")
```



### `numpy.sctypeDict`.keys()

可以使用 `numpy.sctypeDict`.keys() 中的任何类型：

```python
>>> dt = np.dtype('uint32')   # 32-bit unsigned integer
>>> dt = np.dtype('Float64')  # 64-bit floating-point number
```

### (flexible_dtype, itemsize)

第一个必须是可变大小的类型，第二个参数为大小：



```python
>>> dt = np.dtype((np.void, 10))  # 10-byte wide data block
>>> dt = np.dtype(('U', 10))   # 10-character unicode string
```

### (fixed_dtype, shape)

第一个参数为固定大小的数据类型，第二个参数为 shape：

```python
>>> dt = np.dtype((np.int32, (2,2)))          # 2 x 2 integer sub-array
>>> dt = np.dtype(('U10', 1))                 # 10-character string
>>> dt = np.dtype(('i4, (2,3)f8, f4', (2,3))) # 2 x 3 structured sub-array
```

### 结构体类型

* `[(field_name, field_dtype, field_shape), ...]`

必须为一个包含tuple 的list，其中每个tuple 中，第一个为 field name， 第二个为数据类型。



```python
>>> dt = np.dtype([('big', '>i4'), ('little', '<i4')])
>>> dt = np.dtype([('R','u1'), ('G','u1'), ('B','u1'), ('A','u1')])
```

* `{'names': ..., 'formats': ..., 'offsets': ..., 'titles': ..., 'itemsize': ...}`

一个包含各种属性的字典，name 为field name， format是field 的数据类型等等：

```python
>>> dt = np.dtype({'names': ['r','g','b','a'],
...                'formats': [uint8, uint8, uint8, uint8]})

>>> dt = np.dtype({'names': ['r','b'], 'formats': ['u1', 'u1'],
...                'offsets': [0, 2],
...                'titles': ['Red pixel', 'Blue pixel']})
```

* `{'field1': ..., 'field2': ..., ...}`

一个字典，其中 key 是field 的名称，值是一个 tuple 包含其他属性：

```python
>>> dt = np.dtype({'col1': ('U10', 0), 'col2': (float32, 10),
    'col3': (int, 14)})
```

> tuple 为 `(data-type, offset)` or `(data-type, offset, title)` .

* `(base_dtype, new_dtype)`

将一个 base 数据类型转换为新的数据类型，必须为相同的 size



```python
>>> dt = np.dtype((np.int32,{'real':(np.int16, 0),'imag':(np.int16, 2)})
                  
>>> dt = np.dtype((np.int32, (np.int8, 4)))
                  
>>> dt = np.dtype(('i4', [('r','u1'),('g','u1'),('b','u1'),('a','u1')]))
```



## Dtype 对象



### 属性

The type of the data is described by the following [`dtype`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.html#numpy.dtype) attributes:

| ATTR                                                         | 描述                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`dtype.type`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.type.html#numpy.dtype.type) | The type object used to instantiate a scalar of this data-type. |
| [`dtype.kind`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.kind.html#numpy.dtype.kind) | A character code (one of ‘biufcmMOSUV’) identifying the general kind of data. |
| [`dtype.char`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.char.html#numpy.dtype.char) | A unique character code for each of the 21 different built-in types. |
| [`dtype.num`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.num.html#numpy.dtype.num) | A unique number for each of the 21 different built-in types. |
| [`dtype.str`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.str.html#numpy.dtype.str) | The array-protocol typestring of this data-type object.      |

Size of the data is in turn described by:

| 属性                                                         | 描述                                       |
| ------------------------------------------------------------ | ------------------------------------------ |
| [`dtype.name`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.name.html#numpy.dtype.name) | A bit-width name for this data-type.       |
| [`dtype.itemsize`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.itemsize.html#numpy.dtype.itemsize) | The element size of this data-type object. |

Endianness of this data:

| 属性                                                         | 描述                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`dtype.byteorder`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.byteorder.html#numpy.dtype.byteorder) | A character indicating the byte-order of this data-type object. |

Information about sub-data-types in a [structured data type](https://docs.scipy.org/doc/numpy/glossary.html#term-structured-data-type):

| 属性                                                         | 描述                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`dtype.fields`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.fields.html#numpy.dtype.fields) | Dictionary of named fields defined for this data type, or `None`. |
| [`dtype.names`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.names.html#numpy.dtype.names) | Ordered list of field names, or `None` if there are no fields. |

For data types that describe sub-arrays:

| 属性                                                         | 描述                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`dtype.subdtype`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.subdtype.html#numpy.dtype.subdtype) | Tuple `(item_dtype, shape)` if this [`dtype`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.html#numpy.dtype) describes a sub-array, and None otherwise. |
| [`dtype.shape`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.shape.html#numpy.dtype.shape) | Shape tuple of the sub-array if this data type describes a sub-array, and `()` otherwise. |

Attributes providing additional information:

| 属性                                                         | 描述                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`dtype.hasobject`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.hasobject.html#numpy.dtype.hasobject) | Boolean indicating whether this dtype contains any reference-counted objects in any fields or sub-dtypes. |
| [`dtype.flags`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.flags.html#numpy.dtype.flags) | Bit-flags describing how this data type is to be interpreted. |
| [`dtype.isbuiltin`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.isbuiltin.html#numpy.dtype.isbuiltin) | Integer indicating how this dtype relates to the built-in dtypes. |
| [`dtype.isnative`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.isnative.html#numpy.dtype.isnative) | Boolean indicating whether the byte order of this dtype is native to the platform. |
| [`dtype.descr`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.descr.html#numpy.dtype.descr) | *__array_interface__* description of the data-type.          |
| [`dtype.alignment`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.alignment.html#numpy.dtype.alignment) | The required alignment (bytes) of this data-type according to the compiler. |
| [`dtype.base`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.base.html#numpy.dtype.base) | Returns dtype for the base element of the subarrays, regardless of their dimension or shape. |



### 方法

Data types have the following method for changing the byte order:

| 方法                                                         | 描述                                            |
| ------------------------------------------------------------ | ----------------------------------------------- |
| [`dtype.newbyteorder`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.newbyteorder.html#numpy.dtype.newbyteorder)([new_order]) | Return a new dtype with a different byte order. |

The following methods implement the pickle protocol:



| 方法                                                         | 描述               |
| ------------------------------------------------------------ | ------------------ |
| [`dtype.__reduce__`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.__reduce__.html#numpy.dtype.__reduce__)() | Helper for pickle. |
| [`dtype.__setstate__`](https://docs.scipy.org/doc/numpy/reference/generated/numpy.dtype.__setstate__.html#numpy.dtype.__setstate__)() |                    |


