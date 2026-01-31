package config

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"strings"

	_ "embed"
	validation "github.com/go-ozzo/ozzo-validation/v4"
	"gopkg.in/yaml.v3"
	apiextensionsclientset "k8s.io/apiextensions-apiserver/pkg/client/clientset/clientset"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func GetConfigPath(configPathString string) string {
	if strings.Contains(configPathString, "~") {
		return strings.Replace(configPathString, "~", os.Getenv("HOME"), 1)
	}
	if configPathString != "" {
		return configPathString
	}
	if _, err := os.Stat("./config.yaml"); err == nil {
		return "./config.yaml"
	}
	defaultConfigPath := filepath.Join(os.Getenv("HOME"), ".config/teleskopio/config.yaml")
	if _, err := os.Stat(defaultConfigPath); err == nil {
		return defaultConfigPath
	}
	return ""
}

type User struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	Role     string `yaml:"role"`
}

type Config struct {
	LogColor     bool   `yaml:"log_color"`
	LogJSON      bool   `yaml:"log_json"`
	LogLevel     string `yaml:"log_level"`
	ServerHTTP   string `yaml:"server_http"`
	AuthDisabled bool   `yaml:"auth_disabled"`
	JWTKey       string `yaml:"jwt_key"`
	Users        []User `yaml:"users"`
	Kube         struct {
		APIRequestTimeout string           `yaml:"api_request_timeout"`
		Configs           []map[string]any `yaml:"configs"`
	} `yaml:"kube"`
	Version string
}

type Cluster struct {
	Address      string
	Typed        *kubernetes.Clientset
	Dynamic      dynamic.Interface
	RestConfig   *rest.Config
	APIExtension *apiextensionsclientset.Clientset
}

type Users struct {
	Users map[string]User
}

func Parse(configPath string) (Config, []*Cluster, Users, error) {
	var cfg Config
	clusters := []*Cluster{}

	users := Users{
		Users: make(map[string]User),
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return cfg, clusters, users, err
	}

	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return cfg, clusters, users, err
	}
	for _, raw := range cfg.Kube.Configs {
		b, err := yaml.Marshal(raw)
		if err != nil {
			return cfg, clusters, users, err
		}

		kubeCfg, err := clientcmd.Load(b)
		if err != nil {
			return cfg, clusters, users, err
		}

		restCfg, err := clientcmd.
			NewNonInteractiveClientConfig(*kubeCfg, kubeCfg.CurrentContext, &clientcmd.ConfigOverrides{}, nil).
			ClientConfig()
		if err != nil {
			return cfg, clusters, users, err
		}

		clientset, err := kubernetes.NewForConfig(restCfg)
		if err != nil {
			return cfg, clusters, users, err
		}
		dyn, err := dynamic.NewForConfig(restCfg)
		if err != nil {
			return cfg, clusters, users, err
		}
		apiExtension, err := apiextensionsclientset.NewForConfig(restCfg)
		if err != nil {
			return cfg, clusters, users, err
		}

		clusters = append(clusters, &Cluster{
			RestConfig:   restCfg,
			Address:      restCfg.Host,
			Typed:        clientset,
			Dynamic:      dyn,
			APIExtension: apiExtension,
		})
	}

	kubeconfig := os.Getenv("KUBECONFIG")
	if kubeconfig != "" {
		kubeCfg, err := clientcmd.LoadFromFile(kubeconfig)
		if err != nil {
			return cfg, clusters, users, fmt.Errorf("cant read KUBECONFIG %s", err)
		}
		restCfg, err := clientcmd.
			NewNonInteractiveClientConfig(*kubeCfg, kubeCfg.CurrentContext, &clientcmd.ConfigOverrides{}, nil).
			ClientConfig()
		if err != nil {
			return cfg, clusters, users, fmt.Errorf("cant read KUBECONFIG %s", err)
		}

		clientset, err := kubernetes.NewForConfig(restCfg)
		if err != nil {
			return cfg, clusters, users, fmt.Errorf("cant read KUBECONFIG %s", err)
		}
		dyn, err := dynamic.NewForConfig(restCfg)
		if err != nil {
			return cfg, clusters, users, fmt.Errorf("cant read KUBECONFIG %s", err)
		}
		apiExtension, err := apiextensionsclientset.NewForConfig(restCfg)
		if err != nil {
			return cfg, clusters, users, err
		}

		clusters = append(clusters, &Cluster{
			RestConfig:   restCfg,
			Address:      restCfg.Host,
			Typed:        clientset,
			Dynamic:      dyn,
			APIExtension: apiExtension,
		})
	}

	for _, u := range cfg.Users {
		users.Users[u.Username] = u
	}
	return cfg, clusters, users, nil
}

func (c *Config) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.LogLevel, validation.Required, validation.In("INFO", "DEBUG", "WARN").Error("must be one of 'INFO', 'DEBUG', 'WARN'")),
	)
}

//go:embed config.TEMPLATE.yaml
var configTemplate string

func GenerateConfig() ([]byte, error) {
	return executeTemplate(configTemplate)
}

func executeTemplate(tmpl string) ([]byte, error) {
	x, err := template.New("").Parse(tmpl)
	if err != nil {
		return nil, err
	}
	var b bytes.Buffer
	if err := x.Execute(&b, map[string]string{}); err != nil {
		return nil, err
	}
	return b.Bytes(), nil
}
