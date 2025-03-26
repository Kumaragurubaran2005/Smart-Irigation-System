import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "rock-irrigation-app-2.firebaseapp.com",
  projectId: "rock-irrigation-app-2",
  storageBucket: "rock-irrigation-app-2.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXX"
});

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;