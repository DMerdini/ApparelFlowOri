'use client';

import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon, PlusCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ClothingType, CompositionType, Good } from '@/types';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useAuth } from '@/context/auth-provider';
import { cn } from '@/lib/utils';
import { format } from "date-fns"

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  isInventoryPage?: boolean;
}

const goodSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  invoiceDate: z.date({ required_error: "Invoice date is required." }),
  model: z.string().min(1, "Model is required."),
  type: z.string().min(1, "Please select a clothing type."),
  comp: z.string().min(1, "Please select a composition."),
  origin: z.enum(["CEE", "EXTRA"]),
  gender: z.enum(["male", "female"]),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  area: z.coerce.number().min(0, "Area cannot be negative."),
  value: z.coerce.number().min(0, "Value cannot be negative."),
  accessoriesValue: z.coerce.number().min(0, "Accessories value cannot be negative."),
  weight: z.coerce.number().min(0, "Weight cannot be negative."),
  accessoriesWeight: z.coerce.number().min(0, "Accessories weight cannot be negative."),
});


function AddItemForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useAuth();
  const [clothingTypes, setClothingTypes] = useState<ClothingType[]>([]);
  const [compositionTypes, setCompositionTypes] = useState<CompositionType[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsubClothing = onSnapshot(collection(db, 'clothing_types'), (snapshot) => {
      setClothingTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClothingType)));
    });
    const unsubComposition = onSnapshot(collection(db, 'composition_types'), (snapshot) => {
      setCompositionTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompositionType)));
    });
    return () => {
      unsubClothing();
      unsubComposition();
    };
  }, [db]);

  const form = useForm<z.infer<typeof goodSchema>>({
    resolver: zodResolver(goodSchema),
    defaultValues: {
      invoiceNumber: '',
      model: '',
      area: 0,
      quantity: 1,
      value: 0,
      accessoriesValue: 0,
      weight: 0,
      accessoriesWeight: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof goodSchema>) {
    if (!user || !db) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add items.' });
      return;
    }

    const goodsCollectionRef = collection(db, 'goods');
    const newGoodData = {
        ...values,
        totalValue: (values.quantity * values.value) + values.accessoriesValue,
        totalWeight: values.weight + values.accessoriesWeight,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    addDoc(goodsCollectionRef, newGoodData)
      .then(() => {
        toast({ title: 'Success', description: 'Item added to inventory.' });
        form.reset();
        setOpen(false);
      })
      .catch((error) => {
        // Emit the detailed error for debugging.
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: goodsCollectionRef.path,
            operation: 'create',
            requestResourceData: newGoodData,
          })
        );
        // Show a user-friendly message.
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not add item. Please check permissions.',
        });
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Number</FormLabel>
              <FormControl><Input placeholder="INV-12345" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField
            control={form.control}
            name="invoiceDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Invoice Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField control={form.control} name="model" render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl><Input placeholder="e.g. T-Shirt" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

        <div className="grid grid-cols-2 gap-4">
           <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                  <FormLabel>Clothing Type</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {clothingTypes.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <FormMessage />
              </FormItem>
          )} />
           <FormField control={form.control} name="comp" render={({ field }) => (
               <FormItem>
                  <FormLabel>Composition</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a composition" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                           {compositionTypes.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <FormMessage />
              </FormItem>
          )} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="origin" render={({ field }) => (
              <FormItem>
                  <FormLabel>Origin</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select origin" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="CEE">CEE</SelectItem>
                        <SelectItem value="EXTRA">EXTRA</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                  <FormLabel>Gender</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
              </FormItem>
            )} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
             <FormField control={form.control} name="area" render={({ field }) => (
            <FormItem>
                <FormLabel>Area (m²)</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="value" render={({ field }) => (
            <FormItem>
                <FormLabel>Value ($)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
            <FormField control={form.control} name="accessoriesValue" render={({ field }) => (
            <FormItem>
                <FormLabel>Accessories Value ($)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="weight" render={({ field }) => (
            <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
            <FormField control={form.control} name="accessoriesWeight" render={({ field }) => (
            <FormItem>
                <FormLabel>Accessories Weight (kg)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )} />
        </div>

        <DialogFooter>
          <Button type="submit">Add Item</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function DataTableToolbar<TData>({
  table,
  isInventoryPage,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
       <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <p className="text-sm text-muted-foreground">
          Here&apos;s a list of all items in your inventory.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        {isInventoryPage && (
          <>
            <Input
              placeholder="Filter by invoice..."
              value={(table.getColumn('invoiceNumber')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn('invoiceNumber')?.setFilterValue(event.target.value)
              }
              className="h-10 w-[150px] lg:w-[200px]"
            />
             <Input
              placeholder="Filter by model..."
              value={(table.getColumn('model')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn('model')?.setFilterValue(event.target.value)
              }
              className="h-10 w-[150px] lg:w-[200px]"
            />
          </>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-10 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
        {isInventoryPage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-10">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new item to the inventory.
              </DialogDescription>
            </DialogHeader>
            <AddItemForm setOpen={setOpen} />
          </DialogContent>
        </Dialog>
        )}
      </div>
    </div>
  );
}
