# Python Descriptor

> * 什么是 Python Descriptor？
> * Python 内部是怎么使用它的？
> * 如何实现自己的 descriptors？
> * 什么时候使用 Python Descriptor？

## 什么是 Python Descriptors

Descriptors 是实现了 **descriptor protocol** 的 Python object，这个对象在作为其他对象的 attribute 的时候可以定义一些特殊的行为。这是 Descriptor protocol 的定义：

```python
__get__(self, obj, type=None) -> object
__set__(self, obj, value) -> None
__delete__(self, obj) -> None
__set_name__(self, owner, name)
```

如果一个 descriptor 仅仅实现了 `__get__()` 方法，那么可以称为 **non-data descriptor**。如果实现了 `__set__()` 或 `__delete__()` 那么可以称为 **data descriptor**。 **在搜索过程中，data descriptor 比 non-data descriptor 优先级更高。**

首先我们来看一个简单的示例，我们首先定义一个 Descriptor：

```python
class Verbose_attribute():
    def __get__(self, obj, type=None) -> object:
        print("accessing the attribute to get the value")
        return 42
    def __set__(self, obj, value) -> None:
        print("accessing the attribute to set the value")
        print("Got Value", value)
```

然后我们再定一个简单的 Class，这个 Class 的其中一个属性为 `Verbose_attribute` 的实例:

```python
class Foo():
    attribute1 = Verbose_attribute()
```

当我们初始化一个 `Foo` 的实例时，``Verbose_attribute` 也作为 `Foo` 的一个 Attribute 被实例化，这个实例化以后的 `Verbose_attribute` 就可以称作为一个 descriptor。我们来看一下这时候访问 Foo 的 Attribute 会出现什么情况：

```python
>>> my_foo = Foo()
>>> x = my_foo.attribute1
accessing the attribute to get the value
>>> print(x)
42
>>> my_foo.attribute1 = 2
accessing the attribute to set the value
Got Value 2
```

当这个 Descriptor 通过 `.` 符号访问时，产生了 **Binding 操作**。例如：

* 当你通过 `.` 访问一个 Descriptor 时，就会调用它的 `__get__()` 方法。

* 当你通过 `.` 符号对一个 Descriptor 进行**赋值操作**时，就会调用它的 `__set__()` 方法。

  > 通过 `__set__()` 方法实现只读的 Descriptor 是比较推荐的方式。

## Descriptor 在 Python 内部时如何工作的

如果你对 Python 的面向对象编程非常了解，你可以能觉得上面的方法有点不是那么必要，因为你完全可以通过 Property 实现同样的效果。这没错，但是你如果了解的再深入一地啊安，就会发现 Property ... 就是通过 Descriptor 实现的！这也就意味着 Property 其实是 Descriptor 的一个子集， Descriptor 还可以用来做其他的事情。

### Property 与 Descriptor

如果你想实现和之前的例子相同的方法，最直接的方式可能就是使用 **Property**。例如：

```python
class Foo():
    @property
    def attribute1(self) -> object:
        print("accessing the attribute to get the value")
        return 42

    @attribute1.setter
    def attribute1(self, value) -> None:
        print("accessing the attribute to set the value")
        print("Got Value", value)
```

这段代码和上面的 Descriptor 是相同的效果。不仅仅效果相同，在 Python 内部实现的原理也是一样的！所以 **Property 仅仅是一种 语法糖。** 上面的例子的完全体其实是这样：

```python
class Foo():
    def getter(self) -> object:
        print("accessing the attribute to get the value")
        return 42

    def setter(self, value) -> None:
        print("accessing the attribute to set the value")
        raise AttributeError("Cannot change the value")

    attribute1 = property(getter, setter)
```

`property()` 方法可以用来创建一个 Property，它的 Signature 为：

 ```python
property(fget=None, fset=None, fdel=None, doc=None) -> object
 ```

而 `property()` 返回的，就是一个实现了 Descriptor Protocol 的对象。它分别使用 `fget` `fset` `fdel` 参数来指定了 Protocol 中的 `__get__()` `__set__()` `__delete__()` 方法。



### 方法、函数与 Descriptor

如果你熟悉 Python 的面向对象编程，你肯定已经用过 **Method**，**Method** 就是一个 第一个参数为一个对象的函数。你可以通过 `.` 来调用某个对象的方法，这时候你其实是调用了一个函数，这个函数第一个参数就是你 `.` 之前的的那个 Object。

这个从 你的 `obj.method(*arg)` 到 `method(obj, *args)` 的过程就发生在一个 `__get__()` 函数中，也就是一个 **non-data descriptor** 中。再说详细点就是，这个函数对象实现了一个 `__get__()` 方法，从而在你通过 Dot `.` 符号访问时，返回了一个 bound method。而剩下的 `*args` 会原封不动的传递给那个函数。

我们看一个[官方文档](https://docs.python.org/3/howto/descriptor.html#functions-and-methods)中的例子：

```python
import types

class Function(object):
    ...
    def __get__(self, obj, objtype=None):
        "Simulate func_descr_get() in Objects/funcobject.c"
        if obj is None:
            return self
        return types.MethodType(self, obj)
```

在上面的例子中，当一个 Function Descriptor 通过 `.`  访问时，`__get__()` 方法会被调用，并且返回一个 bound method。

对于静态方法与类方法是类似的。例如对于静态方法 `obj.method(*args)` 会转换为 `method(*args)`，对于类方法 `obj.method(type(obj), *args)` 转换为 `method(type(obj), *args)`

在[官方文档](https://docs.python.org/3/howto/descriptor.html#functions-and-methods)中你可以找到类方法与静态方法在 python 中是如何实现的。

> 实际上 Cython 中，这些都是 C 实现的。

```python
class StaticMethod(object):
    "Emulate PyStaticMethod_Type() in Objects/funcobject.c"
    def __init__(self, f):
        self.f = f

    def __get__(self, obj, objtype=None):
        return self.f

class ClassMethod(object):
    "Emulate PyClassMethod_Type() in Objects/funcobject.c"
    def __init__(self, f):
        self.f = f

    def __get__(self, obj, klass=None):
        if klass is None:
            klass = type(obj)
        def newfunc(*args):
            return self.f(klass, *args)
        return newfunc
```

> 注意在 Python 中，**类方法**仅仅是第一个参数为类本身的**静态方法。**

## Attributes 是如何通过 Lookup Chain 访问的

要想进一步理解 Python Descriptor 与 Python 的内部机制，你需要理解当访问一个 Attribute 的时候发生了什么。

在 Python 中，任何一个 object 都有一个 `__dict__` Attribute。这是一个包含该对象所有 Attributes 的字典。例如：

```python
class Vehicle():
    can_fly = False
    number_of_weels = 0

class Car(Vehicle):
    number_of_weels = 4

    def __init__(self, color):
        self.color = color
```

```python
>>> my_car = Car("red")
>>> print(my_car.__dict__)
{'color': 'red'}
>>> print(type(my_car).__dict__)
{'__module__': '__main__', 'number_of_weels': 4, '__init__': <function Car.__init__ at 0x7fa7a8a24840>, '__doc__': None}
```

上面的代码打印出了 Object 的 `__dict__`以及 它的 Class 的 `__dict__`。在 Python 中，**任何东西都是 Object，当然也包括 Class。** 所以我们也可以看某个 Class 的 `__dict__` Attribute。

所以，当我们访问一个 Attribute 的时候会发生什么？

```python
>>> print(my_car.color)
red
>>> print(my_car.number_of_weels)
4
>>> print(my_car.can_fly)
False
```

在上面的例子中

* 当你访问 `my_car` 对象的 `color`  Attribute 时，实际上访问的是 `my_car` 的 `__dict__` 的一个值。
* 当你访问 `my_car` 对象的 `number_of_weels`  Attribute 时，实际上访问的是 `Car` Class 的 `__dict__` 的一个值。

* 当你访问 `my_car` 对象的 `can_fly`  Attribute 时，实际上访问的是 `Vehicle` Class 的 `__dict__` 的一个值。

所以，实际上解释器是通过一个 **Lookup Chain** 来找到你想要的 Attribute 的，假设你通过 `.` 访问属性 `A`，即 `obj.A`：

1. 首先，解释器会尝试获取一个以 `A`  命名的 **data descriptor** 的 `__get__()` 方法的返回值。
2. 如果失败，继续尝试获取**该对象**的 `__dict__` 中以 `A` 为关键字的值。
3. 如果失败，继续尝试获取以 `A` 命名的 **non-data descriptor** 的 `__get__()` 方法的返回值。
4. 如果失败，继续尝试获取**该对象的 Class** 的 `__dict__` 中以 `A` 为关键字的值。
5. 如果失败，继续尝试获取**该对象的 Class 的基类**的  `__dict__` 中以 `A` 为关键字的值。
6. 如果失败，上面的所有过程会根据 [Method Resolution Order](https://data-flair.training/blogs/python-multiple-inheritance/) 在所有的**基类**上重复一遍。
7. 如果失败，抛出一个 `AttributeError`

现在你应该知道了为什么要区分  **data descriptor** 与 **non-data descriptor** 了吧。它们在 Lookup Chain 中位于**不同的级别。**等下你会看到这种区别会非常的方便。

## 如果正确使用 Descriptor

如果你想在你的代码中使用 Descriptor，那你只需要实现对应的 **Descriptor Protocol**。在 Protocol 中，最重要的方法是 `__get__()` 与 `__set__()`，这两个方法的 Signature 如下：

```python
__get__(self, obj, type=None) -> object
__set__(self, obj, value) -> None
```

* `self` 是你编写的 Descriptor 的实例
* `obj` 是这个 Descriptor 附加到的对象实例
* `type` 是这个 Descriptor 附加到的对象的类

> `__set__()`  方法没有 `type` 参数是因为 **`__set__()` 只能在 Object 上调用。** 而 `__get__()` 可以从 Object 或者 Class 上调用。

另一个非常重要的注意事项是：**Descriptor 对于一个 Class 仅仅会实例化一次。**这意味着一个 Class 的所有实例都**共享**同一个 Descriptor 实例。这个特性一般不会被注意到，但是可能会导致一个经典的陷阱：

```python
class OneDigitNumericValue():
    def __init__(self):
        self.value = 0
    def __get__(self, obj, type=None) -> object:
        return self.value
    def __set__(self, obj, value) -> None:
        if value > 9 or value < 0 or int(value) != value:
            raise AttributeError("The value is invalid")
        self.value = value

class Foo():
    number = OneDigitNumericValue()
```

这里一个 `Foo` Class 有一个 `number` Attribute，是一个我们自己定义的 Descriptor，这个 Descriptor 接收一个单个数字并将它保存在 Descripter 的 `value` Attribute 中。并且在 `__get__()` 中返回这个 `value`。但是，**由于 `Foo`  Class 的所有实例都共享一个 Descriptor 实例，所以 `value` 类似于 Class 级别的 Attribute**。

```python
>>> foo_obj1 = Foo()
>>> foo_obj2 = Foo()
>>> foo_obj1.number = 3
>>> print(foo_obj2.number)
3
>>> foo_obj3 = Foo()
>>> print(foo_obj3.number)
3
```

那么如何解决这个问题呢？或者说如果你想为不同的实例存储不同的值，应该如何做呢？

比如我们可以在 Descriptor 里保存一个字典，在字典里对每一个 Instance 都保存一个值不就行了。例如：

```python
class OneDigitNumericValue():
    def __init__(self):
        self.value = {}

    def __get__(self, obj, type=None) -> object:
        try:
            return self.value[obj]
        except:
            return 0

    def __set__(self, obj, value) -> None:
        if value > 9 or value < 0 or int(value) != value:
            raise AttributeError("The value is invalid")
        self.value[obj] = value
```

这样，的确可以，因为 `__get__()` 方法是可以获取调用它的 Object 的，所以针对每一个 Object 在字典里保存不同的值就可以：

```python
>>> foo_obj1 = Foo()
>>> foo_obj2 = Foo()
>>> foo_obj1 = 2
>>> print(foo_obj2.number)
0
```

结果确实如我们所料。但是，这样却有一个潜在的关键问题。那就是，因为你在 Descriptor 里保存了 Object 的一个 **Strong Reference**，**当你不使用某个 Object 时，Garbage Collector 不会将这个 Object 的内存释放。**

对于这种情况，最好的解决办法就是**不要**将值保存在 Descriptor 中。将值**保存在对应的 Object** 中不就行了。例如：

```python
class OneDigitNumericValue():
    def __init__(self, name):
        self.name = name

    def __get__(self, obj, type=None) -> object:
        return obj.__dict__.get(self.name) or 0

    def __set__(self, obj, value) -> None:
        obj.__dict__[self.name] = value

class Foo():
    number = OneDigitNumericValue("number")
```

这个 Descriptor 将值保存在对应的 Object 的 `__dict__`中。

```python
>>> foo_obj1 = Foo()
>>> foo_obj2 = Foo()
>>> foo_obj1 = 2
>>> print(foo_obj2.number)
0
```

这么做的一个唯一问题是，你在使用这个 Descriptor 的时候，需要传递一个 `name` 给 `__init__()`  方法。

这个问题其实也有办法解决，如果你的 Python 版本**低于 3.6** 你需要使用 `metaclasses` 和 `decoraors`。如果你的 Python 版本是 3.6 或更高，那么就简单了，在 3.6，Descriptor Protocol 新增了一个 `__set_name__()` 方法，帮你做了这件事。

> `__set_name__()` 在 [PEP 487](https://www.python.org/dev/peps/pep-0487/)中提案。

```python
__set_name__(self, owner, name)
```

通过这个新方法，当你实例化一个 Descriptor 的时候，这个方法会被调用，并且 `nmae` 参数会**自动生成**。

```python
class OneDigitNumericValue():
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, type=None) -> object:
        return obj.__dict__.get(self.name) or 0

    def __set__(self, obj, value) -> None:
        obj.__dict__[self.name] = value

class Foo():
    number = OneDigitNumericValue()
```

这样就完美实现了需要的功能：

```python
>>> foo_obj1 = Foo()
>>> foo_obj2 = Foo()
>>> foo_obj1 = 2
>>> print(foo_obj2.number)
0
```

## 为什么要使用 Descriptor

现在你知道了什么是 Descriptor 以及 Python 是如何在内部使用 Descriptor 实现 method 以及 Property 的，以及如何实现一个 Descriptor。但你可能还是不清楚，我们为什么要使用 Descriptor，以及什么情况下才会使用 Descriptor。

一般情况下，即使是高级的 Python 开发者也确实很少用到这个 Feature。这也很正常，因为使用 Descriptor 的情况确实不多。但是，这也不意味着这仅仅是一个研究性的话题，仍然是有很多情况下能用到 Descriptor 的。

### Lazy Properties

第一个也是最直接的例子就是 **Lazy Properties**。意思就是一个 Property 在你第一次访问它的时候它才会被执行，而且在之后的每次调用都**不需要再次执行。**

考虑下面这个例子，你有一个 `DeepThhought` Class 包含一个方法 `meaning_of_life()` 这个方法每次调用都会思考三秒钟才能给出答案：

```python
import time

class DeepThought:
    def meaning_of_life(self):
        time.sleep(3)
        return 42
```

那么现在你**每次**调用这个方法，都需要等待三秒钟才能得到结果：

```python
>>> dt = DeepThought()
>>> dt.meaning_of_life  # spend 3 seconds
42
```

其实完全没必要对吗，因为这个方法每次返回的值都是一样的，这时候就可以利用一个 `LazyProperty` Descriptor:

```python
class LazyProperty:
    def __init__(self, function):
        self.function = function
        self.name = function.__name__

    def __get__(self, obj, type=None) -> object:
        obj.__dict__[self.name] = self.function(obj)
        return obj.__dict__[self.name]
```

然后修改一下 `DeepThought`：

``` python
class DeepThought:
    @LazyProperty
    def meaning_of_life(self):
        time.sleep(3)
        return 42
```

这时候，`meaning_of_life` 就变成了一个 Property，它会在你第一次访问的时候生成结果，然后你再访问的时候就不会去执行函数了：

```python
>>> dt = DeepThought()
>>> dt.meaning_of_life  # spend 3 seconds
42
>>> dt.meaning_of_life  # immediate
42
```

但是可能有一个有趣的地方你没有注意到，仔细思考一下这个过程。

1. 首先，你使用 `LazyProperty` 作为 Decorator 来装饰方法 `meaning_of_life`
2. `LazyProperty` 会将这个函数保存在自己的实例中，并且返回一个 Descriptor。
3. 当你通过 `.` 访问 `meaning_of_life` 时，由于 `meaning_of_life` 是一个 Descriptor，所以会调用 `__get__()` 方法
4. Descriptor 的 `__get__()` 方法调用之前保存的 `meaning_of_life` 函数，并将结果保存在 Object 的 `__dict__` 中，Key 为 `meaning_of_life`
5. **关键点：**当你再次调用`meaning_of_life` 时，根据 Lookup Chain，`__dict__` 中的 `meaning_of_life`**首先被找到**，直接返回结果。

为什么第二次调用时就会直接拿 `__dict__` 中的 `meaning_of_life` 而不是调用 Descriptor 的 `__get__()` 方法呢，这就是前面 Lookup Chain 中说的**方便的地方**。**因为这个 Descriptor 仅仅实现了 Protocol 中的 `__get__()` 方法，所以这是一个 non-data Descriptor。又因为 non-data Descriptor 的优先级低于 Object 的 `__dict__`!!!**

这就是为什么要区分 **data Descriptor** 与 **non-data Descriptor** 。如果你实现了 `__set__()`  方法，那么这个 `LazyProperty` 就不会再起作用。

> 你可能说这种特性通过 Python 自己的 Property 以及反射特性也可以轻松的实现，例如：
>
> ```python
> @property
> def test(self):
>   if hasattr(self, 'lazy_test'):
>     return self.lazy_test
>   self.lazy_test = #(code to evaluate lazy_test)
> ```
>
> 首先，前面说过 Property 其实就是实现了一个 Descriptor，这种实现方法就是相当于将**函数操作直接写在 Descriptor 中。**
>
> 如果仅仅有一个 LazyProperty是可以，但是当有多个 Lazy Properties 的时候呢，你要为每一个 Property 都这样写吗？这显然与 `DRY` 相悖。
>
> **其实，Descriptor 的一个主要作用就是将具有相同特性的 Property 抽象出来。**这一点从下面的例子也可以看出。

### D.R.Y 

另一个 Descriptor 的典型用法就是用来定义具有同样特性的 Property，这样你就不需要为每一个 Property 都重复编写相同的代码。

假设你有一个类，里面有五个不同的 Properties 都是相同的行为。每个 Property 都可以被设置为一个偶数，如果assign 一个奇数，则会设置为 0。

如果你不采用 Descriptor：

```python
class Values:
    def __init__(self):
        self._value1 = 0
        self._value2 = 0
        self._value3 = 0
        self._value4 = 0
        self._value5 = 0

    @property
    def value1(self):
        return self._value1

    @value1.setter
    def value1(self, value):
        self._value1 = value if value % 2 == 0 else 0

    @property
    def value2(self):
        return self._value2

    @value2.setter
    def value2(self, value):
        self._value2 = value if value % 2 == 0 else 0

    @property
    def value3(self):
        return self._value3

    @value3.setter
    def value3(self, value):
        self._value3 = value if value % 2 == 0 else 0

    @property
    def value4(self):
        return self._value4

    @value4.setter
    def value4(self, value):
        self._value4 = value if value % 2 == 0 else 0

    @property
    def value5(self):
        return self._value5

    @value5.setter
    def value5(self, value):
        self._value5 = value if value % 2 == 0 else 0
```

如果你采用 Descriptor 问题就会简单很多：

```python
class EvenNumber:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, type=None) -> object:
        return obj.__dict__.get(self.name) or 0

    def __set__(self, obj, value) -> None:
        obj.__dict__[self.name] = (value if value % 2 == 0 else 0)

class Values:
    value1 = EvenNumber()
    value2 = EvenNumber()
    value3 = EvenNumber()
    value4 = EvenNumber()
    value5 = EvenNumber()
```



## Conclusion

通过这篇文章，我们了解了：

* 什么是 Python Descriptor
* Python 在内部是如何利用 Descriptor 
* 如何编写一个 Descriptor

* Descriptor 的具体使用情况

## Reference

* [Python Descriptors: An Introduction](https://realpython.com/python-descriptors/#what-are-python-descriptors)

* [Descriptor HowTo Guide](https://docs.python.org/3/howto/descriptor.html#id1)

* [Python Multiple Inheritance – Python MRO (Method Resolution Order)](https://data-flair.training/blogs/python-multiple-inheritance/)


