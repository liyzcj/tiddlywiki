# SHUTIL

Python 的 shutil 模组常用方法.

---

shutil 是对多文件操作的高级操作, 例如复制或着删除. 但是即使是高级文件拷贝函数, 例如 `shutil.copy()` 或着 `shutil.copy2()` 也无法拷贝文件的所有元数据, 例如 ACL 权限或着文件归属等.

```python
import shutil
```

## 目录与文件操作

### copyfileobj(fsrc, fdst[,length])

复制文件对象.

💡 注意受文件指针的影响, **从源文件的指针处开始复制**, 复制过去以后, **文件指针会指向目标文件的结尾.**


```python
with open('src.txt', 'w') as src:
    src.write('Time Fly!!!')

with open('src.txt') as src, open('dst.txt', 'w+') as dst:
    shutil.copyfileobj(src, dst)
    print(f"Content of dst: {dst.read()}") # 指针在文件结尾
    
with open('dst.txt', 'r') as dst:
    print(f"Content of dst: {dst.read()}")
```

    Content of dst: 
    Content of dst: Time Fly!!!
    

### copyfile(src, dst, *, follow_symlinks=True)

复制文件内容到目标文件, 并返回目标文件. **参数为文件地址, 以字符串给出.** 

💡 目标文件必须是完整的文件, **而不能是目录.** 如果需要拷贝到目录, 请看 `copy()`.

- `follow_symlinks` : 源文件是否为链接. 如果源文件为链接而该参数为 `False` , 则目标文件也为链接.

异常: 

- 如果源文件与目标文件相同, raise `SameFileError`.
- 如果目标文件没有写入权限, raise `IOError`.


```python
shutil.copyfile('src.txt', 'dst2.txt')

with open('dst2.txt') as dst:
    print(f"Content of dst: {dst.read()}")
```

    Content of dst: Time Fly!!!
    

### copymode(src, dst, *, follow_symlinks=True)

拷贝文件权限到目标文件, **内容, 文件归属等不受影响.**

### copystat(src, dst, *, follow_symlinks=True)

拷贝文件权限, 上次读取时间, 上次修改时间, flags 等信息到目标文件. **内容, 文件归属等不受影响.**

💡 不是所有的系统平台都可以修改 symbolic links 的状态, python 提供了方法来确定是否可以修改:

- 如果 `os.chmod in os.supports_follow_symlinks` 则可以修改权限.
- 如果 `os.utime in os.supports_follow_symlinks` 则可以修改时间相关状态.
- 如果 `os.chflags in os.supports_follow_symlinks` 则可以修改 flags.

> 该函数会复制所有它能复制的, **对于无法修改的也不会报错.**

### copy(src, dst, *, follow_symlinks=True)

与 `copyfile()` 类似, 不过可以将文件复制到文件夹. **返回复制后的文件.**


```python
import os
os.mkdir('./dst')
shutil.copy('src.txt', './dst')
```




    './dst\\src.txt'




```python
with open('./dst\\src.txt') as dst:
    print(f"Content of Dst: {dst.read()}")
```

    Content of Dst: Time Fly!!!
    

### copy2(src, dst, *, follow_symlinks=True)

与 `copy()` 相同, 不过 `copy2()` 会尝试复制文件的元数据.

`copy2()` 会尝试使用 `copystat()` 复制文件元数据.

### copytree(src, dst, symlinks=False, ignore=None, copy_function=copy2, ignore_dangling_symlinks=False)

复制文件目录到目标, **目标目录一定不能存在.**

- `ignore` : 一个调用的函数, 接收 `copytree` 当前访问目录与一个包含 `os.listdir()` 返回当前目录的 List 为参数, 并返回一个目录序列与相对于当前目录的文件地址. `shutil.ignore_patterns()` 可以用来创建这样一个可调用函数.

- `copy_function` : 任何一个复制文件的方法, 默认为 `copy2()`.


```python
if os.path.exists('./dst2'):
    shutil.rmtree('./dst2')

shutil.copytree('./dst', './dst2', ignore=shutil.ignore_patterns('*.pyc', 'tmp*'))
```




    './dst2'




```python
os.listdir('./dst2')
```




    ['src.txt']



### rmtree(path, ignore_errors=False, onerror=None)

删除整个目录树, `path` 必须指向一个存在的文件夹, 但是不能是 symbolic link. 

### move(src, dst, copy_function=copy2)

递归的移动一个文件或目录, 并返回目标地址. 如果目标目录已经存在, 则将源文件移动到目标目录. **如果目标已经存在但不是一个目录, 则目标可能会被覆盖.**

### disk_usage(path)¶

返回目录的使用统计.


```python
shutil.disk_usage('./')
```




    usage(total=389786083328, used=8014839808, free=381771243520)



### chown(path, user=None, group=None)

修改目标的归属用户和组, 底层由 `os.chown()` 实现.

### which(cmd, mode=os.F_OK | os.X_OK, path=None)

返回一个可执行命令的地址.


```python
shutil.which('python')
```




    'D:\\python\\jupyter\\.env/Scripts\\python.EXE'



## 压缩文件操作

在 3.2 版本加入了一些压缩文件的操作.

### get_archive_formats()

返回一个包含了支持的压缩文件格式的 List. 目前支持:

- bztar
- gztar
- tar
- xztar
- zip


```python
shutil.get_archive_formats()
```




    [('bztar', "bzip2'ed tar-file"),
     ('gztar', "gzip'ed tar-file"),
     ('tar', 'uncompressed tar file'),
     ('xztar', "xz'ed tar-file"),
     ('zip', 'ZIP file')]



可以自定义来注册或着注销新的格式.

register_archive_format(name, function[, extra_args[, description]])

- `name` : 压缩文件名
- `function` : 一个压缩文件夹的 function. 接收文件名与压缩文件夹(默认为 `os.curdir`) 为参数.
- `description` : 格式的描述. 默认为空.

unregister_archive_format(name)

注销压缩格式.

### make_archive(base_name, format[, root_dir[, base_dir[, verbose[, dry_run[, owner[, group[, logger]]]]]]])

压缩文件.

- `root_dir` : 创建压缩文件的目录. (默认当前目录)
- `base_dir` : 需要压缩的目录. (默认当前目录)
- `dry_run` : 不会创建压缩文件, 但是会写入 Logger
- `owner` `group` : 压缩文件所属用户与组, 默认为当前.
- `logger` : 兼容 [PEP 282](https://www.python.org/dev/peps/pep-0282/) 的对象, 通常是 `logging.Logger` 的实例.

### get_unpack_formats()

获取可以解压的格式.


```python
shutil.get_unpack_formats()
```




    [('bztar', ['.tar.bz2', '.tbz2'], "bzip2'ed tar-file"),
     ('gztar', ['.tar.gz', '.tgz'], "gzip'ed tar-file"),
     ('tar', ['.tar'], 'uncompressed tar file'),
     ('xztar', ['.tar.xz', '.txz'], "xz'ed tar-file"),
     ('zip', ['.zip'], 'ZIP file')]



解压的格式同样可以自定义注册或着注销:

- register_unpack_format(name, extensions, function[, extra_args[, description]])
- unregister_unpack_format(name)

### unpack_archive(filename[, extract_dir[, format]])

解压缩文件.

- `extract_dir` : 解压到的目录. 默认当前目录.
- `format` : 待解压文件的格式. 可以自动使用后缀名.

> 3.7 版本更新, 可以接收一个 [python-like object](#path-like-object).

## 其他功能

### get_terminal_size(fallback=(columns, lines))

获取当前终端的窗口大小.


```python
shutil.get_terminal_size()
```




    os.terminal_size(columns=120, lines=30)



---

删除所有实验创建的文件:


```python
shutil.rmtree('./dst')
shutil.rmtree('./dst2')
os.remove('src.txt')
os.remove('dst.txt')
os.remove('dst2.txt')
```
