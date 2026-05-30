package mcp

import (
	"context"
	"log/slog"
	"slices"
	"teleskopio/pkg/model"

	"github.com/mark3labs/mcp-go/mcp"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/dynamic"
)

func LoadTools(mcpServer *Server) *Server {
	mcpServer.server.AddTool(
		mcp.NewTool("clusters",
			mcp.WithDescription("Get available kubernetes cluster endpoints"),
		),
		mcpServer.clusters,
	) // clusters
	mcpServer.server.AddTool(
		mcp.NewTool("api_resources",
			mcp.WithDescription("Get available api resources of the kubernetes cluster, filter by kind is available."),
			mcp.WithInputSchema[model.APIResourceRequest](),
			mcp.WithOutputSchema[model.APIResourceResponse](),
		),
		mcp.NewStructuredToolHandler(mcpServer.apiResources),
	) // api_resources
	//nolint:lll
	mcpServer.server.AddTool(
		mcp.NewTool("list_resources",
			mcp.WithDescription("Get the list of resources by field selector or label selector. Available resource is requested by api_resources tool. An example of resource key to list nodes: {'apiVersion':'v1','group':'','version':'v1','kind':'Node','namespaced':false,'resource':'nodes'}"),
			mcp.WithInputSchema[model.ResourceFilter](),
			mcp.WithOutputSchema[model.ResourceFilterResponse](),
		),
		mcp.NewStructuredToolHandler(mcpServer.listResources),
	) // get_resources

	return mcpServer
}

func (s *Server) clusters(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	slog.Debug("new tool call", "tool", "clusters")
	resp, err := mcp.NewToolResultJSON(map[string]any{"clusters": s.kapi.GetClusters()})
	return resp, err
}

func (s *Server) apiResources(_ context.Context, request mcp.CallToolRequest, args model.APIResourceRequest) (model.APIResourceResponse, error) {
	slog.Debug("new tool call", "tool", "api_resources", "args", args)
	ar := model.APIResourceResponse{}
	if err := args.Validate(); err != nil {
		return ar, err
	}
	apiResources, err := s.kapi.ListResources(args.Server)
	if err != nil {
		return ar, err
	}
	if args.Kind != "" {
		apiResources = slices.DeleteFunc(apiResources, func(a model.APIResource) bool {
			return a.Kind != args.Kind
		})
	}
	ar.Items = apiResources
	return ar, err
}

func (s *Server) listResources(ctx context.Context, _ mcp.CallToolRequest, args model.ResourceFilter) (model.ResourceFilterResponse, error) {
	slog.Debug("new tool call", "tool", "get_resources", "args", args)
	resources := model.ResourceFilterResponse{}
	if err := args.Validate(); err != nil {
		return resources, err
	}
	kapi, err := s.kapi.GetClient(args.Server)
	if err != nil {
		return resources, err
	}
	apiResourceList, err := s.kapi.GetResource(args.Server, args.Resource)
	if err != nil {
		return resources, err
	}
	s.kapi.SetResource(&args.Resource, apiResourceList)
	gvr := args.Resource.GetGVR()

	var ri dynamic.ResourceInterface
	if args.Resource.Namespaced {
		ri = kapi.Dynamic.Resource(gvr).Namespace(args.Namespace)
	} else {
		ri = kapi.Dynamic.Resource(gvr)
	}

	ctxtimeout, cancel := context.WithTimeout(ctx, requestTimeout)
	defer cancel()
	opts := metav1.ListOptions{
		FieldSelector: args.FieldSelector,
		LabelSelector: args.LabelSelector,
	}
	items, err := ri.List(ctxtimeout, opts)
	if err != nil {
		return resources, err
	}
	for _, o := range items.Items {
		object := o.Object
		// Remove managedFields
		delete(object["metadata"].(map[string]any), "managedFields")
		if args.Full {
			resources.Items = append(resources.Items, object)
			continue
		}
		resources.Items = append(resources.Items, map[string]any{
			"kind":      object["kind"],
			"name":      object["metadata"].(map[string]any)["name"],
			"namespace": object["metadata"].(map[string]any)["namespace"],
		})
	}
	return resources, nil
}
