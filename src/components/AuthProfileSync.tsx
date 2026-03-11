'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Component to ensure every authenticated user has a UserProfile document in Firestore.
 * Automatically provisions designated Master Administrator accounts with 'ADMIN' role.
 */
export function AuthProfileSync() {
  const { user } = useUser();
  const db = useFirestore();

  useEffect(() => {
    if (!user || !db) return;

    const syncProfile = async () => {
      const userRef = doc(db, 'users', user.uid);
      try {
        const userSnap = await getDoc(userRef);

        // Identify if this is a designated primary Administrator
        const isSystemAdmin = 
          user.email === 'nezasalton@gmail.com' || 
          user.email === 'cboazi100@gmail.com' ||
          user.email === 'admin@gmail.com' ||
          user.uid === 'S7QoMkUQNHaok4JjLB1fFd9OI0g1' ||
          user.uid === '7oiKVWSJ30Ucg0DxamaRhoxlI3G2' ||
          user.uid === 'IsXXoo9z34UpjnJJTtlXhBvxHWz2';

        if (!userSnap.exists()) {
          // Provision new profile
          const initialRole = isSystemAdmin ? 'ADMIN' : 'TRAINEE';
          const initialUnit = isSystemAdmin ? 'ORDERLY REPORT' : 'TRS'; // Default unit for new officers
          
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Officer',
            role: initialRole,
            unit: initialUnit,
            createdAt: serverTimestamp(),
          });
        } else if (isSystemAdmin && userSnap.data().role !== 'ADMIN') {
          // Ensure Master Admin always has the correct role if profile already exists
          await setDoc(userRef, { 
            role: 'ADMIN'
          }, { merge: true });
        }
      } catch (e) {
        console.error("Profile sync failed:", e);
      }
    };

    syncProfile();
  }, [user, db]);

  return null;
}
