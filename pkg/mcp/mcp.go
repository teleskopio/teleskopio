package mcp

import (
	"context"
	"fmt"
	"net/http"
	"teleskopio/pkg/kubeapi"
	"teleskopio/pkg/model"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

type Server struct {
	server *server.MCPServer
	kapi   *kubeapi.KubeAPI
}

func New(kapi *kubeapi.KubeAPI) *Server {
	mcpServer := server.NewMCPServer(
		"teleskopio-mcp",
		"0.0.1",
		server.WithToolCapabilities(true), // Enable tool capabilities
		server.WithIcons(
			mcp.Icon{
				MIMEType: "image/png",
				Src:      "https://github.com/teleskopio/teleskopio/blob/132d0feedc4b7134e6b0143f749529c315f61d50/assets/icon.png",
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

	return mcpServer
}

func (s *Server) clusters(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	resp, err := mcp.NewToolResultJSON(map[string]any{"clusters": s.kapi.GetClusters()})
	return resp, err
}

func (s *Server) clusterVersion(ctx context.Context, request mcp.CallToolRequest, args model.PayloadRequest) (*mcp.CallToolResult, error) {
	ver, err := s.kapi.GetVersion(args)
	if err != nil {
		return nil, err
	}
	fallbackText := fmt.Sprintf("The cluster version is: %s", ver.GitVersion)
	return mcp.NewToolResultStructured(model.ClusterVersion{Version: ver.GitVersion}, fallbackText), nil
}
