# Python 的五个彩蛋

本文用来测试如何将 `jupyter notebook` 导入 `tiddlywiki`.

在使用 `tiddlywiki` 做 python 笔记的过程中, 觉的不应该仅仅列出代码, 而是应该亲自进行试验以后, 将代码与执行结果记录以方便查阅. 完成这件事情最好的办法就是 `jupyter notebook` 了, 但是问题是 `jupyter` 建立的笔记本只能在 `jupyter` 服务器打开. 于是就去网上查找有没有人做过类似的事情, 将 `jupyter notebook` 与 `tiddlywiki` 相结合. 很遗憾, 虽然查到 reddit 上有一个五年前的帖子有人提到了这个想法, 但是后面就没有下文了. 

最终, 想到可以将笔记本转换为 `html` 然后嵌入到 `tiddlywiki`. 查了资料发现 `jupyter` 自带文件转换功能, 可以生成多种格式. 那么就简单了, 选择一个生成一个格式然后嵌入到 `tiddlywiki` 中就可以轻松实现我的需求. 但是生成了 `html` 以后, 另一个问题出现了, 生成的 `html` 是附带文件头定义, 的有大量的格式, 没有多少文字就达到 200 多 kb, 这么大的文件肯定不行, 于是就想能不能将格式定义等做成一个 `tiddlywiki` 的插件, 然后仅仅将笔记内容作为一个条目. 无奈目前对网页的知识还不熟悉, 要实现这一功能很难.

那么就只有最后一个也是最简单的选择了, 那就是生成 `markdown` 格式, 再嵌入到 `tiddlywiki`中, 这样生成的文件特别小, 恰巧 `tiddlywiki` 官方也有插件支持 `markdown` 解释器. 在测试了之后, 新的问题又出现了. 官方的 `tiddlywiki` 解释器基于 `markdown.js`. 并不支持反引号所指示的代码块, 而且也不支持高亮. 这个问题不解决这条路也行不通了. 只好又开始查资料, 这么大的问题果然还是有很多人提出来的, 终于最后找到了一个基于官方 `markdown` 插件修改过的插件, 不仅支持反引号代码块, 而且支持代码高亮. 在最新的修改中, 还支持了链接其他条目与数学公式. 真的是非常完美的解决了我的问题. 只不过还有一个小问题, 那就是代码高亮好像并不支持我自定义的主题. 不过这个问题无伤大雅, 而且解决应该不难.

终于, 将 `jupyter notebook` 嵌入 `tiddlywiki` 的愿望通过 `markdown` 实现了, 而且还支持公式, 效果非常完美. 这个文件就用来测试相关功能.

## Updata

解决了语法高亮支持自定义主题的问题, 在 $:/plugins/tiddlywiki/markdown/wrapper.js 的高亮函数的返回值加入了 `<pre>` 字段. 详情见 **配置wiki**.

## 彩蛋一

导入 `braces`, 大家都知道 python 是根据缩进来解决代码范围问题的, 不像其他大部分语言使用括号来定义函数等范围. 那么能不能在python中使用括号来定义范围呢. 这个彩蛋给出了我们答案


```python
from __future__ import braces
```


     from __future__ import braces
     ^
  	SyntaxError: not a chance

## 彩蛋二

相信大部分程序员都是从 `Hello World!` 开始走上这条不归路的. Python 内置了一个 Hello world! 让你回顾以下你的开始😀.


```python
import __hello__
```

    Hello world!
    

## 彩蛋三

这应该是每一个使用 python 语言的人都知道的彩蛋. 那就是 Python 教的信条.


```python
import this
```

    The Zen of Python, by Tim Peters
    
    Beautiful is better than ugly.
    Explicit is better than implicit.
    Simple is better than complex.
    Complex is better than complicated.
    Flat is better than nested.
    Sparse is better than dense.
    Readability counts.
    Special cases aren't special enough to break the rules.
    Although practicality beats purity.
    Errors should never pass silently.
    Unless explicitly silenced.
    In the face of ambiguity, refuse the temptation to guess.
    There should be one-- and preferably only one --obvious way to do it.
    Although that way may not be obvious at first unless you're Dutch.
    Now is better than never.
    Although never is often better than *right* now.
    If the implementation is hard to explain, it's a bad idea.
    If the implementation is easy to explain, it may be a good idea.
    Namespaces are one honking great idea -- let's do more of those!
    

## 彩蛋四

这个彩蛋是一个通向外部网页的大门, 运行这条语句以后, 你的电脑会打开一个网页, 里面有一个漫画.


```python
import antigravity
```

![](https://imgs.xkcd.com/comics/python.png)

## 彩蛋五

Python 还提供了一个非常简单的 HTTP 服务器, 你不需要安装任何其他组件, 只需要在你想分享的文件夹内输入以下命令, 就可以开启一个简单的 HTTP 服务器, 方便的分享文件.


```python
python -m SimpleHTTPServer   # Python 2 
python -m http.server        # Python 3
```
