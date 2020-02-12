# K8S 存储





## Storageclass

> [Official Docs](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/)

storageclass 是 k8s 抽象出来的存储类。有了这个存储类以后可以方便的为不同的 pvc 分配不通策略的存储空间。

示例：

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
reclaimPolicy: Retain
allowVolumeExpansion: true
mountOptions:
  - debug
volumeBindingMode: Immediate
```

### Provisioner 

在 storageclass 中可以通过 provisioner 字段来确定提供存储的 provisioner。这个字段必须填写。支持许多不同厂商提供的云存储 provisioner 和 一些本地的 provisioner 例如 nfs local 等。

| 卷插件               | 提供厂商 | 配置例子                                                     |
| :------------------- | :------- | :----------------------------------------------------------- |
| AWSElasticBlockStore | ✓        | [AWS EBS](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#aws-ebs) |
| AzureFile            | ✓        | [Azure File](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#azure-file) |
| AzureDisk            | ✓        | [Azure Disk](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#azure-disk) |
| CephFS               | -        | -                                                            |
| Cinder               | ✓        | [OpenStack Cinder](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#openstack-cinder) |
| FC                   | -        | -                                                            |
| FlexVolume           | -        | -                                                            |
| Flocker              | ✓        | -                                                            |
| GCEPersistentDisk    | ✓        | [GCE PD](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#gce-pd) |
| Glusterfs            | ✓        | [Glusterfs](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#glusterfs) |
| iSCSI                | -        | -                                                            |
| Quobyte              | ✓        | [Quobyte](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#quobyte) |
| NFS                  | -        | -                                                            |
| RBD                  | ✓        | [Ceph RBD](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#ceph-rbd) |
| VsphereVolume        | ✓        | [vSphere](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#vsphere) |
| PortworxVolume       | ✓        | [Portworx Volume](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#portworx-volume) |
| ScaleIO              | ✓        | [ScaleIO](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#scaleio) |
| StorageOS            | ✓        | [StorageOS](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#storageos) |
| Local                | -        | [Local](https://kubernetes.io/zh/docs/concepts/storage/storage-classes/#local) |

上述拥有提供厂商的插件都是内置并且以 kubernetes.io 开头。除了这些也可以运行和指定外部或者自定义的 provisioner，只要这些 provisioner 遵循 kubernetes 定义的[规范](https://git.k8s.io/community/contributors/design-proposals/storage/volume-provisioning.md)。

> 例如，NFS 没有内部分配器，但可以使用外部分配器。 也有第三方存储供应商提供自己的外部分配器。
>
> 所以使用 local 或者自己定义的 nfs 作为存储提供商的话，需要自己配置一些服务。



### reclaimPolicy

这个字段定义了存储空间的回收策略。

这个策略可以是 `Delete` 或者 `Retain`。默认为 `Delete`

> 通过 `StorageClass` 手动创建并管理的 Persistent Volume 会使用它们被创建时指定的回收政策。



## PVC

当有了 storageclass 之后只需要创建一个 pvc，就可以自动分配需要的 pv。只需要在 pvc 声明文件中的 `spec.storageClassName`里指定 storageclass 的名称。



## Volumes

https://kubernetes.io/docs/concepts/storage/volumes/