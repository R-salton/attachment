
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
          user.uid === '7oiKVWSJ30Ucg0DxamaRhoxlI3G2';

        // Leadership check for specific high-level account
        const isLeadershipAccount = user.uid === 'IsXXoo9z34UpjnJJTtlXhBvxHWz2';

        if (!userSnap.exists()) {
          // Provision new profile with minimal defaults. 
          // Leadership roles are assigned based on the recognized bypass UIDs.
          const initialRole = isSystemAdmin ? 'ADMIN' : (isLeadershipAccount ? 'PTSLEADERSHIP' : 'TRAINEE');
          const initialUnit = (isSystemAdmin || isLeadershipAccount) ? 'ORDERLY REPORT' : 'TRS';
          
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || (isLeadershipAccount ? 'Command Leadership' : 'Officer'),
            role: initialRole,
            unit: initialUnit,
            createdAt: serverTimestamp(),
          });
        } else {
          // Ensure bypass UIDs maintain their designated high-level roles
          const currentData = userSnap.data();
          if (isSystemAdmin && currentData.role !== 'ADMIN') {
            await setDoc(userRef, { role: 'ADMIN' }, { merge: true });
          } else if (isLeadershipAccount && currentData.role !== 'PTSLEADERSHIP') {
            await setDoc(userRef, { role: 'PTSLEADERSHIP' }, { merge: true });
          }
        }
      } catch (e) {
        console.error("Profile sync failed:", e);
      }
    };

    syncProfile();
  }, [user, db]);

  return null;
}
