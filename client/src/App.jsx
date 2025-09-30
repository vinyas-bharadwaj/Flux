import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Posts from './pages/Posts'
import Friends from './pages/Friends'
import Messages from './pages/Messages' 

// Main App Routes Component
const AppRoutes = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  return (
    <div className="min-h-screen w-full">
      {/* Only show navbar on non-auth pages */}
      <Navbar />
      
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          {/* Add your other protected routes here */}
          <Route path="/posts" element={
            <ProtectedRoute>
              <Posts />
            </ProtectedRoute>
          } />
          <Route path="/friends" element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={<div className="p-8 bg-gray-50 min-h-screen"><h1 className="text-2xl font-bold">Profile Page</h1></div>} />
        </Routes>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
