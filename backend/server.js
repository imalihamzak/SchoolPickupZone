const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const socketIO = require('socket.io');
const http = require('http');
const subscriptionController = require('./controllers/subscriptionController');

dotenv.config();

const app = express();
const server = http.createServer(app);


app.post(
  '/api/superadmin/stripe/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    console.log("Middleware reached /api/superadmin/stripe/webhook");
    next();
  },
  subscriptionController.handleStripeWebhook
);

// ------------------------------

const allowedOrigins = [
  'https://pickupzone.org',
  'https://api.pickupzone.org',
  'http://localhost:5173',
  'http://192.168.100.63:5173',
];

const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());
app.use(fileUpload());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('Welcome to the PickupZone API');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/children', require('./routes/childRoutes'));
app.use('/api/guardians', require('./routes/guardianRoutes'));
app.use('/api/pickups', require('./routes/pickupRoutes'));
app.use('/api/qrcode', require('./routes/qrRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/family', require('./routes/familyRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/superadmin', require('./routes/superAdminRoutes'));
app.use('/api/superadmin/subscription', require('./routes/subscriptionRoutes'));

const connectedAdmins = new Map();
app.set('connectedAdmins', connectedAdmins);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('register_admin', (adminId) => {
    console.log(`Admin registered: ${adminId}`);
    connectedAdmins.set(socket.id, adminId);

    socket.on('disconnect', () => {
      console.log(`Admin disconnected: ${adminId}`);
      connectedAdmins.delete(socket.id);
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server + Socket.IO running on port ${PORT}`);
});
