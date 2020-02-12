由于 Go 安装包都是从 github 上下载，但是 github 国内被墙，速度非常慢，所以经常 timeout。

解决方法是 Go 1.11 推出的 `go module` 包管理工具。可以通过设置 `GOPROXY` 变量来通过代理地址下载包而不是 github。 

# goproxy.io

> 代理网址： [https://goproxy.io/](https://goproxy.io/)

```bash
go env -w GOPROXY=https://goproxy.io,direct
```

## Bash

```bash
# Enable the go modules feature
export GO111MODULE=on
# Set the GOPROXY environment variable
export GOPROXY=https://goproxy.io
```

## Windows

```powershell
# Enable the go modules feature
$env:GO111MODULE="on"
# Set the GOPROXY environment variable
$env:GOPROXY="https://goproxy.io"
```

# goproxy.cn

> 中国代理 [https://github.com/goproxy/goproxy.cn](https://github.com/goproxy/goproxy.cn
)

```bash
go env -w GOPROXY=https://goproxy.cn,direct
```

## Bash

```bash
$ export GOPROXY=https://goproxy.cn
```

## Powershell

```powershell
$env:GOPROXY = "https://goproxy.cn"
```