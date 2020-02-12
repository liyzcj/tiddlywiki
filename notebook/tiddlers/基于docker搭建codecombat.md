# codecombat基于docker搭建

## 安装docker

1. 打开windows的hyper-V 服务

   ```powershell
   # 打开 Hyper-V -- powershell
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   ```

2. 官网下载docker并安装

## 下载codecombat容器镜像

## docker操作

```shell
## 导入镜像
docker import codecombat_v2.iso  codecombat
## 创建容器
docker run -itd --name codecombatv1 -p 127.0.0.1:3000:3000 codecombat /bin/bash
## 启动容器
docker start codecombatv1
## 进入容器
docker exec -it codecombatv1 /bin/bash
```

## 容器内操作

```shell
## 打开mongodb
service mongodb start
## 切换到 kumanxuan 用户
su kumanxuan
## 切换到codecombat 目录
cd /home/kumanxuan/codecombat/codecombatSetupPackage/codecombat
## 启动服务器
npm run dev
```

## 后续

游戏网址 ： http://127.0.0.1:3000

管理员账号 ：http://localhost:3000