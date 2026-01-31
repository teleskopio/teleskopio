import { ColumnDef } from '@tanstack/react-table';
import { memo } from 'react';
import HeaderAction from '@/components/ui/Table/HeaderAction';
import AgeCell from '@/components/ui/Table/AgeCell';
import { compareVersions } from 'compare-versions';
import { useConfig } from '@/context/ConfigContext';
import { NavLink } from 'react-router-dom';

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'message',
    id: 'message',
    header: 'Message',
    meta: { className: 'min-w-[50ch] max-w-[50ch]' },
    cell: memo(({ row }) => {
      const { serverInfo } = useConfig();
      return (
        <span>
          {serverInfo?.version &&
            (compareVersions(serverInfo?.version, '1.20') === 1
              ? row.original.note
              : row.original.message)}
        </span>
      );
    }),
  },
  {
    accessorKey: 'type',
    id: 'type',
    meta: { className: 'min-w-[20ch] max-w-[20ch] truncate' },
    header: memo(({ column }) => <HeaderAction column={column} name={'Type'} />),
    cell: memo(({ row }) => {
      let color = '';
      if (row.original.type !== 'Normal') {
        color = 'text-orange-500';
      }
      return <div className={color}>{row.original.type}</div>;
    }),
  },
  {
    accessorKey: 'metadata.namespace',
    id: 'namespace',
    meta: { className: 'min-w-[20ch] max-w-[20ch] truncate' },
    header: memo(({ column }) => <HeaderAction column={column} name={'Namespace'} />),
    cell: ({ row }) => {
      return <div>{row.original.metadata?.namespace}</div>;
    },
  },
  {
    accessorKey: 'reason',
    id: 'reason',
    header: 'Reason',
    meta: { className: 'min-w-[20ch] max-w-[20ch] truncate' },
    cell: memo(({ row }) => {
      return <div>{row.original.reason}</div>;
    }),
  },
  {
    accessorKey: 'regarding',
    id: 'regarding',
    header: 'Regarding',
    meta: { className: 'min-w-[20ch] max-w-[20ch] truncate' },
    cell: memo(({ row }) => {
      const { serverInfo } = useConfig();
      let group = '';
      let url = '';
      let kind = '';
      if (serverInfo?.version && compareVersions(serverInfo?.version, '1.20') === 1) {
        if (row.original?.regarding?.apiVersion?.includes('/')) {
          group = row.original?.regarding.apiVersion.split('/')[0];
        }
        let ns = row.original?.regarding?.namespace;
        if (ns == undefined) {
          ns = 'empty';
        }
        url = `/yaml/${row.original?.regarding?.kind}/${row.original?.regarding?.name}/${ns}?group=${group}`;
        kind = row.original?.regarding?.kind;
      } else {
        if (row.original?.involvedObject?.apiVersion?.includes('/')) {
          group = row.original?.involvedObject.apiVersion.split('/')[0];
        }
        let ns = row.original?.involvedObject?.namespace;
        if (ns == undefined) {
          ns = 'empty';
        }
        url = `/yaml/${row.original?.involvedObject?.kind}/${row.original?.involvedObject?.name}/${ns}?group=${group}`;
        kind = row.original?.involvedObject?.kind;
      }
      return (
        <NavLink to={url} className="underline">
          <div className="text-xs">{kind}</div>
        </NavLink>
      );
    }),
  },
  {
    id: 'age',
    meta: { className: 'min-w-[10ch] max-w-[10ch] truncate' },
    accessorFn: (row) => row?.metadata?.creationTimestamp,
    header: memo(({ column }) => <HeaderAction column={column} name={'Age'} />),
    cell: memo(({ getValue }) => <AgeCell age={getValue<string>()} />),
  },
];

export default columns;
