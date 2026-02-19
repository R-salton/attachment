
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

  // Immediate guard: If there is no user, return unauthenticated state instantly
  if (!user) {
    return { 
      profile: null, 
      isLoading: isAuthLoading, 
      isAdmin: false, 
      isCommander: false,
      isLeader: false, 
      isTrainee: false,
      user: null 
    };
  }

  const isAdmin = user.email === 'nezasalton@gmail.com';
  const isCommander = profile?.role === 'COMMANDER' || isAdmin;
  const isLeader = profile?.role === 'LEADER' || isCommander;
  const isTrainee = profile?.role === 'TRAINEE' && !isCommander && !isLeader;

  return { 
    profile, 
    isLoading: isAuthLoading || isProfileLoading, 
    isAdmin, 
    isCommander,
    isLeader, 
    isTrainee,
    user 
  };
}
