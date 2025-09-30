import React, { useState, useEffect, useRef } from 'react';
import { getFollowing, getConversation, sendMessage } from '../utils/api';
import useWebSocket from '../hooks/useWebSocket';

const Messages = () => {
  console.log('Messages component rendering...');
  
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const currentUser = (() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('Current user from localStorage:', user);
        return user;
      }
      // If no user data, try to get from token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Current user from token:', payload);
          return { id: payload.user_id, username: payload.username };
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }
      return { id: null, username: 'Unknown' };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return { id: null, username: 'Unknown' };
    }
  })();

  console.log('Current user:', currentUser);
  console.log('Loading state:', loading);

  // WebSocket connection for real-time messages
  const handleWebSocketMessage = (data) => {
    console.log('WebSocket message received:', data);
    if (data.type === 'new_message' && data.message) {
      const message = data.message;
      // Only add message if it's part of the current conversation
      if (selectedFriend && 
          ((message.sender_id == currentUser.id && message.receiver_id == (selectedFriend.ID || selectedFriend.id)) ||
           (message.sender_id == (selectedFriend.ID || selectedFriend.id) && message.receiver_id == currentUser.id))) {
        setMessages(prev => [...prev, message]);
      }
    }
  };

  const { sendMessage: sendWebSocketMessage } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      const friendId = selectedFriend.ID || selectedFriend.id;
      fetchConversation(friendId);
    }
  }, [selectedFriend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFriends = async () => {
    try {
      console.log('Fetching friends...');
      setLoading(true);
      setError('');
      const response = await getFollowing();
      console.log('Friends response:', response);
      if (response.following) {
        // Transform the response to extract the actual user objects
        const friendUsers = response.following.map(item => {
          // The response has structure: { ID: ..., following: { user_data } }
          return item.following || item.Following || item;
        });
        setFriends(friendUsers);
        console.log('Friends set:', friendUsers);
      } else {
        console.log('No friends found or error:', response.error);
        setFriends([]); // Set empty array instead of error
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
      setFriends([]); // Set empty array instead of error
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (friendId) => {
    try {
      setError('');
      const actualId = friendId?.ID || friendId?.id || friendId;
      console.log('Fetching conversation for friend ID:', actualId);
      const response = await getConversation(actualId);
      if (response.messages) {
        setMessages(response.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || sendingMessage) return;

    try {
      setSendingMessage(true);
      const friendId = selectedFriend.ID || selectedFriend.id;
      const response = await sendMessage(friendId, newMessage.trim());
      if (response.message) {
        setMessages([...messages, response.message]);
        setNewMessage('');
      } else {
        setError(response.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  console.log('About to render, loading:', loading, 'friends:', friends.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Chat with your friends</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden" style={{ height: '70vh' }}>
          <div className="flex h-full">
            {/* Friends List Sidebar */}
            <div className="w-1/3 border-r border-gray-200/20 flex flex-col">
              {/* Friends Header */}
              <div className="p-4 border-b border-gray-200/20 bg-gradient-to-r from-blue-50 to-purple-50">
                <h2 className="text-lg font-semibold text-gray-900">Friends</h2>
                <p className="text-sm text-gray-600">{friends.length} friends</p>
              </div>

              {/* Friends List */}
              <div className="flex-1 overflow-y-auto">
                {friends.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
                    <p className="text-gray-500 mb-4">Follow some users to start messaging!</p>
                    <button
                      onClick={() => window.location.href = '/friends'}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                      Find Friends
                    </button>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {friends.map((friend, index) => {
                      console.log('Friend object:', friend); // Debug log
                      const friendName = friend?.username || friend?.name || 'Unknown User';
                      const friendId = friend?.ID || friend?.id || index;
                      return (
                        <button
                          key={friendId}
                          onClick={() => setSelectedFriend(friend)}
                          className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-left ${
                            selectedFriend?.ID === friend.ID || selectedFriend?.id === friend.id
                              ? 'bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-lg">
                              {friendName[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{friendName}</p>
                            <p className="text-sm text-gray-500 truncate">Click to start chatting</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedFriend ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200/20 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {(selectedFriend?.username || selectedFriend?.name || 'U')[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedFriend?.username || selectedFriend?.name || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-500">Active now</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        // Handle different ID types (number vs string)
                        const isOwnMessage = message.sender_id == currentUser.id || message.sender_id === currentUser.id;
                        console.log('Message check:', {
                          messageId: message.ID,
                          senderId: message.sender_id,
                          currentUserId: currentUser.id,
                          isOwnMessage: isOwnMessage
                        });
                        return (
                          <div
                            key={message.ID}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                isOwnMessage
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwnMessage ? 'text-green-100' : 'text-gray-500'
                                }`}
                              >
                                {formatMessageTime(message.CreatedAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200/20">
                    <form onSubmit={handleSendMessage} className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        disabled={sendingMessage}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                /* No Friend Selected */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Select a friend to start messaging</h3>
                    <p className="text-gray-500">Choose a friend from the sidebar to begin your conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;