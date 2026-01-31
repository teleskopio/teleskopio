package cache

import (
	"context"
	"log/slog"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/cache"
)

func NewCacheInformers(_ context.Context, stopCh chan struct{}, client *kubernetes.Clientset, funcs cache.ResourceEventHandlerFuncs) informers.SharedInformerFactory {
	factory := informers.NewSharedInformerFactoryWithOptions(
		client,
		0,
		informers.WithNamespace(metav1.NamespaceAll),
		informers.WithTweakListOptions(func(opts *metav1.ListOptions) {
			opts.FieldSelector = "type=helm.sh/release.v1"
		}),
	)
	secretInformer := factory.Core().V1().Secrets().Informer()
	if _, err := secretInformer.AddEventHandler(funcs); err != nil {
		slog.Error("add event handler", "err", err.Error())
	}
	factory.Start(stopCh)
	go factory.WaitForCacheSync(stopCh)
	return factory
}
