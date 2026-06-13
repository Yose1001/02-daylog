import { useState } from 'react'
import api from '../api'

function today() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export default function RecordForm({ onSaved }) {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [date, setDate] = useState(today())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/api/records', { title, detail, date })
      setTitle('')
      setDetail('')
      setDate(today())
      if (onSaved) onSaved()
    } catch (err) {
      const msg = err?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>บันทึกใหม่</h2>

      <label>หัวข้อ *</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="เช่น ประชุมทีม"
        required
        maxLength={200}
      />

      <label>วันที่</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <label>รายละเอียด</label>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="รายละเอียดเพิ่มเติม…"
        rows={5}
        maxLength={5000}
      />

      {error && <div className="error">{error}</div>}

      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? 'กำลังบันทึก…' : '💾 บันทึก'}
      </button>
    </form>
  )
}
