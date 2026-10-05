import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";

/**
 * Configuración leída EXCLUSIVAMENTE de variables de entorno (.env).
 * Next.js inyecta en el navegador solo las variables con prefijo NEXT_PUBLIC_,
 * y deben referenciarse de forma literal (process.env.NEXT_PUBLIC_...) para que se incrusten en el build.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const REQUERIDAS: Record<string, string | undefined> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
};

const faltantes = Object.entries(REQUERIDAS)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (faltantes.length) {
  throw new Error(
    `[Firebase] Faltan variables de entorno: ${faltantes.join(", ")}. ` +
      `Copia .env.example a .env y reinicia el servidor.`,
  );
}

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

function crearDb(): Firestore {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return getFirestore(app); // ya inicializado (hot reload)
  }
}
export const db = crearDb();

/** Analytics solo en navegador, si está soportado y configurado */
export async function initAnalytics() {
  if (typeof window === "undefined" || !firebaseConfig.measurementId) return;
  const { isSupported, getAnalytics } = await import("firebase/analytics");
  if (await isSupported()) getAnalytics(app);
}
