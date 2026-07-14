# Intern Portal - MERN + Python Job Portal

A comprehensive job portal built with MERN stack and Python microservice for CV parsing.

## Project Structure

```
Intern_MERN/
├── client/                 # React Frontend
├── server/                 # Node.js/Express Backend
├── python-service/         # Python Flask CV Parser
└── docker-compose.yml      # Docker Compose for easy setup
```

## Tech Stack

### Frontend
- **React 18** - UI Library
- **React Router** - Navigation
- **Axios** - HTTP Client
- **Tailwind CSS** - Styling

### Backend
- **Node.js** - Runtime
- **Express** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File Upload
- **Bcrypt** - Password Hashing

### Python Service
- **Flask** - Web Framework
- **PyPDF2** - PDF Parsing
- **spaCy** - NLP for CV Analysis
- **python-docx** - Word Document Support

## Getting Started

### Prerequisites
- Node.js v16+
- Python 3.9+
- MongoDB
- npm or yarn

### Installation

#### 1. Clone and Setup Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT key
npm start
```

#### 2. Setup React Frontend
```bash
cd client
npm install
npm start
```

#### 3. Setup Python Service
```bash
cd python-service
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
python app.py
```

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/intern_portal
JWT_KEY=your_jwt_key
SESSION_KEY=your_session_key
PORT=5000
PYTHON_SERVICE_URL=http://localhost:5001
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

## API Endpoints

### Auth
- `POST /api/auth/register` - Register User
- `POST /api/auth/login` - Login User
- `POST /api/auth/logout` - Logout User
- `GET /api/auth/me` - Get Current User

### Jobs
- `GET /api/jobs` - Get All Jobs
- `POST /api/jobs` - Create Job (Employer Only)
- `GET /api/jobs/:id` - Get Job Detail
- `PUT /api/jobs/:id` - Update Job
- `DELETE /api/jobs/:id` - Delete Job

### Applications
- `POST /api/applications` - Apply for Job
- `GET /api/applications` - Get Applications
- `PUT /api/applications/:id/status` - Update Application Status

### CV Parsing (Python Service)
- `POST /api/parse-cv` - Parse CV and Extract Info

## Features

- ✅ User Registration & Authentication (Student/Employer)
- ✅ Job Posting & Management
- ✅ Job Browsing & Search
- ✅ CV Upload & Parsing
- ✅ Job Applications
- ✅ Application Tracking
- ✅ User Dashboard
- ✅ Responsive Design

## Running with Docker

```bash
docker-compose up
```

This will start:
- MongoDB on port 27017
- Backend API on port 5000
- Python Service on port 5001
- Frontend on port 3000

## Development

### Backend Development
```bash
cd server
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd client
npm start    # Starts on port 3000 with hot reload
```

### Python Service Development
```bash
cd python-service
python app.py    # Starts on port 5001
```

## Production Build

### Frontend
```bash
cd client
npm run build    # Creates optimized build
```

### Backend
```bash
cd server
npm run start    # Start production server
```

## License

MIT License - National Electronics Complex of Pakistan

## Contact

For support, email: support@intern-portal.example
