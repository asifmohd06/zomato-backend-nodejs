const user = require("./models/users");

module.exports.isAlreadyLoggedIn = (req, res, next) => {
  //middleware to prevent a logged in user from accessing the login page
  if (req.isAuthenticated()) {
    res.send("you are already logged in");
  } else {
    next();
  }
};

module.exports.logoutUser = (req, res, next) => {
  req.logOut((err) => {
    if (err) next(err);
    res.send("user is logged out");
  });
};
