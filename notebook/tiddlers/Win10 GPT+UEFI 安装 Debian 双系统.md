# Win10 GPT+UEFI 安装 Debian 双系统

在win10单硬盘，gpt + uefi 引导的前提下，安装Debian 双系统并进行初始配置。

## 环境要求

- 已安装 WIN10 操作系统
- 采用GPT分区+UEFI引导
- 一个U盘

## 下载镜像

在`Debian`官网下载最新的`Debian9`镜像，并使用`Rufus`软件写入优盘制作`EFI`启动盘。

- `Debian` 官网 ：<https://www.debian.org>
- `Rufus` 官网 ：<http://rufus.akeo.ie/>

## 安装 Debian

- 在`WIN10` 中使用磁盘管理工具划分出**一定**容量的磁盘空间。*（可以采用压缩已有磁盘空间）*
- 使用EFI启动盘进入`Debian`安装程序。
- 选择`Graphic install` (图形安装)
- 完成各基础配置项。*（语言最好先选择英语）*
- 给划分好的磁盘空间分区。
- 继续安装`Debian`操作系统。
- 点击继续，`Debian`安装程序会自动检测已有的操作系统并安装`GRUB`引导工具。
- 安装成功

## 配置Debian

安装完成后需要进行一些简单配置以方便使用。*（根据自己需求）*

### 配置 apt 源

在国内使用`163`的源速度比较快。配置如下：

编辑 `source.list` 文件：

```shell
vi /etc/apt/source.list
```

注释以下内容：

> ```
> # deb cdrom:[Debian GNU/Linux 9.3.0 _Stretch_ - Official amd64 DVD Binary-1 20171209-12:11]/ stretch contrib main
> ```

在`source.list.d` 文件夹内新建 `163.list` 文件，并添加以下内容：

> deb http://mirrors.163.com/debian/ jessie main non-free contrib
>
> deb http://mirrors.163.com/debian/ jessie-updates main non-free contrib 
>
> deb http://mirrors.163.com/debian/ jessie-backports main non-free contrib
>
> deb-src http://mirrors.163.com/debian/ jessie main non-free contrib
>
> deb-src http://mirrors.163.com/debian/ jessie-updates main non-free contrib
>
> deb-src http://mirrors.163.com/debian/ jessie-backports main non-free contrib
>
> deb http://mirrors.163.com/debian-security/ jessie/updates main non-free contrib
>
> deb-src http://mirrors.163.com/debian-security/ jessie/updates main non-free contrib 

更新` apt`：

```shell
apt update
```

### 配置无线网卡

*本人无线网卡为 Intel n2230*

- 安装驱动

```shell
apt install firmware-iwlwifi
```

- 增加模块

```shell
modprobe -r iwlwifi
modprobe iwlwifi
```

### 安装中文字体

- 下载 `ttf `字体文件，例如[微软雅黑等距](https://github.com/liyzcj/zinux/tree/master/fonts)
- 在目录/usr/share/fonts内新建目录，例如：

```shell
cd /usr/share/fonts
mkdir msyhmono
```

- 将字体文件放入新建目录
- 在新建目录内执行以下命令

```shell
mkfontscale
mkfontdir
fc-cache -fv
```

- 修改locale

```shell
dpkg-reconfigure locales
```

- 修改系统字体，重启

### 安装显卡驱动

*笔记本型号 为联想 Y400，显卡型号为 NVIDIA GT650M*

- 更新源

```shell
# stretch-backports
deb http://httpredir.debian.org/debian stretch-backports main contrib non-free
apt update
```

- 安装驱动

```shell
apt-get install linux-headers-$(uname -r|sed 's/[^-]*-[^-]*-//')
apt-get install -t stretch-backports nvidia-driver
```

### 安装中文输入法

安装搜狗中文输入法

- 在[搜狗官网](https://pinyin.sogou.com/linux/)下载64位输入法安装文件
- 安装`fcitx`动态库和轻量UI

```shell
sudo apt install fcitx-ui-classic
sudo apt install fcitx-ui-light
```

- 安装搜狗输入法*（会有依赖性报错）*

```shell
sudo dpkg -i  sougoupinyin_*.deb
```

- 修复依赖包

```shell
sudo apt -f install
```

- 重启