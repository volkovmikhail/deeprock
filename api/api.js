const { Router } = require('express');
const { userRouter } = require('./routes/user');

const apiRouter = Router();

apiRouter.use('/user', userRouter);

module.exports = {
  apiRouter,
};
