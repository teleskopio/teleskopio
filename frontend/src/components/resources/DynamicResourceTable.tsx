import { useEffect } from 'react';
import { PaginatedTable } from '@/components/resources/PaginatedTable';
import { call } from '@/lib/api';
import type { ColumnDef } from '@tanstack/react-table';
import type { ApiResource } from '@/types';
import { useWS } from '@/context/WsContext';
import { useConfig } from '@/context/ConfigContext';
import { addSubscription } from '@/lib/subscriptionManager';

interface DynamicResourceTableProps<T> {
  kind: string;
  group: string;
  contextMenuItems?: any;
  columns: ColumnDef<T, any>[];
  state: () => Map<string, T>;
  setState: (setter: (prev: Map<string, T>) => Map<string, T>) => void;
  withoutJump?: boolean;
  withNsSelector?: boolean;
  withSearch?: boolean;
  doubleClickDisabled?: boolean;
  deleteDisabled?: boolean;
}

export const DynamicResourceTable = <T extends { metadata: { uid?: string } }>({
  kind,
  group,
  columns,
  state,
  setState,
  withoutJump,
  withNsSelector = true,
  withSearch = true,
  doubleClickDisabled = false,
}: DynamicResourceTableProps<T>) => {
  const subscribeEvents = async (rv: string) => {
    const apiResource = getApiResource({ kind, group });
    await call('watch_dynamic_resource', {
      apiResource: {
        ...apiResource,
        resource_version: rv,
      },
    });
  };
  const { listen } = useWS();
  const { serverInfo } = useConfig();

  const listenEvents = async () => {
    addSubscription(
      await listen(`${kind}-${serverInfo?.server}-deleted`, (payload: any) => {
        setState((prev) => {
          const newMap = new Map(prev);
          newMap.delete(payload.metadata?.uid as string);
          return newMap;
        });
      }),
    );

    addSubscription(
      await listen(`${kind}-${serverInfo?.server}-updated`, (payload: any) => {
        setState((prev) => {
          const newMap = new Map(prev);
          newMap.set(payload.metadata?.uid as string, payload);
          return newMap;
        });
      }),
    );
  };

  const getApiResource = ({
    kind,
    group,
  }: {
    kind: string;
    group: string;
  }): ApiResource | undefined => {
    return (serverInfo?.apiResources || []).find(
      (r: ApiResource) => r.kind === kind && r.group === group,
    );
  };

  const getPage = async ({ limit, continueToken }: { limit: number; continueToken?: string }) => {
    const apiResource = getApiResource({ kind, group });
    return await call('list_dynamic_resource', {
      server: serverInfo?.server,
      limit: limit,
      continue: continueToken,
      apiResource,
    });
  };

  useEffect(() => {
    listenEvents();
  }, []);

  return (
    <PaginatedTable<T>
      kind={kind}
      group={group}
      subscribeEvents={subscribeEvents}
      apiResource={getApiResource({ kind, group })}
      getPage={getPage}
      state={state}
      setState={setState}
      extractKey={(item) => item.metadata?.uid as string}
      columns={columns}
      withoutJump={withoutJump}
      withNsSelector={withNsSelector}
      withSearch={withSearch}
      doubleClickDisabled={doubleClickDisabled}
    />
  );
};
