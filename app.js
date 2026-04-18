// Core modules
const express = require('express');
const app = express();

// Third-party packages
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables FIRST
dotenv.config();

// DB Connection (MySQL)
const { connectDB } = require('./util/database');

// Routes
const routes = require('./routes/routes');

// ------------------- MIDDLEWARES ------------------- //

// Parse JSON
app.use(express.json());

// Parse form data
app.use(bodyParser.urlencoded({ extended: false }));

// Enable CORS
app.use(cors());

// Security headers
app.use(helmet());

// ------------------- LOGGING ------------------- //

// Create access.log file
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

// Log requests
app.use(morgan('combined', { stream: accessLogStream }));

// ------------------- STATIC FILES ------------------- //

app.use(express.static(path.join(__dirname, 'public')));

// ------------------- SECURITY (CSP) ------------------- //

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://checkout.razorpay.com; " +
    "script-src-elem 'self' https://checkout.razorpay.com;"
  );
  next();
});

// ------------------- ROUTES ------------------- //

app.use('/homepage', routes);
app.use('/user', routes);
app.use('/payment', routes);
app.use('/premium', routes);

// ------------------- PAGES ------------------- //

// Password Reset Page
app.get('/password/resetPassword/:uuid', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'resetPassword.html'));
});

// Default Page
app.use('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ------------------- SERVER START ------------------- //

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB(); // Ensure DB is connected before server starts

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
  }
};

startServer();