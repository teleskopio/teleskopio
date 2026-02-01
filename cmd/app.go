package cmd

import (
	"embed"
	"log/slog"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"teleskopio/pkg/config"
	"teleskopio/pkg/middleware"
	httpRouter "teleskopio/pkg/router"
	webSocket "teleskopio/pkg/socket"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"

	"github.com/lmittmann/tint"
)

var logOutput = os.Stdout

type App struct {
	Config   *config.Config
	Clusters []*config.Cluster
	Users    *config.Users
	signchnl chan (os.Signal)
	exitSig  chan (os.Signal)
	isReady  bool
	mu       sync.Mutex
}

func New(version string, configPath string, exitchnl, signchnl chan (os.Signal)) (*App, error) {
	app := &App{exitSig: exitchnl, signchnl: signchnl}
	cfg, clusters, users, err := config.Parse(configPath)
	if err != nil {
		return app, err
	}
	app.Config = &cfg
	app.Config.Version = version
	app.Clusters = clusters
	app.Config = &cfg
	app.Users = &users
	initLogger(&cfg)
	slog.Info("read config at", "path", configPath)
	if err := cfg.Validate(); err != nil {
		return app, err
	}
	return app, nil
}

func (a *App) Run(staticFiles embed.FS) error {
	slog.Info("version", "version", a.Config.Version)
	a.mu.Lock()
	if err := a.initServer(staticFiles); err != nil {
		slog.Error("cant init server", "error", err)
	}
	a.isReady = true
	a.mu.Unlock()
	go func() {
		code := <-a.signchnl
		slog.Info("os signal received", "signal", code)
		a.exitSig <- code
	}()
	return nil
}

func initLogger(cfg *config.Config) {
	level := new(slog.LevelVar)
	handler := &slog.HandlerOptions{
		Level: level,
	}
	var logger *slog.Logger
	logger = slog.New(slog.NewTextHandler(logOutput, handler))
	if cfg.LogJSON {
		logger = slog.New(slog.NewJSONHandler(logOutput, handler))
	}
	if cfg.LogColor {
		logger = slog.New(tint.NewHandler(logOutput, &tint.Options{
			Level:      level,
			TimeFormat: time.Kitchen,
		}))
	}

	if err := level.UnmarshalText([]byte(cfg.LogLevel)); err != nil {
		level.Set(slog.LevelDebug)
	}
	slog.SetDefault(logger)
	slog.Info("set loglevel", "level", level)
}

func (a *App) initServer(staticFiles embed.FS) error {
	slog.Info("initialize web server", "addr", a.Config.ServerHTTP)
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	mdlwr := middleware.New(a.Config)
	router.Use(mdlwr.Logger())
	router.Use(gin.Recovery())
	hub := webSocket.NewHub()
	go hub.Run()
	r, err := httpRouter.New(hub, router, a.Config, a.Clusters, a.Users)
	if err != nil {
		return err
	}
	indexfs, err := static.EmbedFolder(staticFiles, "dist")
	if err != nil {
		return err
	}
	router.Use(static.Serve("/", indexfs))
	for _, ro := range []string{
		"/settings",
		"/helm",
		"/createkubernetesresource",
		"/resource/Logs/:namespace/:name",
		"/yaml/:resource/:name/:namespace",
		"/resource/:resource",
	} {
		router.GET(ro, func(c *gin.Context) {
			c.FileFromFS("/", indexfs)
		})
	}
	router.NoRoute(func(c *gin.Context) {
		slog.Debug("hit no route", "request uri", c.Request.RequestURI)
		if strings.HasPrefix(c.Request.URL.Path, "/yaml") {
			re := regexp.MustCompile(`^(/[^/]+){3}`)
			newPath := re.ReplaceAllString(c.Request.URL.Path, "")
			c.Request.RequestURI = newPath
			c.Request.URL.Path = newPath
			c.FileFromFS(newPath, indexfs)
			return
		}
		if strings.HasPrefix(c.Request.URL.Path, "/resource/Logs") {
			re := regexp.MustCompile(`^(/[^/]+){3}`)
			newPath := re.ReplaceAllString(c.Request.URL.Path, "")
			c.Request.RequestURI = newPath
			c.Request.URL.Path = newPath
			c.FileFromFS(newPath, indexfs)
			return
		}
		if strings.HasPrefix(c.Request.URL.Path, "/resource") {
			newPath := strings.TrimPrefix(c.Request.URL.Path, "/resource")
			c.Request.RequestURI = newPath
			c.Request.URL.Path = newPath
			c.FileFromFS(newPath, indexfs)
			return
		}
		c.FileFromFS("404.html", indexfs)
	})

	router.GET("/api/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	// Liveness probe for Kubernetes
	router.GET("/healthz", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	router.GET("/readyz", func(c *gin.Context) {
		if a.isReady {
			c.JSON(http.StatusOK, gin.H{"message": "ready"})
			return
		}
		c.JSON(http.StatusServiceUnavailable, gin.H{"message": "not ready"})
	})
	router.GET("/api/auth_disabled", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": a.Config.AuthDisabled})
	})
	router.POST("/api/login", r.Login)
	auth := router.Group("/api")
	auth.Use(mdlwr.Auth())
	auth.GET("/lookup_configs", r.LookupConfigs)
	auth.POST("/get_version", r.GetVersion)
	auth.POST("/list_apiresources", r.ListResources)
	auth.POST("/list_dynamic_resource", r.ListDynamicResource)
	auth.POST("/list_crd_resource", r.ListCustomResourceDefinitions)
	auth.POST("/list_events_dynamic_resource", r.ListEventsDynamicResource)
	auth.POST("/watch_events_dynamic_resource", r.WatchEventsDynamicResource)
	auth.POST("/watch_dynamic_resource", r.WatchDynamicResource)
	auth.POST("/get_dynamic_resource", r.GetDynamicResource)
	auth.POST("/get_pod_logs", r.GetPodLogs)
	auth.POST("/stop_pod_log_stream", r.StopStreamPodLogs)
	auth.POST("/stream_pod_logs", r.StreamPodLogs)
	auth.POST("/delete_dynamic_resources", mdlwr.CheckRole(), r.DeleteDynamicResources)
	auth.POST("/create_kube_resource", mdlwr.CheckRole(), r.CreateKubeResource)
	auth.POST("/update_kube_resource", mdlwr.CheckRole(), r.UpdateKubeResource)
	auth.POST("/cordon_node", mdlwr.CheckRole(), r.NodeOperation)
	auth.POST("/uncordon_node", mdlwr.CheckRole(), r.NodeOperation)
	auth.POST("/drain_node", mdlwr.CheckRole(), r.NodeDrain)
	auth.POST("/scale_resource", mdlwr.CheckRole(), r.ScaleResource)
	auth.POST("/trigger_cronjob", mdlwr.CheckRole(), r.TriggerCronjob)
	auth.POST("/helm_releases", mdlwr.CheckRole(), r.ListHelmReleases)
	auth.POST("/helm_release", mdlwr.CheckRole(), r.GetHelmRelease)
	webSocket.SetupWebsocket(hub, router)

	go func() {
		addr := a.Config.ServerHTTP
		if err := router.Run(addr); err != nil {
			slog.Error("cant run server", "error", err)
		}
	}()
	return nil
}
