import type { ApiResource } from '@/types';
import { getLocalKeyObject } from '@/lib/localStorage';
import { call } from '@/lib/api';
import { toast } from 'sonner';

export async function Load(kind: string, group: string, name: string, namespace: string) {
  const config = getLocalKeyObject('currentCluster');
  const resource = config.apiResources?.find(
    (r: ApiResource) => r.kind === kind && r.group === group,
  );
  if (!resource) throw new Error(`API resource for kind ${kind} not found`);
  const response = await call('get_dynamic_resource', {
    name: name,
    namespace: namespace === 'empty' ? '' : namespace,
    apiResource: { ...resource },
  });
  if (response.message) {
    toast.error(`Error: ${response.message}`);
    return;
  }
  return response;
}

export async function LoadHelmRelease(name: string, namespace: string) {
  let request = {
    name: name,
    namespace: namespace,
  };
  const response = await call('helm_release', request);
  if (response.message) {
    toast.error(`Error: ${response.message}`);
    return;
  }
  return response;
}
