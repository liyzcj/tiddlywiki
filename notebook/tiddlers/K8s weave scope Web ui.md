# K8S Web UI

kubernetes 暂时有两个 Web UI 可以使用：

* [DashBoard](https://github.com/kubernetes/dashboard#kubernetes-dashboard)

* [Weave Scope](https://www.weave.works/documentation/scope-latest-installing/#k8s)



## Weave Scope

### 部署



```bash
kubectl apply -f "https://cloud.weave.works/k8s/scope.yaml?k8s-version=$(kubectl version | base64 | tr -d '\n')"
```



### 访问



* `port-forward` 到本地访问：

  ```bash
  kubectl port-forward -n weave "$(kubectl get -n weave pod --selector=weave-scope-component=app -o jsonpath='{.items..metadata.name}')" 4040
  ```

通过 NodePort Service 服务

```bash
apiVersion: v1
kind: Service
metadata:
  name: nodeport-svc
  namespace: weave
spec:
  type: NodePort
  ports:
    - name: webui
      port: 80
      nodePort: 30001
      targetPort: 4040

  selector:
    app: weave-scope
    name: weave-scope-app
    weave-cloud-component: scope
    weave-scope-component: app
```



---

## Reference

[部署Weave Scope](https://www.weave.works/docs/scope/latest/installing/#kubernetes)

[K8S 扩展](https://kubernetes.io/zh/docs/concepts/cluster-administration/addons/)