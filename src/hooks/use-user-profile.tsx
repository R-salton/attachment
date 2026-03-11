
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

  // System master bypass (Primary System Owners only)
  const isMasterAdmin = 
    user?.uid === 'S7QoMkUQNHaok4JjLB1fFd9OI0g1' || 
    user?.uid === '7oiKVWSJ30Ucg0DxamaRhoxlI3G2';

  // Leadership UID identification (Account explicitly assigned to PTS Leadership)
  const isLeadershipUID = user?.uid === 'IsXXoo9z34UpjnJJTtlXhBvxHWz2';

  const isLoading = isUserLoading || (!!user && isProfileLoading);

  if (isLoading) {
    return { 
      profile: null, 
      isLoading: true, 
      isAdmin: isMasterAdmin, 
      isCommander: isMasterAdmin || isLeadershipUID,
      isLeader: isMasterAdmin || isLeadershipUID, 
      isMasterAdmin: isMasterAdmin,
      isPTSLeadership: isLeadershipUID,
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
  
  // Derived role logic: document role takes priority
  const role = profile?.role || (isMasterAdmin ? 'ADMIN' : (isLeadershipUID ? 'PTSLEADERSHIP' : 'TRAINEE'));
  
  const isPTSLeadership = role === 'PTSLEADERSHIP' || isLeadershipUID;
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
