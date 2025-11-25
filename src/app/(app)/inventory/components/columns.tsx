'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Good } from '@/types';
import { DataTableRowActions } from './data-table-row-actions';
import { DataTableColumnHeader } from './data-table-column-header';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

export const columns: ColumnDef<Good>[] = [
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
    accessorKey: 'invoiceNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
    cell: ({ row }) => <div className="font-medium">{row.getValue('invoiceNumber')}</div>,
  },
  {
    accessorKey: 'invoiceDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice Date" />,
    cell: ({ row }) => {
      const dateValue = row.getValue('invoiceDate');
      if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
        const date = (dateValue as any).toDate();
        return date ? format(date, 'dd/MM/yyyy') : 'N/A';
      }
       if (typeof dateValue === 'string') {
        return format(new Date(dateValue), 'dd/MM/yyyy');
      }
      return 'N/A';
    },
  },
  {
    accessorKey: 'model',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Model" />,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
  },
  {
    accessorKey: 'gender',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gender" />,
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
    cell: ({ row }) => <div className="text-center">{row.getValue('quantity')}</div>,
  },
  {
    accessorKey: 'totalValue',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Value" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalValue'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'totalWeight',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Weight (kg)" />,
    cell: ({ row }) => <div className="text-right">{row.getValue('totalWeight')}</div>
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
