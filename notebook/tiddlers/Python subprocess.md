# Subprocess



Python 的 subprocess module 用来启动一个新的进程，并且连接到那个进程的 input/output/error 的管道中获取输出和进程的 Return code。

> 这个 module 用来代替之前的多个旧的 Module和函数，比如：
>
> * `os` module
>
>   ```python
>   os.system
>   os.spawn* # os.spawn 系列的函数
>   os.popen(), os.popen2(), os.popen3() # os.popen 系列的函数
>   ```
>
> * `popen2` module
>
>   ```python
>   popen2.popen2()
>   popen2.popen3()
>   popen2.popen4()
>   ```
>   
> * Python 2 进行 shell 调用的 `commands` module
>
>   ```python
>   getstatusoutput(cmd)
>   getoutput(cmd) 
>   ```
>
>   对于 `commands` module 提供了同名的函数：`subprocess.getstatusoutput()` 以及`subprocess.getoutput()`



在 Python 3.5 中，subprocess 添加了函数 `subprocess.run()`用来代替一些之前版本的 `subprocess` 中的函数，这其中包括三个较新的 High-level API：

* `subprocess.call()`
* `subprocess.check_call()`
* `subprocess.check_output()`

所以**如果使用的 Python 版本大于 3.5，最好使用 `subprocess.run()`  或者 `subprocess.Popen()` 来实现。**

## Function

subprocess 中所提供的函数目前有七个：

* 3.5 版本后**最推荐**的函数 `run()`
* 3.5 之前版本的 High-level 函数：`call()`, `check_call()`, `check_output()`
* 兼容 commands 模组的两个函数: `getstatusoutput()`, `getoutput()`

### run()

```python
subprocess.run(args, *, stdin=None, input=None, stdout=None, stderr=None, capture_output=False, shell=False, cwd=None, timeout=None, check=False, encoding=None, errors=None, text=None, env=None, universal_newlines=None)
```

`run()`  函数会运行参数 `args` 指定的命令，等待进程完成并返回 `CompletedProcess`的一个实例。函数的参数与 Popen 的构造参数基本一致，该函数会直接将参数传递给 Popen 构造器。除了参数 `timeout`,  `input` , `check` 以及 `capture_output`。这里仅仅描述这几个不同的参数，其他参数参照 Popen。

* `capture_output`: if True, stdout 和 stderr 会被捕获。Popen 的参数指定为 `stdout=PIPE, stderr=PIPE`，所以如果同时指定 `stdout` 以及 `stderr`，这两个参数**不会生效**。如果想要将 stdout 以及 stderr 结合到一个流中，使用 `stdout=PIPE, stderr=STDOUT` 代替 `capture_output=True`
* `timeout`:  这个参数会传递给方法 `Popen.communicate()` 。如果进程运行时间超过 timeout，子进程会被 kill 并等待进程结束，并在结束后抛出 `TimeoutExpired`。
* `input`: 同样传递给 `Popen.communicate()` 方法。作为子进程的标准输入，必须为一个 **byte 序列** 或者 **字符串**。如果是字符串，需要指定 `encoding` 或者 `errors` 参数，或者指定参数 `text=True`。当指定该参数时，Popen创建时会自动指定 `stdin=PIPE`，所以同时指定 `stdin` 参数的话也**不会生效**。
* `check`: 如果 `check=True`，并且进程的 exist code 不为 0，则会 抛出 `CalledProcessError`。

### call()

```python
call(args, *, stdin=None, stdout=None, stderr=None, shell=False, cwd=None, timeout=None)
```

运行 args 参数指定的命令。等待命令完成并返回 returncode 属性。除了 timeout 所有参数传递给 Popen 构造函数。

使用 `run()` 函数代替：

```python
run(...).returncode
```

> 不要在这个函数使用 `stdout=PIPE` 或 `stderr=PIPE`。子进程会在 buffer 被占满时阻塞。

### check_call()

```python
subprocess.check_call(args, *, stdin=None, stdout=None, stderr=None, shell=False, cwd=None, timeout=None)
```

运行 args 指定的命令。等待子进程执行完成，如果 returncode 不为 0，则抛出 `CalledProcessError`。否则返回 `CalledProcessError`。除了 timeout 所有参数传递给 Popen 构造函数。

使用 `run()` 代替：

```python
run(..., check=True)
```

> 不要在这个函数使用 `stdout=PIPE` 或 `stderr=PIPE`。子进程会在 buffer 被占满时阻塞。

### check_output()

```python
subprocess.check_output(args, *, stdin=None, stderr=None, shell=False, cwd=None, encoding=None, errors=None, universal_newlines=None, timeout=None, text=None)
```

运行 args 指定的命令，等待执行完成并返回 output，如果 returncode 不为 0，则抛出 `CalledProcessError`。否则返回  `stdout`。

使用 `run()` 代替：

```python
run(..., check=True, stdout=PIPE).stdout
```

上面列出的参数为常用的参数，函数的 signature 和 `run()` 类似。基本所有参数都传递给 `run()` 函数，除了`input=None` 来继承父进程的标准输入文件 handle。

默认情况会返回 encoded bytes。实际的编码方式可能根据调用的命令的不同而不同，所以可能**需要在 Python中编写代码处理输出。**这个行为可以被参数 `text`、`encoding`、`errors` 或 `universal_newlines`覆盖。 

### getstatusoutput()

```python
subprocess.getstatusoutput(cmd)
```

在 shell 中执行命令 `cmd` 并返回 `(exitcode, output)`。

使用 `Popen.check_output()` 执行 shell 命令 cmd 并返回 `(exitcode, output)`。使用 locale Encoding。

**输出中的换行符会被丢掉。**

POSIX、Windows 可用。

### getoutput()

```python
subprocess.getoutput(cmd)
```

在 Shell 中执行 cmd 并返回 output （stdout、stderr）。

与 `getstatusoutput()` 类似，除了不返回 exitcode。

POSIX、Windows 可用。

## Class

Subprocess 中一共有三个 Class：

* 最主要的 Class `Popen`，subprocess 的基础，可以用来创建进程，并且**不会 block 等待进程完成**。
* 记录已完成进程信息的 Class `CompletedProcess`，由 `run()` 函数返回。
* Windows 的 Popen Helper Class `STARTUPINFO`，用来在 Windows 中创建 Popen 进程。



### Popen

Popen 是 subprocess 中的基础类，用来创建一个新的进程并**立即返回**。对于 POSIX 系统，它调用 `os.execvp()`。对于 Windows 系统，它会通过 windows 函数 `CreateProcess()`来创建进程。

#### 构造参数

```python
subprocess.Popen(args, bufsize=-1, executable=None, stdin=None, stdout=None, stderr=None, preexec_fn=None, close_fds=True, shell=False, cwd=None, env=None, universal_newlines=None, startupinfo=None, creationflags=0, restore_signals=True, start_new_session=False, pass_fds=(), *, encoding=None, errors=None, text=None)
```

* **args**

  args 是唯一的位置参数，可以是**字符串**或者**字符串序列** 或着  **[path-like 对象](https://docs.python.org/3/glossary.html#term-path-like-object)**。默认情况下，如果 args 为一个序列，要执行的程序为 args 的第一个元素。args 的处理根据平台而不同。其中，**字符串序列**是比较推荐的方式。这样可以让 module 来处理一些转义或着引号，比如文件名之间的空格。

  对于POSIX 系统，如果 args 为一个字符串，则将其视为一个可执行的程序且**不能具有命令行参数**。如果指定 `shell=True` ，则**使用 shell 执行这个字符串。**默认的 shell 为 `/bin/sh`。也就等价于：

  ```python
  Popen(['/bin/sh', '-c', args[0], args[1], ...])
  ```

  > [shlex module](#Python-shlex) `shlex.split()` 可以用来将字符串分割为数组。

  对于 Windows，如果输入为一个序列，则会被转换为字符串，因为函数 `CreateProcess()` 是根据字符串执行的。其中转换规则在附录。如果 `shell=True` 则通过环境变量 `COMSPEC` 来指定使用的 shell。但是在 Windows 这个参数不常用，因为只有一些特定的shell 命令才需要这个参数，例如 `dir` `copy`。

* **stdin, stdout, stderr**

  stdin, stdout, stderr 指定了进程的标准输入输出和标准错误文件 handles。**可用的值有 `PIPE`, `DEVNULL` 以及存在的文件描述符（一个正整数）和打开的文件或者 None。**其中 **`PIPE`** 代表创建一个进程之间的管道。**`DEVNULL`** 表示特殊文件 `os.devnull`。而对于默认值 None，则不进行任何重定向，子进程的文件 handles 会从父进程继承。

  对于传入 stdin 的输入，换行符 `\n` 会被替换为 `os.linesep`。对于 stdout 和 stderr 所有的行尾符都会被替换为 `\n`。更多信息查看 [`io.TextIOWrapper`](https://docs.python.org/3/library/io.html#io.TextIOWrapper)。

* **shell**

  如果 `shell=True`，则指定的命令会在 shell 中执行。这在你想使用例如通配符，管道，环境变量或者 `~` 家目录等 shell 特性时非常有用。但是 Python其实也提供了大量的相关特性，详情见 [shutil module](#python-shutil)

* **cwd**

  如果该参数不为 None，会首先切换到 cwd 指定的目录再执行子进程。cwd 可以是**字符串**，**bytes**或者 **[path-like 对象](https://docs.python.org/3/glossary.html#term-path-like-object)**

* **env**

  如果 `env` 不为 `None`，则必须为一个 mapping，定义了环境变量的名称和对应的值。注意这会**取代默认行为：从当前进程中继承环境变量。**

* **executable**

  该参数在 `shell=False` 时指定了一个代替 args 中运行的可执行程序。这个参数非常少用，大多数程序都会将 args 中指定的地址作为执行程序，少数会仅仅作为名称而实际执行另一个程序。

  **如果 `shell=True`，该参数可以用来指定一个代替 `/bin/sh` 的 Shell。**

* **bufsize**

  这个参数会传递给创建 stdin stdout 以及 stderr 的 `open()` 函数，其中：

  * 0 代表没有 buffer
  * 1 代表行 buffer（仅仅在 text mode 有效）
  * 其他正值代表对应大小的 buffer。
  * 负值代表系统默认 `io.DEFAULT_BUFFER_SIZE` （**默认值**）

* **encoding/errors/text/universal_newlines**

  如果指定 `encoding` 或者 `errors`，或者 `text=True`。对于 stdin stdout 或者 stderr 的文件对象会以 Text 模式打开，并通过 `encoding` 和 `errors` 指定的 Wrapper 或默认的 `io.TextIOWrapper` 。**`universal_newlines` 参数和 `text` 参数是等价**的，因为向后兼容而存在。**默认的文件流打开方式是 binary mode。**

* **restore_signals**

  如果该参数为 true（默认） 则所有设置在 `SIG_IGN` 中的信号会保存到子进程中的 `SIG_DFL`。现在信号包括 `SIGPIPE`, `SIGXFZ`, `SIGXFSZ`。（仅仅 POSIX）

* **preexec_fn**

  指定一个可执行的对象，会在子进程创建后首先执行。（仅仅 POSIX 系统）
  
  例如可以使用该参数进行子进程的环境变量的设置。
  
  > 3.8 版本后，子进程中不能再次指定该参数。
  
* **start_new_session**

  如果该参数为 True，则会在子进程中首先调用 `setsid()` （POSIX 系统）

* **close_fds**

  如果 `close_fds=True`，所有除了 0 1 2 的文件描述符都会在子进程执行前被关闭。否则子进程会继承父进程的文件描述符。

  在 Windows 中，如果 `close_fds=True`，没有 handles 会被继承，除非明确指定 `STARTUPINFO.lpAttributeList` 中的 `handle_list`

  > 3.2 版本后该参数默认为 False，3.7 版本后 Windows 中重定向时默认为 True。

* **pass_fds**

  该参数用来指定被子进程继承的文件描述符。当指定时 `close_fds` 为 True。

* **startupinfo**

  如果指定，必须为Class `STARTUPINFO` 的实例，并传递给 **Windows** `CreateProcess` 函数。

* **creationflags**

  如果指定，则必须为一个或多个下面的 flags：（**Windows**）

  - [`CREATE_NEW_CONSOLE`](https://docs.python.org/3/library/subprocess.html#subprocess.CREATE_NEW_CONSOLE)：新进程有新的 Console
  - [`CREATE_NEW_PROCESS_GROUP`](https://docs.python.org/3/library/subprocess.html#subprocess.CREATE_NEW_PROCESS_GROUP)：创建新的进程组。要使用 `os.kill()` 必须指定该flag。
  - [`ABOVE_NORMAL_PRIORITY_CLASS`](https://docs.python.org/3/library/subprocess.html#subprocess.ABOVE_NORMAL_PRIORITY_CLASS)：较高优先级
  - [`BELOW_NORMAL_PRIORITY_CLASS`](https://docs.python.org/3/library/subprocess.html#subprocess.BELOW_NORMAL_PRIORITY_CLASS)：较低优先级
  - [`HIGH_PRIORITY_CLASS`](https://docs.python.org/3/library/subprocess.html#subprocess.HIGH_PRIORITY_CLASS)：最高优先级
  - [`IDLE_PRIORITY_CLASS`](https://docs.python.org/3/library/subprocess.html#subprocess.IDLE_PRIORITY_CLASS)：最低优先级
  - [`NORMAL_PRIORITY_CLASS`](https://docs.python.org/3/library/subprocess.html#subprocess.NORMAL_PRIORITY_CLASS)：普通优先级
  - [`REALTIME_PRIORITY_CLASS`](https://docs.python.org/3/library/subprocess.html#subprocess.REALTIME_PRIORITY_CLASS)：实时优先级，最好别用，会阻断鼠标键盘等。
  - [`CREATE_NO_WINDOW`](https://docs.python.org/3/library/subprocess.html#subprocess.CREATE_NO_WINDOW)：不创建 Window
  - [`DETACHED_PROCESS`](https://docs.python.org/3/library/subprocess.html#subprocess.DETACHED_PROCESS)：后台进程
  - [`CREATE_DEFAULT_ERROR_MODE`](https://docs.python.org/3/library/subprocess.html#subprocess.CREATE_DEFAULT_ERROR_MODE)：不继承父进程的 Error mode
  - [`CREATE_BREAKAWAY_FROM_JOB`](https://docs.python.org/3/library/subprocess.html#subprocess.CREATE_BREAKAWAY_FROM_JOB)：创建与当前进程不相关的进程

#### 属性和方法

* **poll()**

  检查子进程是否已经结束。如果结束则设置 `returncode` 并返回，否则返回 None。

* **wait(timeout=None)**

  等待子进程运行结束，设置并返回 `returncode`。

  如果在 timeout 秒之后还没有停止，则抛出 `TimeoutExpired` 异常。可以**捕捉该异常并重新调用 `wait()`。**

  > 当 `stdout=PIPE` 或者 `stderr=PIPE` 时，如果子进程产生的输出占满了 buffer，则该函数会阻塞。使用 `communicate()` 可以避免这种问题。

* **communicate(input=None, timeout=None)**

  与进程交互：发送数据到 stdin，从 stdout 和 stderr 读取数据，**直到 EOF，并等待程序结束**。`input` 参数指定了发送到子进程的数据或者 None。如果数据流以 Text 模式打开，则 `input` 必须为一个字符串，否则必须为 bytes。

  该函数返回一个 tuple `(stdout_data, stderr_data)`。如果为 Text mode，返回的是 String，否则为 Bytes。

  > 注意：如果你想发送数据到 stdin，则在创建进程时必须指定 `stdin=PIPE`。对于 stdout 和 stderr 也是类似。

  如果在参数 `timeout` 秒之内，进程没有关闭，则会抛出 `TimeoutExpired` 异常。 捕获异常并重新调用方法不会丢失输出或 error数据。

  注意，如果超时子进程并不会被 kill，所以应该在超时后手动进行清理：

  ```python
  proc = subprocess.Popen(...)
  try:
    outs, errs = proc.communicate(timeout=15)
  except TimeoutExpired:
    proc.kill()
    outs, errs = proc.communicate()
  ```

  > 读取的数据会**缓存在内存**中，所以读取的**数据量很大时，不要使用该方法。**

* **send_signal(signal)**

  发送 signal 到子进程。

  > 在 Windows 中，SIGTERM 是 `terminate()` 的别名。`CTRL_C_EVENT` 和 `CTRL_BREAK_EVENT` 可以发送到在 `creationflags` 中指定了 `CREAT_NEW_PROCESS_GROUP` 的子进程。

* **terminate()**

  停止子进程。在 POSIX 中，这个方法会发送 `SIGTERM` 信号到子进程。在 Windows 中会调用 `TerminateProcess()` 函数

* **kill()**

  Kill 子进程。在 POSIX 中，向子进程发送 `SIGKILL` 信号。在 Windows 中，`kill()` 是 `terminate()` 的别名。

* **args**

  构造函数的 args 参数。

* **stdin**

  如果 `stdin=PIPE`，这个属性为一个 `open()` 返回可写的流对象。可以为 bytes stream 或 text straem。如果 `stdin != PIPE` 该属性为 None。

* **stdout**

  与 stdin 类似

* **stderr**

  与 stdin 类似

  > **警告**： 对于 stdin / stdout / stderr 使用 `communicate()` 而不是 `.stdin.write` 或者 `.stdout.read` `.stderr.read` 。以防止 OS pipe buffer 占满以后子进程会阻塞。

* **pid**

  子进程的进程号。

* **returncode**

  子进程的返回码（exit code）。由 `poll()` 或者 `wait()` 设置。或由 `communicate()` 间接设置。`None` 表示进程没有结束。

#### Context Management

Popen 可以作为上下文使用，通过 `with` statement，在退出时，标准文件描述符会被关闭。

```python
with Popen(["ifconfig"], stdout=PIPE) as proc:
  log.write(proc.stdout.read())
```

### CompletedProcess

该类由函数 `run()` 返回，代表了一个已经完成的进程。包含一下属性和方法：

* args： 子进程运行的命令
* returncode： 子进程的返回码。0 代表成功，`+N` 代表错误，`-N`代表进程由信号 `N` 停止。（仅 POSIX系统）
* stdout：从子进程中获取的 stdout。**Byte sequence 或者 String。** 如果没有输出则为 None。
* stderr：子进程获取的 stderr，与 stdout 类似。
* check_returncode()：如果 `returncode != 0` 抛出 `CalledProcessError`。

### STARTUPINFO

该类仅仅对于 Windows 平台可用。该类用于 Popen 构造器的 `startupinfo` 参数，用来指定创建进程的 flags。

* **dwFlags**

  决定当进程创建一个 Window 时的 Flags：

  ```python
  si = subprocess.STARTUPINFO()
  si.dwFlags = subprocess.STARTF_USESTDHANDLES | subprocess.STARTF_USESHOWWINDOW
  ```

* **hStdInput**

  如果 `dwFlags` 指定了 `STARTF_USESTDHANDLES`，这个 attribute 代表标准输入。如果 `dwFlags` 没有指定 `STARTF_USESTDHANDLES`，默认标准输入为键盘 buffer。

* **hStdOutput**

  如果 `dwFlags` 指定了 `STARTF_USESTDHANDLES`，这个 attribute 代表标准输出。如果未指定，则标准输出默认为 console buffer。

* **hStdError**

  如果 `dwFlags` 指定了 `STARTF_USESTDHANDLES`，这个 attribute 代表标准错误。如果未指定，则打印到 Console buffer。

* **wShowWindow**

  如果 `dwFlags` 指定了 `STARTF_USESTDHANDLES`，这个 attribute 可以为函数 `ShowWindow`函数的 `nCmdShow` 参数的任何值，除了 `SW_SHOWDEFAULT`。否则这个 attribute 被忽略。

  `SW_HIDE` 可以作为这个 attribute 的值。在 `shell=True` 时可以使用。

* **lpAttributeList**

  一个包含额外的属性的字典，查看 [UpdateProcThreadAttribute](https://msdn.microsoft.com/en-us/library/windows/desktop/ms686880(v=vs.85).aspx)。

  支持的 attributes：

  * **handle_list**：会被继承的多个 handles 的序列。`close_fds` 必须为 True。所包含的 handles 必须被函数 `os.set_handle_inheritable()` 临时标记为可被继承。否则会抛出 `OSError` 异常，包含 Windows Error   `ERROR_INVALID_PARAMETER` (87)。

## Exception

subprocess 中包含三个 Exception class， 其中一个是基类 `SubprocessError`。

* Exception `TimeoutExpired` 当设置了 timeout 参数并超时时会抛出。
* Exception `CalledProcessError`，由 `check_call()` 或 `check_output()` 在进程返回值不为 0 时抛出。

其他相关的错误大部分会抛出 `OSError` 或 `ValueError`。

### TimeoutExpired

* cmd：子进程运行的命令
* timeout：超时的时限
* output：由 `run()` 或 `check_output()` 捕获的标准输出。其他情况为 None。
* stdout：output 的别名
* stderr：由 `run()` 捕获的标准错误，其他情况为 None。

### CalledProcessError

* returncode：子进程的退出码。
* cmd：子进程的命令。
* output：由 `run()` 或 `check_output()` 捕获的标准输出。其他情况为 None。
* stdout：output 的别名
* stderr：由 `run()` 捕获的标准错误，其他情况为 None。

## Constant

Constant 包含三个常用的 Constant 以及一系列的的 Windows Constant.

### 常用的 Constant

* `subprocess.DEVNULL`: 用于 stdout / stderr / stdin 的特殊值，代表 `os.devnull` 这个特殊文件。
* `subprocess.PIPE`: 用于 stdout / stderr / stdin 的特殊值，代表创建一个与子进程之间的 Pipe。
* `subprocess.STDOUT`：用于参数 stderr，用于将子进程的 stderr 重定向到 stdout。

### Windows Constant

* **STD_INPUT_HANDLE**：标准输入设备，Console input buffer。
* **STD_OUTPUT_HANDLE**：标准输出设备，Console screen。
* **STD_ERROR_HANDLE**：标准错误设备，Console buffer
* **SW_HIDE**：隐藏 Windows，另一个 Windows 会被激活。
* **STARTF_USESTDHANDLES**：指定 attributes [`STARTUPINFO.hStdInput`](https://docs.python.org/3/library/subprocess.html#subprocess.STARTUPINFO.hStdInput), [`STARTUPINFO.hStdOutput`](https://docs.python.org/3/library/subprocess.html#subprocess.STARTUPINFO.hStdOutput), and [`STARTUPINFO.hStdError`](https://docs.python.org/3/library/subprocess.html#subprocess.STARTUPINFO.hStdError) 
* **STARTF_USESHOWWINDOW**：指定 [`STARTUPINFO.wShowWindow`](https://docs.python.org/3/library/subprocess.html#subprocess.STARTUPINFO.wShowWindow) attribute。

---

[Subprocess](https://docs.python.org/3/library/subprocess.html#notes)