import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Sparkles, Tag, CheckSquare, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
const API_URL = import.meta.env.VITE_API_URL;
function AiAssistant({
  text,
  setText,
  title = '',
  type = 'post', // 'post' | 'question'
  onTagsRecommended = null // callback when tags are generated
}) {
  const { token } = useSelector((state) => state.auth)
  
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [warnings, setWarnings] = useState([])
  const [score, setScore] = useState(null)

  // 1. Rephrase content
  const handleRephrase = async () => {
    if (!text) return
    setLoading(true)
    setFeedback('')
    try {
      const response = await fetch(`${API_URL}/api/ai/rephrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: text, type })
      })
      const data = await response.json()
      if (response.ok && data.rephrased) {
        setText(data.rephrased)
        setFeedback('AI has rephrased your content for better phrasing!')
      } else {
        setFeedback(data.message || 'Error occurred during AI rephrasing.')
      }
    } catch (err) {
      setFeedback('Failed to reach AI helper.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Recommend tags
  const handleRecommendTags = async () => {
    if (!text) return
    setLoading(true)
    setFeedback('')
    try {
      const response = await fetch(`${API_URL}/api/ai/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      })
      const data = await response.json()
      if (response.ok && data.tags && onTagsRecommended) {
        onTagsRecommended(data.tags)
        setFeedback(`Recommended tags: ${data.tags.join(', ')}`)
      } else {
        setFeedback(data.message || 'Could not recommend tags.')
      }
    } catch (err) {
      setFeedback('Failed to reach AI tagger.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Quality validation for questions
  const handleValidateQuestion = async () => {
    if (!title || !text) return
    setLoading(true)
    setFeedback('')
    setWarnings([])
    setScore(null)
    try {
      const response = await fetch(`${API_URL}/api/ai/validate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, content: text })
      })
      const data = await response.json()
      if (response.ok) {
        setScore(data.score)
        setWarnings(data.warnings)
        if (data.isValid) {
          setFeedback('Excellent quality! Your question is rich and well detailed.')
        } else {
          setFeedback('Quality warning: Your question could use more details.')
        }
      }
    } catch (err) {
      setFeedback('Failed to validate question.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel" style={{
      padding: '1.25rem',
      marginTop: '1rem',
      border: '1px dashed rgba(0, 242, 254, 0.25)',
      background: 'rgba(0, 242, 254, 0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sparkles style={{ color: 'var(--primary)', width: 18, height: 18 }} />
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>AI Assistant Co-Pilot</h4>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          type="button"
          onClick={handleRephrase} 
          disabled={loading || !text}
          className="btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.3rem' }}
        >
          {loading ? <Loader style={{ width: 14, height: 14, animation: 'spin 1s infinite linear' }} /> : <Sparkles style={{ width: 14, height: 14 }} />}
          Improve with AI
        </button>

        {onTagsRecommended && (
          <button 
            type="button"
            onClick={handleRecommendTags} 
            disabled={loading || !text}
            className="btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.3rem' }}
          >
            <Tag style={{ width: 14, height: 14 }} />
            Auto tags
          </button>
        )}

        {type === 'question' && (
          <button 
            type="button"
            onClick={handleValidateQuestion} 
            disabled={loading || !title || !text}
            className="btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.3rem' }}
          >
            <CheckSquare style={{ width: 14, height: 14 }} />
            Check Quality
          </button>
        )}
      </div>

      {feedback && (
        <div style={{ fontSize: '0.8rem', color: score !== null && score < 70 ? 'var(--warning)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
          {score !== null && score >= 70 ? <CheckCircle style={{ color: 'var(--success)', width: 14, height: 14 }} /> : null}
          {score !== null && score < 70 ? <AlertTriangle style={{ color: 'var(--warning)', width: 14, height: 14 }} /> : null}
          {feedback}
        </div>
      )}

      {/* Warnings Stream */}
      {warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--warning)' }}>
          {warnings.map((w, index) => (
            <div key={index} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ⚠️ {w}
            </div>
          ))}
        </div>
      )}

      {score !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span>Quality Score:</span>
          <span style={{ fontWeight: 'bold', color: score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
            {score} / 100
          </span>
        </div>
      )}
    </div>
  )
}

export default AiAssistant
