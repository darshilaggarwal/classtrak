# ClassTrack - Attendance Management System

A comprehensive attendance management system for educational institutions with admin, teacher, and student portals.

## 🚀 Deployment on Render

### Prerequisites
1. MongoDB Atlas account (for database)
2. Gmail account (for email OTP)
3. Render account

### Step 1: Set up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier)
3. Create a database user
4. Get your connection string
5. Add your IP to the whitelist (or use 0.0.0.0/0 for all IPs)

### Step 2: Set up Gmail for OTP
1. Enable 2-factor authentication on your Gmail
2. Generate an App Password
3. Note down the email and app password

### Step 3: Deploy Backend on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `classtrack-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong random string
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: Your Gmail app password
   - `FRONTEND_URL`: `https://your-frontend-url.onrender.com` (update after frontend deployment)

### Step 4: Deploy Frontend on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `classtrack-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Free

5. Add Environment Variables:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com`

### Step 5: Update URLs
1. Update the frontend's `VITE_API_URL` to point to your backend URL
2. Update the backend's `FRONTEND_URL` to point to your frontend URL
3. Redeploy both services

## 🔧 Local Development

### Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
FRONTEND_URL=https://your-frontend-url.onrender.com
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

## 🎯 Features

- **Admin Portal**: Manage teachers, students, timetables, and attendance
- **Teacher Portal**: Mark attendance, view class history
- **OTP Authentication**: Secure login for admins and teachers
- **Timetable Management**: Import and manage weekly schedules
- **Attendance Tracking**: Real-time attendance marking and reporting

## 🔐 Admin Access

After deployment, you can create admin accounts using the provided sample data or by directly adding them to the database.

## 📞 Support

For deployment issues, check:
1. Environment variables are correctly set
2. MongoDB connection is working
3. Email configuration is correct
4. CORS settings match your frontend URL
