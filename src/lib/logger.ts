
'use client';

import { collection, doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';

export interface LogInput {
  userId: string;
  userName: string;
  action: string;
  details: string;
}

/**
 * Utility to record mission-critical actions into the system audit board.
 */
export function recordLog(db: Firestore, log: LogInput) {
  const logId = doc(collection(db, 'system_logs')).id;
  const logRef = doc(db, 'system_logs', logId);

  setDoc(logRef, {
    id: logId,
    ...log,
    timestamp: serverTimestamp(),
  }).catch(err => console.error("Logging failed:", err));
}
