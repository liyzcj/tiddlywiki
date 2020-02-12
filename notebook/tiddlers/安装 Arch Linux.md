# Arch Linux

Arch Linux intall Log.

## 引导方式

使用命令查看引导方式

```shell
ls /sys/firmware/efi/efivars
```

## 网络

检测网络

```shell
ping google.com
#不行就获取ip
dhcpcd
# 若为无线网
wifi-menu
```
在使用`wifi-menu`之前，要先检查无线网卡驱动。
```shell
lspci | grep -i network
```
使用`ip link list`列出可用网卡。
```shell
ip link set wlp2s0 up
```
> 网卡启动失败， rf-kill error~

查看`rfkill`

```shell
rfkill list all
```

如果出现`yes`说明有，硬件或者软件阻塞， 硬件阻塞可能是因为电脑自带无线网卡驱动和`arch`的网卡驱动冲突，使用命令删除自带网卡驱动：

```shell
modprobe -r ideapad_laptop
```

如果软件阻塞， 则运行以下命令：

```shell
rfkill unblock all
```

接下来使用`wifi-menu`链接无线， 确保网卡是连接之前不要使用`ip link set w*** up`
，我也不知道为什么， 我`up`了就连接连不上。
## 更新系统时间

```shell
timedatectl set-ntp true
# 查看状态
timedatectl status
```

## 磁盘分区

查看当前分区, 使用`fdisk`分区

```shell
fdisk -l
fdisk /dev/sda
```

如果为EFI 引导，需要创建一个启动分区

```shell
fdisk /dev/sda3
```

- n # 创建新分区 （p查看当前分区）
- +512M # 大小
- t # 更改分区类型 (l 查看分区类型)
- ef # 修改为EFI分区
- w # 将分区写入磁盘

使用以下命令格式化EFI分区

```shell
mkfs.fat -F32 /dev/sda3
```

## 格式化分区

```shell
mkfs.ext4 /dev/sda1

# swap partition
mkswap /dev/sda2
swapon /dev/sda2
# 注意交换分区必须是主分区
```

## 挂载文件系统

```shell
mount /dev/sda1 /mnt
```

如果为EFI引导，还需挂载启动分区

```shell
mkdir /mnt/boot
mount /dev/sda3 /mnt/boot
```

## 选择镜像源

编辑文件`/etc/pacman.d/mirrorlist`。
将需要的镜像源放到文件前面。

## 安装基本包

```shell
pacstrap /mnt base base-devel
```

## 生成fstab

- UUID

```shell
genfstab -U /mnt >> /mnt/etc/fstab
```

- labels

```shell
genfstab -L /mnt >> /mnt/etc/fstab
```

## 配置系统

### 进入新系统

进入新安装的系统

```shell
arch-chroot /mnt
```

### 配置时区

创建时区软链接

```shell
ln -sf /usr/share/zoneinfo/Region/City /etc/localtime
```

运行`hwclock`生成`/etc/adjtime`:

```shell
hwclock --systohc
```

### 本地化配置

修改本地化配置文件`/etc/locale.gen`，将需要的语言取消注释。
然后运行命令生成本地化文件：

```shell
locale-gen
```

创建`/etc/locale.conf`文件：

```shell
echo "LANG=en_US.UTF-8" > /etc/locale.conf
```

### 网络设置

创建主机名文件：

```shell
echo "[hostname]" > /etc/hostname
```

添加本地ip到`hosts`：

```shell
cat /etc/hosts

127.0.0.1   localhost
::1         localhost
127.0.1.1   arch.localdomain arch
```

### 创建引导启动

如果为BIOS/MBR引导方式：

- 安装GRUB

```shell
pacman -S grub
```

- 部署GRUB, 并生成配置文件：

```shell
grub-install --target=i386-pc /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg
```

> `grub-install`后面跟的是硬盘，不是分区.

如果为EFI/GPT引导方式：

- 安装GRUB 和 `efibootmgr`：

```shell
pacman -S grub efibootmgr
```

- 部署GRUB, 并生成配置文件：

```shell
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg
```

### 配置PACMAN仓库

打开兼容32位软件的仓库`multilib`：

```shell
vi /etc/pacman.conf
```

将`multilib`取消注释
> \# [multilib]
> \# IncIude = /etc/pacman.d/mirrorlist

取消注释，配置颜色输出：

> \# Color

### 创建用户

创建新用户,并添加`wheel`组：

```shell
useradd -m -G wheel -s /bin/bash [username]
```

修改用户密码：

```shell
passwd username
```

修改`root`密码：

```shell
passwd
```

打开`wheel`组的sudo无密码配置：

```shell
vi /etc/sudoers
```

取消注释：
> #%whell ALL=(ALL) ALL

### 安装桌面系统

安装桌面系统，需要先安装X窗口系统。

```shell
pacman -S xorg xorg-xinit
```

> 注意：xorg内包含显卡驱动程序`xf86-video-vesa`，如果不需要则可以删除并安装适合自己的显卡驱动。

- 安装`gnome`网络管理器并启动服务，禁止自带的`netctl`服务：

```shell
pacman -S networkmanager
systemctl enable NetworkManager.service
systemctl disable netctl
```

#### `vmware`虚拟机配置：

删除x窗口系统的自带显卡驱动，并安装`vmware`显卡驱动：

```shell
pacman -Rs xf86-video-vesa
pacman -S xf86-video-vmware xf86-input-vmmouse
```

安装`Open Vm Tools`并启动服务：

```shell
pacman -S open-vm-tools gtkmm
systemctl enable vmtoolsd.service vmware-vmblock-fuse.service
```

#### GNOME

- 安装`gnome`桌面环境, 以及可选附件：

```shell
pacman -S gnome
pacman -S gedit gnome-tweaks file-roller
```

- 修改gdm配置：

```shell
vi /etc/gdm/custom.conf

# 取消注释
#WaylandEnable=false
```

- 启动gdm显示管理器

```shell
systemctl enable gdm.service
```

#### KDE

KDE 的桌面是`plasma`:

```shell
pacman -S plasma
```

最小化安装`plasma`:

```shell
pacman -S plasma-desktop
```

需要安装显示管理器来启动`plasma`，这里使用`sddm`:

```shell
pacman -S sddm
```

安装后打开服务：

```shell
systemctl enable sddm
systemctl start sddm
```

安装kde应用：

```shell
pacman -S kde-applications
```
---
## 重启

退出系统并`umount`挂载点：

```shell
exit
umount /mnt
```

重启

```shell
reboot
```

---

## 安装NVIDIA驱动

从AUR仓库安装

```shell
yay -S nvidia
```

配置`xorg.conf`文件：

```shell
/etc/X11/xorg.conf
```

安装图形配置界面`nvidia-settings`:

```shell
yay -S nvidia-settings
```
---