# Python Mock

构建复杂的应用时，高质量的 Unittest 是非常必要的。要编写一个高质量高覆盖率的 Unittest，可能会遇到很多问题，比如多变的依赖问题，复杂的逻辑，对于外部服务的依赖等等。Mock 是一个很强大的工具，可以方便的解决这些问题，提高 Unittest 的质量

**调研的目标：**

* 可以创建 Python Mock 对象
* Assert 预期的对象
* 检查 Mock 中存储的数据
* 正确配置 Python Mock 的某些方面
* 使用 `patch()` 将 Mock替换为真实对象
* 解决使用 Mock 中的常见问题



## 什么是 Mock

**Mock 对象用来在测试环境中模拟一个真实的对象。** 使用 Mock 对象可以让你在测试中精确的控制代码的行为。

例如你的代码会发送一个 HTTP 请求，但是外部服务是不可控的，所以将真实的 HTTP 请求换成 Mock 对象，就可以模拟外部服务的行为。

可能有些代码中的逻辑很难在测试环境中达到要求，使用 Mock 对象可以方便的测试那些逻辑以提高测试覆盖率。

还有一个原因是 Mock 可以帮助你更好的理解它们模拟的那些真实对象，一个 Mock 对象包含的数据包括：

* 你是否调用了一个方法
* 你如何调用的这个方法
* 调用方法的频率

## The Python Mock Library

> Python v3.3+ 中包含`unittest.mock` 。低版本的需要进行安装：
>
> ```shell
> pip install mock
> ```

`unittest.mock` 提供了一个 `Mock` 对象和 `patch()` 方法。强大灵活的 Mock 可以满足你在 Test 中遇到的大部分问题。`patch()` 能够使用 Mock 对象来替换真正的对象，可以作为 **装饰器** 或者 **上下文** 使用，用来控制替换的范围。当退出上下文时，`patch()` 会将对象替换回来。

此外 `unittest.mock` 还为一些 Mock 本身的问题提供了方案。

## Mock 对象

Mock 对象非常灵活，几乎没有限制。

首先创建一个 Mock 对象：

 ```python
>>> from unittest.mock import Mock
>>> mock = Mock()
>>> mock
<Mock id='4561344720'>
 ```

现在你可以将 mock 对象作为任何对象使用，作为 **参数传递** 或者 **进行赋值** 来替换一些真实对象：

```python
# Pass mock as an argument to do_something()
do_something(mock)

# Patch the json library
json = mock
```

关键是，**当你使用 mock 对象替换真实对象的时候，这个mock 对象必须表现的和它代替的真实对象一样。**

例如，如果你用 mock 代替 json，并且你在代码中调用了 `json.dumps()` 方法，那么你的 mock 对象也必须拥有 `mock.dumps()` 方法。下面我们来看如果做到这一点。

### Lazy Attributes and Methods

Mock 需要模仿几乎所有类型的对象，为了做到这种灵活性，**Mock 在你真正访问属性或者方法的时候才会创建它们** 。

```python
>>> mock.some_attribute
<Mock name='mock.some_attribute' id='4394778696'>
>>> mock.do_something()
<Mock name='mock.do_something()' id='4394778920'>
```

接着前面的例子，如果你使用 mock 替换了 json，并且调用了 `dumps()` 方法，那么 mock 会在你调用的时候创建这个方法，这样 Mock 就可以匹配原来的 json 对象。

```python
>>> json = Mock()
>>> json.dumps()
<Mock name='mock.dumps()' id='4392249776'>
```

注意 mock 版本的 `dumps()` 的两个关键特性：

1. 和真正的 `dumps()` 不同， `mock.dumps()` 并不需要任何参数。**事实上，Mock 会记录下你传递的所有参数。**
2. `mock.dumps()` 的返回值依然是一个 Mock对象。Mock 这种递归的特性让你能在很复杂的情况下使用 Mock。

```python
>>> json = Mock()
>>> json.loads('{"k": "v"}').get('k')
<Mock name='mock.loads().get()' id='4379599424'>
```

接下来我们看如何用 Mock 来更好的理解你的代码。

### Assertions and Inspection

Mock 会将你如何使用它的信息保存下来。例如，你可以查看是否调用了某个方法以及如何调用的，等等。有两种主要的方式来使用这些信息。

首先你可以断言你的程序是否按你期望的方式使用某个对象：

```python
>>> from unittest.mock import Mock

>>> # Create a mock object
... json = Mock()

>>> json.loads('{"key": "value"}')
<Mock name='mock.loads()' id='4550144184'>

# 现在你知道你调用了 `loads()` 方法, 就可以进行断言。
>>> json.loads.assert_called()
>>> json.loads.assert_called_once()
>>> json.loads.assert_called_with('{"key": "value"}')
>>> json.loads.assert_called_once_with('{"key": "value"}')
```

> 需要注意的是 **位置参数和关键字参数是不相同的** 。

除了断言方法的调用信息，你还可以通过查看 attributes 来理解你的代码是如何使用这个对象的。

```python
>>> from unittest.mock import Mock

>>> # Create a mock object
... json = Mock()
>>> json.loads('{"key": "value"}')
<Mock name='mock.loads()' id='4391026640'>

>>> # 调用 loads() 方法的次数
... json.loads.call_count
1
>>> # 调用方法时的参数
... json.loads.call_args
call('{"key": "value"}')
>>> # 调用方法的参数的列表。
... json.loads.call_args_list
[call('{"key": "value"}')]
>>> # 所有调用的方法的列表
... json.method_calls
[call.loads('{"key": "value"}')]
```

你可以使用这些属性编写测试，来确保对象达到预期效果。

现在你知道如何查看 mock 对象内保存的信息，接下来我们来看 **如何自定义 mock 对象的方法** 来达到预期的效果。

### Managing a Mock’s Return Value

使用 Mock 的一个原因是在测试中控制代码的表现。一种方式是指定函数的 **返回值** 。

例如我们编写一个函数来判断今天是否是工作日：

```python
from datetime import datetime

def is_weekday():
    today = datetime.today()
    # Python's datetime library treats Monday as 0 and Sunday as 6
    return (0 <= today.weekday() < 5)

# Test if today is a weekday
assert is_weekday()
```

由于你要测试今天是否是工作日，测试的结果肯定是根据你的日期不同而不同。如果你周末运行这个脚本，那么就会断言失败。这时候你就可以使用 Mock 来固定 datetime 的返回值：

```python
import datetime
from unittest.mock import Mock

# Save a couple of test days
tuesday = datetime.datetime(year=2019, month=1, day=1)
saturday = datetime.datetime(year=2019, month=1, day=5)

# Mock datetime to control today's date
datetime = Mock()

def is_weekday():
    today = datetime.datetime.today()
    # Python's datetime library treats Monday as 0 and Sunday as 6
    return (0 <= today.weekday() < 5)

# Mock .today() to return Tuesday
datetime.datetime.today.return_value = tuesday
# Test Tuesday is a weekday
assert is_weekday()
# Mock .today() to return Saturday
datetime.datetime.today.return_value = saturday
# Test Saturday is not a weekday
assert not is_weekday()
```

> 使用 Mock 来模拟 datetime 是一个非常常见的做法，所以有一个 module 专门来做这件事：[`freezegun`](https://github.com/spulec/freezegun).

当编写测试的时候，仅仅一个确定的返回值往往不能满足要求，**函数内一般都有判断的逻辑，也包含多个返回值。** 这时候你可以使用 `.side_effect`。

### Managing a Mock’s Side Effects

你可以通过制定一个mock 函数的 [side effects](https://docs.python.org/3/library/unittest.mock.html#unittest.mock.Mock.side_effect) 来控制代码的行为。一个 `.side_effect` 定义了当你调用这个 mock 函数的时候会发生什么。

例如，定义一个新的函数：

```python
import requests

def get_holidays():
    r = requests.get('http://localhost/api/holidays')
    if r.status_code == 200:
        return r.json()
    return None
```

`get_holidays()` 向 `localhost` 发送了一个请求。如果 server 回应成功，会返回一个字典，否则返回 None。

你可以通过使用 `requests.get.side_effect` 来查看如果 connection timeout 的话，函数会返回什么。

```python
from requests.exceptions import Timeout
class TestCalendar(unittest.TestCase):
    def test_get_holidays_timeout(self):
        # Test a connection timeout
        requests.get.side_effect = Timeout
        with self.assertRaises(Timeout):
            get_holidays()
```

也可以将 `.side_effect` 设置为一个函数。**mock 函数会将方法传递给 `side_effect` 函数，并且返回函数的返回值。**

```python
class TestCalendar(unittest.TestCase):
    def log_request(self, url):
        # Log a fake request for test output purposes
        print(f'Making a request to {url}.')
        print('Request received!')

        # Create a new Mock to imitate a Response
        response_mock = Mock()
        response_mock.status_code = 200
        response_mock.json.return_value = {
            '12/25': 'Christmas',
            '7/4': 'Independence Day',
        }
        return response_mock

    def test_get_holidays_logging(self):
        # Test a successful, logged request
        requests.get.side_effect = self.log_request
        assert get_holidays()['12/25'] == 'Christmas'
```

`.side_effect` 也可以是 iterable。它必须包含返回值，异常或者两者都有。iterable 会在你每次调用的时候返回下一个值。例如你可以将 timeout 和 正常response 结合起来：

```python
# Set the side effect of .get()
requests.get.side_effect = [Timeout, response_mock]
# Test that the first request raises a Timeout
with self.assertRaises(Timeout):
    get_holidays()
# Now retry, expecting a successful response
assert get_holidays()['12/25'] == 'Christmas'
# Finally, assert .get() was called twice
assert requests.get.call_count == 2
```

---

你可以直接设置 `.return_value` 和 `.side_effect`。但是由于 Mock 对象需要创建attributes 的灵活性，所以有一个更好的方法来配置这些。

### Configuring Your Mock

Some configurable members include `.side_effect`, `.return_value`, and `.name`. You configure a `Mock` when you [create](https://docs.python.org/3/library/unittest.mock.html#unittest.mock.Mock) one or when you use [`.configure_mock()`](https://docs.python.org/3/library/unittest.mock.html#unittest.mock.Mock.configure_mock).

你可以在初始化的时候设置 Mock对象的属性：

```python
>>> mock = Mock(side_effect=Exception)
>>> mock()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/usr/local/Cellar/python/3.6.5/Frameworks/Python.framework/Versions/3.6/lib/python3.6/unittest/mock.py", line 939, in __call__
    return _mock_self._mock_call(*args, **kwargs)
  File "/usr/local/Cellar/python/3.6.5/Frameworks/Python.framework/Versions/3.6/lib/python3.6/unittest/mock.py", line 995, in _mock_call
    raise effect
Exception

>>> mock = Mock(name='Real Python Mock')
>>> mock
<Mock name='Real Python Mock' id='4434041432'>

>>> mock = Mock(return_value=True)
>>> mock()
True
```

像 `.side_effect` 和 `.return_value` 可以在 Mock对象中设置，而其他属性例如 `name` 只能在 `.__init__()` 或者 `.configure_mock()` 中配置。你如果在 Mock 对象中设置 `name` 这种 attribute，你会得到不同的结果：

```python
>>> mock = Mock(name='Real Python Mock')
>>> mock.name
<Mock name='Real Python Mock.name' id='4434041544'>

>>> mock = Mock()
>>> mock.name = 'Real Python Mock'
>>> mock.name
'Real Python Mock'
```

也就是说，如果你访问 `mock.name` 那么你会创建一个叫 name 的属性，而不是像 `side_effect` 那样配置了你的 Mock 对象。但是你可以使用 `configure_mock()` 方法来配置已经初始化 Mock对象。

```python
>>> mock = Mock()
>>> mock.configure_mock(return_value=True)
>>> mock()
True
```

> 注意，在 `__init__()` 或者 `configure_mock()` 中，除了可以配置的 keyword 以外，其他的属性也会被创建为对象的 attribute。

上面的例子使用初始化的方式就可以改为：

```python
# Verbose, old Mock
response_mock = Mock()
response_mock.json.return_value = {
    '12/25': 'Christmas',
    '7/4': 'Independence Day',
}

# Shiny, new .configure_mock()
holidays = {'12/25': 'Christmas', '7/4': 'Independence Day'}
response_mock = Mock(**{'json.return_value': holidays})
```

> 关于 name 属性，Mock 中的 name 类似于` __name__`, 也是用 `.` 分割，只不过 `__name__` 代表的 Module，Mock 的name 代表 attributes。

## Patch()

`unittest.mock` 提供了一个非常强大的机制来 mocking objects，`patch()` 它会搜索给定 module 的所有属性 并且将这些属性替换为 Mock 对象。通常，`patch()` 可以作为**上下文**或者**装饰器**使用。

### `patch()` as a Decorator

例如之前的 datetime 的例子，首先在 module `my_calendar`中创建一个函数：

```python
def is_weekday():
    today = datetime.today()
    # Python's datetime library treats Monday as 0 and Sunday as 6
    return (0 <= today.weekday() < 5)
```

现在你可以在另一个测试文件中去替换 `my_calendar` 中的 object。

这种方法叫做 Monkey patching。 [Monkey patching](https://en.wikipedia.org/wiki/Monkey_patch) 意思是将运行时的一个 object 用另一个来代替。例如：

```python
import unittest
from my_calendar import get_holidays
from requests.exceptions import Timeout
from unittest.mock import patch

class TestCalendar(unittest.TestCase):
    @patch('my_calendar.requests')
    def test_get_holidays_timeout(self, mock_requests):
            mock_requests.get.side_effect = Timeout
            with self.assertRaises(Timeout):
                get_holidays()
                mock_requests.get.assert_called_once()
```

上面的例子中，将 `patch()` 作为装饰器，并将需要替代的真实对象传递给它。然后在 test 函数中添加一个新的参数，这里是 `mock_requests` 代表你在 `patch()` 中生成的 mock 对象。

> **Technical Detail:** `patch()` returns an instance of [`MagicMock`](https://docs.python.org/3/library/unittest.mock.html#unittest.mock.MagicMock), which is a `Mock` subclass. `MagicMock` is useful because it implements most [magic methods](https://dbader.org/blog/python-dunder-methods) for you, such as `.__len__()`, `.__str__()`, and `.__iter__()`, with reasonable defaults.

### `patch()` as a Context Manager

有时候你会将 `patch()` 作为 Context Manager 使用。例如：

* 当你只需要在一个小的 scope 内使用 Mock 对象时。
* 你已经使用了许多装饰器或者参数，这样会让你的 test 可读性很差。

```python
import unittest
from my_calendar import get_holidays
from requests.exceptions import Timeout
from unittest.mock import patch

class TestCalendar(unittest.TestCase):
    def test_get_holidays_timeout(self):
        with patch('my_calendar.requests') as mock_requests:
            mock_requests.get.side_effect = Timeout
            with self.assertRaises(Timeout):
                get_holidays()
                mock_requests.get.assert_called_once()
```

---

到此为止，你已经知道如何完全的 Mock 一个真实的 Object，但是有时候你可能呢只想 Mock 这个 Object 的一部分。

### Patching an Object’s Attributes

例如你只想 Mock 一个 Object 的某个 Method。你可以使用 `patch.object()`。

例如，`.test_get_holidays_timeout()` 只需要 mock `requests.get()` 并且设置 `.side_effect` 为 `Timeout`:

```python
import unittest
from my_calendar import requests, get_holidays
from unittest.mock import patch

class TestCalendar(unittest.TestCase):
    @patch.object(requests, 'get', side_effect=requests.exceptions.Timeout)
    def test_get_holidays_timeout(self, mock_requests):
            with self.assertRaises(requests.exceptions.Timeout):
                get_holidays()
```

在上面的例子中，仅仅使用 `patch()` Mock 了 request 对象的 get 方法。

> **Further Reading:** Besides objects and attributes, you can also `patch()` dictionaries with [`patch.dict()`](https://docs.python.org/3/library/unittest.mock.html#unittest.mock.patch.dict).

有时候你可能不清楚要 Mock 的对象的路径。

### Where to Patch

知道你需要 mock 的 object 的路径非常重要。

假如你要 mock 的对象是 `my_calendar` 里的 `is_weekday()` 函数。

首先你需要导入 `my_calendar.py`，然后替换它的 `is_weekday()`。

```python
>>> import my_calendar
>>> from unittest.mock import patch

>>> with patch('my_calendar.is_weekday'):
...     my_calendar.is_weekday()
...
<MagicMock name='is_weekday()' id='4336501256'>
```

如果修改为导入 `is_weekday()` 函数，那么就会出错：

```python
>>> from my_calendar import is_weekday
>>> from unittest.mock import patch

>>> with patch('my_calendar.is_weekday'):
...     is_weekday()
...
False
```

所以你在 patch 中传入的路径是根据你的导入情况而言的。第二种情况不会成功是因为test 函数在 Local scope 内找到了 `is_weekday` 的引用。

>  A [good rule of thumb](https://docs.python.org/3/library/unittest.mock.html#where-to-patch) is to `patch()` the object where it is looked up.
>
> **Patch 的基本原则是 patch 能找到这个 object 的路径，而不是一定要定义这个 object 的路径。**
>
> * 如果导入某个 Module a，然后使用 `a.something`，则应该 `patch('a.somthing')`.
> * 如果从某个 Module a 中导入 somthing，则应该 patch 当前路径的 something：`patch('current.something')`。

例如这里当前 module 是 `__main__` ，那么就可以写为：

```python
>>> from unittest.mock import patch
>>> from my_calendar import is_weekday

>>> with patch('__main__.is_weekday'):
...     is_weekday()
...
<MagicMock name='is_weekday()' id='4502362992'>
```

现在已经知道 Mock 大致的功能了。下面将介绍一些 Mock 本身的问题和 `unittest.mock` 提供的方案。

## 常见问题

在 tests 中使用 Mock 可能会引入一些问题。一些问题是 mock 本身的，还有一些是 `unittest.mock` 特有的。注意这些问题并不是全部。

### 对象接口的更改以及拼写错误

#### 接口变化

类和函数的定义一直是在变化的。当一个对象的接口被修改的时候，所有的这个对象的 patch 都会失效。例如你修改了某个方法的名称，但是你在测试中 mock 了这个方法并且调用了 `.assert_not_called()`，那么即使你修改了方法的名称，并且调用了这个方法，那么你的断言仍然会返回 True，因为这个方法已经不存在了。

如果在 unittest 中出现以上问题，这种情况可能会对应用造成灾难性的影响。

#### 拼写错误

Mock 本身的特性也会让**拼写错误**对测试产生很重要的影响。因为 Mock 的特殊性，会对每个调用创建新的 Mock 对象，所以**即使你有拼写错误，Mock 依然会创建一个错误的对象。**

例如，一个简单的 case，如果你将 `.assert_called()` 拼写错误为 `.asert_called()`，你的测试不会抛出任何异常。因为这样会创建一个新的名字为 `.asert_called` 的 Mock 对象。

> **Technical Detail:** Interestingly, `assret` is a special misspelling of `assert`. If you try to access an attribute that starts with `assret` (or `assert`), `Mock` will automatically raise an `AttributeError`.
>
> 有趣的是，`assret` 是一个特殊的拼写错误，如果你尝试访问一个以 `assert` 或者 `assret` 开头的属性， Mock 会抛出一个异常。

上面这两个问题是你在 Mock 自己代码中的 对象时可能产生的问题，还有当你 Mock 其他代码库中的对象时的问题。

### 外部依赖的变化

这个问题就更常见了，当你的代码依赖一个外部的服务的时候，你使用 Mock 模拟了这个外部的服务，但是当这个外部服务改变的时候，你的 Mock 会失败，因为你的 Mock 对象并不会改变。而且 `unittest.mock` 对这方面没有任何的解决方案，你只能通过自己的判断来 Mock 外部的 Object。

上面这三个问题时 Mock 最常见的固有的问题，对于前两个问题，`unittest.mock` 提供了一些解决方案。

## 使用 Specifications 避免问题

之前提到的问题，**类接口或者函数定义的改变或者拼写错误，** 会给带有 Mock 的测试带来一些问题。

这些问题存在是因为 **Mock 会在你访问特定属性的时候才创建他们。** 解决问题的关键是**阻止 Mock 创建和你 mock 的真实对象不相关的属性。**

当你对 mock 对象进行配置的时候，你可以传入一个 `spec` 参数，这个 `spec`  可以传入一个名称的列表或者一个对象来指定 mock 的接口。如果你尝试  access 一个不存在的属性，Mock 会抛出一个 `AttributeError`。

```python
>>> from unittest.mock import Mock
>>> calendar = Mock(spec=['is_weekday', 'get_holidays'])

>>> calendar.is_weekday()
<Mock name='mock.is_weekday()' id='4569015856'>
>>> calendar.create_event()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/usr/local/Cellar/python/3.6.5/Frameworks/Python.framework/Versions/3.6/lib/python3.6/unittest/mock.py", line 582, in __getattr__
    raise AttributeError("Mock object has no attribute %r" % name)
AttributeError: Mock object has no attribute 'create_event'
```

对于对象也是一样，如果 `spec` 参数传入的是一个对象，那么如果访问那个对象没有的属性就会引起异常。

此外，`unittest.mock` 提供了一个方便的方法用来自动生成接口的 spec，一种方式是 `create_autospec()` 函数。

```python
>>> import my_calendar
>>> from unittest.mock import create_autospec

>>> calendar = create_autospec(my_calendar)
>>> calendar.is_weekday()
<MagicMock name='mock.is_weekday()' id='4579049424'>
>>> calendar.create_event()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/usr/local/Cellar/python/3.6.5/Frameworks/Python.framework/Versions/3.6/lib/python3.6/unittest/mock.py", line 582, in __getattr__
    raise AttributeError("Mock object has no attribute %r" % name)
AttributeError: Mock object has no attribute 'create_event'
```

另一种方式是 `patch()` 函数中的 `autospec` 参数：

```python
>>> import my_calendar
>>> from unittest.mock import patch

>>> with patch('__main__.my_calendar', autospec=True) as calendar:
...     calendar.is_weekday()
...     calendar.create_event()
...
<MagicMock name='my_calendar.is_weekday()' id='4579094312'>
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/usr/local/Cellar/python/3.6.5/Frameworks/Python.framework/Versions/3.6/lib/python3.6/unittest/mock.py", line 582, in __getattr__
    raise AttributeError("Mock object has no attribute %r" % name)
AttributeError: Mock object has no attribute 'create_event'
```

## 结论

Mock 是一个在测试中非常有用的方法，可以让**编写的测试质量更高**，并且能够**去除外部依赖的不稳定性**，而且还能**防止对外部信息的修改**。但是 Mock 也有一些特有的问题，特别是**无法模拟外部依赖的变化**。所以，应该**避免过度使用 Mock 的方法**。虽然 Mock 可以用来提高测试的质量，但是如果过度使用，反而会降低测试的质量。

## Reference

[Official Doc](https://docs.python.org/3/library/unittest.mock.html)

[Understanding the Python Mock Object Library](https://realpython.com/python-mock-library/)


