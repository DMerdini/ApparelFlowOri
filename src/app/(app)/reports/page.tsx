'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Good } from '@/types';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';

export default function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const exportToCsv = (filename: string, rows: any[]) => {
    if (!rows || !rows.length) {
      toast({
        variant: 'destructive',
        title: 'No Data',
        description: 'There is no data to export for the selected date range.',
      });
      return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map((row) => {
          return keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell =
                cell instanceof Date
                  ? cell.toLocaleString()
                  : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleGenerateReport = async () => {
    if (!date?.from || !date?.to) {
      toast({
        variant: 'destructive',
        title: 'Invalid Date Range',
        description: 'Please select a start and end date.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'goods'),
        where('createdAt', '>=', date.from),
        where('createdAt', '<=', date.to)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => {
        const item = doc.data() as Good;
        return {
          ID: doc.id,
          'Invoice Number': item.invoiceNumber,
          'Invoice Date': format(item.invoiceDate.toDate(), 'dd/MM/yyyy'),
          'Type': item.type,
          'Composition': item.comp,
          'Origin': item.origin,
          'Gender': item.gender,
          'Quantity': item.quantity,
          'Area': item.area,
          'Value': item.value,
          'Accessories Value': item.accessoriesValue,
          'Weight': item.weight,
          'Accessories Weight': item.accessoriesWeight,
          'Total Value': item.totalValue,
          'Total Weight': item.totalWeight,
          'Date Added': format(item.createdAt.toDate(), 'dd/MM/yyyy'),
        };
      });

      const fromDate = format(date.from, 'yyyy-MM-dd');
      const toDate = format(date.to, 'yyyy-MM-dd');
      exportToCsv(`inventory-report-${fromDate}-to-${toDate}.csv`, data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Generating Report',
        description: 'An unexpected error occurred. Please try again.',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold md:text-3xl">Generate Reports</h1>
        <p className="text-muted-foreground">Export your inventory data for a selected date range.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Inventory Report</CardTitle>
          <CardDescription>Select a date range to generate and download a CSV report of your inventory items.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-[300px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'dd/MM/yyyy')} -{' '}
                        {format(date.to, 'dd/MM/yyyy')}
                      </>
                    ) : (
                      format(date.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading || !date?.from || !date?.to}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export to CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
