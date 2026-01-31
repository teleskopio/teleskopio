import React, { createContext, useContext, useEffect, useState } from 'react';
import { getLocalKeyObject, setLocalKeyObject, delLocalKey } from '@/lib/localStorage';
import type { ServerInfo, ApiResource } from '@/types';
import { toast } from 'sonner';
import { call } from '@/lib/api';
import { useWS } from '@/context/WsContext';
import { crsState } from '@/store/resources';
import { addSubscription } from '@/lib/subscriptionManager';
import { namespacesState } from '@/store/resources';
import { crdsState, useCrdResourcesState } from '@/store/crdResources';

type ConfigContextType = {
  serverInfo: ServerInfo | null;
  isLoading: boolean;
  setConfig: (value: ServerInfo | undefined) => void;
  deleteConfig: () => void;
};

const ConfigContext = createContext<ConfigContextType | null>(null);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { listen } = useWS();
  const crdResources = useCrdResourcesState();

  useEffect(() => {
    getConfig();
  }, [isLoading]);

  const getConfig = () => {
    const config = getLocalKeyObject('currentCluster');
    setServerInfo(config);
  };

  const setConfig = async (value: ServerInfo | undefined) => {
    if (value === undefined) {
      throw new Error('cant load server config');
    }
    setIsLoading(true);
    const apiResource = await call('list_apiresources', { server: value.server });
    value.apiResources = apiResource;
    setServerInfo(value);
    setLocalKeyObject('currentCluster', value);
    setServerInfo(value);
    await fetchAndWatchCRDs(listen, value.server, apiResource);
    Array.from(crdResources.get().values()).forEach((x) => {
      fetchAndWatchCRs(
        listen,
        value.server as string,
        x.spec.names.kind,
        x.spec.group,
        apiResource,
      );
    });
    await fetchAndWatchNamespaces(listen, value.server as string, apiResource);
    setIsLoading(false);
  };

  const deleteConfig = () => {
    delLocalKey('currentCluster');
    const si: ServerInfo = {
      server: '',
      version: '',
      apiResources: [],
    };
    setServerInfo(si);
  };

  return (
    <ConfigContext.Provider value={{ serverInfo, isLoading, setConfig, deleteConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used inside ConfigProvider');
  return ctx;
};

async function fetchAndWatchCRDs(
  listen: any,
  server: string | undefined,
  apiResources: ApiResource[] | undefined,
): Promise<Promise<Promise<void>>> {
  const [resources, rv] = await call('list_crd_resource', { server: server });
  if (!resources) {
    return;
  }
  if (resources.length === 0) {
    toast.error(<div>CRD Resources not loaded!</div>);
    return;
  }
  toast.info(<div>CRD Resources loaded: {resources.length}</div>);
  const resource = (apiResources || []).find(
    (r: ApiResource) => r.kind === 'CustomResourceDefinition',
  );
  await call('watch_dynamic_resource', { server, request: { ...resource, resource_version: rv } });
  resources
    .filter((x) => x.kind !== 'SelfSubjectReview')
    .forEach((x) => {
      crdsState.set((prev) => {
        const newMap = new Map(prev);
        newMap.set(x.metadata?.uid as string, x);
        return newMap;
      });
    });
  addSubscription(
    listen(`CustomResourceDefinition-${server}-deleted`, async (ev: any) => {
      fetchAndWatchCRs(listen, server, ev.spec.names.kind, ev.spec.group, apiResources);
      crdsState.set((prev) => {
        const newMap = new Map(prev);
        newMap.delete(ev.metadata?.uid as string);
        return newMap;
      });
    }),
  );
  addSubscription(
    listen(`CustomResourceDefinition-${server}-updated`, async (ev: any) => {
      fetchAndWatchCRs(listen, server, ev.spec.names.kind, ev.spec.group, apiResources);
      crdsState.set((prev) => {
        const newMap = new Map(prev);
        newMap.set(ev.metadata?.uid as string, ev);
        return newMap;
      });
    }),
  );
}

async function fetchAndWatchCRs(
  listen: any,
  server: string | undefined,
  kind: string,
  group: string,
  apiResources: ApiResource[] | undefined,
): Promise<Promise<Promise<void>>> {
  const customResource = (apiResources || []).find(
    (r: ApiResource) => r.kind === kind && r.group === group,
  );
  if (!customResource) {
    return;
  }
  const [resources, rv] = await call<any>('list_dynamic_resource', {
    server,
    apiResource: { ...customResource },
  });
  crsState.set((prev) => {
    const newMap = new Map(prev);
    resources.forEach((item: any) => {
      newMap.set(item.metadata.uid, item);
    });
    return newMap;
  });
  if (kind === 'ComponentStatus') {
    return;
  }
  await call('watch_dynamic_resource', {
    server,
    apiResource: { ...customResource, resource_version: rv },
  });
  addSubscription(
    listen(`${kind}-${server}-deleted`, (ev: any) => {
      crsState.set((prev) => {
        const newMap = new Map(prev);
        newMap.delete(ev.metadata.uid);
        return newMap;
      });
    }),
  );
  addSubscription(
    listen(`${kind}-${server}-updated`, (ev: any) => {
      crsState.set((prev) => {
        const newMap = new Map(prev);
        newMap.set(ev.metadata.uid, ev);
        return newMap;
      });
    }),
  );
}

async function fetchAndWatchNamespaces(
  listen: any,
  server: any,
  apiResources: ApiResource[] | undefined,
): Promise<void> {
  const nsResource = (apiResources || []).find(
    (r: ApiResource) => r.kind === 'Namespace' && r.group === '',
  );
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [ns, _token, rv] = await call('list_dynamic_resource', {
    server,
    apiResource: { ...nsResource },
  });
  if (!ns) {
    return;
  }
  ns.forEach((x) => {
    namespacesState.set((prev) => {
      const newMap = new Map(prev);
      newMap.set(x.metadata?.uid as string, x);
      return newMap;
    });
  });
  await call('watch_dynamic_resource', {
    server,
    apiResource: {
      ...nsResource,
      resource_version: rv,
    },
  });
  addSubscription(
    listen(`Namespace-${server}-deleted`, async (ev: any) => {
      namespacesState.set((prev) => {
        const newMap = new Map(prev);
        newMap.delete(ev.metadata?.uid as string);
        return newMap;
      });
    }),
  );
  addSubscription(
    listen(`Namespace-${server}-updated`, async (ev: any) => {
      namespacesState.set((prev) => {
        const newMap = new Map(prev);
        newMap.set(ev.metadata?.uid as string, ev);
        return newMap;
      });
    }),
  );
}
