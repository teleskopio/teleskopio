package model

import (
	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/golang-jwt/jwt/v5"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

type Claims struct {
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

type Cluster struct {
	Server string `json:"server"`
}

type PayloadRequest struct {
	Server string `json:"server,required" jsonschema_description:"the kubernetes cluster endpoint"`
}

type ClusterVersion struct {
	Version string `json:"version" jsonschema_description:"the kubernetes cluster version"`
}

type ClusterResponse struct {
	Server string `json:"server" jsonschema_description:"the kubernetes cluster endpoint"`
}

func (p *PayloadRequest) Validate() error {
	return validation.ValidateStruct(p,
		validation.Field(&p.Server, validation.Required),
	)
}

type Creds struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (c *Creds) Validate() error {
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

func (a *APIResource) GetGVR() schema.GroupVersionResource {
	return schema.GroupVersionResource{
		Group:    a.Group,
		Version:  a.Version,
		Resource: a.Resource,
	}
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

func (g *GetRequest) Validate() error {
	if err := validation.ValidateStruct(g,
		validation.Field(&g.Server, validation.Required),
	); err != nil {
		return err
	}
	if err := g.APIResource.Validate(); err != nil {
		return err
	}
	return nil
}

type PodLogRequest struct {
	Server    string `json:"server"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Container string `json:"container"`
	TailLines *int64 `json:"tail_lines"`
}

func (p *PodLogRequest) Validate() error {
	return validation.ValidateStruct(p,
		validation.Field(&p.Server, validation.Required),
		validation.Field(&p.Name, validation.Required),
		validation.Field(&p.Namespace, validation.Required),
		validation.Field(&p.Container, validation.Required),
	)
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

func (d *DeleteRequest) Validate() error {
	return validation.ValidateStruct(d,
		validation.Field(&d.Server, validation.Required),
		validation.Field(&d.Resources, validation.Required),
	)
}

type ObjectRequest struct {
	Server    string `json:"server"`
	Namespace string `json:"namespace"`

	Yaml string `json:"yaml"`
}

func (o *ObjectRequest) Validate() error {
	if err := validation.ValidateStruct(o,
		validation.Field(&o.Server, validation.Required),
		validation.Field(&o.Yaml, validation.Required),
	); err != nil {
		return err
	}
	return nil
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

func (t *TriggerCronjob) Validate() error {
	return validation.ValidateStruct(t,
		validation.Field(&t.Server, validation.Required),
		validation.Field(&t.Name, validation.Required),
		validation.Field(&t.Namespace, validation.Required),
	)
}

type ResourceOperation struct {
	Server    string `json:"server"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Replicas  int64  `json:"replicas"`

	APIResource APIResource `json:"apiResource"`
}

func (r *ResourceOperation) Validate() error {
	return validation.ValidateStruct(r,
		validation.Field(&r.Server, validation.Required),
		validation.Field(&r.Name, validation.Required),
		validation.Field(&r.Namespace, validation.Required),
	)
}
