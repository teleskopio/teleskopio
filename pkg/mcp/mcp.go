package mcp

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"teleskopio/pkg/kubeapi"
	"teleskopio/pkg/model"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type Server struct {
	server *server.MCPServer
	kapi   *kubeapi.KubeAPI
}

const requestTimeout = time.Second * 5

func New(version string, kapi *kubeapi.KubeAPI) *Server {
	mcpServer := server.NewMCPServer(
		"teleskopio",
		version,
		server.WithToolCapabilities(true), // Enable tool capabilities
		server.WithIcons(
			mcp.Icon{
				MIMEType: "image/png",
				Src:      fmt.Sprintf("data:image/png;base64,%s", iconData),
			}),
		server.WithLogging(),  // Enable logging
		server.WithRecovery(), // Enable error recovery
	)

	return &Server{
		kapi:   kapi,
		server: mcpServer,
	}
}

func (s *Server) SetupRoutes(router *gin.Engine) *Server {
	for _, method := range []string{http.MethodPost, http.MethodOptions, http.MethodGet, http.MethodDelete} {
		router.Handle(method, "/mcp", gin.WrapH(s.ServeHTTP()))
	}
	return s
}

func (s *Server) ServeHTTP() *server.StreamableHTTPServer {
	return server.NewStreamableHTTPServer(s.server,
		server.WithHeartbeatInterval(30*time.Second), // TODO custom
		server.WithEndpointPath("/mcp"),
		server.WithStreamableHTTPCORS(
			server.WithCORSAllowedOrigins("*"),
			server.WithCORSAllowCredentials(),
			server.WithCORSMaxAge(300),
		),
	)
}

func LoadTools(mcpServer *Server) *Server {
	mcpServer.server.AddTool(
		mcp.NewTool("clusters",
			mcp.WithDescription("Get available kubernetes cluster endpoints"),
		),
		mcpServer.clusters,
	) // clusters
	mcpServer.server.AddTool(
		mcp.NewTool("cluster_version",
			mcp.WithDescription("Get kubernetes cluster version"),
			mcp.WithInputSchema[model.PayloadRequest](),
			mcp.WithOutputSchema[model.ClusterVersion](),
		),
		mcp.NewStructuredToolHandler(mcpServer.clusterVersion),
	) // cluster_version
	mcpServer.server.AddTool(
		mcp.NewTool("filter_pods",
			mcp.WithDescription("Get pods by field selector or label selector"),
			mcp.WithInputSchema[model.PodFilter](),
			mcp.WithOutputSchema[model.PodFilterResponse](),
		),
		mcp.NewStructuredToolHandler(mcpServer.filterpods),
	) // filter_pods

	return mcpServer
}

func (s *Server) clusters(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	slog.Debug("new tool call", "tool", "clusters")
	resp, err := mcp.NewToolResultJSON(map[string]any{"clusters": s.kapi.GetClusters()})
	return resp, err
}

func (s *Server) clusterVersion(ctx context.Context, request mcp.CallToolRequest, args model.PayloadRequest) (model.ClusterVersion, error) {
	slog.Debug("new tool call", "tool", "cluster_version", "args", args)
	cv := model.ClusterVersion{}
	ver, err := s.kapi.GetVersion(args)
	if err != nil {
		return cv, err
	}
	cv.Version = ver.GitVersion
	return cv, nil
}

func (s *Server) filterpods(ctx context.Context, request mcp.CallToolRequest, args model.PodFilter) (model.PodFilterResponse, error) {
	slog.Debug("new tool call", "tool", "filter_pods", "args", args)
	gpr := model.PodFilterResponse{}
	if err := args.Validate(); err != nil {
		return gpr, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()
	opts := metav1.ListOptions{
		FieldSelector: args.FieldSelector,
		LabelSelector: args.LabelSelector,
	}
	pods, err := s.kapi.FilterPods(ctx, args.Server, opts)
	return pods, err
}
