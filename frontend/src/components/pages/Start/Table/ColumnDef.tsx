import { Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { ServerInfo } from '@/types';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { call } from '@/lib/api';
import { useloadingState } from '@/store/loader';
import { useConfig } from '@/context/ConfigContext';

const columns: ColumnDef<ServerInfo>[] = [
  {
    accessorKey: 'server',
    id: 'server',
    header: 'Server',
    cell: ({ row }) => {
      return <div>{row.original.server}</div>;
    },
  },
  {
    accessorKey: 'connect',
    id: 'connect',
    header: '',
    cell: ({ row }) => {
      const navigate = useNavigate();
      const loading = useloadingState();
      const { setConfig } = useConfig();
      return (
        <Button
          className="text-xs"
          variant="outline"
          size="sm"
          onClick={async () => {
            loading.set(true);
            const clusterVersion = await call('get_version', { server: row.original.server });
            if (!clusterVersion.gitVersion) {
              loading.set(false);
              toast.error(
                <div>
                  Cant connect to cluster
                  <br />
                  Server: {row.original.server}
                </div>,
              );
              return;
            }
            const si: ServerInfo = {
              server: row.original.server,
              version: clusterVersion.gitVersion,
            };
            setConfig(si);
            toast.info(<div>Cluster version: {si.version}</div>);
            navigate('/resource/Node');
            loading.set(false);
            return;
          }}
        >
          <Unplug className="h-2 w-2" />
          Connect
        </Button>
      );
    },
  },
];

export default columns;
