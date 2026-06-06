import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { io } from 'socket.io-client'
import { fetchConversations, fetchMessages, selectActivePartner, addIncomingMessage, updateOnlineUsersList } from '../store/chatSlice'
import { Send, User, Circle, ArrowLeft, Loader } from 'lucide-react'
import { Link } from 'react-router-dom'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL

function ChatPage() {
  const dispatch = useDispatch()

  const { user } = useSelector((state) => state.auth)
  const { conversations, messages, activePartner, onlineUserIds, isLoading } = useSelector((state) => state.chat)

  const [messageText, setMessageText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // 1. Fetch conversations list on load
  useEffect(() => {
    dispatch(fetchConversations())
  }, [dispatch])

  // 2. Establish Socket connection
  useEffect(() => {
    if (!user) return

    // Connect to server (proxy will point to http://localhost:5000)
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socketRef.current = socket

    // Register active user
    socket.emit('register', user._id)

    // Receive incoming message
    socket.on('receive_message', (msg) => {
      dispatch(addIncomingMessage(msg))
    });

    // Received message sent confirmation
    socket.on('message_sent', (msg) => {
      dispatch(addIncomingMessage(msg))
    });

    // Handle online list broadcasts
    socket.on('online_users', (userIds) => {
      dispatch(updateOnlineUsersList(userIds))
    });

    // Handle incoming typing indicator
    socket.on('typing', (data) => {
      if (activePartner && data.senderId.toString() === activePartner._id.toString()) {
        setPartnerTyping(data.isTyping)
      }
    });

    return () => {
      socket.disconnect()
    }
  }, [user, activePartner, dispatch])

  // 3. Fetch message history when selected partner changes
  useEffect(() => {
    if (activePartner) {
      dispatch(fetchMessages(activePartner._id))
      setPartnerTyping(false)
    }
  }, [activePartner, dispatch])

  // 4. Auto scroll messages list to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, partnerTyping])

  const handleSelectConversation = (partner) => {
    dispatch(selectActivePartner(partner))
  }

  // 5. Send message trigger
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageText.trim() || !activePartner || !socketRef.current) return

    // Emit send_message event
    socketRef.current.emit('send_message', {
      senderId: user._id,
      recipientId: activePartner._id,
      text: messageText
    })

    setMessageText('')
    
    // Stop typing immediately
    socketRef.current.emit('typing', {
      senderId: user._id,
      recipientId: activePartner._id,
      isTyping: false
    })
  }

  // 6. Handle keypresses for typing triggers
  const handleKeyPress = () => {
    if (!activePartner || !socketRef.current) return

    if (!isTyping) {
      setIsTyping(true)
      socketRef.current.emit('typing', {
        senderId: user._id,
        recipientId: activePartner._id,
        isTyping: true
      })
    }

    // Reset typing timeout
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socketRef.current.emit('typing', {
        senderId: user._id,
        recipientId: activePartner._id,
        isTyping: false
      })
    }, 2000)
  }

  const isUserOnline = (userId) => onlineUserIds.includes(userId.toString())

  return (
    <div className="main-content" style={{ gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 120px)', padding: '1rem' }}>
      
      {/* Sidebar Contacts List */}
      <div 
        className={`left-chat-pane glass-panel ${activePartner ? 'hide-mobile' : ''}`}
        style={{ 
          display: activePartner ? 'none' : 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          padding: '1.25rem',
          height: '100%',
          overflowY: 'auto'
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Active Chats</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {conversations.length === 0 ? (
           <div style={{display: 'flex',flexDirection: 'column',alignItems: 'center',gap: '1rem',marginTop: '2rem'}}>
            <div style={{color: 'var(--text-muted)',fontSize: '0.85rem',textAlign: 'center'}}>
              No chats active yet.
            </div>
            <Link
            to="/"
            className="btn-primary"
            style={{textDecoration: 'none',padding: '0.6rem 1rem'}}>
              Browse Developers
            </Link>
        </div>
          ) : (
            conversations.map((conv) => {
              const online = isUserOnline(conv.user._id)
              return (
                <div 
                  key={conv.user._id}
                  onClick={() => handleSelectConversation(conv.user)}
                  className="glass-panel-interactive"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={conv.user.avatarUrl} style={{ width: 36, height: 36, borderRadius: '50%' }} alt="" />
                    <Circle 
                      style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        right: 0, 
                        width: 10, 
                        height: 10, 
                        fill: online ? 'var(--success)' : 'var(--text-dark)', 
                        color: online ? 'var(--success)' : 'var(--text-dark)' 
                      }} 
                    />
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>@{conv.user.username}</span>
                      {conv.unreadCount > 0 && (
                        <span style={{ background: 'var(--primary)', color: '#000', fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '8px', fontWeight: 'bold' }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Messaging Window */}
      <div
        className={`right-chat-pane glass-panel ${!activePartner ? 'hide-mobile' : ''}`}
        style={{ 
          display: activePartner ? 'flex' : 'none', 
          flexDirection: 'column', 
          height: '100%',
          overflow: 'hidden'
        }}>
      
        {activePartner ? (
          <>
            {/* Header Partner Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
              <button 
                onClick={() => dispatch(selectActivePartner(null))}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.25rem' }}
                className="chat-back-btn"
              >
                <ArrowLeft style={{ width: 18, height: 18 }} />
              </button>

              <div style={{ position: 'relative' }}>
                <img src={activePartner.avatarUrl} style={{ width: 36, height: 36, borderRadius: '50%' }} alt="" />
                <Circle 
                  style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0, 
                    width: 10, 
                    height: 10, 
                    fill: isUserOnline(activePartner._id) ? 'var(--success)' : 'var(--text-dark)', 
                    color: isUserOnline(activePartner._id) ? 'var(--success)' : 'var(--text-dark)' 
                  }} 
                />
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>@{activePartner.username}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isUserOnline(activePartner._id) ? 'Active Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Messages body stream */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: 'auto' }}>
                  No message history yet. Drop a friendly developer greet! 👋
                </div>
              ) : (
                messages.map((msg) => {
                  const isSentByMe = msg.sender._id.toString() === user._id.toString()
                  return (
                    <div 
                      key={msg._id} 
                      style={{ 
                        alignSelf: isSentByMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                      }}
                    >
                      <div 
                        style={{
                          background: isSentByMe ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.04)',
                          color: isSentByMe ? '#000' : 'var(--text-main)',
                          padding: '0.6rem 1rem',
                          borderRadius: isSentByMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          fontSize: '0.9rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: isSentByMe ? 'flex-end' : 'flex-start' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}

              {/* Typing indicator markup */}
              {partnerTyping && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.5rem 1rem', borderRadius: '12px' }}>
                  <div className="skeleton" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></div>
                  <div className="skeleton" style={{ width: '6px', height: '6px', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer field */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Type a developer message..." 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
                style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
              />
              <button className="btn-primary" type="submit" style={{ padding: '0.6rem 1.25rem' }}>
                <Send style={{ width: 16, height: 16 }} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <User style={{ width: 44, height: 44, color: 'var(--primary)', opacity: 0.3 }} />
            <span>Select an active contact or click direct chat on profiles to begin live messaging!</span>
          </div>
        )}
      </div>

      {/* Responsive mobile media styles */}
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile {
            display: none !important;
          }
          .left-chat-pane, .right-chat-pane {
            grid-column: 1 / -1;
            width: 100% !important;
          }
          .chat-back-btn {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .chat-back-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default ChatPage
