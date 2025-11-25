'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Good, ClothingType, CompositionType } from '@/types';
import { getColumns } from './components/columns';
import { DataTable } from './components/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';

export default function InventoryPage() {
  const [data, setData] = useState<Good[]>([]);
  const [clothingTypes, setClothingTypes] = useState<ClothingType[]>([]);
  const [compositionTypes, setCompositionTypes] = useState<CompositionType[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  const columns = useMemo(() => getColumns(clothingTypes, compositionTypes), [clothingTypes, compositionTypes]);

  useEffect(() => {
    if (!db) return;

    setLoading(true);
    let activeListeners = 3;
    const doneLoading = () => {
      activeListeners--;
      if (activeListeners === 0) {
        setLoading(false);
      }
    };


    const q = query(collection(db, 'goods'), orderBy('createdAt', 'desc'));
    const unsubscribeGoods = onSnapshot(q, 
      (querySnapshot) => {
        const items: Good[] = [];
        querySnapshot.forEach((doc) => {
          const good = { id: doc.id, ...doc.data() } as Good;
          items.push(good);
        });
        setData(items);
        doneLoading();
      },
      (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'goods',
          operation: 'list',
        }));
        doneLoading();
      }
    );

    const unsubClothing = onSnapshot(collection(db, 'clothing_types'), (snapshot) => {
      setClothingTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClothingType)));
      doneLoading();
    }, (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'clothing_types', operation: 'list' }));
      doneLoading();
    });

    const unsubComposition = onSnapshot(collection(db, 'composition_types'), (snapshot) => {
      setCompositionTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompositionType)));
      doneLoading();
    }, (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'composition_types', operation: 'list' }));
      doneLoading();
    });

    return () => {
      unsubscribeGoods();
      unsubClothing();
      unsubComposition();
    };
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
      <DataTable 
        data={data} 
        columns={columns} 
        clothingTypes={clothingTypes}
        compositionTypes={compositionTypes}
      />
    </div>
  );
}
