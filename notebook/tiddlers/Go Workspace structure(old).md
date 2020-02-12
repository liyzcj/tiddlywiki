# GO workspace structure



## ENVs

Go 的初学者可能会对 Go 中的各种 ENV 产生疑惑，只有充分理解的 Go 中各个 env 的作用，才能构建符合规范的 Go project，并且在使用的过程中减少痛苦，是学习 Go 的必经之路。

* GOROOT： golang 的安装路径。

* GOPATH：按照惯例所有的 Go 代码都必须存储在单个工作空间中。通常 `GOPATH` 会指定这个工作空间。这个目录中应该至少包含以下三个文件夹：

  * `src`: 包含 Go 的源代码

    `src` 目录通常包含一个或多个由版本管理的包的源代码。每一个源文件都属于一个包。你可以在一个代码仓库内创建多个文件夹来保存多个分离的包。

  * `bin`: 包含二进制执行文件

    Go tool 会构建并且安装二进制文件到这个文件夹。所有的可以执行的 Go 程序都必须包含一个 `main`包，并且这个包内需要有一个 `main()` 函数作为入口函数。

  * `pkg`: 包含 Go 包的档案(`.a`)

    所有不可执行的包会保存到这个目录，也就是 library 。这些包通常是作为其他包的依赖，由其他可执行的程序包导入并使用。



## install

对于 `src` 中的 packages，可以执行 `go install package`, go 会将 src 对应的包编译并且将二进制文件安装到 `bin` 目录下，假设你有一个包在 src 目录下：

```bash
src/github.com/user/hello
```

那么你可以执行安装命令：

```shell
go install github.com/user/hello
```

这条命令在任何位置都可以执行，因为 go 根据 `GOPATH` 就能知道你指定的是哪个包，如果你在一个包的目录下，就可以直接省略后面的path：

```shell
go install
```

## build

假如你编写的是一个 library，那么这个 library 是不可以执行的，那么显然不能使用 Install 命令，这时候你可以 使用 build 命令，例如：

```go
go build github.com/user/stringutil
```

build 命令并不会产生一个新的文件，而是将这个包进行编译并且添加到构建缓存中。现在你就可以在其他包中使用这个包：

```go
package main

import (
	"fmt"

	"github.com/user/stringutil"
)

func main() {
	fmt.Println(stringutil.Reverse("!oG ,olleH"))
}
```


## get

你可以使用 get 命令来获取远程仓库的包：

```go
go get github.com/golang/example/hello
```

这会将远程仓库的包源代码 fetch 到本地的 `src`  目录：

```shell
bin/
    hello                           # command executable
src/
    github.com/golang/example/
	.git/                       # Git repository metadata
        hello/
            hello.go                # command source
        stringutil/
            reverse.go              # package source
            reverse_test.go         # test source
```



> version 1.11 之后推荐使用新增的 modules 功能来管理包。


