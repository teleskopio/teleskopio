package router

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	icache "teleskopio/pkg/cache"
	"teleskopio/pkg/model"

	"github.com/gin-gonic/gin"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"
	v1 "k8s.io/api/core/v1"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
)

func (r *Route) ListHelmReleases(c *gin.Context) {
	var req model.HelmChart
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("parsing", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	flags := genericclioptions.NewConfigFlags(false)
	// Spoof kube config on the fly
	server, err := r.kapi.GetClient(req.Server)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	flags.WrapConfigFn = func(_ *rest.Config) *rest.Config {
		return server.RestConfig
	}
	var result []*release.Release
	slog.Debug("get releases", "ns", len(req.Namespaces))
	for _, ns := range req.Namespaces {
		actionConfig := new(action.Configuration)
		if err := actionConfig.Init(flags, ns, "secret", slog.Default().Info); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}

		list := action.NewList(actionConfig)
		list.All = true

		rels, err := list.Run()
		if err != nil {
			slog.Error("cant get releases", "ns", ns, "err", err.Error())
			continue
		}

		result = append(result, rels...)
	}

	// TODO stop all watchers
	if _, ok := r.helmWathers.Load(req.Server); !ok {
		r.helmWathers.Store(
			req.Server,
			icache.NewCacheInformers(c.Request.Context(), make(chan struct{}), server.Typed, cache.ResourceEventHandlerFuncs{
				AddFunc: func(obj any) {
					sec := obj.(*v1.Secret)
					slog.Debug("add", "sec", sec.Labels)
					rel, err := decodeHelmRelease(sec.Data["release"])
					if err != nil {
						slog.Error("cant add releases", "ns", sec.Namespace, "err", err.Error())
						return
					}
					payload, _ := json.Marshal(map[string]interface{}{
						"event":   fmt.Sprintf("helm-release-%s-added", req.Server),
						"payload": rel,
					})
					r.hub.Broadcast(payload)
				},
				UpdateFunc: func(_, newObj any) {
					sec := newObj.(*v1.Secret)
					slog.Debug("update", "sec", sec.Labels)
					rel, err := decodeHelmRelease(sec.Data["release"])
					if err != nil {
						slog.Error("cant update releases", "ns", sec.Namespace, "err", err.Error())
						return
					}
					payload, _ := json.Marshal(map[string]interface{}{
						"event":   fmt.Sprintf("helm-release-%s-updated", req.Server),
						"payload": rel,
					})
					r.hub.Broadcast(payload)
				},
				DeleteFunc: func(obj any) {
					sec := obj.(*v1.Secret)
					slog.Debug("delete", "sec", sec.Labels)
					rel, err := decodeHelmRelease(sec.Data["release"])
					if err != nil {
						slog.Error("cant delete releases", "ns", sec.Namespace, "err", err.Error())
						return
					}
					payload, _ := json.Marshal(map[string]interface{}{
						"event":   fmt.Sprintf("helm-release-%s-deleted", req.Server),
						"payload": rel,
					})
					r.hub.Broadcast(payload)
				},
			}))
	}

	c.JSON(http.StatusOK, gin.H{"charts": result})
}

func (r *Route) GetHelmRelease(c *gin.Context) {
	var req model.HelmRelease
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("parsing", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	flags := genericclioptions.NewConfigFlags(false)
	// Spoof kube config on the fly
	server, err := r.kapi.GetClient(req.Server)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	flags.WrapConfigFn = func(_ *rest.Config) *rest.Config {
		return server.RestConfig
	}
	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(flags, req.Namespace, "secret", slog.Default().Info); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	list := action.NewGet(actionConfig)

	rel, err := list.Run(req.Name)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rel})
}
