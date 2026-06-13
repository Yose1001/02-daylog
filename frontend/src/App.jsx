import { useState } from 'react'
import { useAuth } from './auth.jsx'
import Login from './components/Login.jsx'
import RecordForm from './components/RecordForm.jsx'
import History from './components/History.jsx'

export default function App() {
  const { user, loading, logout } = useAuth()
  const [tab, setTab] = useState('new') // 'new' | 'history'
  const [refreshKey, setRefreshKey] = useState(0)

  if (loading) {
    return <div className="center muted">กำลังโหลด…</div>
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>📋 DayLog</h1>
        <div className="topbar-right">
          <span className="muted">
            สวัสดี, <strong>{user.username}</strong>
          </span>
          <button className="btn ghost" onClick={logout}>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'new' ? 'tab active' : 'tab'} onClick={() => setTab('new')}>
          ✏️ บันทึกใหม่
        </button>
        <button
          className={tab === 'history' ? 'tab active' : 'tab'}
          onClick={() => setTab('history')}
        >
          🕘 ประวัติย้อนหลัง
        </button>
      </nav>

      <main className="content">
        {tab === 'new' ? (
          <RecordForm
            onSaved={() => {
              setRefreshKey((k) => k + 1)
              setTab('history')
            }}
          />
        ) : (
          <History refreshKey={refreshKey} />
        )}
      </main>
    </div>
  )
}
