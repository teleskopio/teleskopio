import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { toast } from 'sonner';
import moment from 'moment';
import { Header } from '@/components/Header';
import { useSelectedNamespacesState } from '@/store/selectedNamespace';
import type { ApiResource } from '@/types';
import { compareVersions } from 'compare-versions';
import { useConfig } from '@/context/ConfigContext';

interface PaginatedTableProps<T> {
  kind: string;
  group: string;
  getPage: (args: {
    server: string | undefined;
    limit: number;
    continueToken?: string;
  }) => Promise<[T[], string | null, string]>;
  subscribeEvents: (rv: string) => Promise<void>;
  state: () => Map<string, T>;
  setState: (updater: (prev: Map<string, T>) => Map<string, T>) => void;
  extractKey: (item: T) => string;
  apiResource: ApiResource | undefined;
  columns: any;
  namespaced?: boolean;
  withNsSelector?: boolean;
  withoutJump?: boolean;
  withSearch?: boolean | undefined;
  doubleClickDisabled?: boolean;
}

export function PaginatedTable<T>({
  getPage,
  kind,
  group,
  subscribeEvents,
  state,
  apiResource,
  setState,
  extractKey,
  columns,
  withoutJump,
  withNsSelector = true,
  doubleClickDisabled = false,
}: PaginatedTableProps<T>) {
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const selectedNamespace = useSelectedNamespacesState();
  const [searchQuery, setSearchQuery] = useState('');
  const { serverInfo, isLoading } = useConfig();

  const loadPage = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (serverInfo?.server === '') return;
      const [items, next, rv] = await getPage({
        server: serverInfo?.server,
        limit: 50,
        continueToken: nextToken ?? undefined,
      });
      setState((prev) => {
        const newMap = new Map(prev);
        items.forEach((item) => {
          newMap.set(extractKey(item), item);
        });
        return newMap;
      });
      await subscribeEvents(rv);
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
  }, [isLoading]);

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
  }, [nextToken, loading, selectedNamespace]);
  const ns = selectedNamespace.get();
  const data = Array.from(state().values())
    .sort((a: any, b: any) =>
      moment(b.metadata.creationTimestamp).diff(moment(a.metadata.creationTimestamp)),
    )
    .filter((x: any) => {
      let attribute: string;
      if (kind === 'Event') {
        if (serverInfo?.version && compareVersions(serverInfo?.version, '1.20') === 1) {
          attribute = x.note;
        } else {
          attribute = x.message;
        }
      } else {
        attribute = x.metadata.name;
      }
      return String(attribute || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    })
    .filter(
      (x: any) => !apiResource?.namespaced || !ns || ns === 'all' || x.metadata.namespace === ns,
    );
  const showInitialLoader = loading && data.length === 0;
  return (
    <>
      {!withoutJump && <Header setSearchQuery={setSearchQuery} withNsSelector={withNsSelector} />}
      {showInitialLoader && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <DataTable
          kind={kind}
          apiResource={apiResource}
          doubleClickDisabled={doubleClickDisabled}
          noResult={data.length === 0}
          columns={columns}
          data={data}
        />
        {nextToken && <div ref={loaderRef} style={{ height: 1, marginTop: -1 }} />}
        {loading && data.length > 0 && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </>
  );
}
