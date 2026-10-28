import { auth } from '../firebase';
import { useState, useEffect } from 'react';
import { useEstudiante } from '../hooks/useEstudiante';
import { useRuta } from '../hooks/useRuta';
import { usePmap } from '../hooks/usePmap';
import CuestionarioCard from '../components/CuestionarioCard';
import GrabacionesEstudiante from '../components/GrabacionesEstudiante';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';

const MUNDOS = {
  N1: { titulo: 'Mundo 1 — Reconocimiento', sub: 'Localizar, identificar y relacionar información explícita', color: '#16a34a' },
  N2: { titulo: 'Mundo 2 — Comprensión',    sub: 'Inferir, relacionar y aplicar conceptos en contexto',     color: '#3b82f6' },
  N3: { titulo: 'Mundo 3 — Análisis',        sub: 'Evaluar, argumentar y transferir conocimiento',           color: '#d97706' },
  N4: { titulo: 'Mundo 4 — Pensamiento crítico', sub: 'Síntesis, creatividad y construcción de conocimiento', color: '#9333ea' },
};

const TENDENCIA_LABEL = { estable: '→ Estable', descendente: '↓ Descendente', inconsistente: '↔ Inconsistente', ascendente: '↑ Ascendente' };
const TENDENCIA_COLOR = { estable: '#38bdf8', descendente: '#f87171', inconsistente: '#fbbf24', ascendente: '#4ade80' };

function SeccionPmap({ pmap }) {
  const [abierto, setAbierto] = useState(false);
  const [sesionAbierta, setSesionAbierta] = useState(null);

  if (!pmap || (!pmap.trayectoria?.patron_detectado && !Object.keys(pmap.sesiones || {}).length)) return null;

  const tray = pmap.trayectoria || {};
  const sesiones = pmap.sesiones || {};
  const sesionesList = Object.entries(sesiones)
    .map(([key, s]) => ({ key, ...s }))
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  const tendColor = TENDENCIA_COLOR[tray.tendencia] || '#9ca3af';
  const tendLabel = TENDENCIA_LABEL[tray.tendencia] || tray.tendencia || '—';

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Cabecera sección */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
          🧠
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>Mi diagnóstico PMAP</div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Patrón de aprendizaje y trayectoria personalizada</div>
        </div>
      </div>

      {/* Trayectoria general */}
      {(tray.patron_detectado || tray.nivel_actual) && (
        <div style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a855f7', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trayectoria general</div>

          {/* Chips nivel + tendencia */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {tray.nivel_actual && (
              <span style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                Nivel {tray.nivel_actual}
              </span>
            )}
            {tray.tendencia && (
              <span style={{ background: `${tendColor}18`, border: `1px solid ${tendColor}44`, borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', color: tendColor, fontWeight: 600 }}>
                {tendLabel}
              </span>
            )}
            {tray.patron_detectado && (
              <span style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', color: '#a855f7', fontWeight: 600 }}>
                {tray.patron_detectado.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Fortaleza + Área de trabajo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {tray.fortaleza && (
              <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 600, marginBottom: 4 }}>✅ Fortaleza</div>
                <div style={{ fontSize: '0.78rem', color: '#d1d5db', lineHeight: 1.5 }}>{tray.fortaleza}</div>
              </div>
            )}
            {tray.area_trabajo && (
              <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>🎯 Área de trabajo</div>
                <div style={{ fontSize: '0.78rem', color: '#d1d5db', lineHeight: 1.5 }}>{tray.area_trabajo}</div>
              </div>
            )}
          </div>

          {/* Resumen */}
          {tray.resumen_publico && (
            <div style={{ fontSize: '0.82rem', color: '#d1d5db', lineHeight: 1.6, marginBottom: 12 }}>
              {tray.resumen_publico}
            </div>
          )}

          {/* Mensaje motivacional */}
          {tray.mensaje_estudiante && (
            <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#38bdf8', lineHeight: 1.6 }}>
              💬 {tray.mensaje_estudiante}
            </div>
          )}
        </div>
      )}

      {/* Historial de sesiones */}
      {sesionesList.length > 0 && (
        <div style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden' }}>
          <button
            onClick={() => setAbierto(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Historial de sesiones</span>
              <span style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 10, padding: '1px 8px', fontSize: '0.72rem', color: '#a855f7' }}>{sesionesList.length}</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{abierto ? '▲' : '▼'}</span>
          </button>

          {abierto && (
            <div style={{ borderTop: '1px solid #1f2937' }}>
              {sesionesList.map((s, i) => {
                const diag = s.diagnostico || {};
                const fechaStr = s.fecha ? new Date(s.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                const isOpen = sesionAbierta === s.key;
                return (
                  <div key={s.key} style={{ borderBottom: i < sesionesList.length - 1 ? '1px solid #1f2937' : 'none' }}>
                    <button
                      onClick={() => setSesionAbierta(isOpen ? null : s.key)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>{s.area || s.cuestionarioId || s.key}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>
                          {fechaStr}
                          {s.pct != null && <span style={{ marginLeft: 10, color: '#38bdf8' }}>{s.pct}% aciertos</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {diag.patron_detectado && (
                          <span style={{ fontSize: '0.68rem', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, padding: '2px 8px', color: '#a855f7' }}>
                            {diag.patron_detectado.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ padding: '0 18px 16px' }}>
                        {diag.resumen_publico && (
                          <div style={{ fontSize: '0.8rem', color: '#d1d5db', lineHeight: 1.6, marginBottom: 10 }}>{diag.resumen_publico}</div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          {diag.fortaleza && (
                            <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8, padding: '8px 10px' }}>
                              <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 600, marginBottom: 3 }}>✅ Fortaleza</div>
                              <div style={{ fontSize: '0.75rem', color: '#d1d5db' }}>{diag.fortaleza}</div>
                            </div>
                          )}
                          {diag.area_trabajo && (
                            <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 8, padding: '8px 10px' }}>
                              <div style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 600, marginBottom: 3 }}>🎯 A trabajar</div>
                              <div style={{ fontSize: '0.75rem', color: '#d1d5db' }}>{diag.area_trabajo}</div>
                            </div>
                          )}
                        </div>
                        {diag.items_fallados?.length > 0 && (
                          <div style={{ background: '#1f2937', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                            <div style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 600, marginBottom: 6 }}>Ítems con dificultad ({diag.items_fallados.length})</div>
                            {diag.items_fallados.map((it, j) => (
                              <div key={j} style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #374151' }}>
                                <span style={{ color: '#f1f5f9' }}>{it.item}</span>
                                {it.interpretacion && <span style={{ color: '#6b7280' }}> — {it.interpretacion}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        {diag.mensaje_estudiante && (
                          <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', color: '#38bdf8', lineHeight: 1.5 }}>
                            💬 {diag.mensaje_estudiante}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Portal() {
  const [modalSesion, setModalSesion] = useState(null);
  const { uid, perfil, loading: loadingPerfil, modoAcceso, setModoAcceso, buscarPorDocumento, perfilManual } = useEstudiante();
  const { porNivel, loading: loadingRuta } = useRuta(uid, perfil);
  const { pmap } = usePmap(uid);
  const [solicitud, setSolicitud] = useState(null);
  const [loadingSolicitud, setLoadingSolicitud] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Escuchar estado de solicitud
  useEffect(() => {
    if (!uid) return;
    const solRef = ref(db, `solicitudes_portal/${uid}`);
    const unsub = onValue(solRef, snap => {
      setSolicitud(snap.val());
      setLoadingSolicitud(false);
    });
    return () => unsub();
  }, [uid]);

const enviarSolicitud = async () => {
    if (!perfil) return;
    setEnviando(true);
    try {
      const authUid = auth.currentUser?.uid;
      if (!authUid) return;
      await set(ref(db, `solicitudes_portal/${authUid}`), {
        uid: authUid,
        uid_perfil: uid,
        nombre: perfil.datos?.nombre || 'Estudiante',
        institucion: perfil.datos?.institucion || '',
        municipio: perfil.datos?.municipio || '',
        grado: perfil.datos?.grado || '',
        documento: perfil.datos?.documento || '',
        sesiones_count: perfil.sesiones?.length || 0,
        fecha_solicitud: Date.now(),
        estado: 'pendiente'
      });
   } catch(e) {
      console.error('Error enviando solicitud:', e.message, e.code);
      alert('Error: ' + e.message);
    }
    setEnviando(false);
  };

  if (loadingPerfil || loadingSolicitud) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
        <div style={{ color: '#38bdf8', fontSize: '1rem' }}>Cargando...</div>
      </div>
    );
  }

 // SIN PERFIL — pantalla de entrada
  if (!perfil) {
    
    if (modoAcceso === 'solicitud') {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 380, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 18, padding: 32 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Solicitar acceso manual</div>
        <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>
          Tu docente deberá aprobar tu acceso. Solo estudiantes que han participado en clase pueden solicitarlo.
        </div>
        <input id="solNombre" type="text" placeholder="Tu nombre completo" maxLength={60}
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 40, border: '1px solid #1f2937', background: '#020617', color: '#e5e7eb', fontSize: '0.88rem', marginBottom: 10 }} />
        <input id="solInstitucion" type="text" placeholder="Tu institución educativa" maxLength={60}
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 40, border: '1px solid #1f2937', background: '#020617', color: '#e5e7eb', fontSize: '0.88rem', marginBottom: 10 }} />
        <input id="solMunicipio" type="text" placeholder="Tu municipio" maxLength={40}
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 40, border: '1px solid #1f2937', background: '#020617', color: '#e5e7eb', fontSize: '0.88rem', marginBottom: 12 }} />
        <div id="solError" style={{ color: '#ef4444', fontSize: '0.78rem', marginBottom: 10, display: 'none' }}></div>
        <button
          onClick={async () => {
            const nombre = document.getElementById('solNombre').value.trim();
            const institucion = document.getElementById('solInstitucion').value.trim();
            const municipio = document.getElementById('solMunicipio').value.trim();
            const errEl = document.getElementById('solError');
            errEl.style.display = 'none';
            if (!nombre || nombre.length < 2) { errEl.textContent = 'Escribe tu nombre'; errEl.style.display = 'block'; return; }
            if (!institucion) { errEl.textContent = 'Escribe tu institución'; errEl.style.display = 'block'; return; }
            if (!municipio) { errEl.textContent = 'Escribe tu municipio'; errEl.style.display = 'block'; return; }
            const authUid = auth.currentUser?.uid;
            if (!authUid) return;
            try {
              await set(ref(db, `solicitudes_portal/${authUid}`), {
                uid: authUid,
                nombre, institucion, municipio,
                fecha_solicitud: Date.now(),
                estado: 'pendiente',
                tipo: 'sin_documento'
              });
              setModoAcceso('pendiente_manual');
            } catch(e) {
              errEl.textContent = 'Error al enviar. Intenta de nuevo.';
              errEl.style.display = 'block';
            }
          }}
          style={{ width: '100%', padding: '0.85rem', borderRadius: 40, background: 'linear-gradient(95deg,#38bdf8,#0ea5e9)', color: '#020617', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', marginBottom: 10 }}>
          📩 Enviar solicitud
        </button>
        <button onClick={() => setModoAcceso('auto')}
          style={{ width: '100%', padding: '0.7rem', borderRadius: 40, background: 'transparent', color: '#9ca3af', fontWeight: 600, fontSize: '0.82rem', border: '1px solid #1f2937', cursor: 'pointer' }}>
          ← Volver
        </button>
      </div>
    </div>
  );
}

if (modoAcceso === 'pendiente_manual') {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 380, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 18, padding: 32 }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Solicitud enviada</div>
        <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6 }}>
          Tu docente revisará tu solicitud. Cuando sea aprobada podrás acceder a tu ruta de aprendizaje.
        </div>
      </div>
    </div>
  );
}
    if (modoAcceso === 'documento') {
      return (
        <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ textAlign: 'center', maxWidth: 380, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 18, padding: 32 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Ingresa tu número de documento</div>
            <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>
              El número que registraste cuando entraste a clase con tu docente.
            </div>
            <input
              id="inputDocumento"
              type="text"
              maxLength={15}
              placeholder="Ej: 1234567890"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 40, border: '1px solid #1f2937', background: '#020617', color: '#e5e7eb', fontSize: '0.9rem', marginBottom: 12, textAlign: 'center' }}
            />
            <div id="docError" style={{ color: '#ef4444', fontSize: '0.78rem', marginBottom: 12, display: 'none' }}></div>
            <button
              onClick={async () => {
                const doc = document.getElementById('inputDocumento').value.trim();
                const errEl = document.getElementById('docError');
                errEl.style.display = 'none';
                if (!doc || doc.length < 5) { errEl.textContent = 'Escribe tu número de documento'; errEl.style.display = 'block'; return; }
                errEl.textContent = 'Buscando...'; errEl.style.display = 'block'; errEl.style.color = '#38bdf8';
                const result = await buscarPorDocumento(doc);
                if (!result.ok) { errEl.textContent = result.error; errEl.style.display = 'block'; errEl.style.color = '#ef4444'; }
              }}
              style={{ width: '100%', padding: '0.85rem', borderRadius: 40, background: 'linear-gradient(95deg,#38bdf8,#0ea5e9)', color: '#020617', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', marginBottom: 12 }}>
              Buscar mi perfil
            </button>
            <button
              onClick={() => setModoAcceso('auto')}
              style={{ width: '100%', padding: '0.7rem', borderRadius: 40, background: 'transparent', color: '#9ca3af', fontWeight: 600, fontSize: '0.82rem', border: '1px solid #1f2937', cursor: 'pointer' }}>
              ← Volver
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 380, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 18, padding: 32 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🎓</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Portal del estudiante</div>
          <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6, marginBottom: 24 }}>
            Acceso exclusivo para estudiantes activos de SITE-RUTA LATAM.
          </div>
          <button
            onClick={() => setModoAcceso('documento')}
            style={{ width: '100%', padding: '0.85rem', borderRadius: 40, background: 'linear-gradient(95deg,#38bdf8,#0ea5e9)', color: '#020617', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', marginBottom: 10 }}>
            🪪 Tengo mi número de documento
          </button>
          <button
            onClick={() => setModoAcceso('solicitud')}
            style={{ width: '100%', padding: '0.85rem', borderRadius: 40, background: 'transparent', color: '#9ca3af', fontWeight: 600, fontSize: '0.82rem', border: '1px solid #1f2937', cursor: 'pointer' }}>
            No tengo mi documento — solicitar acceso
          </button>
          <div style={{ marginTop: 24, fontSize: '0.72rem', color: '#6b7280' }}>SITE-RUTA LATAM · Fedusocial</div>
        </div>
      </div>
    );
  }

  // CON PERFIL — ver estado de solicitud
  const nombre = perfil.datos?.nombre || 'Estudiante';
  const iniciales = nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const nivelActual = perfil.trayectoria?.nivel_actual || 'N1';
  const cuartilActual = perfil.trayectoria?.cuartil_actual || 'Q1';
  const progreso = perfil.progreso?.general || 0;

  
  // PENDIENTE — solo si no entró por documento
  if (!perfilManual && (!solicitud || solicitud.estado === 'pendiente')) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 380, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 18, padding: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#38bdf8', margin: '0 auto 16px' }}>
            {iniciales}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>{nombre}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 24 }}>
            {perfil.datos?.institucion || ''} · {perfil.datos?.municipio || ''}
          </div>

          {!solicitud ? (
            <>
              <div style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.6, marginBottom: 24 }}>
                Para acceder a tu ruta de aprendizaje personalizada, solicita acceso a tu docente.
              </div>
              <button
                onClick={enviarSolicitud}
                disabled={enviando}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 40, background: 'linear-gradient(95deg,#38bdf8,#0ea5e9)', color: '#020617', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
                {enviando ? '⏳ Enviando...' : '📩 Solicitar acceso'}
              </button>
            </>
          ) : (
            <>
              <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>⏳ Solicitud pendiente</div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Tu docente revisará tu solicitud pronto.</div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // RECHAZADO
  if (solicitud?.estado === 'rechazado') {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 380, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 18, padding: 32 }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>❌</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Acceso no aprobado</div>
          <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6 }}>
            {solicitud.motivo_rechazo || 'Tu solicitud no fue aprobada. Habla con tu docente para más información.'}
          </div>
        </div>
      </div>
    );
  }

  // SUSPENDIDO
  if (solicitud?.estado === 'suspendido') {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 380, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 18, padding: 32 }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏸️</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Acceso suspendido</div>
          <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6 }}>
            Tu acceso está temporalmente suspendido. Habla con tu docente para resolver esta situación.
          </div>
          {solicitud.motivo_suspension && (
            <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#6b7280' }}>Motivo: {solicitud.motivo_suspension}</div>
          )}
        </div>
      </div>
    );
  }

  // BLOQUEADO
  if (solicitud?.estado === 'bloqueado') {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 380, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 18, padding: 32 }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>🚫</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Acceso revocado</div>
          <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6 }}>
            Tu acceso ha sido revocado. Contacta a tu institución educativa.
          </div>
        </div>
      </div>
    );
  }

  // APROBADO — portal completo
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif', padding: '20px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>SITE-RUTA LATAM</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Portal del estudiante</div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#38bdf8', flexShrink: 0 }}>
            {iniciales}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f1f5f9' }}>{nombre}</div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
              {perfil.datos?.institucion || '—'} · {perfil.datos?.municipio || '—'}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: 4 }}>
                Nivel {nivelActual}{cuartilActual} · Progreso general {progreso}%
              </div>
              <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progreso}%`, background: '#38bdf8', borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </div>

        {Object.entries(MUNDOS).map(([nivel, mundo]) => {
          const cuests = porNivel[nivel] || [];
          if (!cuests.length) return null;
          const bloqueado = cuests.every(c => c.estado === 'locked');
          return (
            <div key={nivel} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: bloqueado ? '#1f2937' : `${mundo.color}22`,
                  border: `1px solid ${bloqueado ? '#374151' : mundo.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: bloqueado ? '#6b7280' : mundo.color,
                  flexShrink: 0
                }}>
                  {nivel}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: bloqueado ? '#6b7280' : '#f1f5f9' }}>
                    {mundo.titulo}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{mundo.sub}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {cuests.map(c => (
                  <CuestionarioCard key={c.id} cuestionario={c} onClick={c => {
  if (c.estado === 'completed' || c.estado === 'mastery') {
    setModalSesion(c);
  } else if (c.estado === 'available') {
    window.open('https://alau.fedusocial.org', '_blank');
  }
}} />
                ))}
              </div>
            </div>
          );
        })}

{modalSesion && (
  <div onClick={() => setModalSesion(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%' }}>
      <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, marginBottom: 4 }}>✅ Completado</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>{modalSesion.nombre}</div>
      {(() => {
        // Buscar diagnóstico PMAP de Docente-1 para esta sesión
        const sesionKey = modalSesion?.id?.replace(/\//g, '_');
        const pmapSesion = sesionKey && pmap?.sesiones?.[sesionKey];
        const patron = pmapSesion?.patron_detectado || modalSesion?.sesion?.diagnostico?.patron_detectado || pmap?.trayectoria?.patron_detectado || perfil?.trayectoria?.patron_detectado || '—';
        const mensaje = pmapSesion?.mensaje_estudiante || modalSesion?.sesion?.diagnostico?.mensaje_estudiante || pmap?.trayectoria?.mensaje_estudiante || perfil?.trayectoria?.mensaje_estudiante;
        const resumen = pmapSesion?.resumen_publico || modalSesion?.sesion?.diagnostico?.resumen_publico || pmap?.trayectoria?.resumen_publico || perfil?.trayectoria?.resumen_publico;
        const aciertos = modalSesion?.sesion?.pct ?? perfil?.progreso?.general ?? 0;
        const itemsFallados = pmapSesion?.items_fallados ?? null;
        return (
          <>
            {resumen && (
              <div style={{ fontSize: '0.82rem', color: '#d1d5db', lineHeight: 1.6, marginBottom: 16 }}>
                {resumen}
              </div>
            )}
            {mensaje && (
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#38bdf8', lineHeight: 1.6, marginBottom: 16 }}>
                💬 {mensaje}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: '#1f2937', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9' }}>{aciertos}%</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>aciertos</div>
              </div>
              <div style={{ flex: 1, background: '#1f2937', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>{patron}</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>patrón</div>
              </div>
              {itemsFallados !== null && (
                <div style={{ flex: 1, background: '#1f2937', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f87171' }}>{itemsFallados}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>fallados</div>
                </div>
              )}
            </div>
          </>
        );
      })()}
      <button onClick={() => setModalSesion(null)} style={{ width: '100%', marginTop: 16, padding: '0.75rem', borderRadius: 40, background: '#1f2937', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
        Cerrar
      </button>
    </div>
  </div>
)}

        <SeccionPmap pmap={pmap} />

        <GrabacionesEstudiante
          uid={uid}
          institucion={perfil.datos?.institucion || ''}
          grado={perfil.datos?.grado || ''}
        />

        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.72rem', marginTop: 32, paddingTop: 20, borderTop: '1px solid #1f2937' }}>
          SITE-RUTA LATAM · Fedusocial · Universidad del Tolima
        </div>
      </div>
    </div>
  );
}