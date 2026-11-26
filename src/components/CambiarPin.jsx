import { useState } from 'react';
import { api } from '../api';

// El estudiante cambia su PIN. El servidor lo guarda cifrado: nadie lo puede leer, ni el docente ni el administrador.
// Si lo olvida, el administrador le genera uno nuevo.
export default function CambiarPin({ pinInicial }) {
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({ actual: '', nuevo: '', repetir: '' });
  const [estado, setEstado] = useState({ enviando: false, error: '', listo: false });
  const solo4 = v => v.replace(/\D/g, '').slice(0, 4);
  const campo = (k, etq) => (
    <label style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af', marginBottom: 8 }}>{etq}
      <input type="password" inputMode="numeric" autoComplete="off" value={f[k]} onChange={e => setF({ ...f, [k]: solo4(e.target.value) })}
        style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px 10px', background: '#020617', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: '1rem', letterSpacing: 6 }} />
    </label>
  );
  async function guardar() {
    if (f.actual.length !== 4 || f.nuevo.length !== 4) return setEstado({ enviando: false, error: 'Los PIN deben tener 4 números.', listo: false });
    if (f.nuevo !== f.repetir) return setEstado({ enviando: false, error: 'El PIN nuevo y su repetición no coinciden.', listo: false });
    setEstado({ enviando: true, error: '', listo: false });
    try {
      await api('/api/portal/cambiar-pin', { actual: f.actual, nuevo: f.nuevo });
      setF({ actual: '', nuevo: '', repetir: '' }); setEstado({ enviando: false, error: '', listo: true }); setAbierto(false);
    } catch (e) { setEstado({ enviando: false, error: e.message, listo: false }); }
  }
  const caja = { background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: '14px 18px', marginBottom: 24 };
  const btn = { fontSize: '0.8rem', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', border: 'none' };

  if (estado.listo) return <div style={{ ...caja, borderColor: 'rgba(74,222,128,0.4)', color: '#86efac', fontSize: '0.82rem' }}>✅ Listo. Desde ahora entra con tu PIN nuevo. Nadie más lo conoce: si lo olvidas, pídele uno nuevo a tu docente.</div>;
  if (!abierto) return pinInicial
    ? <div style={{ ...caja, borderColor: 'rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, fontSize: '0.8rem', color: '#fde68a' }}>🔐 Estás usando el PIN que te entregó tu docente. Cámbialo por uno que solo tú conozcas.</div>
        <button style={{ ...btn, background: '#f59e0b', color: '#111827', fontWeight: 600 }} onClick={() => setAbierto(true)}>Cambiar mi PIN</button>
      </div>
    : <div style={{ textAlign: 'right', marginTop: -16, marginBottom: 16 }}>
        <button style={{ ...btn, background: 'transparent', color: '#64748b', padding: 0, fontSize: '0.72rem' }} onClick={() => setAbierto(true)}>🔐 Cambiar mi PIN</button>
      </div>;
  return (
    <div style={caja}>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9', marginBottom: 10 }}>🔐 Cambiar mi PIN</div>
      {campo('actual', 'PIN actual')}
      {campo('nuevo', 'PIN nuevo (4 números)')}
      {campo('repetir', 'Repite el PIN nuevo')}
      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 10 }}>Evita 1234, 1111 o tu fecha de nacimiento. Nadie más podrá ver tu PIN.</div>
      {estado.error && <div style={{ fontSize: '0.78rem', color: '#f87171', marginBottom: 10 }}>⚠️ {estado.error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ ...btn, background: '#1f2937', color: '#d1d5db' }} onClick={() => { setAbierto(false); setEstado({ enviando: false, error: '', listo: false }); }}>Cancelar</button>
        <button style={{ ...btn, background: '#0284c7', color: '#fff', fontWeight: 600, opacity: estado.enviando ? 0.6 : 1 }} disabled={estado.enviando} onClick={guardar}>{estado.enviando ? 'Guardando…' : 'Guardar PIN nuevo'}</button>
      </div>
    </div>
  );
}
