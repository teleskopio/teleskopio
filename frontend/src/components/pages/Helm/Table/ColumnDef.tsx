import { ColumnDef } from '@tanstack/react-table';
import AgeCell from '@/components/ui/Table/AgeCell';
import { HelmRelease } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { Fragment } from 'react';

const columns: ColumnDef<HelmRelease>[] = [
  {
    accessorKey: 'name',
    id: 'name',
    meta: { className: 'min-w-[20ch] max-w-[20ch]' },
    header: 'Name',
    cell: ({ row }) => {
      const info = (row.original as HelmRelease).info.notes.split('\n');

      return (
        <div className="flex flex-row items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-row items-center p-1">
                <Info size={16} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span className="ml-1">
                {info.map((str, index) => (
                  <Fragment key={index}>
                    {str}
                    {index < info.length - 1 && <br />}
                  </Fragment>
                ))}
              </span>
            </TooltipContent>
          </Tooltip>
          <div className="flex flex-row items-center">{(row.original as HelmRelease).name}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'namespace',
    id: 'namespace',
    header: 'Namespace',
    meta: { className: 'min-w-[10ch] max-w-[10ch]' },
    cell: ({ row }) => {
      return <div>{row.original.namespace}</div>;
    },
  },
  {
    accessorKey: 'info.status',
    id: 'status',
    header: 'Status',
    meta: { className: 'min-w-[10ch] max-w-[10ch]' },
    cell: ({ row }) => {
      let color = '';
      if (row.original.info.status === 'deployed') {
        color = 'text-green-500';
      }
      if (row.original.info.status === 'uninstalled') {
        color = 'text-red-500';
      }
      if (row.original.info.status === 'superseded') {
        color = 'text-yellow-500';
      }
      if (row.original.info.status === 'failed') {
        color = 'text-red-500';
      }
      return <div className={`${color}`}>{(row.original as HelmRelease).info.status}</div>;
    },
  },
  {
    accessorKey: 'chart.metadata.version',
    id: 'version',
    header: 'App Version',
    cell: ({ row }) => {
      return <div>{(row.original as HelmRelease).chart.metadata.version}</div>;
    },
  },
  {
    accessorKey: 'version',
    id: 'revison',
    header: 'Revision',
    cell: ({ row }) => {
      return <div>{(row.original as HelmRelease).version}</div>;
    },
  },
  {
    accessorKey: 'info.last_deployed',
    id: 'last_deployed',
    header: 'Last Deployed',
    cell: ({ row }) => {
      return <AgeCell age={(row.original as HelmRelease).info.last_deployed} />;
    },
  },
];

export default columns;
