const clients = require("./models/clients");

module.exports.isAlreadyLoggedIn = (req, res, next) => {
  //middleware to prevent a logged in user from accessing the login page
  if (req.isAuthenticated()) {
    res.status(200).json({
      success: true,
      isAlreadyLoggedIn: true,
      message: "already logged in",
      ...req.user,
    });
  } else {
    next();
  }
};

module.exports.logoutUser = (req, res, next) => {
  req.logOut((err) => {
    if (err) res.send("something went wrong");
    res.json({ logout: "success" });
  });
};
