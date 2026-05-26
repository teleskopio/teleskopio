package genericmap

import "sync"

type Map[K comparable, V any] struct {
	inner sync.Map
}

func (m *Map[K, V]) Range(f func(key K, value V) bool) {
	m.inner.Range(func(k, v any) bool {
		return f(k.(K), v.(V))
	})
}

func (m *Map[K, V]) Delete(key K) {
	m.inner.Delete(key)
}

func (m *Map[K, V]) Load(key K) (V, bool) {
	val, ok := m.inner.Load(key)
	if !ok {
		var zero V
		return zero, false
	}
	return val.(V), true
}

func (m *Map[K, V]) Store(key K, val V) {
	m.inner.Store(key, val)
}
