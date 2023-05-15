const clients = require("./models/clients");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.TOKEN_SECRET;

//middleware to prevent a logged in user from accessing the login/register page
module.exports.isAlreadyLoggedIn = async (req, res, next) => {
  if (req.user) {
    res.status(200).json({
      success: true,
      isAlreadyLoggedIn: true,
      message: "already logged in",
      username: req.user.username,
      email: req.user.email,
    });
  }

  next();
};

// middleware to handle error
module.exports.asyncError = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// checks if client has registered a restaurant before ( restaurants per client is limited to 1)
module.exports.verifyClientRestaurant = async (req, res, next) => {
  if (!req.user) {
    return res.json({ success: false, message: "You should login first" });
  }
  if (req.user.restaurants) {
    return res.json({
      success: false,
      message: "you already have a restaurant registered",
    });
  }
  next();
};

// module.exports.verifyFileCount = async (req, res, next) => {
//   console.log(req.file);
//   next();
// };
