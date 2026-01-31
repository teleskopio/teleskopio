import { hookstate, useHookstate } from '@hookstate/core';
import { toast } from 'sonner';
import { call } from '@/lib/api';
import { HelmRelease } from '@/types';

export const helmState = hookstate<Map<string, HelmRelease>>(new Map());

export async function getCharts(namespaces: string[]) {
  try {
    let { charts } = await call<any[]>('helm_releases', {
      namespaces: namespaces,
    });
    (charts || []).forEach((chart: HelmRelease) => {
      const newMap = new Map(helmState.value);
      newMap.set(`${chart.namespace}-${chart.name}`, chart);
      helmState.set(newMap);
    });
  } catch (error: any) {
    toast.error('Error! Cant load helm charts\n' + error.message);
    console.error('Error! Cant load helm charts\n' + error.message);
  }
}

export function useHelmState() {
  return useHookstate(helmState);
}
