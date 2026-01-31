import { DataTable } from '@/components/ui/DataTable';
import { useCrsState } from '@/store/resources';
import { Loader2 } from 'lucide-react';
import columns from '@/components/resources/CustomResources/columns';
import { useEffect, useRef, useState } from 'react';
import { useLoaderData } from 'react-router';
import type { ApiResource } from '@/types';
import { useConfig } from '@/context/ConfigContext';
import { call } from '@/lib/api';
import moment from 'moment';
import { Header } from '@/components/Header';
import { toast } from 'sonner';

const subscribeEvents = async (rv: string, apiResource: ApiResource | undefined) => {
  const request = {
    apiResource: { ...apiResource },
    resource_version: rv,
  };
  await call('watch_dynamic_resource', request);
};

const getPage = async ({
  server,
  limit,
  continueToken,
  apiResource,
}: {
  server: string | undefined;
  limit: number;
  continueToken?: string;
  apiResource: ApiResource | undefined;
}) => {
  return await call('list_dynamic_resource', {
    server: server,
    limit: limit,
    continue: continueToken,
    apiResource: {
      ...apiResource,
      namespaced: false,
    },
  });
};

const getApiResource = ({
  kind,
  group,
  apiResources,
}: {
  kind: string;
  group: string;
  apiResources: ApiResource[] | undefined;
}): ApiResource | undefined => {
  const resource = (apiResources || []).find(
    (r: ApiResource) => r.kind === kind && r.group === group,
  );
  if (!resource) throw new Error(`API resource for kind ${kind} and group ${group} not found`);
  return resource;
};

const CustomResources = () => {
  const { kind, group } = useLoaderData();
  const [nextToken, setNextToken] = useState<string | null>();
  const cr = useCrsState();
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { serverInfo } = useConfig();

  const loadPage = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const apiResource = getApiResource({ kind, group, apiResources: serverInfo?.apiResources });
      const [items, next, rv] = await getPage({
        server: serverInfo?.server,
        apiResource: apiResource,
        limit: 50,
        continueToken: nextToken ?? undefined,
      });
      cr.set(() => {
        const newMap = new Map();
        items.forEach((item) => {
          newMap.set(item.metadata.uid, item);
        });
        return newMap;
      });
      await subscribeEvents(rv, apiResource);
      setNextToken(next);
    } catch (e: any) {
      console.error('Error loading page:', e);
      if (e.message) {
        toast.error(`Error loading data for table: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [cr.get()]);

  useEffect(() => {
    if (!loaderRef.current || !nextToken) return;

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && nextToken && !loading) {
        loadPage();
      }
    });

    observer.current.observe(loaderRef.current);
    return () => observer.current?.disconnect();
  }, [nextToken, loading]);
  const data = Array.from(cr.get().values())
    .filter((x) => x.kind === kind)
    .sort((a: any, b: any) =>
      moment(b.metadata.creationTimestamp).diff(moment(a.metadata.creationTimestamp)),
    )
    .filter((x: any) => {
      return String(x.metadata.name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    });
  const showInitialLoader = loading && data.length === 0;
  return (
    <>
      <Header setSearchQuery={setSearchQuery} />
      {showInitialLoader && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      )}
      <DataTable
        kind={kind}
        key={`${kind}-${Math.random()}`}
        noResult={data.length === 0}
        columns={columns}
        apiResource={getApiResource({ kind, group, apiResources: serverInfo?.apiResources })}
        data={data}
      />
      {nextToken && <div ref={loaderRef} style={{ height: 1, marginTop: -1 }} />}
      {loading && data.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  );
};

export default CustomResources;
