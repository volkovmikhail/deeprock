const { Router } = require('express');
const config = require('../config/env');

const userRouter = Router();


userRouter.get('/profile', (req, res) => {

})

module.exports = {
  userRouter
}
