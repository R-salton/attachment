
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Component to ensure authenticated users have a profile.
 * Every new user defaults to INACTIVE unless they are a hardcoded System Admin.
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

        // System Master check for initial setup bypass
        const isSystemAdmin = 
          user.uid === 'S7QoMkUQNHaok4JjLB1fFd9OI0g1' || 
          user.uid === '7oiKVWSJ30Ucg0DxamaRhoxlI3G2';

        if (!userSnap.exists()) {
          // Provision new profile with INACTIVE default. 
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Pending Officer',
            role: isSystemAdmin ? 'ADMIN' : 'INACTIVE',
            unit: isSystemAdmin ? 'ORDERLY REPORT' : 'TRS',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
        } else {
          // Update last login on every sync/mount
          await setDoc(userRef, { 
            lastLogin: serverTimestamp(),
            // Ensure bypass UIDs maintain their designated ADMIN roles if they exist
            ...(isSystemAdmin ? { role: 'ADMIN' } : {})
          }, { merge: true });
        }
      } catch (e) {
        console.error("Profile sync failed. This is expected for new users before Firestore rules propagation.", e);
      }
    };

    syncProfile();
  }, [user, db]);

  return null;
}
