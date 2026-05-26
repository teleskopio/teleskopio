package router

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"teleskopio/pkg/config"
	"teleskopio/pkg/genericmap"
	"teleskopio/pkg/kubeapi"
	"teleskopio/pkg/model"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"golang.org/x/crypto/bcrypt"

	w "k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/informers"

	webSocket "teleskopio/pkg/socket"
)

type Route struct {
	cfg   *config.Config
	kapi  *kubeapi.KubeAPI
	users *config.Users
	hub   *webSocket.Hub
	// TODO
	// Add mutex
	watchers        *genericmap.Map[string, w.Interface]
	helmWathers     *genericmap.Map[string, informers.SharedInformerFactory]
	podLogsWatchers map[string]chan (bool)
}

func New(hub *webSocket.Hub, cfg *config.Config, kapi *kubeapi.KubeAPI, users *config.Users) (Route, error) {
	watchersMap := &genericmap.Map[string, w.Interface]{}
	helmWatchersMap := &genericmap.Map[string, informers.SharedInformerFactory]{}
	r := Route{
		cfg:             cfg,
		kapi:            kapi,
		users:           users,
		hub:             hub,
		watchers:        watchersMap,
		helmWathers:     helmWatchersMap,
		podLogsWatchers: make(map[string]chan bool),
	}
	return r, nil // TODO
}

func (r *Route) LookupConfigs(c *gin.Context) {
	c.JSON(http.StatusOK, r.kapi.GetClusters())
}

func (r *Route) GetVersion(c *gin.Context) {
	var req model.PayloadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	ver, err := r.kapi.GetVersion(req)
	if err != nil {
		slog.Error("client", "err", err.Error(), "req", req)
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ver)
}

func (r *Route) GetDynamicResource(c *gin.Context) {
	var req model.GetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("parsing", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	res, err := r.kapi.GetDynamicResource(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.YAML(http.StatusOK, res.Object)
}

func (r *Route) CreateKubeResource(c *gin.Context) {
	var req model.ObjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	created, err := r.kapi.CreateOrUpdateKubeResource(c.Request.Context(), req, "create")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.YAML(http.StatusOK, created)
}

func (r *Route) UpdateKubeResource(c *gin.Context) {
	var req model.ObjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	updated, err := r.kapi.CreateOrUpdateKubeResource(c.Request.Context(), req, "update")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.YAML(http.StatusOK, updated)
}

func (r *Route) DeleteDynamicResources(c *gin.Context) {
	var req model.DeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	if err := r.kapi.DeleteDynamicResources(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": ""})
}

func (r *Route) ScaleResource(c *gin.Context) {
	var req model.ResourceOperation
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("parsing", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if err := r.kapi.ScaleResource(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": ""})
}

func (r *Route) TriggerCronjob(c *gin.Context) {
	var req model.TriggerCronjob
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	jobName, err := r.kapi.TriggerCronjob(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": jobName})
}

func (r *Route) CleanUp(c *gin.Context) {
	var req model.PayloadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	r.watchers.Range(func(k string, v w.Interface) bool {
		if strings.Contains(k, req.Server) {
			slog.Debug("stop watcher", "k", k)
			v.Stop()
		}
		return true
	})
	r.helmWathers.Range(func(k string, v informers.SharedInformerFactory) bool {
		slog.Debug("helm watcher", "k", k)
		// TODO
		return true
	})
	c.JSON(http.StatusOK, gin.H{"message": "cleanup"})
}

func (r *Route) Login(c *gin.Context) {
	var req model.Creds
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("parsing", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	if err := req.Validate(); err != nil {
		slog.Error("validate", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	u, ok := r.users.Users[req.Username]
	if !ok || bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid credentials"})
		return
	}

	exp := time.Now().Add(1 * time.Hour)
	claims := &model.Claims{
		Username: u.Username,
		Role:     u.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString([]byte(r.cfg.JWTKey))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": t})
}
