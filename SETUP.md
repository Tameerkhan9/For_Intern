# Intern Portal MERN + Python Setup Guide

## Project Overview

Your intern job portal is now set up as a complete **MERN + Python** stack:

- **Frontend**: React 18 with Tailwind CSS
- **Backend**: Node.js/Express with MongoDB
- **Python Service**: Flask for CV parsing & analysis
- **Database**: MongoDB (local or Atlas)
- **Authentication**: JWT-based

## Quick Start - 3 Options

### Option 1: Using Docker (Recommended)

The easiest way to get everything running with one command:

```bash
cd e:\Intern_MERN
docker-compose up
```

This starts:
- MongoDB on `localhost:27017`
- Backend API on `localhost:5000`
- Python Service on `localhost:5001`
- Frontend on `localhost:3000`

### Option 2: Manual Setup (Recommended for Development)

#### Step 1: Install Prerequisites
- Node.js v16+ (https://nodejs.org)
- Python 3.9+ (https://www.python.org)
- MongoDB (local or MongoDB Atlas cloud)

#### Step 2: Backend Setup

```bash
cd server
npm install

# Create .env file
copy .env.example .env

# Edit .env with your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/intern_portal
# or MongoDB Atlas: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/intern_portal

npm run dev
# Backend runs on http://localhost:5000
```

#### Step 3: Frontend Setup

```bash
cd client
npm install

# Create .env file
copy .env.example .env

npm start
# Frontend runs on http://localhost:3000
```

#### Step 4: Python Service Setup

```bash
cd python-service

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Create .env file
copy .env.example .env

# Install dependencies
pip install -r requirements.txt

# Download spaCy model (one-time)
python -m spacy download en_core_web_sm

python app.py
# Python service runs on http://localhost:5001
```

### Option 3: Step-by-Step in Separate Terminals

Open 3-4 terminal windows and run each service separately:

**Terminal 1 - Backend**:
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd client
npm install
npm start
```

**Terminal 3 - Python**:
```bash
cd python-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Terminal 4 - MongoDB** (if using local):
```bash
mongod
```

## Configuration

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/intern_portal
JWT_KEY=your_jwt_key_change_this_in_production
JWT_EXPIRE=7d
PYTHON_SERVICE_URL=http://localhost:5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
SESSION_KEY=replace_with_long_random_session_key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Python Service (.env)
```
FLASK_ENV=development
FLASK_PORT=5001
```

## Project Structure

```
Intern_MERN/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components (Navbar)
│   │   ├── pages/          # Page components (Landing, Jobs, etc.)
│   │   ├── context/        # React Context (Auth)
│   │   ├── hooks/          # Custom hooks (useAuth)
│   │   ├── services/       # API client
│   │   ├── App.js          # Main app
│   │   └── index.js        # Entry point
│   └── package.json
│
├── server/                 # Node.js/Express Backend
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── uploads/            # CV uploads directory
│   ├── server.js           # Main server file
│   └── package.json
│
├── python-service/         # Flask CV Parser
│   ├── app.py              # Main Flask app
│   └── requirements.txt
│
├── docker-compose.yml      # Docker Compose config
└── README.md               # Project documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register (name, email, password, role)
- `POST /api/auth/login` - Login (email, password)
- `GET /api/auth/me` - Get current user (protected)

### Jobs
- `GET /api/jobs?category=Electronics&search=engineer` - Browse jobs with filters
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (employer only)
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Applications
- `POST /api/applications` - Apply for job
- `GET /api/applications` - Get my applications
- `GET /api/applications?forJobs=true` - Get applications for my jobs (employer)
- `PUT /api/applications/:id/status` - Update status

### CV
- `POST /api/cv/upload` - Upload and parse CV
- `GET /api/cv` - Get my CVs

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile

## Testing the Application

### 1. Access the Frontend
- Open browser: http://localhost:3000
- You should see the Intern Portal landing page

### 2. Register a User
- Click "Sign Up"
- Fill form (choose "Student" or "Employer")
- Create account

### 3. Login
- Click "Sign In"
- Use your credentials

### 4. For Students
- Browse jobs at /jobs
- Click on a job to view details
- Apply with a cover letter
- Upload your CV
- View applications in dashboard

### 5. For Employers
- Post new job (from dashboard)
- View applications for your jobs
- Update application status

## Key Features Implemented

✅ **User Authentication**
- Register as Student or Employer
- Login with JWT token
- Protected routes

✅ **Job Management**
- Post, edit, delete jobs
- Search and filter jobs
- View job details

✅ **Applications**
- Apply for jobs
- Track application status
- View all applications

✅ **CV Upload & Parsing**
- Upload CV (PDF/DOCX)
- Python service parses CV
- Extract skills, education, experience

✅ **User Profiles**
- Edit profile information
- Manage CV files
- View saved CVs

✅ **Responsive Design**
- Mobile-friendly UI
- Modern Tailwind CSS styling
- Gradient effects

## Development Tips

### Hot Reload
- Frontend: Automatic hot reload on file changes
- Backend: Uses Nodemon for auto-restart
- Python: Restart required for changes

### Database
- MongoDB stores all data (users, jobs, applications)
- Uses Mongoose for Node.js
- Add indexes in production for better performance

### Authentication
- JWT tokens stored in localStorage
- Auto-refresh on page load
- Token included in all protected requests

### File Uploads
- CVs stored in `/server/uploads`
- Python service parses CV files
- Extracted data saved to database

## Troubleshooting

### Port Already in Use
```bash
# Find process on port
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

### MongoDB Connection Error
```
Check MONGODB_URI in .env
If using local: ensure mongod is running
If using Atlas: check network access settings
```

### Python Service Not Found
```
Ensure Flask is running on port 5001
Check that requirements.txt packages are installed
Run: pip install -r requirements.txt
```

### CORS Errors
```
Check CORS_ORIGIN in backend .env
For local dev: http://localhost:3000
```

## Production Deployment

### Build for Production

**Frontend:**
```bash
cd client
npm run build
# Creates optimized build in build/ folder
```

**Backend:**
```bash
# Set NODE_ENV=production in .env
npm start
```

**Deploy Options:**
- Frontend: Vercel, Netlify, GitHub Pages
- Backend: Heroku, AWS, DigitalOcean
- Python: Same as Backend or separate container
- Database: MongoDB Atlas (cloud)

## Next Steps

1. **Customize Branding**: Update logo, colors, text
2. **Add More Pages**: About, Contact, Terms
3. **Email Notifications**: Send emails on application updates
4. **Admin Dashboard**: For system management
5. **Advanced Search**: Elasticsearch for better job search
6. **Payment Integration**: For premium features
7. **Analytics**: Track user behavior and job trends

## Support & Documentation

- **Backend API Docs**: View in `server/routes/`
- **Frontend Components**: View in `client/src/components/`
- **Python Service**: View in `python-service/app.py`

## License

MIT License - National Electronics Complex of Pakistan

---

**Start your development!** 🚀

Questions? Check the README.md in each folder for more details.
