import { useState, useEffect, useRef, useCallback } from 'react';
import { api, cargarPdf } from '../api';

// Fase 2 del portal: evaluaciones (una sola oportunidad), refuerzo por microhabilidad y hoja de respuestas.
// Las claves nunca llegan al navegador: el servidor califica.

const OPC = ['A', 'B', 'C', 'D'];
const caja = { background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: '16px 18px', marginBottom: 16 };
const btn = { padding: '0.7rem 1rem', borderRadius: 40, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' };
const btnAzul = { ...btn, background: '#38bdf8', color: '#020617' };
const btnGris = { ...btn, background: '#1f2937', color: '#d1d5db' };
const capa = { position: 'fixed', inset: 0, background: '#020617', zIndex: 1000, overflowY: 'auto', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' };
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function Aviso({ texto, tipo }) {
  if (!texto) return null;
  const c = tipo === 'ok' ? '#4ade80' : '#f87171';
  return <div style={{ color: c, fontSize: '0.8rem', margin: '8px 0', lineHeight: 1.5 }}>{texto}</div>;
}

// Una página del PDF dibujada con pdf.js (página N = pregunta N)
function PaginaPdf({ pdf, pagina }) {
  const ref = useRef(null);
  const [estado, setEstado] = useState('cargando');
  useEffect(() => {
    let vivo = true, tarea = null;
    setEstado('cargando');
    cargarPdf(pdf).then(async doc => {
      if (!vivo) return;
      if (pagina > doc.numPages) { setEstado('sin_pagina'); return; }
      const page = await doc.getPage(pagina);
      const lienzo = ref.current; if (!lienzo || !vivo) return;
      const ancho = Math.min(lienzo.parentElement.clientWidth || 600, 900);
      const base = page.getViewport({ scale: 1 });
      const escala = (ancho / base.width) * (window.devicePixelRatio || 1);
      const vp = page.getViewport({ scale: escala });
      lienzo.width = vp.width; lienzo.height = vp.height;
      lienzo.style.width = '100%';
      tarea = page.render({ canvasContext: lienzo.getContext('2d'), viewport: vp });
      await tarea.promise;
      if (vivo) setEstado('listo');
    }).catch(e => { if (vivo && e?.name !== 'RenderingCancelledException') setEstado('error'); });
    return () => { vivo = false; if (tarea) tarea.cancel(); };
  }, [pdf, pagina]);
  return (
    <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', minHeight: 120, position: 'relative' }}>
      <canvas ref={ref} style={{ display: estado === 'listo' ? 'block' : 'none' }} />
      {estado !== 'listo' && (
        <div style={{ color: '#475569', fontSize: '0.85rem', padding: 24, textAlign: 'center' }}>
          {estado === 'cargando' ? 'Cargando la pregunta…' : estado === 'sin_pagina' ? 'Esta pregunta no está en el documento.' : 'No pudimos mostrar el documento. Revisa tu conexión y vuelve a abrirlo.'}
        </div>
      )}
    </div>
  );
}

// Documento completo en visor externo (cuando el cuestionario no tiene PDF propio)
function DocumentoCompleto({ pdf, n }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 6 }}>Busca en el documento la pregunta {n}.</div>
      <iframe title="Cuestionario" src={pdf} style={{ width: '100%', height: '60vh', border: 'none', borderRadius: 10, background: '#fff' }} />
    </div>
  );
}

function Opciones({ valor, onElegir, deshabilitado, correcta }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '14px 0' }}>
      {OPC.map(o => {
        let fondo = valor === o ? '#38bdf8' : '#1f2937', color = valor === o ? '#020617' : '#e5e7eb';
        if (correcta) {
          if (o === correcta) { fondo = '#16a34a'; color = '#fff'; }
          else if (o === valor) { fondo = '#dc2626'; color = '#fff'; }
        }
        return (
          <button key={o} disabled={deshabilitado} onClick={() => onElegir(o)}
            style={{ ...btn, padding: '0.9rem 0', fontSize: '1.05rem', background: fondo, color, opacity: deshabilitado && !correcta ? 0.6 : 1 }}>{o}</button>
        );
      })}
    </div>
  );
}

// Resultado: puntaje, tus respuestas y las correctas (como el modal de fin de clase en AlaU)
function Resultado({ r, titulo, onCerrar, onRefuerzo }) {
  const fallos = (r.detalle || []).filter(d => d.acierto === false).length;
  return (
    <div style={capa}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>✅ Entregado</div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: '4px 0 16px' }}>{titulo}</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, ...caja, marginBottom: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9' }}>{r.pct}%</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{r.aciertos} de {r.total} correctas</div>
          </div>
        </div>
        {r.diagnostico?.resumen_publico && <div style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.6, marginBottom: 12 }}>{r.diagnostico.resumen_publico}</div>}
        {r.diagnostico?.mensaje_estudiante && (
          <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', color: '#38bdf8', lineHeight: 1.6, marginBottom: 16 }}>
            💬 {r.diagnostico.mensaje_estudiante}
          </div>
        )}
        {!r.diagnostico && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 12 }}>Tu diagnóstico se actualizará en tu ruta en unos minutos.</div>}
        <div style={{ ...caja, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '0.72rem', color: '#9ca3af', padding: '8px 14px', borderBottom: '1px solid #1f2937' }}>
            <div>Pregunta</div><div>Tu respuesta</div><div>Correcta</div>
          </div>
          {(r.detalle || []).map(d => (
            <div key={d.n} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: '0.85rem', padding: '8px 14px', borderBottom: '1px solid #111827' }}>
              <div style={{ color: '#9ca3af' }}>{d.n}</div>
              <div style={{ fontWeight: 700, color: d.acierto ? '#4ade80' : '#f87171' }}>{d.tuya || '—'} {d.acierto ? '✓' : '✗'}</div>
              <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{d.correcta || '—'}</div>
            </div>
          ))}
        </div>
        {fallos > 0 && onRefuerzo && <button style={{ ...btnAzul, width: '100%', marginBottom: 10 }} onClick={onRefuerzo}>💪 Practicar lo que fallé</button>}
        <button style={{ ...btnGris, width: '100%' }} onClick={onCerrar}>Volver al portal</button>
      </div>
    </div>
  );
}

// Presentar un cuestionario: una pregunta por página, temporizador del servidor, cada respuesta se guarda al marcarla
function Reproductor({ ev, onSalir, onEntregado }) {
  const [info, setInfo] = useState(null);
  const [aviso, setAviso] = useState('');
  const [i, setI] = useState(0);
  const [resp, setResp] = useState({});
  const [restante, setRestante] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const fin = useRef(0), tiempos = useRef({}), desde = useRef(Date.now()), entregado = useRef(false);

  useEffect(() => {
    api(`/api/portal/evaluaciones/${encodeURIComponent(ev.id)}/iniciar`, {}).then(d => {
      setInfo(d); setResp(d.respuestas || {}); fin.current = Date.now() + d.restanteMs; setRestante(d.restanteMs);
    }).catch(e => setAviso(e.message));
  }, [ev.id]);

  const entregar = useCallback(async () => {
    if (entregado.current) return;
    entregado.current = true; setEnviando(true); setAviso('');
    try { onEntregado(await api(`/api/portal/evaluaciones/${encodeURIComponent(ev.id)}/entregar`, {})); }
    catch (e) { entregado.current = false; setEnviando(false); setAviso(e.message); }
  }, [ev.id, onEntregado]);

  useEffect(() => {
    if (!info) return;
    const t = setInterval(() => {
      const r = fin.current - Date.now(); setRestante(r);
      if (r <= 0) { clearInterval(t); entregar(); }
    }, 500);
    return () => clearInterval(t);
  }, [info, entregar]);

  const n = info?.preguntas?.[i];
  // Tiempo en cada pregunta (suma de visitas), para clasificar AR/AL/ER/EL
  const acumular = () => { if (n == null) return; tiempos.current[n] = (tiempos.current[n] || 0) + (Date.now() - desde.current) / 1000; desde.current = Date.now(); };
  const ir = j => { acumular(); setI(j); };

  const elegir = async o => {
    acumular();
    const previa = resp[n];
    setResp(r => ({ ...r, [n]: o })); setAviso('');
    try { await api(`/api/portal/evaluaciones/${encodeURIComponent(ev.id)}/responder`, { n, opcion: o, tObs: Math.round(tiempos.current[n] || 0) }); }
    catch (e) {
      setResp(r => ({ ...r, [n]: previa })); setAviso(e.message);
      if (e.status === 410) entregar();
    }
  };

  if (!info) return <div style={capa}><div style={{ maxWidth: 680, margin: '0 auto', padding: 20 }}><Aviso texto={aviso} />{!aviso && 'Abriendo…'}<button style={{ ...btnGris, marginTop: 16 }} onClick={onSalir}>Volver</button></div></div>;

  const total = info.preguntas.length, hechas = info.preguntas.filter(p => resp[p]).length;
  const poco = restante < 60000;
  return (
    <div style={capa}>
      <div style={{ position: 'sticky', top: 0, background: '#020617', borderBottom: '1px solid #1f2937', padding: '10px 16px', zIndex: 2 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{info.nombre}</div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Pregunta {n} · {hechas}/{total} respondidas</div>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: poco ? '#f87171' : '#38bdf8', fontVariantNumeric: 'tabular-nums' }}>⏱ {mmss(restante)}</div>
          <button style={{ ...btnGris, padding: '0.45rem 0.8rem', fontSize: '0.75rem' }} onClick={onSalir} title="Puedes volver antes de que acabe el tiempo">Salir</button>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 16px 40px' }}>
        {info.modo === 'paginas' ? <PaginaPdf pdf={info.pdf} pagina={n} /> : info.modo === 'documento' ? <DocumentoCompleto pdf={info.pdf} n={n} /> : <div style={{ color: '#9ca3af' }}>Este cuestionario no tiene documento.</div>}
        <Opciones valor={resp[n]} onElegir={elegir} deshabilitado={enviando} />
        <Aviso texto={aviso} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button style={{ ...btnGris, flex: 1 }} disabled={i === 0} onClick={() => ir(i - 1)}>← Anterior</button>
          {i < total - 1
            ? <button style={{ ...btnAzul, flex: 1 }} onClick={() => ir(i + 1)}>Siguiente →</button>
            : <button style={{ ...btnAzul, flex: 1 }} onClick={() => setConfirmar(true)}>Entregar</button>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {info.preguntas.map((p, j) => (
            <button key={p} onClick={() => ir(j)} style={{ width: 36, height: 36, borderRadius: 8, border: j === i ? '2px solid #38bdf8' : '1px solid #1f2937', background: resp[p] ? 'rgba(56,189,248,0.2)' : '#0f172a', color: '#e5e7eb', fontSize: '0.75rem', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
        {i < total - 1 && <button style={{ ...btnGris, width: '100%' }} onClick={() => setConfirmar(true)}>Entregar ahora</button>}
        {confirmar && (
          <div style={{ ...caja, marginTop: 14, border: '1px solid #38bdf8' }}>
            <div style={{ fontSize: '0.88rem', color: '#f1f5f9', marginBottom: 10 }}>
              {hechas < total ? `Te faltan ${total - hechas} pregunta(s). ` : ''}Solo tienes una oportunidad: después de entregar no podrás cambiar tus respuestas.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btnGris, flex: 1 }} onClick={() => setConfirmar(false)}>Seguir respondiendo</button>
              <button style={{ ...btnAzul, flex: 1 }} disabled={enviando} onClick={entregar}>{enviando ? 'Calificando…' : 'Entregar'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Refuerzo: preguntas de la misma microhabilidad que falló, con retroalimentación inmediata
function Refuerzo({ onSalir }) {
  const [lista, setLista] = useState(null);
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState('');
  const [res, setRes] = useState(null);
  const [aviso, setAviso] = useState('');
  const [cierre, setCierre] = useState(null);
  const desde = useRef(Date.now());

  useEffect(() => { api('/api/portal/refuerzo').then(d => setLista(d.preguntas)).catch(e => setAviso(e.message)); }, []);

  const p = lista?.[i];
  const responder = async o => {
    if (res) return;
    setElegida(o); setAviso('');
    try { setRes(await api('/api/portal/refuerzo/responder', { ref: p.ref, opcion: o, tObs: Math.round((Date.now() - desde.current) / 1000) })); }
    catch (e) { setElegida(''); setAviso(e.message); }
  };
  const siguiente = async () => {
    if (i < lista.length - 1) { setI(i + 1); setElegida(''); setRes(null); desde.current = Date.now(); return; }
    try { setCierre(await api('/api/portal/refuerzo/cerrar', {})); } catch { setCierre({}); }
  };

  return (
    <div style={capa}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ flex: 1, fontWeight: 700, color: '#f1f5f9' }}>💪 Refuerzo {lista?.length ? `· ${i + 1} de ${lista.length}` : ''}</div>
          <button style={{ ...btnGris, padding: '0.45rem 0.8rem', fontSize: '0.75rem' }} onClick={onSalir}>Salir</button>
        </div>
        <Aviso texto={aviso} />
        {lista && !lista.length && <div style={{ color: '#9ca3af', fontSize: '0.88rem' }}>Por ahora no tienes preguntas de refuerzo pendientes. 🎉</div>}
        {cierre ? (
          <div>
            <div style={{ color: '#f1f5f9', marginBottom: 10 }}>¡Terminaste esta ronda!</div>
            {cierre.diagnostico?.mensaje_estudiante && <div style={{ background: 'rgba(56,189,248,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', color: '#38bdf8', marginBottom: 14 }}>💬 {cierre.diagnostico.mensaje_estudiante}</div>}
            <button style={{ ...btnGris, width: '100%' }} onClick={onSalir}>Volver al portal</button>
          </div>
        ) : p && (
          <div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: 6 }}>{p.area} · de «{p.nombre}», pregunta {p.n}</div>
            {p.modo === 'paginas' ? <PaginaPdf pdf={p.pdf} pagina={p.n} /> : <DocumentoCompleto pdf={p.pdf} n={p.n} />}
            <Opciones valor={elegida} onElegir={responder} deshabilitado={!!res} correcta={res?.correcta} />
            {res && <Aviso tipo={res.acierto ? 'ok' : 'err'} texto={res.acierto ? '¡Correcto!' : `La respuesta correcta es ${res.correcta}.`} />}
            {res && <button style={{ ...btnAzul, width: '100%' }} onClick={siguiente}>{i < lista.length - 1 ? 'Siguiente →' : 'Terminar ronda'}</button>}
          </div>
        )}
      </div>
    </div>
  );
}

// Hoja de respuestas: para la clase en vivo que respondió en papel
function Hoja({ hoja, onSalir, onEntregado }) {
  const [resp, setResp] = useState({});
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const entregar = async () => {
    setEnviando(true); setAviso('');
    try { onEntregado(await api('/api/portal/hojas/entregar', { id: hoja.id, respuestas: resp })); }
    catch (e) { setAviso(e.message); setEnviando(false); }
  };
  const hechas = Object.keys(resp).length;
  return (
    <div style={capa}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ flex: 1, fontWeight: 700, color: '#f1f5f9' }}>📝 Hoja de respuestas</div>
          <button style={{ ...btnGris, padding: '0.45rem 0.8rem', fontSize: '0.75rem' }} onClick={onSalir}>Salir</button>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 14 }}>{hoja.nombre}. Copia aquí lo que marcaste en papel. Solo puedes enviarla una vez.</div>
        {hoja.preguntas.map(n => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 34, fontSize: '0.85rem', color: '#9ca3af' }}>{n}</div>
            {OPC.map(o => (
              <button key={o} onClick={() => setResp(r => ({ ...r, [n]: o }))}
                style={{ ...btn, flex: 1, padding: '0.55rem 0', background: resp[n] === o ? '#38bdf8' : '#1f2937', color: resp[n] === o ? '#020617' : '#e5e7eb' }}>{o}</button>
            ))}
          </div>
        ))}
        <Aviso texto={aviso} />
        <button style={{ ...btnAzul, width: '100%', marginTop: 12 }} disabled={!hechas || enviando} onClick={entregar}>
          {enviando ? 'Calificando…' : `Enviar hoja (${hechas}/${hoja.preguntas.length})`}
        </button>
      </div>
    </div>
  );
}

// Sección del portal
export default function Evaluaciones() {
  const [evs, setEvs] = useState(null);
  const [hojas, setHojas] = useState([]);
  const [aviso, setAviso] = useState('');
  const [vista, setVista] = useState(null); // { tipo: 'presentar'|'resultado'|'refuerzo'|'hoja', ... }
  const [porIniciar, setPorIniciar] = useState(null);

  const cargar = useCallback(() => {
    api('/api/portal/evaluaciones').then(d => setEvs(d.evaluaciones)).catch(e => setAviso(e.message));
    api('/api/portal/hojas').then(d => setHojas(d.hojas.filter(h => h.abierta && !h.entregada && !h.enVivo))).catch(() => {});
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const cerrar = () => { setVista(null); cargar(); };
  const verResultado = async ev => {
    try { setVista({ tipo: 'resultado', titulo: ev.nombre, r: await api(`/api/portal/evaluaciones/${encodeURIComponent(ev.id)}/entregar`, {}) }); }
    catch (e) { setAviso(e.message); }
  };

  if (vista?.tipo === 'presentar') return <Reproductor ev={vista.ev} onSalir={cerrar} onEntregado={r => setVista({ tipo: 'resultado', titulo: vista.ev.nombre, r })} />;
  if (vista?.tipo === 'resultado') return <Resultado r={vista.r} titulo={vista.titulo} onCerrar={cerrar} onRefuerzo={() => setVista({ tipo: 'refuerzo' })} />;
  if (vista?.tipo === 'refuerzo') return <Refuerzo onSalir={cerrar} />;
  if (vista?.tipo === 'hoja') return <Hoja hoja={vista.hoja} onSalir={cerrar} onEntregado={r => setVista({ tipo: 'resultado', titulo: vista.hoja.nombre, r })} />;

  const hechas = (evs || []).filter(e => e.estado === 'entregado').length;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 10 }}>📋 Evaluaciones</div>
      <Aviso texto={aviso} />
      {hojas.map(h => (
        <div key={h.id} style={{ ...caja, border: '1px solid #fbbf24' }}>
          <div style={{ fontSize: '0.85rem', color: '#f1f5f9', fontWeight: 600 }}>📝 ¿Respondiste en papel «{h.nombre}»?</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0 10px' }}>Sube tu hoja de respuestas antes del {new Date(h.vence).toLocaleDateString('es-CO')}.</div>
          <button style={btnAzul} onClick={() => setVista({ tipo: 'hoja', hoja: h })}>Subir mi hoja</button>
        </div>
      ))}
      {hechas > 0 && (
        <button style={{ ...btnGris, width: '100%', marginBottom: 12 }} onClick={() => setVista({ tipo: 'refuerzo' })}>💪 Refuerzo de lo que he fallado</button>
      )}
      {evs === null && !aviso && <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Cargando…</div>}
      {evs && !evs.length && <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Aún no hay cuestionarios para tu grado.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {(evs || []).map(ev => (
          <div key={ev.id} style={{ ...caja, marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{ev.nombre}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{ev.total} preguntas · {ev.minutos} min{ev.deTuClase ? ' · de tu clase' : ''}</div>
            {ev.estado === 'entregado'
              ? <button style={btnGris} onClick={() => verResultado(ev)}>Ver resultado · {ev.resultado?.pct ?? 0}%</button>
              : ev.estado === 'en_curso'
                ? <button style={btnAzul} onClick={() => setVista({ tipo: 'presentar', ev })}>Continuar</button>
                : porIniciar === ev.id
                  ? <div>
                      <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginBottom: 8, lineHeight: 1.5 }}>Tendrás {ev.minutos} minutos y una sola oportunidad. El tiempo corre aunque salgas.</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...btnGris, flex: 1 }} onClick={() => setPorIniciar(null)}>Ahora no</button>
                        <button style={{ ...btnAzul, flex: 1 }} onClick={() => { setPorIniciar(null); setVista({ tipo: 'presentar', ev }); }}>Empezar</button>
                      </div>
                    </div>
                  : <button style={btnAzul} onClick={() => setPorIniciar(ev.id)}>Presentar</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
