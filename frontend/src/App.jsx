import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '';

const SunIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

function formatDate(iso) {
  return new Date(iso).toLocaleString('es', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
}

function PostCard({ post }) {
  return (
    <article style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.05)',
      borderTop: '3px solid',
      borderImage: 'linear-gradient(90deg, #fbbf24, #fb923c, #fb7185) 1',
      animation: 'fadeIn .3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(135deg, #fbbf24, #f43f5e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: '15px',
        }}>
          {post.author[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1c1917' }}>{post.author}</div>
          <div style={{ fontSize: '12px', color: '#a8a29e' }}>{formatDate(post.createdAt)}</div>
        </div>
        <div style={{ marginLeft: 'auto', color: '#fbbf24' }}><SparkleIcon /></div>
      </div>
      <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#292524' }}>{post.text}</p>
    </article>
  );
}

export default function App() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState(null); // null | {type:'error'|'success', msg:''}
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/posts`)
      .then(r => r.json())
      .then(setPosts)
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), author: author.trim() || 'Anónimo' }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setPosts(prev => [data.post, ...prev]);
        setText('');
        setStatus({ type: 'success', msg: '¡Tu luz brilla! ✨ Publicado con éxito.' });
      } else {
        setStatus({ type: 'error', msg: data.reason || 'No fue aprobado por el filtro.' });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Error de conexión. ¿El backend está corriendo?' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
        textarea:focus, input:focus { outline: none; border-color: #fbbf24 !important; box-shadow: 0 0 0 3px rgba(251,191,36,.2); }
        button:disabled { opacity: .6; cursor: not-allowed; }
        button:not(:disabled):hover { filter: brightness(1.05); transform: translateY(-1px); }
        button { transition: all .15s ease; }
      `}</style>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ color: '#f59e0b', marginBottom: '8px' }}><SunIcon /></div>
          <h1 style={{
            fontSize: '36px', fontWeight: 800,
            background: 'linear-gradient(135deg, #f59e0b, #f97316, #f43f5e)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', lineHeight: 1.2,
          }}>Brilla ✨</h1>
          <p style={{ color: '#78716c', marginTop: '6px', fontSize: '15px' }}>
            Solo luz, solo amor, solo lo mejor de ti
          </p>
        </header>

        {/* Composer */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '24px',
          boxShadow: '0 4px 24px rgba(0,0,0,.08)', marginBottom: '28px',
        }}>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Tu nombre (opcional)"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              maxLength={40}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '1.5px solid #e7e5e4', fontSize: '14px', marginBottom: '12px',
                fontFamily: 'inherit', color: '#1c1917', background: '#fffaf5',
              }}
            />
            <textarea
              placeholder="Comparte algo positivo… ¿qué te hace brillar hoy?"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={280}
              rows={3}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                border: '1.5px solid #e7e5e4', fontSize: '15px', resize: 'vertical',
                fontFamily: 'inherit', color: '#1c1917', background: '#fffaf5',
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <span style={{ fontSize: '12px', color: text.length > 250 ? '#f43f5e' : '#a8a29e' }}>
                {text.length}/280
              </span>
              <button
                type="submit"
                disabled={loading || !text.trim()}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #f97316, #f43f5e)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '10px 24px', fontWeight: 700, fontSize: '14px',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {loading ? 'Filtrando…' : '✨ Publicar'}
              </button>
            </div>
          </form>

          {status && (
            <div style={{
              marginTop: '14px', padding: '12px 16px', borderRadius: '10px',
              background: status.type === 'success' ? '#f0fdf4' : '#fff1f2',
              border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecdd3'}`,
              color: status.type === 'success' ? '#15803d' : '#be123c',
              fontSize: '14px', fontWeight: 500,
              animation: 'fadeIn .3s ease',
            }}>
              {status.type === 'error' && '🚫 '}{status.msg}
            </div>
          )}
        </div>

        {/* Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#a8a29e' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌅</div>
              <p style={{ fontSize: '15px' }}>Sé el primero en hacer brillar este espacio</p>
            </div>
          ) : (
            posts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      </div>
    </>
  );
}
