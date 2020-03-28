# VSCode 开发环境

> https://code.visualstudio.com/

## 简介

vscode 是微软开发的一款可以方便多种语言开发的 IDE。Vscode 本身具有极高的可定制性，能够满足绝大部分的开发需求。

vscode 有两个版本，一个完全开源的版本和另一个基于开源的微软定制版本。微软定制版本添加了一些反馈信息收集等功能。绝大多数安装的都是微软定制版本。对于每个版本又分为稳定版和开发版，开发版会多一些测试功能。

vscode 的大部分功能由可扩展的插件来完成，其中一些插件是由 VScode 官方团队开发和维护的，还有很大一部分是用户自己开发的组件。

## 关于远程开发

Vscode 包含了一系列远程开发套件，基本原理是在远程服务器上（或者 Docker Container 内）开启一个 vscode 服务端，客户端可以连接服务端来进行开发。远程开发有以下好处：

* 所有 Code 全部保存在服务端，代码不易丢失。
* 所有配置保存在服务端，可以方便多台机器无缝切换。
* 直接在服务器环境中运行代码，无需本地配置开发环境。

也有一些不方便的地方：

* 由于需要和服务端保持连接，所以每次开发都要保证网络通畅。如果网络断掉就无法开发。
* 如果网络速度慢或波动较大，可能会产生写代码反应较慢等问题。

> 对于网络开发不是必须，如果没有特殊环境需求可以采用本地开发，就不会有这些问题。如果本地环境特殊（例如 Macos） 无法进行某些环境配置，可以使用 Docker 创建本地 container，然后连接到 Docker Container 内的开发环境，这样就不会产生网络问题。Vscode 的远程开发套件也对此提供了完善的支持。

## 常用插件列表

**需要注意的是，在远程模式中，有些插件需要运行在服务端，在安装时会有对应提示。**

### git

对于开发人员，git 是不可或缺的版本控制工具。

git 插件可以让你方便的进行文件比对，以及进行 commit pull push 等操作。

### python

对于 Python 开发，首先必须安装的是 Python 语言插件。

Python 插件提供了 Python 的运行，Debug，环境管理，Lint 工具，代码格式化，代码测试等一系列的功能。

> 由于 Vscode 是针对多语言开发设计，VScode 团队将不同开发语言相关的功能集成到各个语言的插件中。这样开发人员可以按功能需求进行安装，减少不必要的功能，保证 Vscode 的轻量性。

### autodocstring

对于 Python 语言的开发来说，docstring 提高了代码的可读性，也是 Python 的代码与文档结合的一个特色，是必须掌握的代码特性。

docstring 不仅仅是阅读代码时的好工具，还可以直接用来生成一个完整的项目文档。 [PEP 257](https://www.python.org/dev/peps/pep-0257/) 描述了关于 docstring 的相关规定，如果 docstring 能够按照规范编写的话，就可以方便的使用相关工具自动生成一个完善的 Python 文档。

对于 Python 文档，最常用的生成工具就是 Sphinx 文档工具链。所以就有一种 docstring 的格式为 sphinx。sphinx 的文档采用的语法时 reStructuredText，可以参考：[reStructuredText 语法](https://znote.readthedocs.io/zh/latest/program/markup/restructuredtext.html)

对于特定格式的 docstring，每次都手动编写格式显然是不合适的，docstring 插件可以帮助你快速的生成对应函数的 docstring，并填入参数的名称和返回值名称（如果你编写代码时写入 Type hint，docstring 还会填入对应的 type）

### Chinese (Simplified) Language Pack for Visual Studio Code

如果需要编辑器的中文支持，可以安装中文语言包。

### Python Indent

Python Indent 可以帮助你在换行时自动对齐

### Remote - SSH

这是远程开发的必备插件，可以通过 SSH 连接到远程服务端。

### Remote - Containers

远程开发套件之一，可以让你连接到本地的 Docker Container 中。



> 除了以上插件，VS code 还有各种有趣的插件，有兴趣可以自己探索。

## VSCode 工作区

Vscode 的工作区可以是**包含一个项目的文件夹**，也可以是一个**通过 VScode 创建的可以包含多个项目的 VSCode 工作区**。

### 打开文件夹

点击打开文件夹直接打开即可，打开以后该文件夹就作为当前工作区。

### 打开工作区

要打开一个工作区首先需要创建一个新的工作区，首先通过 `文件 -> 将文件夹添加到工作区` 将一个新的文件夹添加到当前工作区，再点击 `文件 -> 将工作区另存为` 就可以将当前工作区保存。

保存的工作区为一个 json 文件，文件内包含该工作区内包含的文件夹以及位置。下次打开时，只需要通过 `文件 -> 打开工作区` 即可打开保存的工作区。

Vscode 工作区的优势就是可以包含多个项目。而打开的文件夹只能包含一个项目。

## VScode 配置

前面提到 VSCode 有着极高的可定制性，这就不可避免的产生了大量的可配置项。

VScode 将所有的配置集中到一个 json 配置文件中。（这其中包含 Vscode 本身的配置以及所有已安装的插件的配置）

在 **local 模式**中，VScode 的配置有两份，**用户配置和工作区配置**。其中用户配置保存在用户的家目录中，工作区配置保存在当前工作区中的 `.vscode/setting.json` 中。优先级是**工作区配置 > 用户配置 > 默认配置**。

在 **Remote 模式**中，Vscode 的配置有三份，**用户配置、远程配置和工作区配置**。其中多出的远程配置保存在服务端。优先级是 **工作区配置 > 服务端配置 > 用户配置 > 默认配置**。

> 例如，当你在用户配置中设定了某个配置项，而你在当前工作区也设置了某个配置项，则工作区中的配置会覆盖用户的配置。

配置文件示例：

```json
{
    // 外观
    "window.zoomLevel": 1,
    "debug.console.fontSize": 14,
    "terminal.integrated.fontSize": 14,
    "breadcrumbs.enabled": true,
    "editor.fontSize": 14,
    "editor.minimap.enabled": false,
    "editor.renderWhitespace": "none",
    "editor.renderControlCharacters": true,
    "editor.foldingStrategy": "indentation",
    // "editor.rulers": [80],
    "workbench.colorTheme": "Monokai",
    "workbench.colorCustomizations": {
        "editorRuler.foreground": "#435e33",
        "editor.foldBackground": "#46372b"
    },

    // 其他
    "explorer.confirmDelete": false,
    "explorer.confirmDragAndDrop": false,
    "editor.suggestSelection": "first",
    "files.exclude": {
        // ".vscode": true,
        "**/__pycache__": true
    },

    // Extensions
    "autoDocstring.docstringFormat": "google",
    "autoDocstring.generateDocstringOnEnter": true,
    "autoDocstring.startOnNewLine": true,

    "python.linting.flake8Enabled": true,
    "python.linting.pylintEnabled": true,
    "python.dataScience.searchForJupyter": false,
    "python.dataScience.askForKernelRestart": false,
    "python.dataScience.sendSelectionToInteractiveWindow": false,
    "python.dataScience.allowLiveShare": false,

    "git.enableSmartCommit": true,
    "git.autofetch": true,
    "git.untrackedChanges": "separate",

    "commentAnchors.workspace.excludeFiles": "**/{node_modules,.git,.idea,target,out,build,vendor,.env}/**/*",
}
```

### 配置连接 SSH

在安装好 Remote-SSH 插件以后，侧边栏就会多出一个远程按钮。点击远程按钮以后，就会显示出你当前的 ssh config 中配置的所有远程主机，点击要连接的主机即可。

>  ssh config 文件的位置为 `$HOME/.ssh/config`。

## 有用的快捷键

快捷键的熟悉程度是对一个 IDE 是否熟悉的具体表现。通过使用快捷键，可以快速的提高开发效率。

下面是一些常用的快捷键：

> * 由于大家的开发大多都在 Mac上进行，所以仅仅列出 Mac 端的快捷键。
>
> * **快捷键是可以随意更改的**。如果有自己习惯的快捷键方式，可以进行自定义配置。
>
> * 快速查看当前快捷方式： `Cmd + k` `Cmd + s` 。
>
>   > 在快捷方式界面中按下搜索框后面的小键盘，或者 `Opt + Cmd + k`，可以进行按键录制来查看某个按键对应的功能。
>
> * **注意：两个并在一起的是组合键，需要首先按前面的再按后面的，不是一起按。**



| 快捷键               | 功能               |
| -------------------- | ------------------ |
| `Cmd + ,`            | 打开配置页面       |
| `Cmd + s`            | 保存文件           |
| `Cmd + w`            | 关闭当前页面       |
| `Cmd + o`            | 打开文件或文件夹   |
| `Cmd + Shift + p`    | 执行命令           |
| `Cmd + 鼠标左键`     | 跳转代码实现       |
| `Ctrl + -`           | 后退               |
| `Cmd + +`            | 放大界面           |
| `Cmd + -`            | 缩小界面           |
| `Cmd + f`            | 搜索当前文件内容   |
| `Cmd + j`            | 显示/隐藏底部面板  |
| `Ctrl + 反引号`      | 打开终端           |
| `Cmd + b`            | 显示/隐藏侧边脸    |
| `F5`                 | 调试代码           |
| `F4`                 | 运行代码（不调试） |
| `Cmd + Shift + 空格` | 显示代码提示       |
| `Cmd + 1~8`          | 切换到对应编辑器组 |
| `Cmd + /`            | 注释代码           |
| `Shift + 左键`       | 二段折叠代码       |

> 一个非常特殊并且实用的快捷键是 `Cmd + p` ，这会打开一个搜索框。
>
> * 最基础的操作是什么都不干，直接在搜索框内搜索当前工作区内的文件。可以用来方便快速的打开文件。
> * 高级的操作就是可以输入一个前缀，这样这个搜索框的功能就会改变。例如输入 `>` 就会变成命令搜索框，和上面的 `Cmd + Shift + p` 等价。
>* 输入 `?` 可以查看所有可用的前缀。

上面提到的只是我经常用到的快捷键，还有大量的快捷键大家可以自行探索。

### 命令

关于**命令搜索框**，也就是快捷键 `Cmd + Shift + p` 打开的搜索框。

通过**命令**可以完成 VScode 中的绝大部分操作。例如插件中增加的功能都会以命令的形式添加到 VSCode 的命令集当中。而快捷键就是将按键与命令绑定到一起。

例如 `Cmd + s` 就与命令 `File: Save` 绑定，执行这个命令和按下 `Cmd + s` 是一样的效果。

**所以对于大部分不常用的命令，并不需要知道命令的快捷键，只需要通过命令搜索框搜索命令并执行即可。**	




