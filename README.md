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
   # Create an environment file in the server directory and the below env code.

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
- Cannot be removed from the project
- Can delete the project
- Can manage all members and roles

### Admin
- Project management (edit title, description, settings)
- Member management (invite, remove, change roles)
- Full task management
- Cannot remove the project owner

### Member
- Create, edit, and delete tasks
- Add comments and attachments
- View all project content
- Cannot manage the project or members

### Viewer
- Read-only access to the project
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
6. Update CORS settings for the production domain

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



**WorkNest** - Streamlining team collaboration through intuitive project management with enterprise-level features.
