'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pen, Trash, CalendarIcon } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ClothingType, CompositionType, Good } from '@/types';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  clothingTypes: ClothingType[];
  compositionTypes: CompositionType[];
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

function EditItemForm({ 
  item, 
  setOpen, 
  clothingTypes, 
  compositionTypes 
}: { 
  item: Good, 
  setOpen: (open: boolean) => void,
  clothingTypes: ClothingType[],
  compositionTypes: CompositionType[]
 }) {
  const { toast } = useToast();
  const db = useFirestore();

  const form = useForm<z.infer<typeof goodSchema>>({
    resolver: zodResolver(goodSchema),
    defaultValues: {
      invoiceNumber: item.invoiceNumber || '',
      invoiceDate: item.invoiceDate?.toDate ? item.invoiceDate.toDate() : new Date(item.invoiceDate || new Date()),
      model: item.model || '',
      type: item.type || '',
      comp: item.comp || '',
      origin: item.origin || 'CEE',
      gender: item.gender || 'male',
      quantity: item.quantity || 1,
      area: item.area || 0,
      value: item.value || 0,
      accessoriesValue: item.accessoriesValue || 0,
      weight: item.weight || 0,
      accessoriesWeight: item.accessoriesWeight || 0,
    },
  });

  async function onSubmit(values: z.infer<typeof goodSchema>) {
    const itemRef = doc(db, 'goods', item.id);
    const updatedGoodData = {
      ...values,
      totalValue: (values.quantity * values.value) + values.accessoriesValue,
      totalWeight: values.weight + values.accessoriesWeight,
      updatedAt: serverTimestamp(),
    };

    updateDoc(itemRef, updatedGoodData).then(() => {
      toast({ title: 'Success', description: 'Item updated successfully.' });
      setOpen(false);
    }).catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: itemRef.path,
            operation: 'update',
            requestResourceData: updatedGoodData,
        }));
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update item.' });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Number</FormLabel>
              <FormControl><Input {...field} /></FormControl>
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
          <Button type="submit">Save Changes</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function DataTableRowActions<TData>({
  row,
  clothingTypes,
  compositionTypes,
}: DataTableRowActionsProps<TData>) {
  const item = row.original as Good;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const db = useFirestore();

  const generateCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const openDeleteConfirmation = () => {
    setVerificationCode(generateCode());
    setIsDeleteDialogOpen(true);
    setError('');
    setConfirmationCode('');
  };

  const handleDelete = async () => {
     if (confirmationCode !== verificationCode) {
      setError('Invalid code. Please try again.');
      return;
    }
    setError('');

    if (!db) return;
    const docRef = doc(db, 'goods', item.id);
    deleteDoc(docRef).then(() => {
        toast({ title: 'Success', description: 'Item deleted successfully.' });
        setIsDeleteDialogOpen(false);
    }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        }));
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete item.' });
    });
  }

  return (
    <>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DialogTrigger asChild>
                <DropdownMenuItem>
                    <Pen className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuSeparator />
             <DropdownMenuItem onClick={openDeleteConfirmation} className="text-destructive">
                <Trash className="mr-2 h-4 w-4" /> Delete
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>
                Update the details for invoice &quot;{item.invoiceNumber}&quot;.
              </DialogDescription>
            </DialogHeader>
            <EditItemForm 
                item={item} 
                setOpen={setIsEditDialogOpen} 
                clothingTypes={clothingTypes}
                compositionTypes={compositionTypes}
             />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                    This action cannot be undone. Enter the following code to confirm the deletion of item &quot;{item.invoiceNumber}&quot;.
                    <div className="my-4 text-center">
                        <p className="text-2xl font-bold tracking-widest text-destructive bg-destructive/10 rounded-md p-2">
                           {verificationCode}
                        </p>
                   </div>
                </DialogDescription>
            </DialogHeader>
            <Input 
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Enter 4-digit code"
                maxLength={4}
            />
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
