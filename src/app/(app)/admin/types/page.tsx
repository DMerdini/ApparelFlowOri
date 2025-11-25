'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';

type TypeDoc = { id: string; name: string };
type TypeCategory = 'clothing_types' | 'composition_types';

const typeSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

const TypeManager = ({ category, title }: { category: TypeCategory; title: string }) => {
  const [types, setTypes] = useState<TypeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<TypeDoc | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<TypeDoc | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const db = useFirestore();

  const form = useForm<z.infer<typeof typeSchema>>({
    resolver: zodResolver(typeSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!db) return;
    const q = collection(db, category);
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const typesData: TypeDoc[] = [];
        querySnapshot.forEach((doc) => {
          typesData.push({ id: doc.id, name: doc.data().name });
        });
        setTypes(typesData.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      },
      (error) => {
        const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: category,
        });
        errorEmitter.emit('permission-error', contextualError);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [category, db]);

  const handleOpenDialog = (type: TypeDoc | null = null) => {
    setEditingType(type);
    form.reset({ name: type?.name || '' });
    setDialogOpen(true);
  };

  const generateCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const openDeleteConfirmation = (type: TypeDoc) => {
    setTypeToDelete(type);
    setVerificationCode(generateCode());
    setDeleteDialogOpen(true);
    setError('');
    setConfirmationCode('');
  };

  const handleDelete = async () => {
    if (confirmationCode !== verificationCode) {
      setError('Invalid code. Please try again.');
      return;
    }
    if (!typeToDelete) return;

    setError('');
    const docRef = doc(db, category, typeToDelete.id);
    deleteDoc(docRef).then(() => {
      toast({ title: "Success", description: "Type deleted." });
      setDeleteDialogOpen(false);
    }).catch(error => {
      errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          })
        );
    });
  };

  const onSubmit = async (values: z.infer<typeof typeSchema>) => {
    if (editingType) {
      const docRef = doc(db, category, editingType.id);
      updateDoc(docRef, values).then(() => {
        toast({ title: "Success", description: "Type updated." });
        setDialogOpen(false);
      }).catch(error => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: docRef.path,
              operation: 'update',
              requestResourceData: values,
            })
          );
      });
    } else {
      const collRef = collection(db, category);
      addDoc(collRef, values).then(() => {
        toast({ title: "Success", description: "Type added." });
        setDialogOpen(false);
      }).catch(error => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: collRef.path,
              operation: 'create',
              requestResourceData: values,
            })
          );
      });
    }
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                <TableRow><TableCell colSpan={2} className="h-24 text-center">Loading...</TableCell></TableRow>
                ) : types.length > 0 ? types.map((type) => (
                <TableRow key={type.id} className="h-14">
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(type)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteConfirmation(type)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    </TableCell>
                </TableRow>
                )) : (
                <TableRow><TableCell colSpan={2} className="h-24 text-center">No types found.</TableCell></TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? 'Edit' : 'Add'} {title.slice(0,-1)}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={`${title.slice(0, -1)} name`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>

    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                    This action cannot be undone. Enter the following code to confirm the deletion of type &quot;{typeToDelete?.name}&quot;.
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
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function AdminTypesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold md:text-3xl">Manage Types</h1>
        <p className="text-muted-foreground">Add, edit, or delete clothing and composition types.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <TypeManager category="clothing_types" title="Clothing Types" />
        <TypeManager category="composition_types" title="Composition Types" />
      </div>
    </div>
  );
}
