
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Component to ensure every authenticated user has a UserProfile document in Firestore.
 * Automatically provisions the primary Administrator account with 'ADMIN' role.
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

        // Identify if this is the designated primary Administrator
        const isSystemAdmin = user.email === 'nezasalton@gmail.com' || user.uid === 'S7QoMkUQNHaok4JjLB1fFd9OI0g1';

        if (!userSnap.exists()) {
          // Provision new profile
          const initialRole = isSystemAdmin ? 'ADMIN' : 'TRAINEE';
          const initialUnit = 'TRS'; // Default unit for new officers
          
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Officer',
            role: initialRole,
            unit: initialUnit,
            createdAt: serverTimestamp(),
          });
        } else if (isSystemAdmin && userSnap.data().role !== 'ADMIN') {
          // Ensure System Admin always has the correct role if profile already exists
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
