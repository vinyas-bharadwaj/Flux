import React, { useState, useEffect } from 'react';
import { 
  getAllUsers,
  searchUsers, 
  followUser, 
  unfollowUser, 
  getFollowers, 
  getFollowing,
  checkFollowStatus 
} from '../utils/api';

const Friends = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0
  });

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchAllUsers();
    } else if (activeTab === 'followers') {
      fetchFollowers();
    } else if (activeTab === 'following') {
      fetchFollowing();
    }
  }, [activeTab]);

  const fetchAllUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getAllUsers(page, 20);
      if (response.users) {
        if (page === 1) {
          setAllUsers(response.users);
        } else {
          setAllUsers(prev => [...prev, ...response.users]);
        }
        setPagination({
          page: response.page,
          totalPages: response.total_pages,
          totalCount: response.total_count
        });
      } else {
        setError(response.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreUsers = () => {
    if (pagination.page < pagination.totalPages) {
      fetchAllUsers(pagination.page + 1);
    }
  };

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const response = await getFollowers();
      if (response.followers) {
        setFollowers(response.followers);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch followers');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const response = await getFollowing();
      if (response.following) {
        setFollowing(response.following);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch following');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError('');
      const response = await searchUsers(searchQuery);
      if (response.users) {
        setSearchResults(response.users);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userID) => {
    try {
      await followUser(userID);
      // Update all users list
      setAllUsers(allUsers.map(user => 
        user.ID === userID ? { ...user, is_following: true } : user
      ));
      // Update search results if any
      setSearchResults(searchResults.map(user => 
        user.ID === userID ? { ...user, is_following: true } : user
      ));
      // Refresh following list if on that tab
      if (activeTab === 'following') {
        fetchFollowing();
      }
    } catch (err) {
      setError('Failed to follow user');
    }
  };

  const handleUnfollow = async (userID) => {
    try {
      await unfollowUser(userID);
      // Update all users list
      setAllUsers(allUsers.map(user => 
        user.ID === userID ? { ...user, is_following: false } : user
      ));
      // Update search results if any
      setSearchResults(searchResults.map(user => 
        user.ID === userID ? { ...user, is_following: false } : user
      ));
      // Refresh following list if on that tab
      if (activeTab === 'following') {
        fetchFollowing();
      }
    } catch (err) {
      setError('Failed to unfollow user');
    }
  };

  const UserCard = ({ user, showFollowButton = true, isFollowing = false }) => (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user.username ? user.username[0].toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user.username}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span>{user.followers_count || 0} followers</span>
              <span>{user.following_count || 0} following</span>
            </div>
          </div>
        </div>
        {showFollowButton && (
          <button
            onClick={() => isFollowing ? handleUnfollow(user.ID) : handleFollow(user.ID)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isFollowing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );

  const FollowerCard = ({ friendship }) => (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {friendship.follower?.username ? friendship.follower.username[0].toUpperCase() : 'U'}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{friendship.follower?.username}</h3>
          <p className="text-sm text-gray-600">{friendship.follower?.email}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
            <span>{friendship.follower?.followers_count || 0} followers</span>
            <span>{friendship.follower?.following_count || 0} following</span>
          </div>
        </div>
      </div>
    </div>
  );

  const FollowingCard = ({ friendship }) => (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {friendship.following?.username ? friendship.following.username[0].toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{friendship.following?.username}</h3>
            <p className="text-sm text-gray-600">{friendship.following?.email}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span>{friendship.following?.followers_count || 0} followers</span>
              <span>{friendship.following?.following_count || 0} following</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => handleUnfollow(friendship.following?.ID)}
          className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-medium transition-all duration-200"
        >
          Unfollow
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Friends & Connections</h1>
          <p className="text-gray-600">Discover and connect with other users on Flux</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/50 rounded-xl p-1">
            {['discover', 'followers', 'following'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white shadow-md text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'discover' ? 'Discover People' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            {/* Search Form */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6">
              <form onSubmit={handleSearch} className="flex space-x-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for specific users by username..."
                  className="flex-1 px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>

            {/* All Users Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {searchResults.length > 0 ? 'Search Results' : 'All Users'}
                </h2>
                {searchResults.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear Search
                  </button>
                )}
              </div>

              {loading && allUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              ) : (
                <>
                  {/* Display search results or all users */}
                  {(searchResults.length > 0 ? searchResults : allUsers).map((user) => (
                    <UserCard
                      key={user.ID}
                      user={user}
                      isFollowing={user.is_following}
                    />
                  ))}

                  {/* Load More Button */}
                  {searchResults.length === 0 && pagination.page < pagination.totalPages && (
                    <div className="text-center py-6">
                      <button
                        onClick={loadMoreUsers}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                      >
                        {loading ? 'Loading...' : 'Load More Users'}
                      </button>
                    </div>
                  )}

                  {/* Empty state for no users */}
                  {allUsers.length === 0 && searchResults.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                      <p className="text-gray-500">Be the first to join Flux!</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Followers Tab */}
        {activeTab === 'followers' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Followers</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading followers...</p>
              </div>
            ) : followers.length > 0 ? (
              <div className="space-y-4">
                {followers.map((friendship) => (
                  <FollowerCard key={friendship.ID} friendship={friendship} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No followers yet</h3>
                <p className="text-gray-500">Share your profile to gain followers!</p>
              </div>
            )}
          </div>
        )}

        {/* Following Tab */}
        {activeTab === 'following' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Following</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading following...</p>
              </div>
            ) : following.length > 0 ? (
              <div className="space-y-4">
                {following.map((friendship) => (
                  <FollowingCard key={friendship.ID} friendship={friendship} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Not following anyone yet</h3>
                <p className="text-gray-500 mb-4">Discover people to start following them!</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Discover People
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;