import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';

// Servidor del portal (pmap-api en la VM)
const API = 'https://motor1.alau.fedusocial.org';

async function post(ruta, cuerpo) {
  let r;
  try {
    r = await fetch(API + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  } catch {
    throw new Error('Sin conexión con el servidor. Intenta de nuevo.');
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok) throw new Error(d.error || 'Error ' + r.status);
  return d;
}

// Sesión del estudiante: identidad estable por documento (token del servidor), no por dispositivo
export function useSesionPortal() {
  const [estado, setEstado] = useState('cargando');   // cargando | fuera | dentro
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async (user) => {
    try {
      const t = await user.getIdToken();
      const r = await fetch(API + '/api/portal/datos', { headers: { Authorization: 'Bearer ' + t } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || 'No pudimos cargar tus datos.');
      setDatos(d);
      setEstado('dentro');
    } catch (e) {
      setError(e.message);
      setDatos(null);
      setEstado('fuera');
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setDatos(null); setEstado('fuera'); return; }
    const tok = await user.getIdTokenResult().catch(() => null);
    if (!tok?.claims?.portal) { await signOut(auth); return; }   // sesión anónima antigua u otra cuenta
    setEstado('cargando');
    cargar(user);
  }), [cargar]);

  const entrar = async (token) => { setError(''); await signInWithCustomToken(auth, token); };

  return {
    estado, datos, error, setError,
    verificar: (documento, codigo) => post('/api/portal/verificar', { documento, codigo }),
    activar: async (documento, codigo, pin) => { const d = await post('/api/portal/verificar', { documento, codigo, pin }); await entrar(d.token); },
    ingresar: async (documento, pin) => { const d = await post('/api/portal/ingresar', { documento, pin }); await entrar(d.token); },
    salir: () => signOut(auth),
  };
}
