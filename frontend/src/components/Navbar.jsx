import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/authSlice'
import { fetchNotifications, markNotificationsAsRead, selectUnreadCount } from '../store/notificationSlice'
import { fetchConversations } from '../store/chatSlice'
import { Bell, MessageSquare, LogOut, User, Terminal, Search  } from 'lucide-react'

function Navbar() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  
  const { user } = useSelector((state) => state.auth)
  const { notifications } = useSelector((state) => state.notifications)
  const unreadNotifications = useSelector(selectUnreadCount)
  const { conversations } = useSelector((state) => state.chat)
  
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({
  users: [],
  posts: [],
  questions: []
  })
  // Calculate unread chat conversations
  const unreadChats = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0)

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications())
      dispatch(fetchConversations())
    }
  }, [user, dispatch])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/auth')
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications && unreadNotifications > 0) {
      dispatch(markNotificationsAsRead())
    }
  }

  const handleNotificationClick = (notification) => {
    setShowNotifications(false)

    switch (notification.type) {
      case 'follow':
        navigate(`/profile/${notification.sender.username}`)
        break

      case 'like':
      case 'comment':
        navigate(
          `/post/${notification.resourceId}?comment=${notification.commentId}`
       )
       break  
      case 'repost':
        navigate(`/post/${notification.resourceId}?comment=${notification.commentId}`)
        break

      case 'answer':
      case 'accept':
        navigate(`/qa/${notification.resourceId}`)
        break

      default:
        break
  }
}

  const isActive = (path) => location.pathname === path
  const handleUserSearch = async (value) => {
  setSearchQuery(value)

  if (!value.trim()) {
    setSearchResults({
      users: [],
      posts: [],
      questions: []
    })
    return
  }

  try {
    const response = await fetch(`/api/search?query=${value}`)
    const data = await response.json()

    if (response.ok) {
      setSearchResults({
        users: data.users || [],
        posts: data.posts || [],
        questions: data.questions || []
      })
    }
  } catch (err) {
    console.error(err)
  }
}

  return (
    <header style={{
      padding: '1rem 2rem',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-card)',
      backdropFilter: 'var(--glass-blur)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      {/* Branding Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <Terminal style={{ color: 'var(--primary)', width: 28, height: 28 }} />
        <h1 style={{ 
          fontSize: '1.4rem', 
          fontWeight: 800, 
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>
          DevCircle
        </h1>
      </Link>

      {/* Nav Actions */}
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link 
              to="/" 
              style={{ 
                color: isActive('/') ? 'var(--primary)' : 'var(--text-muted)', 
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'var(--transition-smooth)'
              }}
            >
              Feed
            </Link>
            <Link 
              to="/qa" 
              style={{ 
                color: isActive('/qa') ? 'var(--primary)' : 'var(--text-muted)', 
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'var(--transition-smooth)'
              }}
            >
              Q&A
            </Link>

            <Link
              to="/developers"
              style={{
                color: isActive('/developers')
                  ? 'var(--primary)'
                  : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'var(--transition-smooth)'
              }}
            >
              Developers
            </Link>


          {user?.role === 'admin' && (
            <Link 
              to="/admin" 
              style={{ 
                color: isActive('/admin') ? 'var(--primary)' : 'var(--text-muted)', 
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'var(--transition-smooth)'
              }}
            >
              Admin Panel
            </Link>
          )}
          </nav>

          <div style={{ position: 'relative' }}>
            <div style={{display: 'flex',alignItems: 'center',gap: '0.5rem',background: 'rgba(255,255,255,0.05)',padding: '0.5rem 0.75rem',borderRadius: '10px',border: '1px solid var(--border-color)'}}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search developers..."
                value={searchQuery}
                onChange={(e) => handleUserSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  width: '180px'
                }}
              />
            </div>
            {(
              searchResults.users.length > 0 ||
              searchResults.questions.length > 0 ||
              searchResults.posts.length > 0
            ) && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '45px',
                  left: 0,
                  width: '300px',
                  zIndex: 999,
                  padding: '0.75rem'
                }}
              >

                {/* DEVELOPERS */}

                {searchResults.users.length > 0 && (
                  <>
                    <h4 style={{ marginBottom: '0.5rem' }}>
                      Developers
                    </h4>

                    {searchResults.users.map((user) => (
                      <Link
                        key={user._id}
                        to={`/profile/${user.username}`}
                        onClick={() => {
                          setSearchQuery('')
                          setSearchResults({
                            users: [],
                            posts: [],
                            questions: []
                          })
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <img
                      src={
                        user.avatarUrl ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`
                      }
                      alt=""
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%'
                      }}
                    />
                    
              <div>
                <div>@{user.username}</div>
              </div>
            </Link>
          ))}
       </>
    )}

    {/* QUESTIONS */}

    {searchResults.questions.length > 0 && (
      <>
        <h4 style={{ marginTop: '0.75rem' }}>
          Questions
        </h4>

        {searchResults.questions.map((q) => (
          <Link
            key={q._id}
            to={`/qa/${q._id}`}
            style={{
              display: 'block',
              padding: '0.5rem',
              textDecoration: 'none',
              color: 'white'
            }}
          >
            ❓ {q.title}
          </Link>
        ))}
      </>
    )}

    {/* POSTS */}

    {searchResults.posts.length > 0 && (
      <>
        <h4 style={{ marginTop: '0.75rem' }}>
          Posts
        </h4>

        {searchResults.posts.map((post) => (
          <Link
            key={post._id}
            to={`/post/${post._id}`}
            style={{
              display: 'block',
              padding: '0.5rem',
              textDecoration: 'none',
              color: 'white'
            }}
          >
            📝 {post.text.slice(0, 50)}...
          </Link>
        ))}
      </>
    )}

  </div>
)}
      </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            {/* Socket Chat Badge */}
            <Link to="/chat" style={{ position: 'relative', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <MessageSquare style={{ width: 20, height: 20, transition: 'var(--transition-smooth)' }} />
              {unreadChats > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: 'var(--primary)',
                  color: '#000',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadChats}
                </span>
              )}
            </Link>

            {/* Notification Bell */}
            <button 
              onClick={toggleNotifications}
              style={{ 
                background: 'none', 
                border: 'none', 
                position: 'relative', 
                color: 'var(--text-muted)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Bell style={{ width: 20, height: 20 }} />
              {unreadNotifications > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: 'var(--danger)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {showNotifications && (
              <div 
                className="glass-panel" 
                style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  width: '320px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  zIndex: 200,
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Notifications</h4>
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>Close</button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                      <div key={n._id} onClick={() => handleNotificationClick(n)} style={{display: 'flex',gap: '0.5rem',fontSize: '0.8rem',padding: '0.5rem',opacity: n.isRead ? 0.75 : 1,cursor: 'pointer',borderRadius: '8px',transition: '0.2s'}}
                        onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                                      }
                        onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                        }>    
                      <img src={n.sender.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${n.sender.username}`} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>@{n.sender.username}</span>{' '}
                        {n.type === 'like' && 'liked your post.'}
                        {n.type === 'follow' && 'started following you.'}
                        {n.type === 'comment' && 'commented on your post.'}
                        {n.type === 'answer' && 'answered your question.'}
                        {n.type === 'accept' && 'accepted your answer! 🎉'}
                        {n.type === 'repost' && 'reposted your post.'}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Profile trigger */}
            <Link to={`/profile/${user.username}`} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <User style={{ width: 20, height: 20 }} />
            </Link>

            {/* Logout button */}
            <button 
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <LogOut style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      ) : (
        <Link to="/auth" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none' }}>
          Connect Wallet / Sign In
        </Link>
      )}
    </header>
  )
}

export default Navbar
