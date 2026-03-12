const { Router } = require('express');

const userRouter = Router();

userRouter.get('/profile', (req, res) => {
  res.json({
    user: req.tgUser,
    data: req.tgData,
  });
});

module.exports = {
  userRouter,
};
