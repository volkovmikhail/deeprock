require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');

const { globalErrorMiddleware, LocalError } = require('./middlewares/error-handler');
const { authenticate } = require('./middlewares/auth');
const path = require('path');

const { apiRouter } = require('./api/api');

const app = express();

const config = require('./config/env');
const { bot } = require('./bot/bot');

const httpPort = config.httpPort;

app.locals.basePath = config.basePath;
const basePath = config.basePath;

app.use(morgan('dev'));
app.use(basePath + '/', express.static(path.resolve(__dirname, 'client')));
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
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : false,
    methods: ['GET', 'POST', 'OPTIONS'],
  }),
);

// Authentication middleware
// ---------
// Routes
// ---------

app.use(basePath + '/api', authenticate, apiRouter);

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
