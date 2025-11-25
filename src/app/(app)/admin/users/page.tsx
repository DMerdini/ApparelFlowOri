'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { User } from '@/types';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';

export default function AdminUsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
          users.push({ uid: doc.id, ...doc.data() } as User);
        });
        setData(users);
        setLoading(false);
      },
      (error) => {
        const contextualError = new FirestorePermissionError({
          path: 'users',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', contextualError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="rounded-md border">
            <div className="p-4">
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
       <div className="space-y-1">
        <h1 className="text-2xl font-bold md:text-3xl">User Management</h1>
        <p className="text-muted-foreground">Approve new users and manage existing roles.</p>
      </div>
      <DataTable data={data} columns={columns} />
    </div>
  );
}
