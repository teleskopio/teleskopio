import { useEffect, useCallback, useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useloadingState } from '@/store/loader';
import { DataTable } from '@/components/ui/DataTable';
import columns from '@/components/pages/Start/Table/ColumnDef';
import { useConfigsState, getConfigs } from '@/store/kubeconfigs';
import { Input } from '@/components/ui/input';
import { call } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/context/AuthProvider';

export function StartPage() {
  const location = useLocation();
  const configs = useConfigsState();
  const [searchQuery, setSearchQuery] = useState('');
  const loading = useloadingState();
  const { logout, AuthDisabled } = useAuth();
  const { serverInfo } = useConfig();

  const fetchData = useCallback(async () => {
    try {
      await call<any[]>('ping');
      await getConfigs(searchQuery);
    } catch (error: any) {
      toast.error('Error! Cant ping server\n' + error.message);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return serverInfo?.server ? (
    <Navigate to="/resource/Node" replace state={{ from: location }} />
  ) : (
    <div className="flex-grow overflow-auto">
      <div className="flex flex-row py-2 px-2 items-center justify-between">
        <Input
          placeholder="Filter by name..."
          className="placeholder:text-muted-foreground flex h-6 w-full rounded-md bg-transparent py-2 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {!AuthDisabled && (
          <Button onClick={logout} className="ml-2 text-xs">
            <LogOut size={12} />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1">
        <div className="h-24 col-span-2">
          {loading.get() && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          )}
          <DataTable
            menuDisabled={true}
            kind={'configs'}
            noResult={true}
            columns={columns as any}
            data={configs.configs.get() as any}
          />
        </div>
      </div>
    </div>
  );
}
