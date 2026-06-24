const { Router } = require('express');
const { userRouter } = require('./routes/user');
const { resourcesRouter } = require('./routes/resources');

const apiRouter = Router();

apiRouter.use('/user', userRouter);
apiRouter.use('/user/resources', resourcesRouter);

module.exports = {
  apiRouter,
};
