const API_BASE_URL = 'http://localhost:8080';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make authenticated requests
const authenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
};

// Auth functions
export const register = async (username, email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return response.json();
};

export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
};

// Posts functions
export const getAllUserPosts = async () => {
  const response = await authenticatedRequest('/posts');
  return response.json();
};

export const getPost = async (id) => {
  const response = await authenticatedRequest(`/posts/${id}`);
  return response.json();
};

export const createPost = async (caption, imageURL) => {
  const response = await authenticatedRequest('/posts', {
    method: 'POST',
    body: JSON.stringify({ caption, image_url: imageURL }),
  });
  return response.json();
};

export const updatePost = async (id, caption, imageURL) => {
  const response = await authenticatedRequest(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ caption, image_url: imageURL }),
  });
  return response.json();
};

export const deletePost = async (id) => {
  const response = await authenticatedRequest(`/posts/${id}`, {
    method: 'DELETE',
  });
  return response.json();
};

export const likePost = async (id) => {
  const response = await authenticatedRequest(`/posts/${id}/like`, {
    method: 'POST',
  });
  return response.json();
};

export const getFollowingPosts = async (page = 1, limit = 20) => {
  const response = await authenticatedRequest(`/feed?page=${page}&limit=${limit}`);
  return response.json();
};

// Message functions
export const sendMessage = async (receiverID, content) => {
  const response = await authenticatedRequest('/messages', {
    method: 'POST',
    body: JSON.stringify({ receiver_id: receiverID, content }),
  });
  return response.json();
};

export const getConversation = async (userID) => {
  const response = await authenticatedRequest(`/messages/conversation?user_id=${userID}`);
  return response.json();
};

// WebSocket connection helper
export const getWebSocketURL = () => {
  const token = getAuthToken();
  return `ws://localhost:8080/ws/connect?token=${token}`;
};

// Friends functions
export const followUser = async (userID) => {
  const response = await authenticatedRequest('/friends/follow', {
    method: 'POST',
    body: JSON.stringify({ user_id: userID }),
  });
  return response.json();
};

export const unfollowUser = async (userID) => {
  const response = await authenticatedRequest(`/friends/unfollow/${userID}`, {
    method: 'DELETE',
  });
  return response.json();
};

export const getFollowers = async () => {
  const response = await authenticatedRequest('/friends/followers');
  return response.json();
};

export const getFollowing = async () => {
  const response = await authenticatedRequest('/friends/following');
  return response.json();
};

export const searchUsers = async (query) => {
  const response = await authenticatedRequest(`/friends/search?q=${encodeURIComponent(query)}`);
  return response.json();
};

export const checkFollowStatus = async (userID) => {
  const response = await authenticatedRequest(`/friends/status/${userID}`);
  return response.json();
};

export const getAllUsers = async (page = 1, limit = 50) => {
  const response = await authenticatedRequest(`/friends/users?page=${page}&limit=${limit}`);
  return response.json();
};
