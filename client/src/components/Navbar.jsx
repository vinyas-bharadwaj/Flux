import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [location]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const isActiveLink = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/20' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flux
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isLoggedIn ? (
              <>
                <NavLink to="/" isActive={isActiveLink('/')}>
                  Home
                </NavLink>
                <NavLink to="/posts" isActive={isActiveLink('/posts')}>
                  Posts
                </NavLink>
                <NavLink to="/friends" isActive={isActiveLink('/friends')}>
                  Friends
                </NavLink>
                <NavLink to="/messages" isActive={isActiveLink('/messages')}>
                  Messages
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-lg hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" isActive={isActiveLink('/login')}>
                  Login
                </NavLink>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200/20 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              {isLoggedIn ? (
                <>
                  <MobileNavLink to="/home" onClick={() => setIsMobileMenuOpen(false)}>
                    Home
                  </MobileNavLink>
                  <MobileNavLink to="/posts" onClick={() => setIsMobileMenuOpen(false)}>
                    Posts
                  </MobileNavLink>
                  <MobileNavLink to="/friends" onClick={() => setIsMobileMenuOpen(false)}>
                    Friends
                  </MobileNavLink>
                  <MobileNavLink to="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                    Messages
                  </MobileNavLink>
                  <MobileNavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    Profile
                  </MobileNavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Login
                  </MobileNavLink>
                  <MobileNavLink to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign Up
                  </MobileNavLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Desktop Navigation Link Component
const NavLink = ({ to, children, isActive }) => (
  <Link
    to={to}
    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? 'text-blue-600 bg-blue-50/50'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
    }`}
  >
    {children}
  </Link>
);

// Mobile Navigation Link Component
const MobileNavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors duration-200"
  >
    {children}
  </Link>
);

export default Navbar;