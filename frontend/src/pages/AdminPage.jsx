import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ShieldAlert, Trash2, CheckCircle2, AlertTriangle, User } from 'lucide-react'

function AdminPage() {
  const { token } = useSelector((state) => state.auth)

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const loadReports = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setReports(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadReports()
    }
  }, [token])

  const handleResolve = async (reportId, action) => {
    if (!window.confirm(`Are you sure you want to resolve this report via ${action.toUpperCase()}?`)) return
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      })
      if (response.ok) {
        // Reload reports
        loadReports()
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ color: 'var(--primary)' }}>Loading moderator streams...</div>
      </div>
    )
  }

  return (
    <div className="main-content" style={{ gridTemplateColumns: '1fr' }}>
      
      {/* Page Header */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ShieldAlert style={{ color: 'var(--danger)', width: 32, height: 32 }} />
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Moderator Admin Panel</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Review flagged posts, technical questions, comments, and answers from the DevCircle community.</p>
        </div>
      </div>

      {/* Reports feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Open Flags Timeline ({reports.filter(r => r.status === 'pending').length})</h3>
        
        {reports.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Hurrah! No community flags reported.
          </div>
        ) : (
          reports.map((rep) => {
            const isResolved = rep.status === 'resolved'
            return (
              <div 
                key={rep._id} 
                className="glass-panel" 
                style={{ 
                  padding: '1.5rem', 
                  border: isResolved ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(239, 68, 68, 0.2)', 
                  background: isResolved ? 'rgba(255,255,255,0.01)' : 'rgba(239, 68, 68, 0.01)',
                  opacity: isResolved ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* Meta header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <AlertTriangle style={{ color: isResolved ? 'var(--text-muted)' : 'var(--warning)', width: 16, height: 16 }} />
                    <span>Reported <strong style={{ textTransform: 'uppercase', color: 'var(--primary)' }}>{rep.contentType}</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>by @{rep.reporter.username}</span>
                  </div>

                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '6px',
                    background: isResolved ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.15)',
                    color: isResolved ? 'var(--text-muted)' : 'var(--danger)',
                    textTransform: 'uppercase'
                  }}>
                    {rep.status}
                  </span>
                </div>

                {/* Flag Content details */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Flagged Element Detail (Author: @{rep.contentDetails ? rep.contentDetails.author : 'Deleted'}):</div>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-main)' }}>"{rep.contentDetails ? rep.contentDetails.snippet : 'Original content deleted'}"</div>
                </div>

                {/* Flag report reason */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>Reason for Flagging:</strong> {rep.reason}
                </div>

                {/* Resolution buttons */}
                {!isResolved && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <button 
                      onClick={() => handleResolve(rep._id, 'dismiss')}
                      className="btn-secondary" 
                      style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.3rem' }}
                    >
                      <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--success)' }} /> Dismiss flag
                    </button>
                    <button 
                      onClick={() => handleResolve(rep._id, 'delete')}
                      className="btn-primary" 
                      style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.3rem', background: 'var(--danger)' }}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} /> Delete Content
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AdminPage
