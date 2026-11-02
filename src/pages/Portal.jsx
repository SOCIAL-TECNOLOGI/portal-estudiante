import { useState } from 'react';
import { useSesionPortal } from '../hooks/useSesionPortal';
import { useRuta } from '../hooks/useRuta';
import CuestionarioCard from '../components/CuestionarioCard';
import GrabacionesEstudiante from '../components/GrabacionesEstudiante';
import Evaluaciones from '../components/Evaluaciones';
import Entrada, { Pantalla } from '../components/Entrada';

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
  const sesion = useSesionPortal();
  const datos = sesion.datos;
  const perfil = datos?.perfil || null;
  const pmap = datos?.pmap || null;
  const { porNivel } = useRuta(perfil, datos?.sesiones || []);

  if (sesion.estado === 'cargando') {
    return <Pantalla><div style={{ color: '#38bdf8', fontSize: '1rem' }}>Cargando...</div></Pantalla>;
  }
  if (sesion.estado !== 'dentro' || !perfil) return <Entrada s={sesion} />;

  const nombre = perfil.datos?.nombre || 'Estudiante';
  const iniciales = nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const nivelActual = pmap?.trayectoria?.nivel_actual || perfil.trayectoria?.nivel_actual || 'N1';
  const cuartilActual = perfil.trayectoria?.cuartil_actual || 'Q1';
  const progreso = perfil.progreso?.general || 0;

  // APROBADO — portal completo
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif', padding: '20px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>SITE-RUTA LATAM</div>
          <button onClick={sesion.salir} style={{ fontSize: '0.75rem', color: '#9ca3af', background: 'transparent', border: '1px solid #1f2937', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>Salir</button>
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

        <Evaluaciones />

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

        <GrabacionesEstudiante grabaciones={datos.grabaciones || []} />

        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.72rem', marginTop: 32, paddingTop: 20, borderTop: '1px solid #1f2937' }}>
          SITE-RUTA LATAM · Fedusocial · Universidad del Tolima
        </div>
      </div>
    </div>
  );
}