import { useState } from 'react'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, password)
      }
    } catch (err) {
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง')
    } finally {
      setBusy(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  return (
    <div className="center">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">{mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</h1>
        <p className="muted">DayLog · ระบบบันทึกข้อมูลส่วนตัว</p>

        <label>ชื่อผู้ใช้</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          autoComplete="username"
          required
          minLength={3}
        />

        <label>รหัสผ่าน</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="อย่างน้อย 6 ตัวอักษร"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={6}
        />

        {error && <div className="error">{error}</div>}

        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'กำลังดำเนินการ…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </button>

        <div className="switch">
          {mode === 'login' ? (
            <span>
              ยังไม่มีบัญชี?{' '}
              <button type="button" className="link" onClick={() => switchMode('register')}>
                สมัครสมาชิก
              </button>
            </span>
          ) : (
            <span>
              มีบัญชีอยู่แล้ว?{' '}
              <button type="button" className="link" onClick={() => switchMode('login')}>
                เข้าสู่ระบบ
              </button>
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
