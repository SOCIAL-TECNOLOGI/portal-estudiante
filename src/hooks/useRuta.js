import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

const NIVEL_ORDEN = { N1: 1, N2: 2, N3: 3, N4: 4 };
const CUARTIL_ORDEN = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };

function nivelMayor(a, b) {
  return NIVEL_ORDEN[a] > NIVEL_ORDEN[b];
}

function cuartilMayor(a, b) {
  return CUARTIL_ORDEN[a] > CUARTIL_ORDEN[b];
}

function calcularEstadoCuestionario(cuestionario, perfil, sesiones) {
  const nivel = cuestionario.nivel_minimo || 'N1';
  const cuartil = cuestionario.cuartil_minimo || 'Q1';
  const nivelActual = perfil?.trayectoria?.nivel_actual || 'N1';
  const cuartilActual = perfil?.trayectoria?.cuartil_actual || 'Q1';

  // Verificar si ya lo completó
  const sesion = sesiones?.find(s => s.cuestionarioId === cuestionario.id);
 
   if (sesion) {
    if (sesion.pct >= 90) return 'mastery';
    return 'completed';
  }

  // Verificar si tiene el nivel mínimo
  const tieneNivel = NIVEL_ORDEN[nivelActual] >= NIVEL_ORDEN[nivel];
  const tieneCuartil = tieneNivel && (
    NIVEL_ORDEN[nivelActual] > NIVEL_ORDEN[nivel] ||
    CUARTIL_ORDEN[cuartilActual] >= CUARTIL_ORDEN[cuartil]
  );

  if (!tieneNivel || !tieneCuartil) return 'locked';
  return 'available';
}

export function useRuta(uid, perfil) {
  const [cuestionarios, setCuestionarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bancRef = ref(db, 'banco/cuestionarios');
    const unsub = onValue(bancRef, (snap) => {
      const data = snap.val() || {};
      const lista = Object.entries(data).map(([id, c]) => ({
        id,
        ...c,
        nivel_minimo: c.nivel_minimo || 'N1',
        cuartil_minimo: c.cuartil_minimo || 'Q1'
      }));
      setCuestionarios(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const [sesiones, setSesiones] = useState([]);
  useEffect(() => {
    if (!uid) return;
    const sesRef = ref(db, `estudiantes/${uid}/sesiones`);
    const unsub = onValue(sesRef, (snap) => {
      const data = snap.val() || {};
      setSesiones(Object.values(data));
    });
    return () => unsub();
  }, [uid]);

console.log('useRuta uid:', uid);
  console.log('Sesiones cargadas:', sesiones.length, sesiones.map(s => s.cuestionarioId));
  const rutaCalculada = cuestionarios.map(c => ({
    ...c,
    estado: calcularEstadoCuestionario(c, perfil, sesiones)
  }));

  const porNivel = {
    N1: rutaCalculada.filter(c => (c.nivel_minimo || 'N1') === 'N1'),
    N2: rutaCalculada.filter(c => c.nivel_minimo === 'N2'),
    N3: rutaCalculada.filter(c => c.nivel_minimo === 'N3'),
    N4: rutaCalculada.filter(c => c.nivel_minimo === 'N4'),
  };

  return { rutaCalculada, porNivel, loading };
}
