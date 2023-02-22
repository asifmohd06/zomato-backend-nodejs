const clients = require("./models/clients");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.TOKEN_SECRET;

module.exports.isAlreadyLoggedIn = async (req, res, next) => {
  //middleware to prevent a logged in user from accessing the login page
  if (req.user)
    res.status(200).json({
      success: true,
      isAlreadyLoggedIn: true,
      message: "already logged in",
      username: user.username,
      email: user.email,
    });
  next();
};
