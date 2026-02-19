
'use client';

import { useDoc, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useUserProfile() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  const isAdmin = user?.email === 'nezasalton@gmail.com';
  const isLeader = profile?.role === 'LEADER' || isAdmin;
  const isTrainee = profile?.role === 'TRAINEE' && !isAdmin;

  return { 
    profile, 
    isLoading: isAuthLoading || isProfileLoading, 
    isAdmin, 
    isLeader, 
    isTrainee,
    user 
  };
}
