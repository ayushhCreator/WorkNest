# WorkNest - Real-time Kanban Project Management Tool

A comprehensive full-stack project management application built with the MERN stack, featuring real-time collaboration, Kanban boards, team management capabilities, and enterprise-level features for modern teams.

## 🚀 Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **Project Management**: Create, edit, and manage projects with team collaboration
- **Real-time Kanban Board**: Drag-and-drop task management with live updates
- **Task Management**: Assign tasks, set due dates, priorities, and add comments
- **Real-time Updates**: Socket.io integration for instant updates across all connected users
- **Dashboard Analytics**: Visual charts and statistics for project insights
- **Profile Management**: User profile customization and settings
- **Responsive Design**: Mobile-friendly interface with modern UI/UX

### Advanced Features
- **🎯 Invitation System**: Email-based team invitations with secure tokens
- **👥 Role-Based Permissions**: Owner/Admin/Member/Viewer roles with granular access control
- **🔔 Real-time Notifications**: In-app notifications for task assignments, comments, and updates
- **📎 File Attachments**: Upload and manage files on tasks with cloud storage
- **📊 Activity Logs**: Comprehensive project activity tracking and feeds
- **🔍 Advanced Search & Filters**: Full-text search with multi-criteria filtering
- **⏰ Due Dates & Reminders**: Automated email reminders and overdue notifications
- **📈 Analytics Dashboard**: Detailed project analytics with performance metrics

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Beautiful DnD** for drag-and-drop functionality
- **Chart.js** for analytics visualization
- **Socket.io Client** for real-time updates
- **Axios** for API communication
- **React Router** for navigation
- **React Dropzone** for file uploads

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Nodemailer** for email notifications
- **Cloudinary** for file storage
- **Node-cron** for scheduled tasks
- **Multer** for file upload handling

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (see Database Setup section below)
- npm or yarn
- Cloudinary account (for file uploads)
- SMTP email service (for notifications)

### Database Setup

**Important**: This application requires a MongoDB database. You have several options:

#### Option 1: MongoDB Atlas (Recommended for Development)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier available)
3. Create a database user with read/write permissions
4. Get your connection string from the "Connect" button
5. Replace the `MONGODB_URI` in your `.env` file with your Atlas connection string

#### Option 2: Local MongoDB Installation
1. Download and install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   - **Windows**: MongoDB should start automatically as a service
   - **macOS**: Run `brew services start mongodb/brew/mongodb-community` (if installed via Homebrew)
   - **Linux**: Run `sudo systemctl start mongod`
3. Verify MongoDB is running by connecting to `mongodb://localhost:27017`

#### Option 3: Docker MongoDB
```bash
# Run MongoDB in a Docker container
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd worknest
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Create environment file in server directory
   cp server/.env.example server/.env
   ```
   
   Edit `server/.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   # For MongoDB Atlas (replace with your connection string):
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/worknest?retryWrites=true&w=majority
   # For local MongoDB:
   # MONGODB_URI=mongodb://localhost:27017/worknest
   
   # JWT Secret Key
   JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
   
   # Client URL
   CLIENT_URL=http://localhost:5173
   
   # Email Configuration (for invitations and reminders)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=WorkNest <noreply@worknest.com>
   
   # Cloudinary Configuration (for file uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Third-Party Service Setup**

   **Email Service (Required for invitations):**
   - For Gmail: Enable 2FA and create an App Password
   - For other providers: Configure SMTP settings accordingly
   
   **Cloudinary (Required for file uploads):**
   - Create account at [Cloudinary](https://cloudinary.com)
   - Get your cloud name, API key, and API secret from dashboard
   - Add credentials to `.env` file

5. **Start MongoDB** (if using local installation)
   ```bash
   # Check if MongoDB is running:
   mongosh --eval "db.adminCommand('ismaster')"
   ```

6. **Start the development servers**
   ```bash
   # Start the backend server (from server directory)
   cd server
   npm run dev
   
   # Start the frontend server (from root directory)
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🔧 Troubleshooting

### MongoDB Connection Issues

If you encounter `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`:

1. **Verify MongoDB is running**:
   ```bash
   # Check if MongoDB process is running
   ps aux | grep mongod
   
   # Or try connecting directly
   mongosh
   ```

2. **Start MongoDB service**:
   - **Windows**: Check Windows Services for MongoDB
   - **macOS**: `brew services start mongodb/brew/mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

3. **Check MongoDB logs**:
   - **Windows**: Check Event Viewer or MongoDB log files
   - **macOS/Linux**: `tail -f /var/log/mongodb/mongod.log`

4. **Alternative**: Use MongoDB Atlas for cloud-hosted database (recommended for development)

### Email Configuration Issues
- Ensure SMTP credentials are correct
- For Gmail, use App Passwords instead of regular password
- Check firewall settings for SMTP ports

### File Upload Issues
- Verify Cloudinary credentials
- Check file size limits (default: 10MB)
- Ensure proper file types are being uploaded

### Common Solutions
- Ensure your `.env` file has the correct `MONGODB_URI`
- Check firewall settings if using remote MongoDB
- Verify MongoDB is listening on the correct port (default: 27017)
- For Atlas: Ensure your IP address is whitelisted in Network Access

## 🏗️ Project Structure

```
worknest/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── AttachmentList.tsx
│   │   │   ├── CreateProjectModal.tsx
│   │   │   ├── CreateTaskModal.tsx
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── InviteMemberModal.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── NotificationDropdown.tsx
│   │   │   ├── ProjectAnalytics.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskDetailModal.tsx
│   │   │   └── TaskFilters.tsx
│   │   ├── context/        # React context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── pages/          # Page components
│   │   │   ├── AcceptInvite.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── ProjectBoard.tsx
│   │   │   └── Register.tsx
│   │   ├── utils/          # Utility functions
│   │   │   └── axios.ts
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Express backend
│   ├── config/             # Configuration files
│   │   ├── cloudinary.js   # File upload configuration
│   │   ├── db.js          # Database configuration
│   │   └── email.js       # Email service configuration
│   ├── jobs/              # Scheduled jobs
│   │   └── reminderJob.js # Due date reminder cron job
│   ├── middleware/        # Express middleware
│   │   └── auth.js        # Authentication middleware
│   ├── models/            # Mongoose models
│   │   ├── ActivityLog.js # Activity logging model
│   │   ├── Invitation.js  # Team invitation model
│   │   ├── Notification.js # Notification model
│   │   ├── Project.js     # Project model
│   │   ├── Task.js        # Task model
│   │   └── User.js        # User model
│   ├── routes/            # API routes
│   │   ├── analytics.js   # Analytics endpoints
│   │   ├── auth.js        # Authentication routes
│   │   ├── invitations.js # Invitation management
│   │   ├── notifications.js # Notification routes
│   │   ├── projects.js    # Project management
│   │   ├── tasks.js       # Task management
│   │   └── users.js       # User management
│   ├── utils/             # Utility functions
│   │   ├── activityLogger.js # Activity logging utilities
│   │   └── notifications.js  # Notification utilities
│   ├── server.js          # Server entry point
│   └── package.json
└── README.md
```

## 📊 Database Schema

### Users Collection
- name, email, password (hashed)
- role (admin/member)
- projects array
- emailNotifications preference
- lastActive timestamp
- timestamps

### Projects Collection
- title, description, color
- owner reference
- members array with roles (owner/admin/member/viewer)
- columns for Kanban board
- settings (notifications, file uploads, etc.)
- status (active/archived/completed)
- timestamps

### Tasks Collection
- title, description, project reference
- assignee reference, status, priority
- due date, estimated/actual hours
- comments array, attachments array
- column ID for positioning
- tags, completion tracking
- reminder sent flag
- timestamps

### Invitations Collection
- email, project reference, invited by
- role, secure token
- status (pending/accepted/expired)
- expiration date
- timestamps

### Notifications Collection
- recipient, sender references
- type, title, message
- read status, data payload
- timestamps

### Activity Logs Collection
- project, user references
- action type, description
- metadata (task details, etc.)
- timestamps

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `PUT /api/projects/:id/members/:userId/role` - Update member role
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/tasks/project/:projectId` - Get project tasks (with filters)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment to task
- `POST /api/tasks/:id/attachments` - Upload file attachment
- `DELETE /api/tasks/:id/attachments/:attachmentId` - Delete attachment

### Invitations
- `POST /api/invitations` - Send team invitation
- `GET /api/invitations/:token` - Get invitation details
- `POST /api/invitations/:token/accept` - Accept invitation
- `GET /api/invitations/project/:projectId` - Get project invitations

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Analytics
- `GET /api/analytics/project/:projectId` - Get project analytics
- `GET /api/analytics/user` - Get user analytics

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users by email

## 🔄 Real-time Features

The application uses Socket.io for real-time collaboration:

- **Live Task Updates**: Changes to tasks are instantly reflected for all project members
- **Real-time Comments**: Comments appear immediately without page refresh
- **Drag-and-Drop Sync**: Kanban board changes are synchronized across all connected users
- **Live Notifications**: Instant in-app notifications for team activities
- **Connection Status**: Visual indicator of real-time connection status
- **Activity Feeds**: Real-time project activity updates

## 🎯 Role-Based Permissions

### Owner
- Full project control
- Cannot be removed from project
- Can delete project
- Can manage all members and roles

### Admin
- Project management (edit title, description, settings)
- Member management (invite, remove, change roles)
- Full task management
- Cannot remove project owner

### Member
- Create, edit, and delete tasks
- Add comments and attachments
- View all project content
- Cannot manage project or members

### Viewer
- Read-only access to project
- Can view tasks and comments
- Cannot create or edit content
- Cannot access project settings

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Configure environment variables for production
3. Set up email service (SMTP) for notifications
4. Configure Cloudinary for file storage
5. Deploy to platforms like Heroku, Railway, or DigitalOcean
6. Update CORS settings for production domain

### Frontend Deployment
1. Update API URLs in environment variables
2. Build the production version: `npm run build`
3. Deploy to platforms like Netlify, Vercel, or AWS S3
4. Configure build settings and environment variables

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Provide steps to reproduce any bugs

## 🔮 Future Enhancements

- **Time Tracking**: Built-in time tracking for tasks
- **Advanced Reporting**: Custom report generation
- **Mobile App**: React Native mobile application
- **Integration APIs**: Third-party tool integrations (Slack, GitHub, etc.)
- **Advanced Permissions**: Custom role creation
- **Task Templates**: Reusable task templates
- **Automation**: Workflow automation and triggers
- **Multi-language Support**: Internationalization
- **Dark Mode**: Theme customization
- **Advanced Analytics**: Machine learning insights

---

**WorkNest** - Streamlining team collaboration through intuitive project management with enterprise-level features.