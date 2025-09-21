# 🌊 Flux - Social Media Platform

A modern, full-stack social media platform built with Go, React, and real-time messaging capabilities.

![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication system
- Secure user registration and login
- Protected routes and middleware
- Session management

### 📝 Posts Management
- Create, read, update, and delete posts
- Image upload integration with Cloudinary CDN
- Automatic image optimization and format conversion
- User-specific post ownership and permissions

### 💬 Real-time Messaging
- WebSocket-based real-time chat
- Direct messaging between users
- Message persistence with database storage
- Online user presence tracking

### 🖼️ Media Handling
- Cloudinary integration for image uploads
- Automatic image optimization (WebP conversion)
- CDN delivery for global performance
- File validation and security checks

## 🏗️ Architecture

### Backend (Go)
```
server/
├── cmd/
│   └── main.go                 # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/           # HTTP request handlers
│   │   │   ├── auth.go         # Authentication endpoints
│   │   │   ├── posts.go        # Posts CRUD operations
│   │   │   ├── message.go      # Messaging endpoints
│   │   │   └── websocket.go    # WebSocket connection handler
│   │   ├── middleware/         # HTTP middleware
│   │   │   └── auth.go         # JWT authentication middleware
│   │   └── routes/             # Route definitions
│   │       └── routes.go       # API route setup
│   ├── chat/
│   │   └── hub.go             # WebSocket hub for real-time messaging
│   ├── cloudinary/
│   │   └── config.go          # Cloudinary integration
│   └── models/
│       ├── user.go            # User data model
│       ├── posts.go           # Post data model
│       └── message.go         # Message data model
├── .env                       # Environment variables
├── go.mod                     # Go dependencies
└── go.sum                     # Dependency checksums
```

### Frontend (React) - *Coming Soon*
- Modern React application with TypeScript
- Real-time chat interface
- Image upload with drag & drop
- Responsive design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Go 1.19 or higher
- PostgreSQL database
- Cloudinary account (for image uploads)
- Node.js 16+ (for frontend development)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flux.git
   cd flux/server
   ```

2. **Install dependencies**
   ```bash
   go mod tidy
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up your `.env` file**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=flux_db

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Server Configuration
   PORT=8080
   ```

5. **Run the server**
   ```bash
   go run cmd/main.go
   ```

The server will start on `http://localhost:8080`

### Frontend Setup *(Coming Soon)*
```bash
cd frontend
npm install
npm start
```

## 📚 API Documentation

### Authentication Endpoints
```http
POST /auth/register    # User registration
POST /auth/login       # User login
```

### Posts Endpoints
```http
GET    /posts          # Get all user posts
GET    /posts/:id      # Get specific post
POST   /posts          # Create new post
PUT    /posts/:id      # Update post
DELETE /posts/:id      # Delete post
POST   /posts/:id/like # Like post
```

### Messaging Endpoints
```http
POST /messages                           # Send message
GET  /messages/conversation?user_id=123  # Get conversation
```

### WebSocket
```http
GET /ws/connect        # WebSocket connection (authenticated)
```

### Example API Usage

**Create a Post**
```bash
curl -X POST http://localhost:8080/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "caption=Hello World!" \
  -F "image=@/path/to/image.jpg"
```

**Send a Message**
```bash
curl -X POST http://localhost:8080/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiver_id": 2, "content": "Hello there!"}'
```

## 🔧 Technology Stack

### Backend
- **Go** - High-performance backend language
- **Gin** - HTTP web framework
- **GORM** - ORM for database operations
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **WebSocket** - Real-time communication
- **Cloudinary** - Image storage and optimization

### Frontend *(Planned)*
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - WebSocket client
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Input Validation** - Comprehensive input sanitization
- **CORS Protection** - Cross-origin request security
- **File Upload Security** - Content type validation and size limits
- **SQL Injection Prevention** - GORM ORM with prepared statements
- **Authorization Middleware** - Route-level access control

## 🌟 Key Features in Detail

### Real-time Messaging
- WebSocket-based chat system
- Message persistence in PostgreSQL
- User presence tracking
- Direct messaging between users

### Image Upload & Processing
- Cloudinary CDN integration
- Automatic WebP conversion for modern browsers
- Image optimization and compression
- Global content delivery network

### Social Media Features
- User posts with images and captions
- Like functionality
- User profiles and authentication
- Feed management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Vinyas Bharadwaj**
- GitHub: [vinyas-bharadwaj](https://github.com/vinyas-bharadwaj)
- LinkedIn: [vinyas-bharadwaj](https://www.linkedin.com/in/vinyas-bharadwaj-443982293/)

## 🙏 Acknowledgments

- [Gin Web Framework](https://gin-gonic.com/) for the excellent Go HTTP framework
- [GORM](https://gorm.io/) for the powerful ORM
- [Cloudinary](https://cloudinary.com/) for image management services
- [React](https://reactjs.org/) for the upcoming frontend framework

---

⭐ **Star this repository** if you find it helpful!