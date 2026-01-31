package router

import (
	"teleskopio/pkg/config"
	webSocket "teleskopio/pkg/socket"

	validation "github.com/go-ozzo/ozzo-validation/v4"
	w "k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/informers"
)

type Cluster struct {
	Server string `json:"server"`
}

type Payload struct {
	Server string `json:"server"`
}

func (p *Payload) Validate() error {
	return validation.ValidateStruct(p,
		validation.Field(&p.Server, validation.Required),
	)
}

type creds struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (c *creds) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.Username, validation.Required),
		validation.Field(&c.Password, validation.Required),
	)
}

type APIResource struct {
	APIVersion      string `json:"apiVersion"`
	Group           string `json:"group"`
	Version         string `json:"version"`
	Kind            string `json:"kind"`
	Namespaced      bool   `json:"namespaced"`
	Resource        string `json:"resource"`
	ResourceVersion string `json:"resource_version"`
}

func (a *APIResource) Validate() error {
	return validation.ValidateStruct(a,
		validation.Field(&a.Kind, validation.Required),
		validation.Field(&a.Version, validation.Required),
		validation.Field(&a.Resource, validation.Required),
	)
}

type ListRequest struct {
	UID       string `json:"uid"`
	Continue  string `json:"continue"`
	Limit     int64  `json:"limit"`
	Server    string `json:"server"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`

	APIResource APIResource `json:"apiResource"`
}

func (l *ListRequest) Validate() error {
	if err := validation.ValidateStruct(l,
		validation.Field(&l.Server, validation.Required),
	); err != nil {
		return err
	}
	if err := l.APIResource.Validate(); err != nil {
		return err
	}
	return nil
}

type WatchRequest struct {
	UID       string `json:"uid"`
	Server    string `json:"server"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`

	APIResource APIResource `json:"apiResource"`
}

type GetRequest struct {
	Server    string `json:"server"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`

	APIResource APIResource `json:"apiResource"`
}

type PodLogRequest struct {
	Server    string `json:"server"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Container string `json:"container"`
	TailLines *int64 `json:"tail_lines"`
}

type DeleteRequest struct {
	Server    string `json:"server"`
	Name      string `json:"name"`
	Resources []struct {
		Name      string `json:"name"`
		Namespace string `json:"namespace"`
	} `json:"resources"`
	APIResource APIResource `json:"apiResource"`
}

type CreateRequest struct {
	Server    string `json:"server"`
	Namespace string `json:"namespace"`

	Yaml string `json:"yaml"`
}

type NodeOperation struct {
	Server    string `json:"server"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`

	Cordon      bool        `json:"cordon"`
	APIResource APIResource `json:"apiResource"`
}

type NodeDrain struct {
	ResourceName        string `json:"resourceName"`
	ResourceUID         string `json:"resourceUid"`
	Server              string `json:"server"`
	DrainForce          bool   `json:"drainForce"`
	IgnoreAllDaemonSets bool   `json:"IgnoreAllDaemonSets"`
	DeleteEmptyDirData  bool   `json:"DeleteEmptyDirData"`
	DrainTimeout        int64  `json:"drainTimeout"`
}

type HelmRelease struct {
	Name      string `json:"name,omitempty"`
	Namespace string `json:"namespace,omitempty"`
	Server    string `json:"server,omitempty"`
}

type HelmChart struct {
	Namespaces []string `json:"namespaces,omitempty"`
	Server     string   `json:"server,omitempty"`
}

type TriggerCronjob struct {
	Server    string `json:"server"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`

	APIResource APIResource `json:"apiResource"`
}

type ResourceOperation struct {
	Server    string `json:"server"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Replicas  int64  `json:"replicas"`

	APIResource APIResource `json:"apiResource"`
}

type Route struct {
	cfg      *config.Config
	clusters []*config.Cluster
	users    *config.Users
	hub      *webSocket.Hub
	// TODO
	// Add mutex
	watchers        map[string]w.Interface
	helmWathers     map[string]informers.SharedInformerFactory
	podLogsWatchers map[string]chan (bool)
}
