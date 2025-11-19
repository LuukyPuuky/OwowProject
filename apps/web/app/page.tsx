import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Flipdot Controller</h1>
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
        Choose a tool:
      </p>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/view" style={{ 
          padding: '1rem 2rem', 
          background: 'var(--bg-panel)', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}>
          Viewer
        </Link>
        <Link href="/anim" style={{ 
          padding: '1rem 2rem', 
          background: 'var(--bg-panel)', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}>
          Animation Editor
        </Link>
      </div>
    </main>
  );
}
