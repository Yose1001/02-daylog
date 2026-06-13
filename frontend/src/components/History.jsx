import { useEffect, useState } from 'react'
import api from '../api'

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function RecordEditForm({ record, onSaved, onCancel }) {
  const [title, setTitle] = useState(record.title)
  const [detail, setDetail] = useState(record.detail || '')
  const [date, setDate] = useState(record.date || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = await api.put(`/api/records/${record.id}`, { title, detail, date })
      onSaved(data)
    } catch (err) {
      const msg = err?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'แก้ไขไม่สำเร็จ ลองใหม่อีกครั้ง')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="record-item editing">
      <form className="record-edit-form" onSubmit={handleSubmit}>
        <label>หัวข้อ *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />

        <label>วันที่</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label>รายละเอียด</label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={4}
          maxLength={5000}
        />

        {error && <div className="error">{error}</div>}

        <div className="record-edit-actions">
          <button className="btn primary small" type="submit" disabled={busy}>
            {busy ? 'กำลังบันทึก…' : '💾 บันทึก'}
          </button>
          <button className="btn ghost small" type="button" onClick={onCancel} disabled={busy}>
            ยกเลิก
          </button>
        </div>
      </form>
    </li>
  )
}

export default function History({ refreshKey }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/records')
      setRecords(data)
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  async function handleDelete(id) {
    if (!window.confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return
    try {
      await api.delete(`/api/records/${id}`)
      setRecords((rs) => rs.filter((r) => r.id !== id))
    } catch {
      window.alert('ลบไม่สำเร็จ')
    }
  }

  function handleSaved(updated) {
    setRecords((rs) => rs.map((r) => (r.id === updated.id ? updated : r)))
    setEditingId(null)
  }

  if (loading) return <div className="muted center-pad">กำลังโหลด…</div>
  if (error) return <div className="error center-pad">{error}</div>
  if (records.length === 0) {
    return <div className="muted center-pad">ยังไม่มีบันทึก — ลองเพิ่มรายการแรกของคุณ ✨</div>
  }

  return (
    <div className="history">
      <h2>
        ประวัติย้อนหลัง <span className="muted">({records.length} รายการ)</span>
      </h2>
      <ul className="record-list">
        {records.map((r) =>
          editingId === r.id ? (
            <RecordEditForm
              key={r.id}
              record={r}
              onSaved={handleSaved}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <li key={r.id} className="record-item">
              <div className="record-main">
                <div className="record-head">
                  <span className="record-title">{r.title}</span>
                  {r.date && <span className="badge">{r.date}</span>}
                </div>
                {r.detail && <p className="record-detail">{r.detail}</p>}
                <span className="record-time">บันทึกเมื่อ {formatDateTime(r.created_at)}</span>
              </div>
              <div className="record-actions">
                <button className="btn warning small" onClick={() => setEditingId(r.id)}>
                  แก้ไข
                </button>
                <button className="btn danger small" onClick={() => handleDelete(r.id)}>
                  ลบ
                </button>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  )
}
