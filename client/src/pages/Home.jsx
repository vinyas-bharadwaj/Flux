import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFollowingPosts, createPost, likePost } from '../utils/api';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    caption: '',
    image_url: ''
  });
  const [creating, setCreating] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0
  });

  const currentUser = (() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return { id: payload.user_id, username: payload.username };
        } catch (e) {
          return null;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  })();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (token) {
      fetchFeedPosts();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchFeedPosts = async (page = 1) => {
    try {
      if (page === 1) setLoading(true);
      setError('');
      const response = await getFollowingPosts(page, 10);
      if (response.posts) {
        if (page === 1) {
          setPosts(response.posts);
        } else {
          setPosts(prev => [...prev, ...response.posts]);
        }
        setPagination({
          page: response.page,
          totalPages: response.total_pages,
          totalCount: response.total_count
        });
      } else {
        if (page === 1) setPosts([]);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      if (page === 1) setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = () => {
    if (pagination.page < pagination.totalPages) {
      fetchFeedPosts(pagination.page + 1);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.caption.trim()) return;

    try {
      setCreating(true);
      const response = await createPost(newPost.caption, newPost.image_url);
      if (response.post) {
        setPosts([response.post, ...posts]);
        setNewPost({ caption: '', image_url: '' });
        setShowCreateForm(false);
        // Refresh feed to get latest posts
        fetchFeedPosts(1);
      } else {
        setError(response.error || 'Failed to create post');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await likePost(postId);
      if (response.post) {
        setPosts(posts.map(post => 
          post.ID === postId ? { ...post, likes: response.post.likes } : post
        ));
      }
    } catch (err) {
      setError('Failed to like post');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show landing page for non-logged in users
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <div className="inline-flex items-center space-x-3 mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-3xl">F</span>
                </div>
                <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Flux
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Connect, Share, and
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Experience the Flow
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join a vibrant community where your thoughts, creativity, and connections flow seamlessly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/register"
                  className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white border border-gray-200 hover:border-gray-300 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Instagram-style feed for logged in users
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Create Post Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {currentUser?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex-1 text-left px-4 py-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              What's on your mind, {currentUser?.username || 'User'}?
            </button>
          </div>
          
          {showCreateForm && (
            <form onSubmit={handleCreatePost} className="space-y-4 border-t border-gray-200 pt-4">
              <textarea
                value={newPost.caption}
                onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                className="w-full px-0 py-2 text-lg border-none resize-none focus:outline-none placeholder-gray-400"
                rows="3"
                placeholder="Share your thoughts..."
                required
              />
              <input
                type="url"
                value={newPost.image_url}
                onChange={(e) => setNewPost({ ...newPost, image_url: e.target.value })}
                className="w-full px-0 py-2 border-none focus:outline-none placeholder-gray-400"
                placeholder="Add image URL (optional)"
              />
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newPost.caption.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your feed...</p>
          </div>
        ) : (
          <>
            {/* Posts Feed */}
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No posts in your feed</h3>
                <p className="text-gray-500 mb-4">Follow some users to see their posts here!</p>
                <Link
                  to="/friends"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                >
                  Find People to Follow
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.ID} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Post Header */}
                    <div className="flex items-center justify-between p-4 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {post.user?.username?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{post.user?.username || 'Unknown User'}</p>
                          <p className="text-gray-500 text-xs">{formatDate(post.CreatedAt)}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>

                    {/* Post Image */}
                    {post.image_url && (
                      <div className="w-full">
                        <img
                          src={post.image_url}
                          alt="Post content"
                          className="w-full h-auto object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="p-4 pt-3">
                      <div className="flex items-center space-x-4 mb-3">
                        <button
                          onClick={() => handleLikePost(post.ID)}
                          className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors duration-200"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 transition-colors duration-200">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 transition-colors duration-200">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        </button>
                      </div>

                      {/* Likes Count */}
                      <p className="font-semibold text-sm text-gray-900 mb-1">
                        {post.likes || 0} {(post.likes || 0) === 1 ? 'like' : 'likes'}
                      </p>

                      {/* Post Caption */}
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">{post.user?.username || 'Unknown User'}</span>
                        <span className="text-gray-900 ml-2">{post.caption}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {pagination.page < pagination.totalPages && (
                  <div className="text-center py-6">
                    <button
                      onClick={loadMorePosts}
                      className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                    >
                      Load More Posts
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;