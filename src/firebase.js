import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyDZsHt7nODk13MgM0fa6JTK1iWlcY-CqVw",
  authDomain: "alau-academy.firebaseapp.com",
  databaseURL: "https://alau-academy-default-rtdb.firebaseio.com",
  projectId: "alau-academy",
  storageBucket: "alau-academy.firebasestorage.app",
  messagingSenderId: "170213819709",
  appId: "1:170213819709:web:69ea8bfaa126ce4926f154"
};

const app = initializeApp(firebaseConfig);

if (typeof window !== 'undefined') {
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LdIcl4tAAAAAP3UBZmNPEYb_Sjp_TxNeB50JxtI'),
  isTokenAutoRefreshEnabled: true
});

export const db = getDatabase(app);
export const auth = getAuth(app);