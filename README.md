<div align="center">
  <a href="https://www.zot.sh">
    <img src="assets/icon.png" alt="teleskopio lightweight kubernetes web client" width="120" height="120" />
  </a>
</div>
<p align="center">
  <a href="https://teleskopio.github.io">teleskopio</a>
</p>

#### about

teleskopio is a lightweight kubernetes web client.

#### features

- [Multiple config support](https://teleskopio.github.io/configuration/#configuration) – switch between clusters effortlessly. Teleskopio reads the `$KUBECONFIG` variable and checks the `config.yaml` file.
- Simple `JWT` token authorization.
- Admin and Viewer role - Full access (admin) or Read Only access (viewer) to cluster.
- Cluster overview - get a high-level view of cluster health and activity.
- [Resource editor/creator](https://teleskopio.github.io/blog/teleskopio-with-kind/#deploy-a-pod-2) - integrated [Monaco Editor](https://microsoft.github.io/monaco-editor/) with syntax highlighting.
- Live updates - real-time resource changes with `Kubernetes` watchers.
- `Pod` logs and `Event`'s - inspect logs and event history directly in the UI.
- Owner links - navigate from a resource to its owner.
- `CRD` - custom resource definition editor.
- Multiple font options - customize the UI appearance, [Light and dark themes](https://teleskopio.github.io/blog/teleskopio-with-kind/#theme-and-font-2).
- Manual `CronJob` [triggering](https://teleskopio.github.io/blog/teleskopio-with-kind/#cronjob-2)
- [Scale resources](https://teleskopio.github.io/blog/teleskopio-with-kind/#scale-resources-2) (`Deployments`, `ReplicaSets`)
- Filter `CTRL + F` any resource.
- Jump to section `CTRL + J` any menu.
- [Objects multi-select operations](https://teleskopio.github.io/blog/teleskopio-with-kind/#multiselect-2) (delete, drain, cordon, e.t.c.)
- It is a `Go`-based native implementation that interacts directly with the Kubernetes API server.
- Kubernetes [resource schemas](https://github.com/yannh/kubernetes-json-schema?tab=readme-ov-file#kubernetes-json-schemas) per API version.
- [Helm integration](https://teleskopio.github.io/blog/teleskopio-helm-integration).
- There is NO NEED for external dependencies or tools to be installed on the system.
- Air-gapped environments ready. No external requests.
- [MCP server](https://teleskopio.github.io/blog/mcp-server)

### install

There are few ways to install teleskopio.

- [Linux](https://teleskopio.github.io/install/#linux-2)
- [Mac OS](https://teleskopio.github.io/install/#macos-2)
- [Docker](https://teleskopio.github.io/install/#docker-2)
- [Helm](https://teleskopio.github.io/install/#helm-2)

### configuration

[teleskopio.github.io/configuration](https://teleskopio.github.io/configuration/#configuration)
