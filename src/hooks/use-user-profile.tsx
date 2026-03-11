
'use client';

import { useDoc, useUser, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useUserProfile() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  // Safety bypass for system masters
  const isMasterAdmin = 
    user?.uid === 'S7QoMkUQNHaok4JjLB1fFd9OI0g1' || 
    user?.uid === '7oiKVWSJ30Ucg0DxamaRhoxlI3G2' ||
    user?.uid === 'IsXXoo9z34UpjnJJTtlXhBvxHWz2';

  const isLoading = isUserLoading || (!!user && isProfileLoading);

  if (isLoading) {
    return { 
      profile: null, 
      isLoading: true, 
      isAdmin: isMasterAdmin, 
      isCommander: isMasterAdmin,
      isLeader: isMasterAdmin, 
      isMasterAdmin: isMasterAdmin,
      isPTSLeadership: false,
      isTrainee: false,
      user: user || null 
    };
  }

  if (!user) {
    return { 
      profile: null, 
      isLoading: false, 
      isAdmin: false, 
      isCommander: false, 
      isLeader: false, 
      isMasterAdmin: false, 
      isPTSLeadership: false, 
      isTrainee: false, 
      user: null 
    };
  }
  
  const role = profile?.role || (isMasterAdmin ? 'ADMIN' : 'TRAINEE');
  
  const isPTSLeadership = role === 'PTSLEADERSHIP';
  const isAdmin = role === 'ADMIN' || isMasterAdmin;
  const isCommander = role === 'COMMANDER' || isAdmin || isPTSLeadership;
  const isLeader = role === 'LEADER' || isCommander;
  const isTrainee = role === 'TRAINEE' && !isCommander && !isLeader && !isAdmin && !isPTSLeadership;

  return { 
    profile, 
    isLoading: false, 
    isAdmin, 
    isCommander,
    isLeader, 
    isMasterAdmin,
    isPTSLeadership,
    isTrainee,
    user 
  };
}
