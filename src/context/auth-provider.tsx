'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User as AppUser } from '@/types';
import { FullPageLoader } from '@/components/common/full-page-loader';
import { useAuth as useFirebaseAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useFirebaseAuth();
  const db = useFirestore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
      }
      // The rest is handled by the second useEffect
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (firebaseUser) {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeDoc = onSnapshot(userDocRef, 
        (doc) => {
          if (doc.exists()) {
            setUser({ uid: firebaseUser.uid, ...doc.data() } as AppUser);
          } else {
            // This case can happen briefly after sign up before the user doc is created.
            // We don't set user to null here, we wait for the doc to appear.
          }
          setLoading(false);
        },
        (error) => {
          // This error can happen if rules deny access.
          const contextualError = new FirestorePermissionError({ path: userDocRef.path, operation: 'get' });
          errorEmitter.emit('permission-error', contextualError);
          setUser(null);
          setLoading(false);
        }
      );
      return () => unsubscribeDoc();
    }
  }, [firebaseUser, db]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null); // Clear user state immediately on sign out
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signOut }}>
      {loading ? <FullPageLoader /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
