'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Good } from '@/types';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';

export default function InventoryPage() {
  const [data, setData] = useState<Good[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'goods'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const items: Good[] = [];
        querySnapshot.forEach((doc) => {
          const good = { id: doc.id, ...doc.data() } as Good;
          items.push(good);
        });
        setData(items);
        setLoading(false);
      },
      (error) => {
        const contextualError = new FirestorePermissionError({
          path: 'goods',
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
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="rounded-md border">
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-8 w-64" />
              </div>
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
      <DataTable data={data} columns={columns} />
    </div>
  );
}
