import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDg8XXvY07SnEMfZA3L81nIgTHJuOadfPQ",
  authDomain: "attendancecoldsis.firebaseapp.com",
  databaseURL: "https://attendancecoldsis-default-rtdb.firebaseio.com",
  projectId: "attendancecoldsis",
  storageBucket: "attendancecoldsis.firebasestorage.app",
  messagingSenderId: "860074021575",
  appId: "1:860074021575:web:98a5fedb6681edd96124e2",
  measurementId: "G-T8YFSKXH3V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;
