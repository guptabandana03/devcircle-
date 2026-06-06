import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

// Layout & pages
import Navbar from './components/Navbar'
import AuthPage from './pages/AuthPage'
import FeedPage from './pages/FeedPage'
import QaPage from './pages/QaPage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import DevelopersPage from './pages/DevelopersPage'
import PostDetailPage from './pages/PostDetailPage'
// Secure Route Helper
function PrivateRoute({ children }) {
  const { user } = useSelector((state) => state.auth)
  return user ? children : <Navigate to="/auth" replace />
}
// Admin Route Helper
function AdminRoute({ children }) {
  const { user } = useSelector((state) => state.auth)

  return user?.role === 'admin'
    ? children
    : <Navigate to="/" replace />
}

function App() {
  return (
    <div className="app-container">
      {/* Premium Header Navigation bar */}
      <Navbar />

      {/* Main Routes */}
      <Routes>
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <FeedPage />
            </PrivateRoute>
          } 
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route 
          path="/qa" 
          element={
            <PrivateRoute>
              <QaPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/qa/:id" 
          element={
            <PrivateRoute>
              <QuestionDetailPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/profile/:username" 
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } 
        />
        <Route
          path="/developers"
          element={
            <PrivateRoute>
            <DevelopersPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/post/:id"
          element={
            <PrivateRoute>
              <PostDetailPage />
            </PrivateRoute>
          }
        />  

        {/* Wildcard redirect fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
