const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const userRoutes = require('./routes/users');
const cvRoutes = require('./routes/cv');
const accessRoutes = require('./routes/access');
const feedbackRoutes = require('./routes/feedback');
const internApplicationRoutes = require('./routes/internApplications');

const app = express();

// Required behind Render / reverse proxies so secure cookies work
app.set('trust proxy', 1);

// Middleware - Security & Performance
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Middleware - CORS
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  }
}));
app.options('*', cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  }
}));

// Middleware - Session for access-code gate
// Use SameSite=None only when frontend is on a different origin (split hosting)
const crossOriginFrontend = Boolean(
  process.env.CORS_ORIGIN &&
  process.env.CORS_ORIGIN.split(',').some((o) => o.trim() && !o.includes('localhost') && !o.includes('127.0.0.1'))
);
app.use(session({
  secret: process.env.SESSION_KEY || 'change_this_session_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: crossOriginFrontend ? 'none' : 'lax',
    maxAge: 60 * 60 * 1000 // 1 hour
  }
}));

// Middleware - Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('✅ MongoDB Connected Successfully');

  // Free Render has no Shell — create default admin if missing
  try {
    const User = require('./models/User');
    const email = (process.env.ADMIN_EMAIL || 'admin@internportal.com').toLowerCase();
    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Super Admin',
        email,
        password: process.env.ADMIN_PASSWORD || 'Admin123!',
        role: 'superadmin',
        isApproved: true
      });
      console.log('✅ Default admin created:', email);
    }
  } catch (seedErr) {
    console.error('Admin seed skipped:', seedErr.message);
  }
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/intern-applications', internApplicationRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Serve React build (single Render Web Service = API + frontend)
const clientBuildPath = path.join(__dirname, 'public');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// 404 handler (API-only when no React build is present)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
