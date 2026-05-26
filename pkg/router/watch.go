package router

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"teleskopio/pkg/model"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	w "k8s.io/apimachinery/pkg/watch"
)

func (r *Route) WatchDynamicResource(c *gin.Context) {
	var req model.WatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("parsing", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	ri, err := r.kapi.GetResourceInterface(req.Server, req.Namespace, &req.APIResource)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	watcherKey := fmt.Sprintf("%s-%s", req.APIResource.Kind, req.Server)
	watch, err := ri.Watch(context.TODO(), metav1.ListOptions{ResourceVersion: req.APIResource.ResourceVersion})
	if err != nil {
		slog.Error("watcher", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	ch := watch.ResultChan()
	r.watchers.Store(watcherKey, watch)
	gvr := req.APIResource.GetGVR()
	slog.Info("Watching ...", "gvr", gvr.String())
	go func() {
		for event := range ch {
			switch event.Type {
			case w.Added, w.Modified:
				slog.Debug("message received", "gvr", gvr.String(), "watchKey", watcherKey, "type", event.Type)
				payload, _ := json.Marshal(map[string]interface{}{
					"event":   fmt.Sprintf("%s-%s-updated", req.APIResource.Kind, req.Server),
					"payload": event.Object,
				})
				r.hub.Broadcast(payload)
			case w.Deleted:
				slog.Debug("message received", "gvr", gvr.String(), "watchKey", watcherKey, "type", event.Type)
				payload, _ := json.Marshal(map[string]interface{}{
					"event":   fmt.Sprintf("%s-%s-deleted", req.APIResource.Kind, req.Server),
					"payload": event.Object,
				})
				r.hub.Broadcast(payload)
			case w.Error:
				slog.Error("watching error", "gvr", gvr.String(), "watchKey", watcherKey, "error", event.Object.DeepCopyObject().GetObjectKind())
				r.watchers.Delete(watcherKey)
			}
		}
	}()

	c.JSON(http.StatusOK, gin.H{"success": ""})
}

func (r *Route) WatchEventsDynamicResource(c *gin.Context) {
	var req model.WatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	ri, err := r.kapi.GetResourceInterface(req.Server, req.Namespace, &req.APIResource)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	gvr := req.APIResource.GetGVR()
	watcherKey := fmt.Sprintf("%s-%s-updated", req.UID, req.Server)
	_, ok := r.watchers.Load(watcherKey)
	if ok {
		slog.Info("watcher exist", "gvr", gvr.String(), "key", watcherKey)
		c.JSON(http.StatusOK, gin.H{"success": ""})
		return
	}
	watchOptions := metav1.ListOptions{ResourceVersion: req.APIResource.ResourceVersion}
	fieldSelector := ""
	if req.APIResource.Group == "" {
		fieldSelector = fmt.Sprintf("involvedObject.uid=%s", req.UID)
	} else {
		fieldSelector = fmt.Sprintf("regarding.uid=%s", req.UID)
	}
	watchOptions.FieldSelector = fieldSelector
	watch, err := ri.Watch(context.TODO(), watchOptions)
	if err != nil {
		slog.Error("watcher", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	ch := watch.ResultChan()
	r.watchers.Store(watcherKey, watch)
	slog.Info("Watching ...", "gvr", gvr.String())
	go func() {
		for event := range ch {
			switch event.Type {
			case w.Added, w.Modified:
				slog.Debug("message received", "gvr", gvr.String(), "watchKey", watcherKey, "type", event.Type)
				payload, _ := json.Marshal(map[string]interface{}{
					"event":   watcherKey,
					"payload": event.Object,
				})
				r.hub.Broadcast(payload)
			case w.Error:
				slog.Error("watching error", "gvr", gvr.String(), "watchKey", watcherKey, "error", event.Object.DeepCopyObject().GetObjectKind())
				r.watchers.Delete(watcherKey)
			}
		}
	}()

	c.JSON(http.StatusOK, gin.H{"success": ""})
}
