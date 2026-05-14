import { createClient } from '@/src/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-icon">👤</div>
        <h1 className="hero-title">Dashboard</h1>
        <p className="hero-sub">Welcome back!</p>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-hover)', borderRadius: '0.5rem' }}>
          <strong>Logged in as:</strong><br />
          <span style={{ color: 'var(--text-muted)' }}>{user.email}</span>
        </div>

        <form action="/auth/signout" method="post">
          <button className="btn btn-outline btn-full" type="submit">
            Log Out
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-row">
          {/* Use a simple form or link here in a real server component, or a client wrapper */}
          <a href="/" className="btn btn-gold" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Start a Round →
          </a>
        </div>
      </div>
    </div>
  );
}
