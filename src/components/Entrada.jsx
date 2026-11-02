import { useState } from 'react';

const caja = { textAlign: 'center', maxWidth: 380, width: '100%', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 18, padding: 32 };
const input = { width: '100%', padding: '0.75rem 1rem', borderRadius: 40, border: '1px solid #1f2937', background: '#020617', color: '#e5e7eb', fontSize: '0.9rem', marginBottom: 10, textAlign: 'center', boxSizing: 'border-box' };
const btn = { width: '100%', padding: '0.85rem', borderRadius: 40, background: 'linear-gradient(95deg,#38bdf8,#0ea5e9)', color: '#020617', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', marginBottom: 10 };
const btn2 = { width: '100%', padding: '0.7rem', borderRadius: 40, background: 'transparent', color: '#9ca3af', fontWeight: 600, fontSize: '0.82rem', border: '1px solid #1f2937', cursor: 'pointer' };
const soloNum = (v, max) => v.replace(/\D/g, '').slice(0, max);

export function Pantalla({ children }) {
  return <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui, sans-serif' }}>{children}</div>;
}

// Entrada al portal: documento + PIN; la primera vez (u olvido del PIN) documento + código de una clase
export default function Entrada({ s }) {
  const [modo, setModo] = useState('pin');        // pin | activar | crearPin
  const [doc, setDoc] = useState('');
  const [pin, setPin] = useState('');
  const [codigo, setCodigo] = useState('');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [nombre, setNombre] = useState('');
  const [msg, setMsg] = useState(s.error || '');
  const [ocupado, setOcupado] = useState(false);

  const correr = async (fn) => { setMsg(''); setOcupado(true); try { await fn(); } catch (e) { setMsg(e.message); } setOcupado(false); };
  const Aviso = () => msg ? <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: 12 }}>{msg}</div> : null;

  if (modo === 'activar') return (
    <Pantalla><div style={caja}>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Activa tu acceso</div>
      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>
        Escribe el documento que registraste en clase y el <b>código de una clase</b> en la que participaste (el que tu docente muestra en pantalla).
      </div>
      <input style={input} inputMode="numeric" placeholder="Número de documento" value={doc} onChange={e => setDoc(soloNum(e.target.value, 15))} />
      <input style={{ ...input, textTransform: 'uppercase', letterSpacing: 2 }} placeholder="Código de clase" maxLength={10} value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} />
      <Aviso />
      <button style={btn} disabled={ocupado} onClick={() => correr(async () => { const d = await s.verificar(doc, codigo); setNombre(d.nombre); setModo('crearPin'); })}>
        {ocupado ? 'Verificando…' : 'Verificar'}
      </button>
      <button style={btn2} onClick={() => { setMsg(''); setModo('pin'); }}>← Volver</button>
    </div></Pantalla>
  );

  if (modo === 'crearPin') return (
    <Pantalla><div style={caja}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>👋</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>Hola, {nombre}</div>
      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>Crea un <b>PIN de 4 números</b>. Lo usarás junto con tu documento para entrar. No lo compartas.</div>
      <input style={{ ...input, letterSpacing: 8, fontSize: '1.2rem' }} type="password" inputMode="numeric" placeholder="PIN" value={pin1} onChange={e => setPin1(soloNum(e.target.value, 4))} />
      <input style={{ ...input, letterSpacing: 8, fontSize: '1.2rem' }} type="password" inputMode="numeric" placeholder="Repite el PIN" value={pin2} onChange={e => setPin2(soloNum(e.target.value, 4))} />
      <Aviso />
      <button style={btn} disabled={ocupado} onClick={() => correr(async () => {
        if (pin1.length !== 4) throw new Error('El PIN debe tener 4 números.');
        if (pin1 !== pin2) throw new Error('Los dos PIN no coinciden.');
        await s.activar(doc, codigo, pin1);
      })}>{ocupado ? 'Guardando…' : 'Crear PIN y entrar'}</button>
    </div></Pantalla>
  );

  return (
    <Pantalla><div style={caja}>
      <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🎓</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Portal del estudiante</div>
      <div style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6, marginBottom: 20 }}>Acceso para estudiantes que participan en clases en vivo de SITE-RUTA LATAM.</div>
      <input style={input} inputMode="numeric" placeholder="Número de documento" value={doc} onChange={e => setDoc(soloNum(e.target.value, 15))} />
      <input style={{ ...input, letterSpacing: 8, fontSize: '1.2rem' }} type="password" inputMode="numeric" placeholder="PIN" value={pin} onChange={e => setPin(soloNum(e.target.value, 4))}
        onKeyDown={e => { if (e.key === 'Enter') correr(() => s.ingresar(doc, pin)); }} />
      <Aviso />
      <button style={btn} disabled={ocupado} onClick={() => correr(() => s.ingresar(doc, pin))}>{ocupado ? 'Entrando…' : 'Entrar'}</button>
      <button style={btn2} onClick={() => { setMsg(''); setModo('activar'); }}>Primera vez u olvidé mi PIN</button>
      <div style={{ marginTop: 18, fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.6 }}>
        ¿Aún no registras tu documento? Escríbelo cuando entres a tu próxima clase en vivo con tu docente.
      </div>
      <div style={{ marginTop: 14, fontSize: '0.72rem', color: '#6b7280' }}>SITE-RUTA LATAM · Fedusocial</div>
    </div></Pantalla>
  );
}
