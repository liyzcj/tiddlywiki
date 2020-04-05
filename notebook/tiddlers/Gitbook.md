# 在git pages上部署Gitbook



## 下载安装nvm

```shell
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
```
**注意：默认添加环境变量到`.bashrc`**

## 使用 nvm 安装最新版本 nodejs

```shell
nvm install node
```

## 使用 npm 安装gitbook-cli

```shell
npm install gitbook-cli -g
```

## 使用git book创建静态页面

### 创建并初始化

```shell
mkdir zshbook
cd zshbook
gitbook init
```

### 配置git book

执行初始化命令后会生成如下文件：

> SUMMARY.md
>
> README.md

在`SUMMARY.md`内创建书的目录结构：

```markdown
# Summary

* [Introduction](README.md)
* [介绍](introduction/README.md)
    * [为什么选择ZSH](introduction/whyzsh.md)
    * [不涉及部分](introduction/exclude.md)
* [配置ZSH](configure/README.md)
    * [初始文件](configure/startfile.md)
    * [可配置选项](configure/options.md)
    * [提示符](configure/prompts/README.md)
        * [转义字符](configure/prompts/escape.md)
        * [条件表示](configure/prompts/conditional.md)
        * [格式化](configure/prompts/format.md)
    * [查看其他用户](configure/others/README.md)
        * [格式化登录、注销监视器](configure/others/format.md)
* [易用性](convenience/README.md)
    * [别名](convenience/alias.md)
    * [cd的整个故事](convenience/cdstory.md)
    * [目录栈](convenience/dirstack.md)
    * [大括号扩展](convenience/braceexpansion.md)
    * [命令历史](convenience/history/README.md)
        * [使用fc](convenience/history/usefc.md)
        * [命令历史扩展](convenience/history/history_expansion.md)
* [zsh编程](program/README.md)
    * [参数：概述](program/parameter/README.md)
        * [数组参数](program/parameter/array.md)
        * [下标](program/parameter/subscript.md)
        * [参数扩展](program/parameter/expansion.md)
    * [文件名通配符](program/filename/README.md)
        * [修饰符](program/filename/modifier.md)
        * [操作符和限定符](program/filename/qualifier.md)
* [自定义补全](completion/README.md)
    * [了解自动补全](completion/start.md)
    * [更多实例](completion/examples.md)
* [额外功能](ammenities/README.md)
    * [限制模式](ammenities/restricted.md)
    * [模拟其他shell](ammenities/emulaltion.md)
* [更多信息](moreinfo.md)
* [终](final.md)

```

**修改`SUMMARY.md`文件以后再次执行`gitbook init`自动创建文件与文件夹。**

```shell
❯ tree zsh_workshop
zsh_workshop
├── ammenities
│   ├── emulaltion.md
│   ├── README.md
│   └── restricted.md
├── book.json
├── completion
│   ├── examples.md
│   ├── README.md
│   └── start.md
├── configure
│   ├── options.md
│   ├── others
│   │   ├── format.md
│   │   └── README.md
│   ├── prompts
│   │   ├── conditional.md
│   │   ├── escape.md
│   │   ├── format.md
│   │   └── README.md
│   ├── README.md
│   └── startfile.md
├── convenience
│   ├── alias.md
│   ├── braceexpansion.md
│   ├── cdstory.md
│   ├── dirstack.md
│   ├── history
│   │   ├── history_expansion.md
│   │   ├── README.md
│   │   └── usefc.md
│   └── README.md
├── final.md
├── introduction
│   ├── exclude.md
│   ├── README.md
│   └── whyzsh.md
├── moreinfo.md
├── node_modules
│   ├── gitbook-plugin-splitter
│   │   ├── book
│   │   │   ├── splitter.css
│   │   │   └── splitter.js
│   │   ├── gitbook-splitter-demo.gif
│   │   ├── index.js
│   │   ├── LICENSE.txt
│   │   ├── package.json
│   │   └── README.md
│   ├── gitbook-plugin-theme-comscore
│   │   ├── book
│   │   │   ├── test.css
│   │   │   └── test.js
│   │   ├── index.js
│   │   ├── LICENSE
│   │   ├── package.json
│   │   └── README.md
│   └── gitbook-plugin-toggle-chapters
│       ├── book
│       │   ├── toggle.css
│       │   └── toggle.js
│       ├── index.js
│       ├── LICENSE
│       ├── package.json
│       └── README.md
├── program
│   ├── filename
│   │   ├── modifier.md
│   │   ├── qualifier.md
│   │   └── README.md
│   ├── parameter
│   │   ├── array.md
│   │   ├── expansion.md
│   │   ├── README.md
│   │   └── subscript.md
│   └── README.md
├── README.md
└── SUMMARY.md

18 directories, 58 files

```

### 创建静态页面

```shell
gitbook build
```

构建静态页面至`_book`目录。

### 创建本地服务器

```shell
gitbook serve
```

打开本地服务器，并实时修改生成文件的内容

### 安装gitbook插件

创建`book.json`文件，并在文件内填写插件名称

```json
{
    "author": "Li Yanzhe <liyz0912@gmail.com>",
    "description": "A GitBook about Zsh",
    "extension": null,
    "generator": "site",
    "links": {
        "sharing": {
            "all": null,
            "facebook": null,
            "google": null,
            "twitter": null,
            "weibo": null
        }
    },
    "pdf": {
        "fontSize": 12,
        "footerTemplate": null,
        "headerTemplate": null,
        "margin": {
            "bottom": 36,
            "left": 62,
            "right": 62,
            "top": 36
        },
        "pageNumbers": false,
        "paperSize": "a4"
    },
    "plugins": [
        "theme-comscore",
        "splitter",
        "toggle-chapters"
    ],
    "title": "Zsh 简介",
    "variables": {}
}
```

**使用`gitbook install`命令安装插件**

## 部署静态页面至git pages

### 在github创建空仓库

在github上创建一个空的仓库，并复制仓库链接。

> https://github.com/liyzcj/zshbook.git

### 初始化git

将 gitbook 目录初始化为git：

```shell
git init
echo "_book" > .gitignore
```
**一定要在创建分支前创建`.gitignore`文件，否则会导致创建`gh-pages`分支后没有`_book`目录**

### 添加远程仓库

```shell
git remote add origin https://github.com/liyzcj/zshbook.git
git push --set-upstream origin master
```


### 创建分支

```shell
git checkout --orphan gh-pages ## 创建空分支
git rm --cached -r . ## 删除缓存空间文件
git clean -df ## 删除硬盘文件
```

现在`gh-pages`分支下只有`_book`文件夹。将文件夹内的静态文件拷贝出来。

```shell
cp -r _book/* .
git add .      ## 将所有静态文件和.gitignore文件添加到分支。
git commit -m "Publish book"  ## 提交
```

**`gitbook build`会在`_book`内生成相同的`.gitignore`文件**

### 上传`gh-pages`分支

```shell
git push -u origin gh-pages   ## 远程创建并上传分支
```

