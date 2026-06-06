import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { fetchQuestionById, voteQuestion, fetchAnswers, createAnswer, voteAnswer, acceptAnswer } from '../store/qaSlice'
import { ArrowUp, ArrowDown, Check, Send, User, ChevronLeft, HelpCircle } from 'lucide-react'

function QuestionDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()

  const { user } = useSelector((state) => state.auth)
  const { currentQuestion, answers, isLoading } = useSelector((state) => state.qa)

  const [answerContent, setAnswerContent] = useState('')

  useEffect(() => {
    dispatch(fetchQuestionById(id))
    dispatch(fetchAnswers(id))
  }, [dispatch, id])

  const handleQuestionVote = (direction) => {
    if (!user) return
    dispatch(voteQuestion({ questionId: id, direction }))
  }

  const handleAnswerVote = (answerId, direction) => {
    if (!user) return
    dispatch(voteAnswer({ answerId, direction }))
  }

  const handleAcceptAnswer = (answerId) => {
    if (!user || !currentQuestion) return
    if (currentQuestion.author._id.toString() !== user._id.toString()) return
    dispatch(acceptAnswer(answerId))
  }

  const handleAnswerSubmit = (e) => {
    e.preventDefault()
    if (!answerContent.trim()) return

    dispatch(createAnswer({ questionId: id, content: answerContent }))
    setAnswerContent('')
  }

  if (isLoading || !currentQuestion) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ color: 'var(--primary)' }}>Loading question detail co-pilot...</div>
      </div>
    )
  }

  const questionScore = (currentQuestion.upvotes ? currentQuestion.upvotes.length : 0) - (currentQuestion.downvotes ? currentQuestion.downvotes.length : 0)
  const isQuestionAuthor = user && currentQuestion.author._id.toString() === user._id.toString()

  return (
    <div className="main-content" style={{ gridTemplateColumns: '1fr' }}>
      
      {/* Back button */}
      <div style={{ marginBottom: '0.5rem' }}>
        <Link to="/qa" className="btn-text" style={{ textDecoration: 'none', gap: '0.25rem' }}>
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back to Q&A Board
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '1.5rem' }}>
        
        {/* Question Votes Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={() => handleQuestionVote('up')}
            className="btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
            title="Upvote Question"
          >
            <ArrowUp style={{ width: 20, height: 20 }} />
          </button>
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{questionScore}</span>
          <button 
            onClick={() => handleQuestionVote('down')}
            className="btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
            title="Downvote Question"
          >
            <ArrowDown style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Question content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Card */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentQuestion.title}</h2>
              {currentQuestion.acceptedAnswer && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <Check style={{ width: 14, height: 14 }} /> Solved
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {currentQuestion.tags && currentQuestion.tags.map((tag) => (
                <span key={tag} className="tag-badge">#{tag}</span>
              ))}
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

            <div style={{ fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {currentQuestion.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={currentQuestion.author.avatarUrl} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
                <span>Asked by <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>@{currentQuestion.author.username}</span></span>
              </div>
              <div>
                Asked: {new Date(currentQuestion.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Answers stream */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
            </h3>

            {answers.map((ans) => {
              const ansScore = (ans.upvotes ? ans.upvotes.length : 0) - (ans.downvotes ? ans.downvotes.length : 0)
              const isAccepted = ans.isAccepted

              return (
                <div key={ans._id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '1rem' }}>
                  
                  {/* Answer Votes */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', paddingTop: '0.5rem' }}>
                    <button 
                      onClick={() => handleAnswerVote(ans._id, 'up')}
                      className="btn-secondary"
                      style={{ padding: '0.25rem', borderRadius: '50%' }}
                      title="Upvote Answer"
                    >
                      <ArrowUp style={{ width: 16, height: 16 }} />
                    </button>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{ansScore}</span>
                    <button 
                      onClick={() => handleAnswerVote(ans._id, 'down')}
                      className="btn-secondary"
                      style={{ padding: '0.25rem', borderRadius: '50%' }}
                      title="Downvote Answer"
                    >
                      <ArrowDown style={{ width: 16, height: 16 }} />
                    </button>

                    {/* Accept Answer Marker */}
                    {isQuestionAuthor ? (
                      <button 
                        onClick={() => handleAcceptAnswer(ans._id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          marginTop: '0.5rem',
                          color: isAccepted ? 'var(--success)' : 'rgba(255,255,255,0.15)',
                          transition: 'var(--transition-smooth)'
                        }}
                        title="Toggle Accept Answer"
                      >
                        <Check style={{ width: 28, height: 28, strokeWidth: isAccepted ? 4 : 2 }} />
                      </button>
                    ) : (
                      isAccepted && (
                        <div style={{ color: 'var(--success)', marginTop: '0.5rem' }} title="Accepted Answer">
                          <Check style={{ width: 28, height: 28, strokeWidth: 3 }} />
                        </div>
                      )
                    )}
                  </div>

                  {/* Answer Card */}
                  <div className="glass-panel" style={{ padding: '1.5rem', border: isAccepted ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)', background: isAccepted ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-card)' }}>
                    <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {ans.content}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <img src={ans.author.avatarUrl} style={{ width: 20, height: 20, borderRadius: '50%' }} alt="" />
                        <span>Answered by <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>@{ans.author.username}</span></span>
                      </div>
                      <div>
                        {new Date(ans.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Answer Form */}
          {user ? (
            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Your Answer</h3>
              <form onSubmit={handleAnswerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <textarea 
                  required
                  className="input-field" 
                  rows="5" 
                  placeholder="Support this developer by answering their query. You can add code examples..."
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', gap: '0.3rem' }}>
                  <Send style={{ width: 14, height: 14 }} /> Post Answer
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Please <Link to="/auth" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>sign in</Link> to post an answer.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionDetailPage
