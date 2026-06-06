import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login, register, resetAuthState } from '../store/authSlice'
import { Terminal, KeyRound, Mail, User, Info, Award, Github, Loader } from 'lucide-react'

function AuthPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { user, isLoading, isError, message } = useSelector((state) => state.auth)

  const [isLoginView, setIsLoginView] = useState(true)

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [skillsString, setSkillsString] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  useEffect(() => {
    if (user) {
      navigate('/')
    }
    dispatch(resetAuthState())
  }, [user, navigate, dispatch])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isLoginView) {
      dispatch(login({ email, password }))
    } else {
      const skills = skillsString
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      dispatch(register({ username, email, password, bio, skills, githubUrl }))
    }
  }

  const handleToggle = () => {
    setIsLoginView(!isLoginView)
    dispatch(resetAuthState())
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), var(--shadow-premium)'
        }}
      >
        {/* Branding header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
          <Terminal style={{ color: 'var(--primary)', width: 44, height: 44 }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {isLoginView ? 'Welcome Back' : 'Join DevCircle'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLoginView ? 'Sign in to connect with developers globally' : 'Create an account to start sharing posts and answering queries'}
          </p>
        </div>

        {isError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--danger)',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {message || 'An error occurred. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Email input (Always required) */}
          <div>
            <label className="input-label" htmlFor="email-input">
              <Mail style={{ width: 14, height: 14, marginRight: '0.25rem', verticalAlign: 'middle' }} /> Email Address
            </label>
            <input 
              id="email-input"
              type="email" 
              required
              className="input-field" 
              placeholder="e.g. dev@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Username input (Register only) */}
          {!isLoginView && (
            <div>
              <label className="input-label" htmlFor="username-input">
                <User style={{ width: 14, height: 14, marginRight: '0.25rem', verticalAlign: 'middle' }} /> Username
              </label>
              <input 
                id="username-input"
                type="text" 
                required
                className="input-field" 
                placeholder="e.g. hackerman"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          {/* Password input */}
          <div>
            <label className="input-label" htmlFor="password-input">
              <KeyRound style={{ width: 14, height: 14, marginRight: '0.25rem', verticalAlign: 'middle' }} /> Password
            </label>
            <input 
              id="password-input"
              type="password" 
              required
              className="input-field" 
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Register-only bio details */}
          {!isLoginView && (
            <>
              <div>
                <label className="input-label" htmlFor="bio-input">
                  <Info style={{ width: 14, height: 14, marginRight: '0.25rem', verticalAlign: 'middle' }} /> Bio
                </label>
                <input 
                  id="bio-input"
                  type="text" 
                  className="input-field" 
                  placeholder="Tell the community about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="skills-input">
                  <Award style={{ width: 14, height: 14, marginRight: '0.25rem', verticalAlign: 'middle' }} /> Skills (comma separated)
                </label>
                <input 
                  id="skills-input"
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. React, Node.js, MongoDB"
                  value={skillsString}
                  onChange={(e) => setSkillsString(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="github-input">
                  <Github style={{ width: 14, height: 14, marginRight: '0.25rem', verticalAlign: 'middle' }} /> GitHub Profile Link
                </label>
                <input 
                  id="github-input"
                  type="url" 
                  className="input-field" 
                  placeholder="https://github.com/yourprofile"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Submit button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isLoading ? <Loader style={{ animation: 'spin 1s infinite linear', width: 18, height: 18 }} /> : (isLoginView ? 'Secure Login' : 'Register Account')}
          </button>
        </form>

        {/* View Switch */}
        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isLoginView ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={handleToggle}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary)', 
              fontWeight: 600, 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLoginView ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
