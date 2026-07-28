const ESTADOS = {
  locked:    { label: 'Bloqueado',    bg: '#f1f5f9', color: '#94a3b8', icon: '🔒' },
  available: { label: 'Disponible',   bg: '#eff6ff', color: '#3b82f6', icon: '⚡' },
  progress:  { label: 'En progreso',  bg: '#fffbeb', color: '#d97706', icon: '⏳' },
  completed: { label: 'Completado',   bg: '#f0fdf4', color: '#16a34a', icon: '✅' },
  mastery:   { label: 'Maestría',     bg: '#faf5ff', color: '#9333ea', icon: '⭐' },
};

export default function CuestionarioCard({ cuestionario, onClick }) {
  const { estado, nombre, tipo, total_items, nivel_minimo, sesion } = cuestionario;
  const est = ESTADOS[estado] || ESTADOS.locked;
  const locked = estado === 'locked';

  return (
    <div
      onClick={() => !locked && onClick && onClick(cuestionario)}
      style={{
        borderRadius: 12,
        border: `0.5px solid ${estado === 'available' ? '#3b82f6' : estado === 'completed' || estado === 'mastery' ? '#16a34a' : '#e2e8f0'}`,
        background: 'var(--surface-2, #fff)',
        padding: '0.875rem 1rem',
        cursor: locked ? 'default' : 'pointer',
        opacity: locked ? 0.6 : 1,
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 500, padding: '2px 8px',
        borderRadius: 6, background: est.bg, color: est.color,
        marginBottom: 8
      }}>
        {est.icon} {est.label}
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>
        {nombre || cuestionario.id}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        {tipo} · {total_items || 0} preguntas · {nivel_minimo}
      </div>

      {(estado === 'completed' || estado === 'mastery' || estado === 'progress') && sesion && (
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', marginTop: 6 }}>
          {sesion.pct || 0}%
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 4 }}>aciertos</span>
        </div>
      )}

      {locked && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
          Requiere {nivel_minimo}{cuestionario.cuartil_minimo ? cuestionario.cuartil_minimo : ''}
        </div>
      )}
    </div>
  );
}
