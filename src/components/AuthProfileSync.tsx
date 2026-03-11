
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Component to ensure authenticated users have a profile.
 * Roles are primarily managed via the Personnel Management terminal.
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

        // System Master check for initial setup
        const isSystemAdmin = 
          user.uid === 'S7QoMkUQNHaok4JjLB1fFd9OI0g1' || 
          user.uid === '7oiKVWSJ30Ucg0DxamaRhoxlI3G2' ||
          user.uid === 'IsXXoo9z34UpjnJJTtlXhBvxHWz2';

        if (!userSnap.exists()) {
          // Provision new profile with minimal defaults. 
          // Leadership roles must be explicitly assigned via the Users terminal.
          const initialRole = isSystemAdmin ? 'ADMIN' : 'TRAINEE';
          const initialUnit = isSystemAdmin ? 'ORDERLY REPORT' : 'TRS';
          
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Officer',
            role: initialRole,
            unit: initialUnit,
            createdAt: serverTimestamp(),
          });
        } else if (isSystemAdmin && userSnap.data().role !== 'ADMIN') {
          // Keep Master Admins in the ADMIN role
          await setDoc(userRef, { role: 'ADMIN' }, { merge: true });
        }
      } catch (e) {
        console.error("Profile sync failed:", e);
      }
    };

    syncProfile();
  }, [user, db]);

  return null;
}
