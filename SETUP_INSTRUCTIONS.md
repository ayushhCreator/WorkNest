# WorkNest Setup Instructions

This guide provides step-by-step instructions for setting up all third-party services required for WorkNest to function properly.

## 📧 Email Service Setup (SMTP)

### Option 1: Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to "Security" → "2-Step Verification"
   - Follow the setup process to enable 2FA

2. **Generate App Password**
   - In Google Account settings, go to "Security"
   - Under "2-Step Verification", click "App passwords"
   - Select "Mail" as the app and "Other" as the device
   - Enter "WorkNest" as the device name
   - Copy the generated 16-character password

3. **Update Environment Variables**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   SMTP_FROM=WorkNest <noreply@worknest.com>
   ```

### Option 2: Outlook/Hotmail Setup

1. **Enable 2-Factor Authentication**
   - Go to Microsoft Account security settings
   - Enable two-step verification

2. **Generate App Password**
   - In security settings, create an app password
   - Use this password in your environment variables

3. **Update Environment Variables**
   ```env
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=your-email@outlook.com
   SMTP_PASS=your-app-password
   SMTP_FROM=WorkNest <noreply@worknest.com>
   ```

### Option 3: Custom SMTP Provider

For production environments, consider using dedicated email services:

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=WorkNest <noreply@yourdomain.com>
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM=WorkNest <noreply@yourdomain.com>
```

## ☁️ Cloudinary Setup (File Storage)

### Step 1: Create Cloudinary Account

1. **Sign Up**
   - Go to [Cloudinary](https://cloudinary.com)
   - Click "Sign Up for Free"
   - Fill in your details and verify your email

2. **Access Dashboard**
   - After verification, log in to your Cloudinary console
   - You'll see your dashboard with account details

### Step 2: Get API Credentials

1. **Find Your Credentials**
   - On the dashboard, you'll see:
     - **Cloud Name**: Your unique cloud identifier
     - **API Key**: Your public API key
     - **API Secret**: Your private API secret (click "Reveal" to see it)

2. **Copy Credentials**
   - Cloud Name: `your-cloud-name`
   - API Key: `123456789012345`
   - API Secret: `your-secret-key-here`

### Step 3: Configure Environment Variables

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-secret-key-here
```

### Step 4: Test Configuration

1. **Start your server**
   ```bash
   cd server
   npm run dev
   ```

2. **Test file upload**
   - Create a project and task
   - Try uploading a file to verify Cloudinary integration

### Cloudinary Settings (Optional)

1. **Configure Upload Presets**
   - Go to Settings → Upload
   - Create upload presets for different file types
   - Set folder organization: `worknest-attachments/`

2. **Set Security Options**
   - Enable secure URLs for production
   - Configure allowed file formats
   - Set maximum file size limits

## 🗄️ Database Setup Options

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Verify your email address

2. **Create Cluster**
   - Click "Create a New Cluster"
   - Choose "Shared" (free tier)
   - Select your preferred cloud provider and region
   - Click "Create Cluster" (takes 1-3 minutes)

3. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username and password
   - Set role to "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP addresses

5. **Get Connection String**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `worknest`

6. **Update Environment Variables**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/worknest?retryWrites=true&w=majority
   ```

### Option 2: Local MongoDB Installation

#### Windows:
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. MongoDB will start automatically as a Windows service
4. Use connection string: `mongodb://localhost:27017/worknest`

#### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### Linux (Ubuntu):
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 3: Docker MongoDB

```bash
# Run MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Connection string for Docker
MONGODB_URI=mongodb://admin:password@localhost:27017/worknest?authSource=admin
```

## 🔧 Environment Variables Complete Setup

Create a `.env` file in the `server` directory with all required variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/worknest?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Client Configuration
CLIENT_URL=http://localhost:5173

# Email Configuration (Choose one option)
# Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=WorkNest <noreply@worknest.com>

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🚀 Production Environment Setup

### Environment Variables for Production

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database (Use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://prod-user:secure-password@production-cluster.mongodb.net/worknest?retryWrites=true&w=majority

# JWT Secret (Generate a strong secret)
JWT_SECRET=your-production-jwt-secret-should-be-very-long-and-random

# Client URL (Your production domain)
CLIENT_URL=https://your-domain.com

# Email Configuration (Use dedicated service for production)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=WorkNest <noreply@your-domain.com>

# Cloudinary Configuration (Same as development)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🔍 Testing Your Setup

### 1. Test Database Connection
```bash
cd server
npm run dev
```
Look for: `MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net`

### 2. Test Email Service
- Create a user account
- Invite a team member
- Check if invitation email is sent

### 3. Test File Upload
- Create a project and task
- Upload a file attachment
- Verify file appears in Cloudinary dashboard

### 4. Test Real-time Features
- Open the app in two browser windows
- Make changes in one window
- Verify updates appear in the other window

## ❗ Common Issues and Solutions

### Email Issues
- **Gmail "Less secure app access"**: Use App Passwords instead
- **SMTP timeout**: Check firewall settings for port 587
- **Authentication failed**: Verify username/password combination

### Cloudinary Issues
- **Upload failed**: Check API credentials
- **File not found**: Verify cloud name is correct
- **Size limit exceeded**: Check Cloudinary account limits

### Database Issues
- **Connection refused**: Ensure MongoDB is running
- **Authentication failed**: Check username/password
- **Network timeout**: Verify IP whitelist in Atlas

### General Issues
- **Environment variables not loaded**: Ensure `.env` file is in `server` directory
- **CORS errors**: Check `CLIENT_URL` matches your frontend URL
- **Port conflicts**: Change `PORT` in `.env` if 5000 is occupied

## 📞 Support Resources

- **MongoDB Atlas**: [Documentation](https://docs.atlas.mongodb.com/)
- **Cloudinary**: [Documentation](https://cloudinary.com/documentation)
- **Nodemailer**: [Documentation](https://nodemailer.com/about/)
- **Gmail SMTP**: [Google Support](https://support.google.com/mail/answer/7126229)

## 🔐 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Enable 2FA** on all third-party services
4. **Use dedicated email services** for production
5. **Regularly rotate API keys** and passwords
6. **Monitor usage** on Cloudinary and email services
7. **Set up IP restrictions** where possible
8. **Use environment-specific configurations**

---

Following these instructions will ensure your WorkNest application is properly configured with all necessary third-party services for full functionality.