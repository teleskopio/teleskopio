import { hookstate, useHookstate } from '@hookstate/core';
import { call } from '@/lib/api';

export const kubeConfigsState = hookstate<{ configs: object[] }>({
  configs: [],
});

export async function getConfigs(query: string) {
  let configs = await call<any[]>('lookup_configs');
  if (query !== '') {
    configs = configs.filter((c) => {
      return String(c.server || '')
        .toLowerCase()
        .includes(query.toLowerCase());
    });
  }
  kubeConfigsState.configs.set(configs);
}

export function useConfigsState() {
  return useHookstate(kubeConfigsState);
}
