const { Router } = require('express');

const userRouter = Router();

userRouter.post('/profile', (req, res) => {
  res.json({
    user: req.tgUser,
    data: req.tgData,
  });
});

module.exports = {
  userRouter,
};
