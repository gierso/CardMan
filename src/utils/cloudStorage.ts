import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { FinancialProjectData, VersionSnapshot } from '../types';
import { handleFirestoreError, OperationType } from './firebaseErrors';

/**
 * Removes undefined fields from objects recursively since Firestore rejects `undefined`.
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Sync user profile document upon authentication.
 */
export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const payload = sanitizeForFirestore({
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save user financial project data to Firestore.
 */
export async function saveProjectToFirestore(
  userId: string,
  data: FinancialProjectData
): Promise<void> {
  const path = `users/${userId}/financialData/current`;
  try {
    const docRef = doc(db, 'users', userId, 'financialData', 'current');
    const payload = sanitizeForFirestore({
      ...data,
      userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load user financial project data from Firestore.
 */
export async function loadProjectFromFirestore(
  userId: string
): Promise<FinancialProjectData | null> {
  const path = `users/${userId}/financialData/current`;
  try {
    const docRef = doc(db, 'users', userId, 'financialData', 'current');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const raw = docSnap.data();
      return {
        version: raw.version || '1.1.0',
        lastUpdated: raw.lastUpdated || new Date().toISOString(),
        projectName: raw.projectName || 'Mis Finanzas Personales',
        baseCurrency: raw.baseCurrency || 'USD',
        exchangeRates: raw.exchangeRates || {
          USD_MXN: 18.5,
          EUR_USD: 1.08,
          CAD_USD: 0.74,
          GBP_USD: 1.3,
        },
        cards: Array.isArray(raw.cards) ? raw.cards : [],
        checkingAccounts: Array.isArray(raw.checkingAccounts) ? raw.checkingAccounts : [],
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Save a backup snapshot to Firestore under the user's account.
 */
export async function saveSnapshotToFirestore(
  userId: string,
  snapshot: VersionSnapshot
): Promise<void> {
  const path = `users/${userId}/snapshots/${snapshot.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'snapshots', snapshot.id);
    const payload = sanitizeForFirestore({
      ...snapshot,
      userId,
      createdAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load all snapshots for the user from Firestore.
 */
export async function loadSnapshotsFromFirestore(
  userId: string
): Promise<VersionSnapshot[]> {
  const path = `users/${userId}/snapshots`;
  try {
    const colRef = collection(db, 'users', userId, 'snapshots');
    const querySnap = await getDocs(colRef);
    const snapshots: VersionSnapshot[] = [];

    querySnap.forEach((docSnap) => {
      const d = docSnap.data();
      snapshots.push({
        id: docSnap.id,
        name: d.name || 'Versión guardada',
        timestamp: d.timestamp || d.createdAt || new Date().toISOString(),
        cardsCount: typeof d.cardsCount === 'number' ? d.cardsCount : (d.data?.cards?.length || 0),
        totalDebt: typeof d.totalDebt === 'number' ? d.totalDebt : 0,
        data: d.data,
      });
    });

    // Sort descending by timestamp
    snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return snapshots;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Delete a snapshot from Firestore.
 */
export async function deleteSnapshotFromFirestore(
  userId: string,
  snapshotId: string
): Promise<void> {
  const path = `users/${userId}/snapshots/${snapshotId}`;
  try {
    const docRef = doc(db, 'users', userId, 'snapshots', snapshotId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
