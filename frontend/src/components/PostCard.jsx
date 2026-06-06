import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { likePost, repostPost, commentPost, deletePost } from '../store/postSlice'
import { Heart, Repeat2, MessageCircle, Trash2, Flag, AlertTriangle, Send } from 'lucide-react'

function PostCard({ post }) {
  const dispatch = useDispatch()
  const { user, token } = useSelector((state) => state.auth)

  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [isLiked, setIsLiked] = useState(false)
  const [isReposted, setIsReposted] = useState(false)
  
  // Flag reporting state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const isOwnPost = user && post.author._id.toString() === user._id.toString()

  useEffect(() => {
    if (user && post.likes) {
      setIsLiked(post.likes.includes(user._id))
      setIsReposted(post.reposts.includes(user._id))
    }
  }, [post.likes, post.reposts, user])

  const handleLike = () => {
    if (!user) return
    dispatch(likePost(post._id))
    setIsLiked(!isLiked)
  }

  const handleRepost = () => {
    if (!user) return
    dispatch(repostPost(post._id))
    setIsReposted(!isReposted)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your post?')) {
      dispatch(deletePost(post._id))
    }
  }

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}/comments`)
      const data = await response.json()
      if (response.ok) {
        setComments(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleComments = () => {
    setShowComments(!showComments)
    if (!showComments) {
      loadComments()
    }
  }

  const handleSendComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    const originalText = commentText
    setCommentText('')
    try {
      const result = await dispatch(commentPost({ postId: post._id, text: originalText })).unwrap()
      setComments((prev) => [result.comment, ...prev])
    } catch (err) {
      setCommentText(originalText)
    }
  }

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    if (!reportReason.trim()) return
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          contentType: 'post',
          contentId: post._id,
          reason: reportReason
        })
      })
      if (response.ok) {
        alert('Thank you for your report. Moderators will review it shortly.')
        setShowReportModal(false)
        setReportReason('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Handle nested repost layout
  const originalPost = post.parentRepost

  return (
    <article className="glass-panel glass-panel-interactive" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      
      {/* Header author details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/profile/${post.author.username}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
          <img 
            src={post.author.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author.username}`} 
            style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border-color)' }} 
            alt={post.author.username} 
          />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>@{post.author.username}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isOwnPost ? (
            <button 
              onClick={handleDelete}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}
              title="Delete Post"
            >
              <Trash2 style={{ width: 18, height: 18 }} />
            </button>
          ) : (
            <button 
              onClick={() => setShowReportModal(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}
              title="Report Post"
            >
              <Flag style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>
      </div>

      {/* Main post text content */}
      <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
        {post.text}
      </div>

      {/* Optional image rendering */}
      {post.imageUrl && (
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '360px' }}>
          <img src={post.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Post Upload" />
        </div>
      )}
      
      {post.tags?.map(tag => (
        <span key={tag}>
          #{tag}
        </span>
      ))}

      {/* Nested Repost render */}
      {originalPost && (
        <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={originalPost.author.avatarUrl} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>@{originalPost.author.username}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{originalPost.text}</div>
          {originalPost.imageUrl && (
            <img src={originalPost.imageUrl} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }} alt="" />
          )}
        </div>
      )}

      <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

      {/* Post actions row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <button 
          onClick={handleLike} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: isLiked ? 'var(--primary)' : 'var(--text-muted)',
            transition: 'var(--transition-smooth)'
          }}
        >
          <Heart style={{ width: 18, height: 18, fill: isLiked ? 'var(--primary)' : 'none' }} />
          <span style={{ fontSize: '0.8rem' }}>{post.likes ? post.likes.length : 0}</span>
        </button>

        <button 
          onClick={handleRepost} 
          disabled={!!post.parentRepost}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: post.parentRepost ? 'not-allowed' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: isReposted ? 'var(--secondary)' : 'var(--text-muted)',
            transition: 'var(--transition-smooth)'
          }}
        >
          <Repeat2 style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: '0.8rem' }}>{post.reposts ? post.reposts.length : 0}</span>
        </button>

        <button 
          onClick={handleToggleComments} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: 'var(--text-muted)',
            transition: 'var(--transition-smooth)'
          }}
        >
          <MessageCircle style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: '0.8rem' }}>Comments</span>
        </button>
      </div>

      {/* Dynamic comments collapsible section */}
      {showComments && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Write a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            />
            <button className="btn-primary" type="submit" style={{ padding: '0.5rem 1rem' }} title="Send Comment">
              <Send style={{ width: 14, height: 14 }} />
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {comments.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No comments yet</span>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <img src={comment.author.avatarUrl} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />
                  <div>
                    <div style={{ fontWeight: 600 }}>@{comment.author.username}</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{comment.text}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Flag reporting Modal */}
      {showReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <AlertTriangle style={{ color: 'var(--warning)', width: 20, height: 20 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Report Offensive Post</h3>
            </div>
            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label" htmlFor="report-reason">Reason for Reporting</label>
                <textarea 
                  id="report-reason"
                  required
                  className="input-field" 
                  rows="3" 
                  placeholder="e.g. Spam, harassment, inappropriate coding language..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--danger)' }}>Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  )
}

export default PostCard
