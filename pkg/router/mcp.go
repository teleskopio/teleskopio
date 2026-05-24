package router

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

type HelloArgs struct {
	Name string `json:"name"`
}

type MCPServer struct {
	server *server.MCPServer
}

func InitMCP(r Route) *MCPServer {
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

	clustersTool := mcp.NewTool("clusters",
		mcp.WithDescription("Get available kubernetes cluster endpoints"),
	)

	mcpServer.AddTool(clustersTool, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		configs := []Cluster{}
		for _, k := range r.clusters {
			configs = append(configs, Cluster{Server: k.Address})
		}
		resp, err := mcp.NewToolResultJSON(map[string]any{"clusters": configs})
		slog.Debug("tool calling", "tool", clustersTool.Name, "result", resp)
		return resp, err
	})

	clusterVersionTool := mcp.NewTool("cluster_version",
		mcp.WithDescription("Get kubernetes cluster version"),
		mcp.WithString("server",
			mcp.Required(),
			mcp.Description("The kubernetes cluster endpoint"),
		),
	)

	mcpServer.AddTool(clusterVersionTool, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args := request.GetArguments()
		server := args["server"].(string)
		ver, err := r.GetCluster(server).Typed.Discovery().ServerVersion()
		if err != nil {
			return nil, err
		}
		resp := mcp.NewToolResultText(fmt.Sprintf("The cluster version: %s", ver.GitVersion))
		slog.Debug("tool calling", "tool", clustersTool.Name, "result", resp)
		return resp, nil
	})
	return &MCPServer{
		server: mcpServer,
	}
}

func (s *MCPServer) ServeHTTP() *server.StreamableHTTPServer {
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
