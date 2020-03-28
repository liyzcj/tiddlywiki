! 如何构建一个 Python 项目

!! 初始化文件结构

> 一个 Python 官网提供的 Python Project 的典型结构：[[PyPA sample project|https://github.com/pypa/sampleproject]].

!!! setup.py

如果要进行打包并且分发一个项目或者应用，那么最重要的文件就是 setup.py，这个文件应该在你的项目的根目录中。

`setup.py`主要提供两种功能：

1. 这个是整个项目的配置文件。最主要的特点是 `setup.py` 内有一个 `setup()` 函数，这个函数的关键字参数代表了这个包的一些配置信息。在下面会详细介绍一些常用的参数。
2. 这个文件是命令行中打包命令的入口。你可以执行 `python setup.py --help-commands`来查看帮助信息。

!!! setup.cfg

`setup.cfg` 是一个配置文件，包含了对于 `setup.py` 的默认选项。

!!! README.rst / README.md

一个项目应该包含一个 readme 文件，用来描述整个项目。最常用的格式是 rsStructuredText，有时候也会用 Markdown，这两种格式都能支持。通常文件内的内容会传递给 `setup()` 函数的 `long_description`参数。

> Note：使用 setuptools 0.6.27+ 的版本默认会在源码包中查找( README, README.rst, README.txt) 文件。内建的 `distutils` 库在 Python 3.7 之后加入了这个特性。另外，setuptools 36.4.0+ 还会查找 README.md。

!!! MANIFEST.in

当你的包中包含不会被自动添加到 sdist 中的文件时，你需要一个 MANIFEST.in。详情请查看：“[[Including files in source distributions with MANIFEST.in|https://packaging.python.org/guides/using-manifest-in/#using-manifest-in]]”.

!!! LICENSE.txt

每一个 Python 包都应该包含一个 license 文件。在一些法律管辖区，没有指定 license 的包不允许在 copyright 之外被合法使用或者分发。如果你不确定使用哪种 license，你可以参考：[[GitHub’s Choose a License|https://choosealicense.com/]]。

!!! your package

虽然不是严格要求的，但是大多数项目都会将所有的 module 放到项目根目录的一个同名文件夹下。

!! SETUP 常用参数

所有的 metadata 和 Options 都可以在这里查到：[[点我|https://setuptools.readthedocs.io/en/latest/setuptools.html#metadata]]

!!! name

```python
name='sample',
```

你的Python项目的名称，代表了你的项目在 PyPI 中展示的名称。有效的名称有两个要求：

* 仅仅包含 ASCII 字母或者数字，还有下划线 `_` 横杠 `-` 或者句点 `.`
* 初始与结束的符号必须是字母或数字

> 注意下划线 `_` 会被自动替换为横杠 `-`。

当用户查找项目时，项目的名称是大小写无关的，并且除了字母和数字可以匹配任意长度的其他字符。例如你的项目名称叫做 `cool-stuff`，那么下面这些名字都可以匹配：

```bash
Cool-Stuff
cool.stuff
COOL_STUFF
CoOl__-.-__sTuFF
```

''需要强调的是，这个名称和你在使用时 Import 的 package 名称是没关系的。Import 时的名称仅仅和`packages` 参数指定的名字有关。'' 

''而对于下面的 develop 模式，也就是 pip 的 editable 模式，由于是采用将当前路径添加到 path 中的方式，所以在 package 中设置不同的名称并不会起作用，还是需要使用文件夹名称来导入。''

!!! version

```python
versio='1.2.3',
```

这是你这个项目当前的版本号，这使得用户可以方便的查看当前应用的版本，并决定安装哪一个版本。

这个版本号会在你发布应用以后显示在 PyPI 上面。

如果你自己的代码中也涉及到访问版本的代码，并且你不想让代码重复。有几种方案可以使用，详情查看： [[Single-sourcing the package version|https://packaging.python.org/guides/single-sourcing-package-version/#single-sourcing-the-version]]。

!!! description

```python
description='A sample Python project',
long_description=long_description,
long_description_content_type='text/x-rst',
```

为你的项目做一个短和长的描述，并且可以指定长描述的文件格式。

短的描述同样会显示在 PyPI 上，并且会在搜索的时候匹配到其中的内容。

!!! url

```python
url='https://github.com/pypa/sampleproject',
```

指定一个项目的官网。

!!! author

指定项目的作者和作者的 email：

```python
author='The Python Packaging Authority',
author_email='pypa-dev@googlegroups.com',
```

!!! license

```python
license='MIT',
```

指定一个项目的 LICENSE，如果你使用一个通用的 LICENSE，你可以填写 LICENSE 的简写，并且在下面的 classifiers 参数中指定相同的 license。

license 更常用的用法是用来指定一个不常用的或者私有的 LICENSE。通常还是推荐使用知名的 license 协议，不仅可以避免混淆，而且有些组织不允许使用未认证的 License。

!!! classifiers

```python
classifiers=[
    # How mature is this project? Common values are
    #   3 - Alpha
    #   4 - Beta
    #   5 - Production/Stable
    'Development Status :: 3 - Alpha',

    # Indicate who your project is intended for
    'Intended Audience :: Developers',
    'Topic :: Software Development :: Build Tools',

    # Pick your license as you wish (should match "license" above)
     'License :: OSI Approved :: MIT License',

    # Specify the Python versions you support here. In particular, ensure
    # that you indicate whether you support Python 2, Python 3 or both.
    'Programming Language :: Python :: 2',
    'Programming Language :: Python :: 2.6',
    'Programming Language :: Python :: 2.7',
    'Programming Language :: Python :: 3',
    'Programming Language :: Python :: 3.2',
    'Programming Language :: Python :: 3.3',
    'Programming Language :: Python :: 3.4',
],
```

classifiers 指定了一个包含了多个 分类的列表。完整的列表请查看：https://pypi.org/classifiers/.
尽管这个参数通常用来声明那些 Python 版本是支持的，但是这些信息在 PyPI 中也会被搜索到。如果要限制 Python 的版本，需要使用 `python_requires` 参数。

!!! keywords

```python
keywords='sample setuptools development',
```

用来描述项目的一些关键字。

!!! project_urls

```python
project_urls={
    'Documentation': 'https://packaging.python.org/tutorials/distributing-packages/',
    'Funding': 'https://donate.pypi.org',
    'Say Thanks!': 'http://saythanks.io/to/example',
    'Source': 'https://github.com/pypa/sampleproject/',
    'Tracker': 'https://github.com/pypa/sampleproject/issues',
},
```

这个参数用来指定一些额外的相关 URLs。

!!! packages

> Require
>
> Type: `List[Text]`

```python
packages=find_packages(exclude=['tests', 'tests.*']),
```

packages 是一个包含这个项目内所有 packages 的列表。你可以使用 `setuptools.find_pakcages()` 来自动查找。可以使用 `exclude` 参数指定被排除在外的包。

注意 `""` 代表 root package，即 setup.py 所在的目录。

''packages 参数中指定的包是在导入时使用的名称。''这个名称可以和代码所在的文件夹名称不同，可以通过下面的 `package_dir` 参数来指定真正的文件夹。

> 如果使用 `find_packages` 函数，则返回的就是查找到的文件夹的名称，所以最好是文件夹名称就设置为导入的package 名称。

!!! package_dir

> Optional

```python
package_dir = {'sample', 'another_dir'}
```

Package_dir 相当于将 Packages 中指定的 package 切换为 Value 中指定的目录。

root package 也可以被替换：`{'', 'src'}`

> 注意，即使替换了名称，但是导入时仍然以''文件夹的名称''为准。

!!! py_modules

```python
py_modules=["six"],
```

如果你的项目包含了一些单个文件的 module ，并且这个module 不在任何包中，那么你需要通过这个参数指定这些 modules。

!!! install_requires

```python
install_requires=['peppercorn'],
```

这个参数用来指定这个项目的依赖。当使用 pip 安装这个项目的时候，他会首先安装这些依赖。

> 与 requirements.txt 的区别: requirements.txt 通常用来创建一个完整的 Python 环境，而 install_requires 仅仅用来确定一个项目的依赖。

!!! extras_require

> Optional
>
> Type: `Dict[Text, List[Text]]`

指定额外的模式的依赖，例如在该项目的test 模式中需要额外的依赖 `foo` 和 `bar`:

```python
extras_require = {'test': ['foo', 'bar']}
```

这样在安装 test 模式的时候就会安装这些依赖：

```bash
pip install sample[test]
```

!!! python_requires

当你的项目仅仅在特定的 Python 版本中才能执行的时候，你可以使用这个参数指定支持的 Python 版本，当使用 pip 安装的时候 pip 会检查当前 Python 版本是否符合要求。例如：

```python
python_requires='>=3',
```

如果你的包仅仅支持 Python 3.3 ：

```python
python_requires='~=3.3',
```

或者你的包仅仅支持 Python 2.6，2.7 和其他所有大于 3.3 的版本：

```python
python_requires='>=2.6, !=3.0.*, !=3.1.*, !=3.2.*, <4',
```

> NOTE：这个特性最近才刚刚支持。setuptools 的版本必须高于 24.2.0.
>
> 另外，pip 的版本必须高于 9.0.0 才能识别这个参数。

!!! package_data

> Optional
>
> Type: `Dict[Text, List[Text]]`

```python
package_data={
    'sample': ['package_data.dat'],
},
```

很多时候，一些额外的数据也必须进行打包，这些通常是一些相关或者文档的数据。

这个参数的值必须是一个字典，其中 key 是对应的 package 名称，value 是一个包含了 data 文件的列表。

!!! include_package_data

> Optional
>
> Type: `bool`

如果设置为 True，则 setuptools 会自动将 `MANIFEST.in` 文件内指定的所有 data 都进行打包。

!!! data_files

> Optional
>
> Type: `List[Tuple[Text, List[Text]]]`

```python
data_files=[('my_data', ['data/data_file'])],
```

尽管 package_data 能够满足大部分的需求，但是仍然有些情况不能满足。例如，你想要将数据文件安装在你的包外部，data_files 可以做到这一点。

这个参数的值是一个包含多个(directory, files) 元组的列表。每个元祖表达了''需要安装到的文件目录''以及''数据的来源''。directory 如果是相对路径，这个''路径是相对于包的安装路径''的，默认是 `sys.prefix` 单用户安装时是 `site.USER_BASE`。files 是相对于 setup.py 所在的目录的相对路径。

更多详细信息查看：[[Installing Additional Files|http://docs.python.org/3/distutils/setupscript.html#installing-additional-files]]

> Note：当使用 egg 安装包时不支持这个参数，所以你必须使用 pip 来安装这个包。如果你非要使用 `python setup.py` 来安装，你必须添加选项 `--old-and-unmanageable`

!!! scripts

尽管 `setup()` 支持 scripts 关键字来指定一个执行的脚本，但是推荐的方式是使用 console_scripts entry points 来指定入口。

!!! entry_points

```python
entry_points={
  ...
},
```

使用此关键字可以指定项目为可能由您的项目或您依赖的其他项目定义的任何命名入口点提供的任何插件。

> 例如你编写了某个框架的插件，并且你知道那个框架中指定了某个entrypoint， 那么你可以通过这个参数来指定那个 entrypoint，这样那个框架就可以在''运行时通过 entrypoint'' 获取到你这个插件中的代码。

详细信息查看： [[Dynamic Discovery of Services and Plugins|https://setuptools.readthedocs.io/en/latest/setuptools.html#dynamic-discovery-of-services-and-plugins]] 

有一个特殊的 entrypoint 是 `console_scripts`。

```python
entry_points={
    'console_scripts': [
        'sample=sample:main',
    ],
},
```

使用 `console_scripts` entry points 来指定你的脚本的入口。因为这个特殊的 entrypoint 会被 setuptools 自带的工具''检测到并包装成一个命令行工具''，这个工具会自动调用你在 console_scripts 中指定的入口函数。

!! 选择一个版本号schema

!!! 符合标准并且实现互操作性

不同的 Python 项目可能会拥有不同的版本号模式，但是所有的模式必须遵守 [[''public version scheme''|https://www.python.org/dev/peps/pep-0440#public-version-identifiers]]，这个标准是由提案[[''PEP 440''|https://www.python.org/dev/peps/pep-0440]] 指定的，是为了对 pip 以及 setuptools 提供支持。

这是一些实例：

```python
1.2.0.dev1  # Development release
1.2.0a1     # Alpha Release
1.2.0b1     # Beta Release
1.2.0rc1    # Release Candidate
1.2.0       # Final Release
1.2.0.post1 # Post Release
15.10       # Date based release
23          # Serial release
```

[[''PEP 440''|https://www.python.org/dev/peps/pep-0440]] 还定义了一个一个技术  [[''version normalisation''|https://www.python.org/dev/peps/pep-0440#normalization]] 用来将不同的版本号归一化到标准的格式。

!!! 可选的版本 schema

https://packaging.python.org/guides/distributing-packages-using-setuptools/#semantic-versioning-preferred



!!!! Semantic versioning(首选)

对于一个新的项目，最推荐的格式是基于  [[Semantic Versioning|http://semver.org/]]，并且采用不同的方法来管理 预发布版本和构建元数据。

Semantic versioning 的本质是由三个主要的数字编码组成的：

1. MAJOR，主版本意味着更新了不兼容的 API；
2. MINOR，小版本意味着在后端增加了功能，但是有着兼容的 API；
3. MAINTENANCE 版本意味着修改 bug。

这样的版本管理可以让用户指定可兼容版本，例如 `name ~= A.B` 意味着版本不低于 `A.B` 但是在一个可兼容的大版本内。

使用 Semantic versioning 的 Python 项目必须遵守  [[Semantic Versioning 2.0.0 specification|http://semver.org/]]. 的前八条。

!!!! Date based versioning

Semantic versioning 并不是在任何项目中都适用，例如根据时间定期发布的版本，

基于日期的版本控制的主要优点是仅仅通过版本号就知道一个功能集的年龄。

基于日期的版本通常使用 YEAR.MONTH 的格式，例如 18.10 代表 18年 10 日。

!!!! Serial versioning

序列版本控制非常简单，仅仅包含一个每次发布都会增加的版本号。这对于开发者来说可能很简单，但是对于用户来说却不是很友好，他们不能从版本号中获取到任何兼容性相关的信息。

!!!! Hybird schemas

Hybird 指的是上面几种方式的组合。例如，YEAR.SERIAL 代表着 Data based versioning 和 Serial versioning 的组合方式。

!!!! Pre-release versioning

无论使用上面介绍的基础的版本格式的哪一个，预发布版本的代号都可以使用后缀来表示：

* 0 个或多个开发版本，后缀 `.devN`
* 0 个或多个 alpha 版本，后缀 `.aN`
* 0 个或多个 beta 版本，后缀 `.bN`
* 0 个或多个候选发布版本，后缀 `.rcN`

pip 或者其他比较先进的包安装器会在安装时忽略预发布版本。

!!!! Local version identifiers

Public version identifiers 的设计是为了使用  [[PyPI|https://packaging.python.org/glossary/#term-python-package-index-pypi]] 来进行软件分发。Python 的软件分发工具同时也支持 Local version identifiers，用来对并不准备发布出去的软件进行版本管理。

Local version identifier 采用格式：`<public version identifier>+<local version label>`，例如：

```python
1.2.0.dev1+hg.5.b11e5e6f0b0b  # 5th VCS commmit since 1.2.0.dev1 release
1.2.1+fedora.4                # Package with downstream Fedora patches applied 
```



!! 开发者模式

虽然并不是必须的，但是在进行项目处理时，通常会有一个选择是作为开发者在本地安装项目。这允许项目以可编辑的模式安装。

> 可编辑的意思是安装后，当你在源码位置进行修改后，对应的 module 也会自动修改。

假设你现在在项目的根目录下，执行命令：

```bash
pip install -e .
```

`-e` 代表 `--editable`，而 `.` 代表当前的工作目录，这个命令代表以编辑模式安装当前目录。这同样会安装 `install_requires` 参数指定的所有依赖，以及 `console_scripts` 参数指定的所有脚本。而所有的依赖则会按照通常的''不可编辑模式安装''。

> 执行命令 `python setup.py develop` 代表 develop 模式安装，与上面的 pip 命令等价。
>
> 这两个命令执行完毕以后会有三个改动：
>
>* 在当前目录也就是 setup.py 所在的目录生成一个 `egg-info` 结尾的文件夹。
>* 在 dist-packages 文件夹生成一个 `egg-link` 文件指向当前文件夹。
>* 在 dist-packages 文件夹的 easy-install.pth 文件中添加当前目录。
>
> ''注意''： 如果删除了 `egg-info` 文件夹或使用下面的命令卸载，那么 `pip list -e` 中不会显示安装了当前包。且会导致使用 `python setup.py develop -u` 卸载的时候不会自动删除 easy-install.pth 文件中的路径，导致包仍然可用。
>
> 目前卸载方法仅有 `python setup.py develop -u`，卸载时不会删除 `egg-info` ，会删除剩下两个。有些人说 `pip uninstall` 可以卸载，但是经测试不行。

!!! 依赖的编辑模式

有时候，同样有需求''以编辑模式安装一些依赖''。例如，假设你的项目依赖包 foo 与 bar，但是你想将 bar 作为可编辑模式进行安装，那么你可以编写一个这样的 `requirements.txt` 文件：

```bash
-e .
-e git+https://somerepo/bar.git#egg=bar
```

第一行的意思是安装你的项目以及对应的依赖。第二行的意思是以编辑模式重新安装依赖 bar，这会覆盖之前安装的 bar。

如果你想从本地的某个目录安装依赖 bar，那么这一条必须得在上面：

```bash
-e /path/to/project/bar
-e .
```

否则这个依赖会安装 PyPI 上的 bar。

如果你不想安装任何依赖，可以使用以下命令：

```bash
pip install -e . --no-deps
```

更多信息查看 setuptools 的 [[开发者模式|https://setuptools.readthedocs.io/en/latest/setuptools.html#development-mode]]。

!! 打包你的项目

如果想让你的项目可以想 PyPI 中那样安装，那么你需要将你的项目打包。

!!! 源码包 Source Distributions

最简单的打包方式是直接将源码打包。

```bash
python setup.py sdist
```

源码发行版指的是仅仅包含源码，并没有构建，在 pip 进行安装时，需要进行实时的构建。即使是使用纯 Python 编写的项目，同样有一个构建的步骤，从 setup.py 安装元数据。

!!! Wheels

> 为了减少歧义，构建是 build 的意思。

你应该同时为你的项目创建一个 wheel。一个 wheel 是一个已经 build 过的软件包，安装的时候就不需要 build 这个步骤。所以对于用户来说，安装 wheel 包比从源码安装快的多。

* 如果你的项目是纯 Python 项目，并且同时支持 Python2 与 Python3，那么你可以构建一个 Universal Wheel，见下一部分。

* 如果你的项目是纯 Python，但是并不能同时支持 Python2 与 Python3，那么你可以构建一个 Pure Python Wheel。
* 如果你的项目包含其他语言并且需要编译，那么你需要创建一个 Platform Wheel。

在为你的项目构造 wheel 包之前，你需要安装 wheel：

```bash
pip install wheel
```

!!! Universal Wheels

Universal Wheel 指的是纯 Python 并且同时支持 Python 2/3 的 wheel。这种 Wheel 包可以使用 pip 在任何平台上的任何位置安装。

要构建一个这样的 wheel ：

```bash
python setup.py bdist_wheel --universal
```

你也可以在 `setup.cfg` 文件中设置 `--universal` 选项。

```ini
[bdist_wheel]
universal=1
```

设置了 universal 意味着：

* 你的项目可以在 Python 2/3 上运行，而不需要其他操作；
* 你的项目仅仅包含 Python 代码。

> Note：bdist_wheel 不会对你的代码进行任何警告或者检查，即使你的代码不满足要求。

!!!  Pure Python Wheel

Pure Python Wheel 指的是那些 不够 universal 的纯 Python 代码。

```bash
python setup.py bdist_wheel
```

bdist_wheel 会检查你的代码是否是 Pure Python，并且构建一个以当前环境的 Python 主版本命名的 wheel。

如果你的代码支持 Python 2 与 Python 3 但是需要使用 `2to3` 进行转换，你可以使用不同的环境构建两个 Pure Python Wheel。

!!! Platform Wheels

Platform Wheels 指的是仅仅适用于特定平台的 Wheel 包。例如 Linux、Macos或者 Windows，通常包里会包含需要 build 的其他语言。

```bash
python setup.py bdist_wheel
```

bdist_wheel 会检测你的代码是否是 Pure Python，如果不是他会构建一个以当前平台命名的 wheel 包。

> Note: PyPI 现在支持上传 Windows，Macos 已经各种发行版 Linux ，详情见  [[''PEP 513''|https://www.python.org/dev/peps/pep-0513]]。

!! 上传 project 到 PyPI

当你运行了创建分发包的命令以后，会在你的项目目录下生成一个 dist 文件夹，文件夹里是生成的包。

> Note：dist 文件仅仅当你运行打包命令以后才会产生。所以当修改了 setup 的配置以后，需要重新运行打包命令才会生成新的包文件。

在将包上传到 PyPI 之前，可以首先将包上传到 [[PyPI 测试网站|https://test.pypi.org/]]，查看 [[Using TestPyPI|https://packaging.python.org/guides/using-testpypi/#using-test-pypi]] 了解如何使用。

>  Note: 你可能在一些教程中看到使用 `python setup.py register` 和 `python setup.py upload` 注册和上传软件包。但是这种做法是及其''不推荐''的。因为在某些 Python 版本中，这种方法可能会使用 HTTP 或者未验证的 HTTPS 来进行上传，这有可能会使你的账号和密码被劫持。

还有一个需要注意的点是 PyPI 使用的 reStructuredText 解析器''不是 Sphinx''。所以在上传之前可以使用这个工具来检查一下 discription 和 long_discription : [[pypa/readme_renderer|https://github.com/pypa/readme_renderer]] 

!!! 创建一个账号

首先，你需要创建一个 PyPI 的账号。你可以通过[[这个表格|https://pypi.org/account/register/]]来注册 PyPI 账号。

如果你不想在上传的时候输入账号和密码，你可以创建一个 `$HOME/.pypirc` 文件：

```ini
[pypi]
username = <username>
password = <password>
```

但是这种方法会以明文保存你的密码。

!!! 上传你的  Python 分发包

当你拥有账号以后，你可以使用 [[twine|https://packaging.python.org/key_projects/#twine]] 将分发包上传到 PyPI。

无论是新上传还是更新已有的包，步骤都是一致的：

```bash
twine upload dist/*
```

当你的 Python 包上传成功以后，你就可以通过 `https://pypi.org/project/<sampleproject>` 来访问，其中，`sampleproject` 是项目的名字。


! An  overview of packaging Python

Python 作为一个通用的编程语言，可以用来做 任何你想做的事，你可以使用 Python 来开发 Web 应用， 也可以使用Python 来开发一个软件或者游戏等等。 Python 的灵活性是为什么在一个 Python 项目的开始之前你就必须考虑这个项目的受众和这个项目的运行环境。在编写代码之前就需要思考如何打包可能会让开发者有点奇怪，但是这个过程可以避免将来可能会产生的许多麻烦。

! 关于部署的思考

包存在的意义在于被安装或者部署，所以 在你开始打包你的程序之前，你可能首先需要思考一下这些部署问题：

* 谁是你这个软件的用户？你的这个包是否会被其他的开发者作为 library 来进行软件开发？
* 你的代码会运行在 桌面端，服务端或者移动端，还是各种移动的嵌入式设备中？
* 你的软件是独立安装的吗？ 还是会依赖大量的其他模组？

打包仅仅有两个目标：1. 精确的目标环境；2.  部署的过程。对于这两个部分有许多不同的解决方案，这些方案 适用于不同类型的项目。下面会指导你找到最合适的打包解决方案。



! 打包相关的库和工具





你一定听说过 PyPI，`setup.py` 和 `whell`文件，这些仅仅是整个 Python 生态提供的打包分发工具的一小部分。关于这部分的详细内容可以查看： [[Packaging and distributing projects|https://packaging.python.org/guides/distributing-packages-using-setuptools/]]。



!! 面向技术人员的打包



!!! Python 模组

Python module 是一个 Python文件，仅仅依赖于标准库，并且可以被重新部署和复用。必须要保证整个模组使用正确的     Python 版本编写，并且仅仅依赖于标准库。

这是一个非常棒的方式来分享简单的脚本或者程序片段，但是要保证每个用户都拥有兼容的 Python 运行环境。甚至有标准的库支持以这种方式传播。例如  [[bottle.py|https://bottlepy.org/docs/dev/]] 和 [[boltons|http://boltons.readthedocs.io/en/latest/architecture.html#architecture]]。 

但是这种方式的有几个弊端：

* 不支持多个文件
* 不能有其他的依赖
* 不支持特定版本的 Python

!!! Python 源码分发

如果你的代码包含多个 Python 文件，通常会以一个文件目录的形式组织起来，任何包含 Python 代码的文件夹都可以作为一个导入包。

由于一个包由多个文件组成，提高了分发包的难度。许多协议仅仅支持一次传输一个文件。这样很容易导致不完整的传输，很难保证目标节点的代码完整性。

只要你的代码仅仅包含纯 Python 代码，并且你知道你部署的的环境能够兼容你的代码，那么你可以使用 Python 的原生打包工具来创建一个[[源码分发包|https://packaging.python.org/glossary/#term-distribution-package]]，简称 sdist。

Python 的 sdist 是压缩的档案格式（`.tar.gz`），它包含一个或多个包或者模组。如果你的代码是纯 Python，并且你仅仅依赖于其他 Python包，那么你可以参考[[这种打包方式|https://docs.python.org/3/distutils/sourcedist.html]]。

如果你的代码依赖于非 Python 代码或者 非 Python 包，那么你需要的可能是以下这种打包方式，同时下面这种打包方式对于纯 Python 代码也有很多好处。

> Python 于 PyPI 支持一个包有多种实现方式。例如 [[PIL distribution|https://pypi.org/project/PIL/]] 提供了 PIL 包，同时也提供了 [[Pillow|https://pypi.org/project/Pillow/]]，一个提供维护的 PIL 的fork。
>
> 这种强大的功能可以让你仅仅修改 requirements.txt 就可以更换代码中所使用的包。

!!! Python 二进制文件分发

Python 之所以如此强大，得益于它对于软件生态的集成能力，也就是我们常说的胶水语言。Python 可以轻易的将其他语言的生态集成在一起，尤其是 C，C++， Fortran，Rust 和其他一些语言。

并不是所有的开发者都能够找到合适的工具来构建，编译使用这些语言编写的库或者工具，所以 Python 创建了 [[wheel|https://packaging.python.org/glossary/#term-wheel]] ，一种可以用来传输包含编译后的 artifacts 的包格式。事实上，Python 的包安装工具 `pip` 总是倾向于安装 wheel 因为它更快，所以即使纯 Python 代码也倾向于使用 wheel 打包格式。

更加好的方式是编译后的二进制发行版与它们的源码一同打包，这样即使你不为所有的操作系统上传编译后的 wheel 包，通过上传 sdist 源码包，用户也可以自己根据他们需要的平台进行编译。默认情况下，需要将sdist 源码与编译后的 wheel 档案一起分发，除非针对非常特殊的情况，用户只需要其中一个版本。

Python 与 PyPI 使得同时上传 sdist 源码与 wheel 变得非常简单。 可以参考[[打包 Python 项目|https://packaging.python.org/tutorials/packaging-projects/]]。

[img[https://packaging.python.org/_images/py_pkg_tools_and_libs.png]]

上图为 Python 建议的打包工具。



!! 面向非技术人员-Python应用打包



到现在为止，我们仅仅涉及了 Python 原生的打包与分发工具。而且仅仅涉及在 Python 环境下运行，并且面向的是了解 Python 的技术人员。

Python 原生的打包是为了开发者之间的代码复用，库的调用等等。你可以基于 Python 的原生打包工具，借助类似 setuptools entry_points 这种功能来构建简单的工具或者应用。

> 这里的原文是 You can ''piggyback'' tools, or basic applications for developers, on top of Python’s library packaging, using technologies like [[setuptools entry_points|http://setuptools.readthedocs.io/en/latest/setuptools.html#automatic-script-creation]]. 这里的 Piggyback 很有意思，是英文的一个俚语。作为名词是背背的意思，Daddy，Give me a piggyback! 作为动词演化为了基于什么的意思。 现在还可以用来表示 蹭网。''piggyback on neighbor's wifi''  哈哈。
>
> 详情查看 [[美国俚语Piggyback|https://www.jianshu.com/p/3761d8016a81]]

Libraries 是构建软件用的模块，而不是一个完整的应用。对于应用的分发，那完全就是另一个船新的世界。

接下来我们就来了解一下应用的各种打包方式。

!!! 依赖于一个框架

有一些 Python 应用类型，例如网站的后台或者其他网络服务，这类应用非常普遍，以至于它们有支持开发与打包的完整框架。其他类型的应用程序，例如网页的前端和客户端非常的复杂，以至于目标不仅仅框架。

在这些用例中 ，应该合理的使用 框架提供的打包与部署方式。一些框架包含了一个部署系统，其中包含了一些下面列出的技术。这种情况下，应该遵循框架的指导进行简单有效的部署。

下面列出一些框架的打包方式：

!!!! 服务平台

如果你想在 Paas 平台上部署，例如 Heroku 或者 Google App Engine，你可以阅读相关的部署指导：

* [[Heroku|https://devcenter.heroku.com/articles/getting-started-with-python]]
* [[Google App Engine|https://cloud.google.com/appengine/docs/python/]]
* [[PythonAnywhere|https://www.pythonanywhere.com/]]
* [[OpenShift|https://blog.openshift.com/getting-started-python/]]
* “Serverless” frameworks like [[Zappa|https://www.zappa.io/]]

如果你遵循这些平台的开发指导，他们会自动帮你完成打包与分发工作。

!!!! Web 或者移动应用

Python 的稳步发展进入了一些新的领域。现在你可以使用 Python 来开发一个Web 前端或者移动应用，虽然你很熟悉 Python 语言，但是这些应用的打包与部署方式与普通的方式是完全不同的。

如果你想要开发这样一款应用，那么你可能需要依赖以下框架的打包指导：

* [[Kivy|https://kivy.org/#home]]
* [[Beeware|https://pybee.org/]]
* [[Brython|https://brython.info/]]
* [[Flexx|http://flexx.readthedocs.io/en/latest/]]

如果你对这些框架感兴趣，或者仅仅是好奇里面的一些技术，请继续参考以下内容。

!!! 依赖于一个预安装的 Python

现在绝大部分电脑上都预安装了 Python，包括 Linux 和 Mac 系统。现在你完全可以开发一个 Python 应用并安装在这些系统预安装的 Python 环境中。

支持这种情况下的技术有：

* [[PEX|https://github.com/pantsbuild/pex#pex]] (Python EXecutable)
* [[zipapp|https://docs.python.org/3/library/zipapp.html]] (does not help manage dependencies, requires Python 3.5+)
* [[shiv|https://github.com/linkedin/shiv#shiv]] (requires Python 3)

!!! 依赖于一个独立的软件分发生态

在之前的很长一段时间里，一些操作系统包括 Mac 没有一个很好的内置包管理系统。仅仅最近几年，才有了 App Stores 这样的概念，但是这种仍然是主要面向客户，而不是开发者。

开发者一直在寻找一个好的解决方案，在这种混乱中，涌现了很多开发者自己的包管理系统，例如 [[Homebrew|https://brew.sh/]]。和 Python 相关的是著名的 [[Anaconda|https://en.wikipedia.org/wiki/Anaconda_(Python_distribution)]]。

!!! 构建自己的 Python可执行应用

计算机是用来执行程序的。每一个操作系统都会支持运行一种或者多种格式。

有许多技术和方法可以将 Python 编译成为操作系统可以执行的格式，其中大部分是将 Python 解释器与其他的依赖打包到一个可执行文件中。

这种方法称为 freezing，提供了很好的兼容性和无缝的用户体验，尽管这通常需要多种技术和大量的精力。

下面是一些常用的 freezers：

* [[pyInstaller|http://www.pyinstaller.org/]] - Cross-platform
* [[cx_Freeze|https://anthony-tuininga.github.io/cx_Freeze/]] - Cross-platform
* [[constructor|https://github.com/conda/constructor]] - For command-line installers
* [[py2exe|http://www.py2exe.org/]] - Windows only
* [[py2app|https://py2app.readthedocs.io/en/latest/]] - Mac only
* [[bbFreeze|https://pypi.org/project/bbfreeze]] - Windows, Linux, Python 2 only
* [[osnap|https://github.com/jamesabel/osnap]] - Windows and Mac
* [[pynsist|https://pypi.org/project/pynsist/]] - Windows only

还有一些构建容器应用，甚至是构建自己的内核与硬件。详细可以参考[[An Overview of Packaging for Python|https://packaging.python.org/overview/]]

! Reference

* [[Python Packaging User Guide|https://packaging.python.org/]]
* [[An Overview of Packaging for Python|https://packaging.python.org/overview/]]
* [[Packaging and distributing projects|https://packaging.python.org/guides/distributing-packages-using-setuptools/]]