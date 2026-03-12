require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');

const { globalErrorMiddleware, LocalError } = require('./middlewares/error-handler');
const { authenticate } = require('./middlewares/auth');
const path = require('path');

const app = express();

const config = require('./config/env');
const { userRouter } = require('./api/user-router'); //todo: сделать единый в api
const { bot } = require('./bot/bot');

const httpPort = config.httpPort;

const isProd = config.nodeEnv === 'production';

app.locals.basePath = config.basePath;
const basePath = config.basePath;

app.use(morgan('dev'));
app.use(basePath + '/', express.static(path.resolve(__dirname, 'public')));
app.use(basePath + '/static/shared', express.static(path.resolve(__dirname, 'shared')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
});

app.use(limiter);

app.use(helmet());
app.use(helmet.xssFilter());

app.use(
  cors({
    origin: '*',
    methods: ['GET'],
  }),
);

// Authentication middleware
app.use(authenticate);

// ---------
// Routes
// ---------

app.use(basePath + '/', userRouter);

app.get(basePath + '/', (req, res) => {
  res.status(200).json({
    message: 'works!',
  });
});

app.get(basePath + '/*', () => {
  throw new LocalError(404, 'Page not found');
});

app.use(basePath, globalErrorMiddleware);

app.listen(httpPort, () => {
  console.log(`Server listen: http://localhost:${httpPort}`);
});

bot.launch();
