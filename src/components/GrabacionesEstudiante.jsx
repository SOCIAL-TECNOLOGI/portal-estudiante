import { useState } from 'react';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';

const PMAP_URL = 'https://motor1.alau.fedusocial.org';

export default function GrabacionesEstudiante({ uid, institucion, grado }) {
  const [abierto, setAbierto] = useState(false);
  const [grabaciones, setGrabaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [videoActivo, setVideoActivo] = useState(null);
  
  
   const cargar = async () => {
    if (abierto) { setAbierto(false); return; }
    setCargando(true);
    setAbierto(true);
    try {
      const r = await fetch(PMAP_URL + '/api/grabaciones');
      const d = await r.json();
      if (!d.ok || !d.grabaciones?.length) { setGrabaciones([]); setCargando(false); return; }
      const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const instNorm = norm(institucion);
      const gradNorm = norm(grado);
      console.log('inst:', institucion, '→', instNorm, '| grado:', grado, '→', gradNorm);
      const filtradas = (instNorm && gradNorm)
        ? d.grabaciones.filter(g => norm(g.institucion).includes(instNorm.slice(0,6)) && norm(g.grado) === gradNorm)
        : d.grabaciones;
      setGrabaciones(filtradas);
    } catch(e) {
      setGrabaciones([]);
    }
    setCargando(false);
  };



  return (
    <div style={{ marginTop: 28 }}>
      <button onClick={cargar} style={{
        width: '100%', padding: '0.85rem', borderRadius: 12,
        background: abierto ? '#1a2e1f' : 'rgba(39,174,96,0.15)',
        border: '1px solid #27ae60', color: '#27ae60',
        fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
      }}>
        🎬 {abierto ? 'Ocultar clases grabadas' : 'Ver mis clases grabadas'}
      </button>

      {abierto && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cargando && <p style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center' }}>Cargando grabaciones…</p>}
          {!cargando && !grabaciones.length && (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center' }}>No hay grabaciones para tu grupo aún.</p>
          )}
          {grabaciones.map((g, i) => {
            const fecha = g.fecha ? new Date(g.fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '';
            const nombre = g.nombre || 'grabacion.webm';
            return (
              <div key={i} style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, padding: 14 }}>
                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>🎬 {nombre.replace('.webm', '')}</div>
                <div style={{ color: '#6b7280', fontSize: '0.72rem', marginBottom: 10 }}>📅 {fecha}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {g.enlace && (
                    <button onClick={() => setVideoActivo(g)} style={{
                      background: '#27ae60', color: '#fff', padding: '6px 14px',
                      borderRadius: 6, border: 'none', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                    }}>▶ Reproducir</button>
                  )}
                  {g.enlace && (
                    <a href={g.enlace} download={nombre} style={{
                      background: '#2c7da0', color: '#fff', padding: '6px 14px',
                      borderRadius: 6, textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700
                    }}>⬇ Descargar</a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {videoActivo && (
        <div onClick={() => setVideoActivo(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 800 }}>
            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
              🎬 {(videoActivo.nombre || '').replace('.webm', '')}
            </div>
            <iframe src={videoActivo.enlace} style={{ width: '100%', height: '60vh', border: 'none', borderRadius: 10, background: '#000' }} allowFullScreen />
            <button onClick={() => setVideoActivo(null)} style={{
              marginTop: 16, width: '100%', padding: '0.75rem', borderRadius: 40,
              background: '#c0392b', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer'
            }}>✕ Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}