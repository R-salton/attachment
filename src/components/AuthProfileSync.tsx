'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Component to ensure every authenticated user has a UserProfile document in Firestore.
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

        if (!userSnap.exists()) {
          // nezasalton@gmail.com is handled as a Leader/Admin in rules.
          // We set it in data for UI consistency.
          const initialRole = user.email === 'nezasalton@gmail.com' ? 'LEADER' : 'TRAINEE';
          
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Cadet',
            role: initialRole,
            unit: 'N/A', // Every user must be attached to a unit for security rules to work
            createdAt: serverTimestamp(),
          });
        }
      } catch (e) {
        // Silently fail if rules block initial read/write
        console.error("Profile sync failed:", e);
      }
    };

    syncProfile();
  }, [user, db]);

  return null;
}