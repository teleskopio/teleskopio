<p>
	<div align="center">
		<a href="https://teleskopio.github.io">
			<img src="assets/icon.png" alt="teleskopio lightweight kubernetes web client" width="120" height="120" />
		</a>
	</div>
	<div align="center">
	  <a href="https://teleskopio.github.io">teleskopio</a>
	</div>
	<div aligh="center">
		<p>lightweight kubernetes web client.</p>
	</div>
</p>

<div aligh="center">
	<img src="assets/preview-light.png" alt="teleskopio lightweight kubernetes web client" width="100%" />
	<img src="assets/preview-dark.png" alt="teleskopio lightweight kubernetes web client" width="100%" />
</div>


#### features

- [Multiple config support](https://teleskopio.github.io/configuration/#configuration) – respect `$KUBECONFIG` variable and checks the `config.yaml` file.
- Simple `JWT` token authorization, admin and viewer role - Full access (admin) or Read Only access (viewer) to cluster.
- [Resource editor/creator](https://teleskopio.github.io/blog/teleskopio-with-kind/#deploy-a-pod-2) - integrated [Monaco Editor](https://microsoft.github.io/monaco-editor/) with syntax highlighting.
- Live updates - real-time resource changes with `Kubernetes` watchers.
- `Pod` logs and `Event`'s - inspect logs and event history directly in the UI, owner links, share link to resource.
- [Light and dark themes](https://teleskopio.github.io/blog/teleskopio-with-kind/#theme-and-font-2) and fonts.
- [Scale resources](https://teleskopio.github.io/blog/teleskopio-with-kind/#scale-resources-2) `Deployments`, `ReplicaSets`
- Shortcuts to filter `CTRL + F` any resource,  jump to section `CTRL + J` any menu.
- [Objects multi-select operations](https://teleskopio.github.io/blog/teleskopio-with-kind/#multiselect-2) (delete, drain, cordon, e.t.c.)
- [`go-client`](https://github.com/kubernetes/client-go) - based native implementation that interacts directly with the Kubernetes API server, no pulling, only websocket events.
- Kubernetes [resource schemas](https://github.com/yannh/kubernetes-json-schema?tab=readme-ov-file#kubernetes-json-schemas) per API version.
- [Helm integration](https://teleskopio.github.io/blog/teleskopio-helm-integration).
- Zero dependencies, no need to install `kubectl`, `helm` on the host.
- Air-gapped environments ready. No external requests.
- Built-in [MCP server](https://teleskopio.github.io/blog/mcp-server)

#### install

There are few ways to install teleskopio.

- [Linux](https://teleskopio.github.io/install/#linux-2)
- [Mac OS](https://teleskopio.github.io/install/#macos-2)
- [Docker](https://teleskopio.github.io/install/#docker-2)
- [Helm](https://teleskopio.github.io/install/#helm-2)

#### configuration

[teleskopio.github.io/configuration](https://teleskopio.github.io/configuration/#configuration)
