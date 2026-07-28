import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, get } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

export function useEstudiante() {
  const [uid, setUid] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoAcceso, setModoAcceso] = useState('auto');
  const [perfilManual, setPerfilManual] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state:', user?.uid);
      if (user) {
        setUid(user.uid);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          setUid(cred.user.uid);
          console.log('UID anónimo creado:', cred.user.uid);
        } catch(e) {
          console.error('Auth error:', e);
          setLoading(false);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid || perfilManual) return;
    const perfilRef = ref(db, `estudiantes/${uid}`);
    const unsub = onValue(perfilRef, (snap) => {
      setPerfil(snap.val());
      setLoading(false);
    }, (error) => {
      console.error('Error Firebase:', error);
      setLoading(false);
    });
    return () => unsub();
  }, [uid, perfilManual]);

  const buscarPorDocumento = async (documento) => {
    try {
      console.log('Buscando documento:', documento);
      const portalRef = ref(db, `perfiles_portal/${documento}`);
      const snap = await get(portalRef);
      console.log('Resultado:', snap.exists(), snap.val());
      if (snap.exists()) {
        setPerfil({
          datos: {
            nombre: snap.val().nombre,
            municipio: snap.val().municipio,
            institucion: snap.val().institucion,
            documento: documento
          },
          trayectoria: {
            nivel_actual: snap.val().nivel_actual || 'N1',
            cuartil_actual: snap.val().cuartil_actual || 'Q1'
          },
          progreso: {
            general: snap.val().progreso || 0
          }
        });
        setPerfilManual(true);
        setUid(snap.val().uid);
        setLoading(false);
        return { ok: true };
      }
      return { ok: false, error: 'Documento no encontrado. Verifica el número o solicita acceso manual.' };
    } catch(e) {
      console.error('Error buscarPorDocumento:', e);
      return { ok: false, error: 'Error de conexión. Intenta de nuevo.' };
    }
  };

  return { uid, perfil, loading, modoAcceso, setModoAcceso, buscarPorDocumento };
}