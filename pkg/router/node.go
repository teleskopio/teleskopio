package router

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"teleskopio/pkg/model"

	"github.com/gin-gonic/gin"

	corev1 "k8s.io/api/core/v1"
)

func (r *Route) NodeOperation(c *gin.Context) {
	var req model.NodeOperation
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if err := r.kapi.NodeOperation(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": ""})
}

func (r *Route) NodeDrain(c *gin.Context) {
	var req model.NodeDrain
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	onDelete := func(pod *corev1.Pod, usingEviction bool) {
		slog.Debug("Deleted/Evicted pod", "ns", pod.Namespace, "pod", pod.Name, "eviction", usingEviction)
		payload, _ := json.Marshal(map[string]interface{}{
			"event":   fmt.Sprintf("drain_%s_%s", req.ResourceName, req.ResourceUID),
			"payload": map[string]any{"pod": pod.Name, "ns": pod.Namespace, "eviction": usingEviction},
		})
		r.hub.Broadcast(payload)
	}

	node, err := r.kapi.NodeDrain(c.Request.Context(), req, onDelete)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": node})
}
