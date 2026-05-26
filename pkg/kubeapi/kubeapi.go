package kubeapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"teleskopio/pkg/config"
	"teleskopio/pkg/model"
	"time"

	batchv1 "k8s.io/api/batch/v1"
	"k8s.io/kubectl/pkg/drain"

	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	k8sYAML "k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/apimachinery/pkg/version"
	"k8s.io/client-go/dynamic"

	"github.com/patrickmn/go-cache"
)

type KubeAPI struct {
	clusters map[string]*config.Cluster
	cache    *cache.Cache
}

func New(clusters []*config.Cluster) *KubeAPI {
	clustersMap := map[string]*config.Cluster{}
	for _, c := range clusters {
		clustersMap[c.Address] = c
	}
	return &KubeAPI{
		clusters: clustersMap,
		// TODO longer expiration?
		cache: cache.New(1*time.Minute, 10*time.Minute),
	}
}

func (k *KubeAPI) GetClusters() []model.Cluster {
	configs := []model.Cluster{}
	for _, k := range k.clusters {
		configs = append(configs, model.Cluster{Server: k.Address})
	}
	return configs
}

func (k *KubeAPI) GetVersion(req model.PayloadRequest) (*version.Info, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	server, err := k.getClient(req.Server)
	if err != nil {
		return nil, err
	}
	ver, err := server.Typed.Discovery().ServerVersion()
	return ver, err
}

func (k *KubeAPI) ListCustomResourceDefinitions(ctx context.Context, req model.PayloadRequest) (*v1.CustomResourceDefinitionList, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	server, err := k.getClient(req.Server)
	if err != nil {
		return nil, err
	}
	crdList, err := server.APIExtension.ApiextensionsV1().CustomResourceDefinitions().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return crdList, nil
}

func (k *KubeAPI) ListResources(req model.PayloadRequest) ([]model.APIResource, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	server, err := k.getClient(req.Server)
	if err != nil {
		return nil, err
	}
	discoveryClient := server.Typed.Discovery()
	apiGroupResources, err := discoveryClient.ServerPreferredResources()
	if err != nil {
		return nil, err
	}
	result := []model.APIResource{}
	for _, list := range apiGroupResources {
		gv, err := schema.ParseGroupVersion(list.GroupVersion)
		if err != nil {
			return nil, err
		}
		for _, res := range list.APIResources {
			apiResource := model.APIResource{
				Group:      gv.Group,
				Version:    gv.Version,
				Kind:       res.Kind,
				Resource:   res.Name,
				Namespaced: res.Namespaced,
			}
			apiResource.APIVersion = fmt.Sprintf("%s/%s", gv.Group, gv.Version)
			if gv.Group == "" {
				apiResource.APIVersion = gv.Version
			}
			result = append(result, apiResource)
		}
	}
	return result, nil
}

func (k *KubeAPI) ListDynamicResource(ctx context.Context, req model.ListRequest) ([]unstructured.Unstructured, string, string, error) {
	if err := req.Validate(); err != nil {
		return nil, "", "", err
	}
	ri, err := k.GetResourceInterface(req.Server, req.Namespace, &req.APIResource)
	if err != nil {
		return nil, "", "", err
	}
	list, err := ri.List(ctx, metav1.ListOptions{
		Limit:    req.Limit,
		Continue: req.Continue,
	})
	if err != nil {
		return nil, "", "", err
	}
	for i := range list.Items {
		list.Items[i].SetAPIVersion(req.APIResource.Version)
		if req.APIResource.Group != "" {
			list.Items[i].SetAPIVersion(fmt.Sprintf("%s/%s", req.APIResource.Group, req.APIResource.Version))
		}
		list.Items[i].SetKind(req.APIResource.Kind)
	}
	continueToken, resourceVersion := "", ""
	metadata := list.Object["metadata"].(map[string]interface{})
	if v, ok := metadata["resourceVersion"].(string); ok {
		resourceVersion = v
	}
	if v, ok := metadata["continue"].(string); ok {
		continueToken = v
	}
	return list.Items, continueToken, resourceVersion, nil
}

func (k *KubeAPI) FilterPods(ctx context.Context, server string, opts metav1.ListOptions) (model.PodFilterResponse, error) {
	result := model.PodFilterResponse{}

	s, err := k.getClient(server)
	if err != nil {
		return result, err
	}

	pods, err := s.Typed.CoreV1().Pods(metav1.NamespaceAll).List(ctx, opts)
	if err != nil {
		return result, err
	}

	for _, pod := range pods.Items {
		result.Items = append(
			result.Items,
			model.PodItem{
				Name:      pod.Name,
				Namespace: pod.Namespace,
				Phase:     string(pod.Status.Phase),
				NodeName:  pod.Spec.NodeName,
			})
	}
	return result, nil
}

func (k *KubeAPI) ListEventsDynamicResource(ctx context.Context, req model.ListRequest) ([]unstructured.Unstructured, string, string, error) {
	if err := req.Validate(); err != nil {
		return nil, "", "", err
	}
	ri, err := k.GetResourceInterface(req.Server, req.Namespace, &req.APIResource)
	if err != nil {
		return nil, "", "", err
	}
	fieldSelector := ""
	if req.APIResource.Group == "" {
		fieldSelector = fmt.Sprintf("involvedObject.uid=%s", req.UID)
	} else {
		fieldSelector = fmt.Sprintf("regarding.uid=%s", req.UID)
	}
	listParams := metav1.ListOptions{
		Limit:         req.Limit,
		Continue:      req.Continue,
		FieldSelector: fieldSelector,
	}

	list, err := ri.List(ctx, listParams)
	if err != nil {
		return nil, "", "", err
	}

	for i := range list.Items {
		list.Items[i].SetAPIVersion("%s")
		if req.APIResource.Group != "" {
			list.Items[i].SetAPIVersion(fmt.Sprintf("%s/%s", req.APIResource.Group, req.APIResource.Version))
		}
		list.Items[i].SetKind(req.APIResource.Kind)
	}
	continueToken, resourceVersion := "", ""
	metadata := list.Object["metadata"].(map[string]interface{})
	if v, ok := metadata["resourceVersion"].(string); ok {
		resourceVersion = v
	}
	if v, ok := metadata["continue_"].(string); ok {
		continueToken = v
	}
	return list.Items, continueToken, resourceVersion, nil
}

func (k *KubeAPI) GetDynamicResource(ctx context.Context, req model.GetRequest) (*unstructured.Unstructured, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	ri, err := k.GetResourceInterface(req.Server, req.Namespace, &req.APIResource)
	if err != nil {
		return nil, err
	}
	res, err := ri.Get(ctx, req.Name, metav1.GetOptions{})
	return res, err
}

func (k *KubeAPI) CreateOrUpdateKubeResource(ctx context.Context, req model.ObjectRequest, op string) (*unstructured.Unstructured, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	server, err := k.getClient(req.Server)
	if err != nil {
		return nil, err
	}
	decoder := k8sYAML.NewYAMLOrJSONDecoder(bytes.NewReader([]byte(req.Yaml)), 1024)
	obj := &unstructured.Unstructured{}
	if err := decoder.Decode(obj); err != nil && err != io.EOF {
		return nil, err
	}

	gvk := obj.GroupVersionKind()

	apiResList, err := server.Typed.ServerResourcesForGroupVersion(schema.GroupVersion{
		Group:   gvk.Group,
		Version: gvk.Version,
	}.String())
	if err != nil {
		return nil, err
	}

	var plural string
	for _, res := range apiResList.APIResources {
		if res.Kind == gvk.Kind {
			plural = res.Name
			break
		}
	}
	if plural == "" {
		return nil, fmt.Errorf("resource kind %s not found in API group %s/%s", gvk.Kind, gvk.Group, gvk.Version)
	}

	gvr := schema.GroupVersionResource{
		Group:    gvk.Group,
		Version:  gvk.Version,
		Resource: plural,
	}

	ns := obj.GetNamespace()
	var ri dynamic.ResourceInterface
	if ns != "" {
		ri = server.Dynamic.Resource(gvr).Namespace(ns)
	} else {
		ri = server.Dynamic.Resource(gvr)
	}

	var result *unstructured.Unstructured
	switch op {
	case "create":
		result, err = ri.Create(ctx, obj, metav1.CreateOptions{})
	case "update":
		result, err = ri.Update(ctx, obj, metav1.UpdateOptions{})
	}
	return result, err
}

func (k *KubeAPI) TriggerCronjob(ctx context.Context, req model.TriggerCronjob) (string, error) {
	if err := req.Validate(); err != nil {
		return "", err
	}
	server, err := k.getClient(req.Server)
	if err != nil {
		return "", err
	}

	apiResourceList, err := k.getResource(req.Server, req.APIResource)
	if err != nil {
		return "", err
	}

	k.setResource(&req.APIResource, apiResourceList)

	cronJob, err := server.Typed.BatchV1().CronJobs(req.Namespace).Get(ctx, req.Name, metav1.GetOptions{})
	if err != nil {
		return "", err
	}
	jobSpec := cronJob.Spec.JobTemplate.Spec
	jobName := fmt.Sprintf("%s-manual-%d", req.Name, metav1.Now().Unix())

	_, err = server.Typed.BatchV1().Jobs(req.Namespace).Create(ctx, &batchv1.Job{
		ObjectMeta: metav1.ObjectMeta{
			Name:      jobName,
			Namespace: req.Namespace,
		},
		Spec: jobSpec,
	}, metav1.CreateOptions{})
	if err != nil {
		return "", err
	}
	return jobName, nil
}

func (k *KubeAPI) ScaleResource(ctx context.Context, req model.ResourceOperation) error {
	if err := req.Validate(); err != nil {
		return err
	}
	server, err := k.getClient(req.Server)
	if err != nil {
		return err
	}

	apiResourceList, err := k.getResource(req.Server, req.APIResource)
	if err != nil {
		return err
	}

	k.setResource(&req.APIResource, apiResourceList)
	gvr := req.APIResource.GetGVR()
	resource, err := server.Dynamic.Resource(gvr).
		Namespace(req.Namespace).
		Get(ctx, req.Name, metav1.GetOptions{})
	if err != nil {
		return err
	}
	unstr := &unstructured.Unstructured{Object: resource.Object}
	if err := unstructured.SetNestedField(unstr.Object, req.Replicas, "spec", "replicas"); err != nil {
		return err
	}
	if _, err := server.Dynamic.Resource(gvr).
		Namespace(req.Namespace).
		Update(ctx, unstr, metav1.UpdateOptions{}); err != nil {
		return err
	}
	return nil
}

func (k *KubeAPI) DeleteDynamicResources(ctx context.Context, req model.DeleteRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}
	server, err := k.getClient(req.Server)
	if err != nil {
		return err
	}

	apiResourceList, err := k.getResource(req.Server, req.APIResource)
	if err != nil {
		return err
	}

	k.setResource(&req.APIResource, apiResourceList)
	gvr := req.APIResource.GetGVR()
	if req.APIResource.Namespaced {
		for _, res := range req.Resources {
			if err := server.Dynamic.Resource(gvr).Namespace(res.Namespace).Delete(ctx, res.Name, metav1.DeleteOptions{}); err != nil {
				return err
			}
		}
	} else {
		for _, res := range req.Resources {
			if err := server.Dynamic.Resource(gvr).Delete(ctx, res.Name, metav1.DeleteOptions{}); err != nil {
				return err
			}
		}
	}
	return nil
}

func (k *KubeAPI) GetPodLogsReader(ctx context.Context, req model.PodLogRequest, podLogOptions *corev1.PodLogOptions) (io.ReadCloser, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	server, err := k.getClient(req.Server)
	if err != nil {
		return nil, err
	}

	logsReq := server.Typed.CoreV1().Pods(req.Namespace).GetLogs(req.Name, podLogOptions)
	podLogs, err := logsReq.Stream(ctx)
	return podLogs, err
}

func (k *KubeAPI) NodeOperation(ctx context.Context, req model.NodeOperation) error {
	// TODO validate
	server, err := k.getClient(req.Server)
	if err != nil {
		return err
	}
	apiResourceList, err := k.getResource(req.Server, req.APIResource)
	if err != nil {
		return err
	}

	k.setResource(&req.APIResource, apiResourceList)
	ri := server.Dynamic.Resource(req.APIResource.GetGVR())

	payload := []struct {
		Op    string `json:"op"`
		Path  string `json:"path"`
		Value bool   `json:"value"`
	}{{
		Op:    "replace",
		Path:  "/spec/unschedulable",
		Value: req.Cordon,
	}}
	payloadBytes, _ := json.Marshal(payload)

	if _, err := ri.Patch(ctx, req.Name, types.JSONPatchType, payloadBytes, metav1.PatchOptions{}); err != nil {
		return err
	}
	return nil
}

func (k *KubeAPI) NodeDrain(ctx context.Context, req model.NodeDrain, onDelete func(pod *corev1.Pod, usingEviction bool)) (*corev1.Node, error) {
	// TODO validate
	server, err := k.getClient(req.Server)
	if err != nil {
		return nil, err
	}
	node, err := server.Typed.CoreV1().Nodes().Get(ctx, req.ResourceName, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	drainer := &drain.Helper{
		Ctx:                   ctx,
		Client:                server.Typed,
		Force:                 req.DrainForce,
		IgnoreAllDaemonSets:   req.IgnoreAllDaemonSets,
		DeleteEmptyDirData:    req.DeleteEmptyDirData,
		Timeout:               time.Duration(req.DrainTimeout) * time.Second,
		Out:                   os.Stdout,
		ErrOut:                os.Stderr,
		OnPodDeletedOrEvicted: onDelete,
	}
	if err := drain.RunCordonOrUncordon(drainer, node, true); err != nil {
		return nil, err
	}
	return node, drain.RunNodeDrain(drainer, req.ResourceName)
}

func (k *KubeAPI) setResource(req *model.APIResource, apiResourceList *metav1.APIResourceList) {
	for _, r := range apiResourceList.APIResources {
		if r.Kind == req.Kind && r.SingularName == strings.ToLower(req.Kind) {
			req.Resource = r.Name
		}
	}
}

func (k *KubeAPI) getResource(server string, req model.APIResource) (*metav1.APIResourceList, error) {
	s, err := k.getClient(server)
	if err != nil {
		return nil, err
	}
	apiResourceList, found := k.cache.Get("apiResourceList")
	if !found {
		apiResourceList, err := s.Typed.ServerResourcesForGroupVersion(schema.GroupVersion{
			Group:   req.Group,
			Version: req.Version,
		}.String())
		if err != nil {
			return nil, err
		}
		k.cache.Set("apiResourceList", apiResourceList, cache.DefaultExpiration)
		return apiResourceList, nil
	}
	return apiResourceList.(*metav1.APIResourceList), nil
}

// GetClient - just a wrapper
func (k *KubeAPI) GetClient(server string) (*config.Cluster, error) {
	return k.getClient(server)
}

func (k *KubeAPI) getClient(server string) (*config.Cluster, error) {
	s, found := k.clusters[server]
	if found {
		return s, nil
	}
	return nil, fmt.Errorf("server %s not found", server)
}

func (k *KubeAPI) GetResourceInterface(server, ns string, resource *model.APIResource) (dynamic.ResourceInterface, error) {
	s, err := k.getClient(server)
	if err != nil {
		return nil, err
	}
	apiResourceList, err := k.getResource(server, *resource)
	if err != nil {
		return nil, err
	}
	k.setResource(resource, apiResourceList)
	gvr := resource.GetGVR()

	var ri dynamic.ResourceInterface
	if ns != "" {
		ri = s.Dynamic.Resource(gvr).Namespace(ns)
	} else {
		ri = s.Dynamic.Resource(gvr)
	}
	return ri, nil
}
