const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
dotenv.config();

const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const socketIO = require('socket.io');
const http = require('http');
const subscriptionController = require('./controllers/subscriptionController');
const { startSubscriptionLifecycleWorker } = require('./services/subscriptionService');
const { CORS_ORIGINS } = require('./config/appUrls');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);


const stripeWebhookHandler = [
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    console.log(`Middleware reached ${req.originalUrl}`);
    next();
  },
  subscriptionController.handleStripeWebhook,
];

app.post('/api/superadmin/stripe/webhook', ...stripeWebhookHandler);
app.post('/api/webhook/stripe', ...stripeWebhookHandler);

// ------------------------------

const allowedOrigins = CORS_ORIGINS;
const allowAllOrigins = allowedOrigins.includes('*');

const normalizeOrigin = (origin = '') => String(origin).trim().replace(/\/+$/, '');

const isPrivateNetworkHost = (host = '') => {
  const normalizedHost = String(host).toLowerCase();

  if (['localhost', '127.0.0.1', '::1'].includes(normalizedHost)) return true;

  const parts = normalizedHost.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;

  const [first, second] = parts;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127)
  );
};

const isAllowedDevOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const parsed = new URL(origin);
    const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    const isVitePort = ['5173', '5174', '5175', '5176', '5177', '5178', '5179'].includes(parsed.port);
    return isHttp && isVitePort && isPrivateNetworkHost(parsed.hostname);
  } catch (_error) {
    return false;
  }
};

const isOriginAllowed = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  return (
    allowAllOrigins ||
    allowedOrigins.includes(normalizedOrigin) ||
    isAllowedDevOrigin(normalizedOrigin)
  );
};

const enforceHttps = (req, res, next) => {
  const shouldEnforce =
    process.env.NODE_ENV === 'production' &&
    process.env.FORCE_HTTPS !== 'false';

  if (!shouldEnforce || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  return res.status(426).json({ error: 'HTTPS is required.' });
};

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again shortly.' },
});

const io = socketIO(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);

// app.use(enforceHttps);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
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
app.use('/api', apiLimiter);
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
app.use('/api/parent-guard-messages', require('./routes/parentGuardMessageRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
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
  startSubscriptionLifecycleWorker?.();
  subscriptionController.startInvoiceRetryWorker?.();
});
