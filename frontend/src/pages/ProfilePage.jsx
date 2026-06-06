import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { updateProfile } from '../store/authSlice'
import { selectActivePartner } from '../store/chatSlice'
import PostCard from '../components/PostCard'
import { User, Github, Award, Info, Edit, Sparkles, MessageSquare, Plus, Check } from 'lucide-react'

function ProfilePage() {
  const { username } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { user: currentUser, token } = useSelector((state) => state.auth)

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState('feed') // 'feed' | 'skills'

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false)
  const [bio, setBio] = useState('')
  const [skillsString, setSkillsString] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const isOwnProfile = currentUser && currentUser.username.toLowerCase() === username.toLowerCase()

  const loadProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/profile/${username}`)
      const data = await response.json()
      if (response.ok) {
        setProfile(data)
        setBio(data.bio || '')
        setSkillsString((data.skills || []).join(', '))
        setGithubUrl(data.githubUrl || '')
        setAvatarUrl(data.avatarUrl || '')

        // Check if current user is following this profile
        if (currentUser && data.followers) {
          setIsFollowing(data.followers.some((f) => f._id.toString() === currentUser._id.toString()))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadUserPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      const data = await response.json()
      if (response.ok && data.posts) {
        // Filter posts created by this user
        if (profile) {
          const userPosts = data.posts.filter((p) => p.author._id.toString() === profile._id.toString())
          setPosts(userPosts)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [username, currentUser])

  useEffect(() => {
    if (profile) {
      loadUserPosts()
    }
  }, [profile])

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) return
    try {
      const response = await fetch(`/api/users/${profile._id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setIsFollowing(data.isFollowing)
        setProfile((prev) => ({
          ...prev,
          followersCount: data.followersCount,
          followingCount: data.followingCount
        }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    const skills = skillsString
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    dispatch(updateProfile({ bio, skills, githubUrl, avatarUrl }))
    
    // Update local profile state
    setProfile((prev) => ({
      ...prev,
      bio,
      skills,
      githubUrl,
      avatarUrl
    }))
    
    setShowEditModal(false)
  }

  const handleDirectChat = () => {
    if (!profile) return
    // Dispatch active partner selection and route directly
    dispatch(selectActivePartner({
      _id: profile._id,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio
    }))
    navigate('/chat')
  }

  if (loading || !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ color: 'var(--primary)' }}>Loading developer profile...</div>
      </div>
    )
  }

  return (
    <div className="main-content" style={{ gridTemplateColumns: '1fr' }}>
      
      {/* Profile Header Pane */}
      <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', position: 'relative' }}>
        <img 
          src={profile.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`} 
          style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid var(--primary)', boxShadow: 'var(--shadow-glow)' }} 
          alt={profile.username} 
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>@{profile.username}</h2>
            {isOwnProfile ? (
              <button onClick={() => setShowEditModal(true)} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.3rem' }}>
                <Edit style={{ width: 14, height: 14 }} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handleFollowToggle} 
                  className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.3rem' }}
                >
                  {isFollowing ? <Check style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
                  {isFollowing ? 'Following' : 'Follow User'}
                </button>
                <button onClick={handleDirectChat} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.3rem' }}>
                  <MessageSquare style={{ width: 14, height: 14 }} /> Direct Chat
                </button>
              </div>
            )}
          </div>

          <p style={{ fontSize: '0.95rem', color: profile.bio ? 'var(--text-main)' : 'var(--text-muted)' }}>
            {profile.bio || 'This developer has not added a bio yet.'}
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span><strong style={{ color: 'var(--text-main)' }}>{profile.followersCount}</strong> Followers</span>
            <span><strong style={{ color: 'var(--text-main)' }}>{profile.followingCount}</strong> Following</span>
          </div>
        </div>

        {profile.githubUrl && (
          <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', padding: '0.5rem', borderRadius: '50%' }} title="View GitHub Link">
            <Github style={{ width: 20, height: 20 }} />
          </a>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('feed')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            paddingBottom: '0.25rem',
            color: activeTab === 'feed' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            borderBottom: activeTab === 'feed' ? '2px solid var(--primary)' : 'none'
          }}
        >
          Dev Updates
        </button>
        <button 
          onClick={() => setActiveTab('skills')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            paddingBottom: '0.25rem',
            color: activeTab === 'skills' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            borderBottom: activeTab === 'skills' ? '2px solid var(--primary)' : 'none'
          }}
        >
          Skills Set
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'feed' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {posts.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No updates posted by this developer yet.
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award style={{ color: 'var(--primary)', width: 22, height: 22 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Developer Expertise</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill) => (
                  <span key={skill} className="tag-badge" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>{skill}</span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills specified yet.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal Dialog */}
      {showEditModal && (
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
          justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '500px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Developer Profile</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="input-label" htmlFor="edit-avatar">Avatar URL</label>
                <input 
                  id="edit-avatar"
                  type="text" 
                  className="input-field" 
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="edit-bio">Biography</label>
                <textarea 
                  id="edit-bio"
                  className="input-field" 
                  rows="3" 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="edit-skills">Skills (comma separated)</label>
                <input 
                  id="edit-skills"
                  type="text" 
                  className="input-field" 
                  value={skillsString}
                  onChange={(e) => setSkillsString(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="edit-github">GitHub Link</label>
                <input 
                  id="edit-github"
                  type="url" 
                  className="input-field" 
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
