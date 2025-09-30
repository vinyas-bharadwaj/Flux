import React, { useState, useEffect } from 'react';
import { getAllUserPosts, getFollowingPosts, createPost, deletePost, likePost } from '../utils/api';

const Posts = () => {
  const [activeTab, setActiveTab] = useState('my-posts');
  const [posts, setPosts] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    caption: '',
    image_url: ''
  });
  const [creating, setCreating] = useState(false);
  const [feedPagination, setFeedPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0
  });

  useEffect(() => {
    if (activeTab === 'my-posts') {
      fetchPosts();
    } else if (activeTab === 'feed') {
      fetchFeedPosts();
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllUserPosts();
      if (response.posts) {
        setPosts(response.posts);
      } else {
        setError(response.error || 'Failed to fetch posts');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedPosts = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await getFollowingPosts(page, 20);
      if (response.posts) {
        if (page === 1) {
          setFeedPosts(response.posts);
        } else {
          setFeedPosts(prev => [...prev, ...response.posts]);
        }
        setFeedPagination({
          page: response.page,
          totalPages: response.total_pages,
          totalCount: response.total_count
        });
      } else {
        setError(response.error || 'Failed to fetch feed posts');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFeedPosts = () => {
    if (feedPagination.page < feedPagination.totalPages) {
      fetchFeedPosts(feedPagination.page + 1);
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
      } else {
        setError(response.error || 'Failed to create post');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
      if (activeTab === 'my-posts') {
        setPosts(posts.filter(post => post.ID !== postId));
      } else {
        setFeedPosts(feedPosts.filter(post => post.ID !== postId));
      }
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await likePost(postId);
      if (response.post) {
        if (activeTab === 'my-posts') {
          setPosts(posts.map(post => 
            post.ID === postId ? { ...post, likes: response.post.likes } : post
          ));
        } else {
          setFeedPosts(feedPosts.map(post => 
            post.ID === postId ? { ...post, likes: response.post.likes } : post
          ));
        }
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

  const currentPosts = activeTab === 'my-posts' ? posts : feedPosts;
  const canDelete = activeTab === 'my-posts'; // Only allow deleting own posts

  if (loading && currentPosts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
            {activeTab === 'my-posts' && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {showCreateForm ? 'Cancel' : 'Create Post'}
              </button>
            )}
          </div>
          <p className="text-gray-600">
            {activeTab === 'my-posts' ? 'Share your thoughts and moments with the world' : 'See what your friends are sharing'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/50 rounded-xl p-1">
            {['my-posts', 'feed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white shadow-md text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'my-posts' ? 'My Posts' : 'Feed'}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Create Post Form */}
        {showCreateForm && activeTab === 'my-posts' && (
          <div className="mb-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                  Caption *
                </label>
                <textarea
                  id="caption"
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows="3"
                  placeholder="What's on your mind?"
                  required
                />
              </div>
              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (optional)
                </label>
                <input
                  id="image_url"
                  type="url"
                  value={newPost.image_url}
                  onChange={(e) => setNewPost({ ...newPost, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <button
                type="submit"
                disabled={creating || !newPost.caption.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Share Post'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Posts List */}
        {currentPosts.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {activeTab === 'my-posts' ? 'No posts yet' : 'No posts in your feed'}
            </h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'my-posts' 
                ? 'Share your first post to get started!' 
                : 'Follow some users to see their posts in your feed!'
              }
            </p>
            {activeTab === 'my-posts' ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Your First Post
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/friends'}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Find People to Follow
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {currentPosts.map((post) => (
              <div key={post.ID} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {post.user?.username ? post.user.username[0].toUpperCase() : 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{post.user?.username || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">{formatDate(post.CreatedAt)}</p>
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDeletePost(post.ID)}
                        className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-6 pb-4">
                  <p className="text-gray-900 text-lg leading-relaxed">{post.caption}</p>
                </div>

                {/* Post Image */}
                {post.image_url && (
                  <div className="px-6 pb-4">
                    <img
                      src={post.image_url}
                      alt="Post content"
                      className="w-full rounded-xl object-cover max-h-96"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="px-6 py-4 border-t border-gray-200/20">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleLikePost(post.ID)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="font-medium">{post.likes || 0} likes</span>
                    </button>
                    <span className="text-sm text-gray-500">
                      Post #{post.ID}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button for Feed */}
            {activeTab === 'feed' && feedPagination.page < feedPagination.totalPages && (
              <div className="text-center py-6">
                <button
                  onClick={loadMoreFeedPosts}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Posts'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Posts;