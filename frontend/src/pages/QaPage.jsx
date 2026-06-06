import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchQuestions, createQuestion } from '../store/qaSlice'
import AiAssistant from '../components/AiAssistant'
import { HelpCircle, Sparkles, PlusCircle, ArrowUp, ArrowDown, Check, Search, Tag, MessageSquare, Terminal } from 'lucide-react'

function QaPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const tagParam = searchParams.get('tag') || ''
  
  const { user } = useSelector((state) => state.auth)
  const { questions, isLoading } = useSelector((state) => state.qa)

  // Question Form State
  const [showAskModal, setShowAskModal] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [showAiHelper, setShowAiHelper] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  // Search query state
  const [searchTag, setSearchTag] = useState(tagParam)

  useEffect(() => {
    dispatch(fetchQuestions({ tag: tagParam }))
    setSearchTag(tagParam)
  }, [dispatch, tagParam])
  
  useEffect(() => {
  const timer = setTimeout(() => {
    fetchSuggestions()
  }, 800)

  return () => clearTimeout(timer)
  }, [title, content])


  const handleAskSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)

    dispatch(createQuestion({ title, content, tags }))
    
    // Clear state
    setTitle('')
    setContent('')
    setTagsInput('')
    setShowAskModal(false)
    setShowAiHelper(false)
    setSuggestions([])
  }

  const handleTagsRecommended = (recommendedTags) => {
    setTagsInput(recommendedTags.join(', '))
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchParams(searchTag ? { tag: searchTag } : {})
  }

  const fetchSuggestions = async () => {
  if (title.trim().length < 10) {
    setSuggestions([])
    return
  }

  try {
    const response = await fetch('/api/ai/suggest-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`
      },
      body: JSON.stringify({
        title,
        content
      })
    })

    const data = await response.json()

    if (response.ok) {
      setSuggestions(data)
    }
  } catch (error) {
    console.error(error)
  }
}

  return (
    <div className="main-content" style={{ gridTemplateColumns: '240px 1fr' }}>
      
      {/* Left nav */}
      <aside className="left-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Navigation</h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/" className="btn-text" style={{ textDecoration: 'none' }}>
              🏠 Home Feed
            </Link>
            <Link to="/qa" className="btn-text" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
              <HelpCircle style={{ width: 18, height: 18 }} /> Q&A Board
            </Link>
            <Link to="/chat" className="btn-text" style={{ textDecoration: 'none' }}>
              💬 Live Chat
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Q&A Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Search & Ask Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search by tag... e.g. react" 
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                style={{ paddingLeft: '2.25rem', fontSize: '0.9rem' }}
              />
            </div>
            <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Search</button>
          </form>

          {user && (
            <button onClick={() => setShowAskModal(true)} className="btn-primary" style={{ gap: '0.3rem' }}>
              <PlusCircle style={{ width: 18, height: 18 }} /> Ask Question
            </button>
          )}
        </div>

        {/* Selected tag alert banner */}
        {tagParam && (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Showing questions tagged with <span className="tag-badge">#{tagParam}</span>{' '}
            <Link to="/qa" style={{ color: 'var(--primary)', marginLeft: '0.5rem', textDecoration: 'underline' }}>Clear filter</Link>
          </div>
        )}

        {/* Questions list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No questions found. {tagParam ? 'Try searching another tag or ' : ''}be the first to ask a developer query!
            </div>
          ) : (
            questions.map((q) => {
              const score = (q.upvotes ? q.upvotes.length : 0) - (q.downvotes ? q.downvotes.length : 0)
              return (
                <div key={q._id} className="glass-panel glass-panel-interactive" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem' }}>
                  
                  {/* Left Votes Counter */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '10px', minWidth: '60px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: score > 0 ? 'var(--primary)' : score < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {score}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>votes</span>
                  </div>

                  {/* Right Question Meta */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <Link to={`/qa/${q._id}`} style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', textDecoration: 'none', transition: 'var(--transition-smooth)' }} className="btn-text">
                        {q.title}
                      </Link>
                      {q.acceptedAnswer && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <Check style={{ width: 14, height: 14 }} /> Solved
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {q.tags && q.tags.map((tag) => (
                        <Link key={tag} to={`/qa?tag=${tag}`} className="tag-badge">#{tag}</Link>
                      ))}
                    </div>

                    {/* Bottom row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <img src={q.author.avatarUrl} style={{ width: 20, height: 20, borderRadius: '50%' }} alt="" />
                        <span>Asked by <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>@{q.author.username}</span></span>
                      </div>
                      <div style={{display: 'flex',alignItems: 'center',gap: '0.75rem'}}>
                      <span>
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                      <Link 
                        to={`/qa/${q._id}`}
                        className="btn-secondary"
                        style={{
                          padding: '0.45rem 0.9rem',
                          textDecoration: 'none'
                        }}
                      >
                        View
                      </Link>
                      <Link
                        to={`/qa/${q._id}`}
                        className="btn-primary"
                        style={{
                          padding: '0.45rem 0.9rem',
                          textDecoration: 'none'
                        }}
                      >
                       Answer
                      </Link>
                      </div>
                      </div>
                      </div>
                      </div>
                      )
                    })
                    )}
        </div>
      </section>

      {/* Ask Question Popup Modal */}
      {showAskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '2rem 0'
        }}>
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '600px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle style={{ color: 'var(--primary)', width: 22, height: 22 }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Ask a Technical Question</h3>
              </div>
              <button onClick={() => setShowAskModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>

            <form onSubmit={handleAskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="input-label" htmlFor="question-title">Question Title</label>
                <input 
                  id="question-title"
                  type="text" 
                  required
                  className="input-field" 
                  placeholder="e.g. How to handle infinite loop inside React useEffect?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {suggestions.length > 0 && (
                  <div
                    className="glass-panel"
                    style={{
                    marginTop: '1rem',
                    padding: '1rem'
                    }}
                  >
                    <h4
                      style={{
                        marginBottom: '0.75rem',
                        color: 'var(--primary)'
                      }}
                    >
                   🔍 Similar Questions Found
                    </h4>

                    {suggestions.map((q) => (
                      <Link
                        key={q._id}
                        to={`/qa/${q._id}`}
                        style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          color: 'var(--text-main)',
                          textDecoration: 'none'
                        }}
                      >
                        • {q.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="input-label" htmlFor="question-content">Detailed Content (Explain what you tried, logs, code, etc.)</label>
                <textarea 
                  id="question-content"
                  required
                  className="input-field" 
                  rows="6" 
                  placeholder="Paste details, code blocks, or step-by-step instructions..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label" htmlFor="question-tags">Tags (comma separated)</label>
                  <button 
                    type="button" 
                    onClick={() => setShowAiHelper(!showAiHelper)} 
                    className="btn-text" 
                    style={{ fontSize: '0.75rem', gap: '0.25rem', color: 'var(--primary)' }}
                  >
                    <Sparkles style={{ width: 14, height: 14 }} /> AI tagger / advisor
                  </button>
                </div>
                <input 
                  id="question-tags"
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. react, hooks, javascript"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              {/* Quality validated AI co-pilot panel */}
              {showAiHelper && (
                <AiAssistant 
                  text={content} 
                  setText={setContent} 
                  title={title}
                  type="question"
                  onTagsRecommended={handleTagsRecommended}
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAskModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default QaPage
