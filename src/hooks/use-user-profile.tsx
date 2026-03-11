
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
      isInactive: false,
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
      isInactive: false,
      user: null 
    };
  }
  
  // Derived role logic: document role takes priority, then defaults based on UIDs
  const storedRole = profile?.role;
  const role = storedRole || (isMasterAdmin ? 'ADMIN' : (isLeadershipUID ? 'PTSLEADERSHIP' : 'INACTIVE'));
  
  const isPTSLeadership = role === 'PTSLEADERSHIP' || isLeadershipUID;
  const isAdmin = role === 'ADMIN' || isMasterAdmin;
  
  // A leadership account should NOT be an Admin unless specifically assigned ADMIN role
  const finalIsAdmin = (storedRole === 'ADMIN') || isMasterAdmin;
  
  const isCommander = finalIsAdmin || isPTSLeadership || role === 'COMMANDER';
  const isLeader = isCommander || role === 'LEADER';
  const isTrainee = role === 'TRAINEE' && !isCommander && !isLeader && !finalIsAdmin && !isPTSLeadership;
  const isInactive = role === 'INACTIVE' && !isMasterAdmin && !isLeadershipUID;

  return { 
    profile, 
    isLoading: false, 
    isAdmin: finalIsAdmin, 
    isCommander,
    isLeader, 
    isMasterAdmin,
    isPTSLeadership,
    isTrainee,
    isInactive,
    user 
  };
}
