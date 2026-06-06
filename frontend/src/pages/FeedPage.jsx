import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchPosts, createPost } from '../store/postSlice'
import PostCard from '../components/PostCard'
import AiAssistant from '../components/AiAssistant'
import { Home, MessageSquare, HelpCircle, User, Sparkles, Image, Send, Loader } from 'lucide-react'

function FeedPage() {
  const dispatch = useDispatch()
  
  const { user } = useSelector((state) => state.auth)
  const { posts, currentPage, totalPages, isLoading } = useSelector((state) => state.posts)

  // Composer State
  const [postText, setPostText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showAiHelper, setShowAiHelper] = useState(false)
  const [tags, setTags] = useState([])
  const [trendingTags, setTrendingTags] = useState([])

  useEffect(() => {
    dispatch(fetchPosts({ page: 1, limit: 10 }))

    fetch('/api/posts/trending-tags')
      .then(res => res.json())
      .then(data => {
        setTrendingTags(data)
      })
      .catch(err => {
        console.error(err)
      })

  }, [dispatch])

  const handleCreatePost = (e) => {
    e.preventDefault()
    if (!postText.trim()) return

    dispatch(createPost({ text: postText, imageUrl, tags }))
    setPostText('')
    setImageUrl('')
    setShowAiHelper(false)
    setTags([])
  }

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      dispatch(fetchPosts({ page: currentPage + 1, limit: 10 }))
    }
  }

  return (
    <div className="main-content">
      {/* Left Sidebar */}
      <aside className="left-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Navigation</h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/" className="btn-text" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
              <Home style={{ width: 18, height: 18 }} /> Home Feed
            </Link>
            <Link to="/qa" className="btn-text" style={{ textDecoration: 'none' }}>
              <HelpCircle style={{ width: 18, height: 18 }} /> Q&A Board
            </Link>
            <Link to="/chat" className="btn-text" style={{ textDecoration: 'none' }}>
              <MessageSquare style={{ width: 18, height: 18 }} /> Live Chat
            </Link>
            {user && (
              <Link to={`/profile/${user.username}`} className="btn-text" style={{ textDecoration: 'none' }}>
                <User style={{ width: 18, height: 18 }} /> Profile
              </Link>
            )}
          </nav>
        </div>
      </aside>

      {/* Center Feed Timeline */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Post composer panel */}
        {user && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <img 
                  src={user.avatarUrl} 
                  style={{ width: 40, height: 40, borderRadius: '50%' }} 
                  alt="" 
                />
                <textarea 
                  className="input-field" 
                  rows="3" 
                  placeholder="Share a developer update or project idea..." 
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  style={{ resize: 'none', border: 'none', background: 'transparent', padding: '0.25rem 0' }}
                />
              </div>

              {/* Composer action row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  
                  {/* Optional Image Url field toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Image style={{ width: 16, height: 16 }} />
                    <input 
                      type="text" 
                      placeholder="Add Image Link..." 
                      className="input-field" 
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '120px' }}
                    />
                  </div>

                  <button 
                    type="button" 
                    onClick={() => setShowAiHelper(!showAiHelper)} 
                    className="btn-text" 
                    style={{ fontSize: '0.8rem', gap: '0.25rem', color: showAiHelper ? 'var(--primary)' : 'var(--text-muted)' }}
                  >
                    <Sparkles style={{ width: 14, height: 14 }} /> Co-pilot
                  </button>
                </div>

                <button type="submit" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.3rem' }}>
                  <Send style={{ width: 14, height: 14 }} /> Post
                </button>
              </div>

              {/* Collapsible Co-pilot Assistant panel */}
              {showAiHelper && (
                <AiAssistant 
                  text={postText} 
                  setText={setPostText} 
                  type="post"
                  onTagsRecommended={setTags}
                />
              )}
            </form>
          </div>
        )}

        {/* Timeline Posts stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No posts in the timeline yet. Be the first to share an update!
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))
          )}
        </div>

        {/* Load More trigger */}
        {currentPage < totalPages && (
          <button 
            onClick={handleLoadMore} 
            className="btn-secondary" 
            style={{ width: '100%', padding: '1rem', justifySelf: 'center' }}
            disabled={isLoading}
          >
            {isLoading ? <Loader style={{ animation: 'spin 1s infinite linear', width: 18, height: 18 }} /> : 'Load More Dev Updates'}
          </button>
        )}
      </section>

      {/* Right Sidebar Widgets */}
      <aside className="right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Trending Tags widget */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trending Tags</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {trendingTags.map((tag) => (
              <Link
                key={tag._id}
                to={`/qa?tag=${encodeURIComponent(tag._id)}`}
                className="tag-badge"
              >
                #{tag._id}
              </Link>
            ))}
          </div> 
        </div>

        {/* Developer Spotlights details */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Developer spotlight</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', alignItems: 'center' }}>
              <img src="https://api.dicebear.com/7.x/identicon/svg?seed=linus" style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
              <div>
                <div style={{ fontWeight: 'bold' }}>Linus Torvalds</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Linux creator</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', alignItems: 'center' }}>
              <img src="https://api.dicebear.com/7.x/identicon/svg?seed=dan" style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
              <div>
                <div style={{ fontWeight: 'bold' }}>Dan Abramov</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>React co-author</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default FeedPage
