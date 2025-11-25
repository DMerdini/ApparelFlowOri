'use client';

import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/types';
import { DataTableRowActions } from './data-table-row-actions';
import { DataTableColumnHeader } from '../../../inventory/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';


export const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'displayName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user.displayName?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.displayName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      return (
        <Badge
          className={cn({
            'bg-purple-500/20 text-purple-700 hover:bg-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400': role === 'SysAdmin',
            'bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400': role === 'admin',
            'bg-primary/20 text-primary hover:bg-primary/30 dark:bg-primary/10 dark:text-primary': role === 'verified',
            'bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400': role === 'pending',
          })}
          variant="outline"
        >
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          className={cn({
            'bg-green-500/20 text-green-700': status === 'active' || status === 'Active',
            'bg-red-500/20 text-red-700': status === 'inactive',
            'bg-yellow-500/20 text-yellow-700': status === 'suspended',
          })}
          variant="outline"
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date Joined" />,
    cell: ({ row }) => {
        const dateValue = row.getValue('createdAt');
        if (!dateValue) return 'N/A';
        // Check if it's a Firebase Timestamp
        if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
           const date = (dateValue as any).toDate();
           return date ? new Date(date).toLocaleDateString() : 'N/A';
        }
        // Handle string date from new user format
        if (typeof dateValue === 'string') {
            return new Date(dateValue).toLocaleDateString();
        }
        return 'N/A';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
