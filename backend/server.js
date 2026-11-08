require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/blood-banks', require('./routes/bloodBankRoutes'));
app.use('/api/donors', require('./routes/donorRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Blood Coordination System API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`\n🩸 EBDCS: Emergency Blood Donation Coordination System`);
    console.log(`   Running on port ${PORT}`);
    console.log(`   API:      http://localhost:${PORT}/api/health`);
    console.log(`   Frontend: http://localhost:${PORT}`);
    console.log(`   Mode:     ${process.env.NODE_ENV || 'development'}\n`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
}

module.exports = app;
