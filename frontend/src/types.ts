type ServerInfo = {
  version: string;
  server?: string;
  apiResources?: ApiResource[];
};

type HelmRelease = {
  name: string;
  namespace: string;
  chart: {
    metadata: {
      icon: string;
      version: string;
    };
  };
  info: {
    last_deployed: string;
    notes: string;
    status: string;
  };
  version: number;
};

type ApiResource = {
  apiVersion: string;
  resource: string;
  group: string;
  version: string;
  kind: string;
  namespaced: boolean;
};

export type { ServerInfo, ApiResource, HelmRelease };
