package router

import (
	"log/slog"
	"net/http"
	"teleskopio/pkg/model"

	"github.com/gin-gonic/gin"
)

func (r *Route) ListCustomResourceDefinitions(c *gin.Context) {
	var req model.PayloadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	crdList, err := r.kapi.ListCustomResourceDefinitions(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, []any{crdList.Items, crdList.Continue, crdList.ResourceVersion})
}

func (r *Route) ListResources(c *gin.Context) {
	var req model.PayloadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	result, err := r.kapi.ListResources(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (r *Route) ListDynamicResource(c *gin.Context) {
	var req model.ListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	items, continueToken, resourceVersion, err := r.kapi.ListDynamicResource(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, []any{items, continueToken, resourceVersion})
}

func (r *Route) ListEventsDynamicResource(c *gin.Context) {
	var req model.ListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("parsing", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	items, continueToken, resourceVersion, err := r.kapi.ListEventsDynamicResource(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, []interface{}{items, continueToken, resourceVersion})
}
