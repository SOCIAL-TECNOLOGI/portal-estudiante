import { auth } from './firebase';

// Servidor del portal (pmap-api en la VM)
export const API = 'https://motor1.alau.fedusocial.org';

// Llamada autenticada con el token del portal. Lanza Error con el mensaje del servidor.
export async function api(ruta, cuerpo, metodo) {
  const user = auth.currentUser;
  if (!user) throw new Error('Tu sesión terminó. Ingresa de nuevo.');
  const token = await user.getIdToken();
  let r;
  try {
    r = await fetch(API + ruta, {
      method: metodo || (cuerpo ? 'POST' : 'GET'),
      headers: { Authorization: 'Bearer ' + token, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
  } catch {
    throw new Error('Sin conexión con el servidor. Intenta de nuevo.');
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok) { const e = new Error(d.error || 'Error ' + r.status); e.status = r.status; throw e; }
  return d;
}

// pdf.js se carga solo cuando se abre una evaluación (no pesa en la carga inicial del portal)
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/';
let pdfjsPromesa = null;
const documentos = new Map();
export function cargarPdf(url) {
  if (!pdfjsPromesa) {
    pdfjsPromesa = import(/* @vite-ignore */ PDFJS + 'pdf.min.mjs').then(m => {
      m.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.mjs';
      return m;
    });
  }
  if (!documentos.has(url)) {
    const p = pdfjsPromesa.then(m => m.getDocument(encodeURI(url)).promise);
    p.catch(() => documentos.delete(url));
    documentos.set(url, p);
  }
  return documentos.get(url);
}
