'use client';

import { useDoc, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useUserProfile() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  const isSuperAdmin = user?.email === 'nezasalton@gmail.com' || user?.uid === 'S7QoMkUQNHaok4JjLB1fFd9OI0g1';

  // Explicitly determine loading state. 
  // We are loading if auth is initializing OR if user exists but profile doc is still being fetched.
  const isLoading = isAuthLoading || (!!user && isProfileLoading);

  if (isLoading) {
    return { 
      profile: null, 
      isLoading: true, 
      isAdmin: isSuperAdmin, 
      isCommander: isSuperAdmin,
      isLeader: isSuperAdmin, 
      isTrainee: false,
      user: user || null 
    };
  }

  // If no user is authenticated
  if (!user) {
    return { 
      profile: null, 
      isLoading: false, 
      isAdmin: false, 
      isCommander: false,
      isLeader: false, 
      isTrainee: false,
      user: null 
    };
  }
  
  // Default roles if profile isn't fully initialized yet but user exists
  const role = profile?.role || (isSuperAdmin ? 'ADMIN' : 'TRAINEE');
  
  const isAdmin = role === 'ADMIN' || isSuperAdmin;
  const isCommander = role === 'COMMANDER' || isAdmin;
  const isLeader = role === 'LEADER' || isCommander;
  const isTrainee = role === 'TRAINEE' && !isCommander && !isLeader && !isAdmin;

  return { 
    profile, 
    isLoading: false, 
    isAdmin, 
    isCommander,
    isLeader, 
    isTrainee,
    user 
  };
}
