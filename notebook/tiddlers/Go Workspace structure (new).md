# How to Write Go Code

> https://golang.org/doc/code.html

## Introduction

This document demonstrates the developments of a simple Go package inside a module and introduces the go tool, the standard way to fetch build and install Go modules  packages and commands.

> Note: This document assumes that you are using Go 1.13 or later and the `G0111MODULE` environment variable is not set. If you are looking for the older, pre-modules version of this document, it is archived [here](https://golang.org/doc/gopath_code.html).

## 代码组织

Go 代码由 Packages 来组织。一个 package 是一个包含一个或多个源代码文件的文件夹，它们会被一起编译。函数类型变量等在同一个 package的多个文件中是共享的。

一个 repository 包含一个或多个 modules。一个 module 是一组相关的同时发布的 packages。一个 Repository 通常只包含一个 module，位于这个 repository 的根目录。一个名为 `go.mod` 的文件声明了这个 module 的路径：这个路径作为这个 module 内所有 package 的 import path 的前缀。一个 module 包含位于 `go.mod` 的目录以及子目录的所有 packages，除非遇到另一个 `go.mod` 文件。

注意 repository 不是必须的。你不一定需要在代码可以 build 之前将代码发布到远程仓库。

Module path 不仅仅作为 import path 来使用，而且也决定了 go 去哪里下载这个 module。例如，如果需要下载 module `golang.org/x/tools`，go command 会去请求地址 `https://golang.org/x/tools`。

`import path` 是一个用来 import package 的字符串。一个 package 的 import path 是它的 module path 加上它在 module 中的相对路径。

## First program

要编写一个简单的程序，首先需要选择一个 module path，例如 `github.com/user/hello`，并创建一个 `go.mod` 文件。

```shell
$ mkdir hello # Alternatively, clone it if it already exists in version control.
$ cd hello
$ go mod init github.com/user/hello
go: creating new go.mod: module github.com/user/hello
$ cat go.mod
module github.com/user/hello

go 1.13
```

然后编写源代码：

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, world.")
}
```

> 源代码的文件名不重要，编译生成的程序是根据文件夹的名称生成的。

现在就可以 build 这个 package：

```shell
$ go install github.com/user/hello
```

build 之后的二进制文件默认会保存到 `$HOME/go/bin` 目录下，可以通过修改 `GOPATH` 来指定其他目录，这样会将二进制文件保存到 `$GOPATH/bin` 目录下。也可以通过 `GOBIN` 来指定 二进制目录。`GOBIN` 优先级高于 `GOPATH`。

修改 GOBIN：

```shell
$ go env -w GOBIN=/somewhere/else/bin
```

`go install` 必须在含有 `go.mod` 的目录或者子目录执行。如果在根目录，也可以省略后面的 路径：

```shell
$ go install .
$ go install
```

为了方便执行，可以将 `GOBIN` 添加到 `PATH` 变量中：

```shell
$ export PATH=$PATH:$(go env GOBIN)
```

###导入 module 中的 其他 package

首先编写一个新的 package。创建一个文件夹 `morestrings`，创建一个源文件 `reverse.go`，填入以下内容：

```go
// Package morestrings implements additional functions to manipulate UTF-8
// encoded strings, beyond what is provided in the standard "strings" package.
package morestrings

// ReverseRunes returns its argument string reversed rune-wise left to right.
func ReverseRunes(s string) string {
	r := []rune(s)
	for i, j := 0, len(r)-1; i < len(r)/2; i, j = i+1, j-1 {
		r[i], r[j] = r[j], r[i]
	}
	return string(r)
}
```

> 由于函数`ReverseRunes` 由大写字母开头，所以这个函数可以被其他的 package 使用。

我们首先来编译这个 package：

```shell
$ cd $HOME/hello/morestrings
$ go build
```

build 操作不会输出任何文件。它会将编译后的文件保存到 local build cache。

现在我们可以在之前的应用中使用这个package。

```go
package main

import (
	"fmt"

	"github.com/user/hello/morestrings"
)

func main() {
	fmt.Println(morestrings.ReverseRunes("!oG ,olleH"))
}
```

### 导入远程的 modules

Import path 同时描述了 如何获取这个 module，例如：

```go
package main

import (
	"fmt"

	"github.com/user/hello/morestrings"
	"github.com/google/go-cmp/cmp"
)

func main() {
	fmt.Println(morestrings.ReverseRunes("!oG ,olleH"))
	fmt.Println(cmp.Diff("Hello World", "Hello Go"))
}
```

当你使用 `install, build, run` 这些命令时，remote module 会被自动添加到 `go.mod` 文件：

```shell
$ go install github.com/user/hello
$ hello
Hello, Go!
  string(
- 	"Hello World",
+ 	"Hello Go",
  )
$ cat go.mod
module github.com/user/hello

go 1.13

require github.com/google/go-cmp v0.3.1
```

一个 Module 的 path 不一定要匹配它的 URL，但是这是最方便的让别人使用 package 的方法。

## Testing

`go test` 命令会查找 package 内 以 `_test.go` 结尾的文件内 `Test` 开头并且签名为 `func (t *testing.T)`的函数。

例如对 `morestrings` 进行测试：

```go
package morestrings

import "testing"

func TestReverseRunes(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"Hello, world", "dlrow ,olleH"},
		{"Hello, 世界", "界世 ,olleH"},
		{"", ""},
	}
	for _, c := range cases {
		got := ReverseRunes(c.in)
		if got != c.want {
			t.Errorf("ReverseRunes(%q) == %q, want %q", c.in, got, c.want)
		}
	}
}
```

然后使用命令 `go test` 进行测试：

```shell
$ go test
PASS
ok  	github.com/user/morestrings 0.165s
```




