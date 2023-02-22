const multer = require("multer");
const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const city = require("../models/cities");
const client = require("../models/clients");
const restaurant = require("../models/restaurants");
const jwtSecret = process.env.TOKEN_SECRET;

//middlewares
const { isAlreadyLoggedIn } = require("../middleware");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

const capitalize = (word) => {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
};

router.get("/cities", async (req, res) => {
  const citiesData = await city.find();
  res.send(citiesData);
});

router.get("/cities/search/:cityName", async (req, res) => {
  const { cityName } = req.params;
  const targetName = capitalize(cityName);
  const data = await city.find({ name: targetName }).populate("restaurants");
  res.send(data);
});

router.post("/restaurants/add", upload.array("image"), async (req, res) => {
  console.log("in route");
  console.log(req.user);
  if (!req.user) {
    res.json({ success: false, message: "You should login first" });
    return;
  }
  const owner = await client.findById(req.user._id);
  if (owner.restaurants)
    return res.json({
      success: false,
      message: "you already have a restaurant registered",
    });
  const requestedCity = req.body.city;
  const requiredCity = await city.find({ name: requestedCity });
  const newRestaurant = new restaurant(req.body);
  newRestaurant.images = req.files.map((f) => ({
    url: f.path,
    fileName: f.filename,
  }));
  newRestaurant.owner = req.user._id;
  owner.restaurants = newRestaurant._id;
  await owner.save();
  await newRestaurant.save();
  if (requiredCity.length > 0) {
    const targetCity = requiredCity[0];
    targetCity.restaurants.push(newRestaurant._id);
    await targetCity.save();
  } else {
    const newCity = new city({
      name: req.body.city,
      restaurants: [newRestaurant._id],
    });
    await newCity.save();
  }
  res.json({ success: true, message: "Successfully added your restaurant" });
});

router.post("/restaurants/addmenu", upload.array("image"), async (req, res) => {
  console.log("in route");
  console.log(req.user);
  if (!req.user) {
    res.json({ success: false, message: "You should login first" });
    return;
  }
  const { menuName, basePrice, quantityType, minQuantity, type } = req.body;
  const restaurantId = req.user.restaurants;
  const targetRestaurant = await restaurant.findById({ _id: restaurantId });
  if (targetRestaurant) {
    const newmenu = {
      menuName,
      quantityType,
      minQuantity: parseFloat(eval(minQuantity)),
      basePrice,
      type,
    };
    newmenu.images = req.files.map((f) => ({
      url: f.path,
      fileName: f.filename,
    }));

    targetRestaurant.menu.push(newmenu);
    await targetRestaurant.save();
    res.json({
      success: true,
      message: "Successfully added menu",
      targetRestaurant,
    });
    // await targetRestaurant.save()
  } else {
    res.json({
      success: false,
      message: "You should add restaurant details first",
    });
  }
});

/******************************** CLIENTS AUTH ****************************/

router.post("/clients/register", async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    const isEmailTaken = await client.find({ email });
    const isUsernameTaken = await client.find({ username });
    if (isEmailTaken.length < 1 && isUsernameTaken.length < 1) {
      const saltRounds = 10;
      const passwordHashed = await bcrypt.hash(password, saltRounds);
      const newUser = new client({ email, username, passwordHashed }); // creating a mongoose database using the User schema
      const savedUser = await newUser.save();
      tokenData = { id: savedUser._id, username: savedUser.username };
      const token = jwt.sign(tokenData, jwtSecret);
      res.json({
        token,
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        success: true,
        messsage: "successfully created an account",
      });
    } else {
      res.json({
        success: false,
        error:
          isEmailTaken.length > 0
            ? "Email is already registered"
            : isUsernameTaken.length > 0
            ? "Username is already taken"
            : "oops, please try again later",
      });
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});
router.post("/clients/login", isAlreadyLoggedIn, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({
      success: false,
      error: `${username ? "Password" : "Username"} is required`,
    });
  const reqClient = await client.findOne({ username });
  const passwordCorrect =
    reqClient === null
      ? false
      : await bcrypt.compare(password, reqClient.passwordHashed);

  if (!(reqClient && passwordCorrect)) {
    return res.json({
      success: false,
      error: "invalid username or password",
    });
  }

  const tokenData = {
    username: reqClient.username,
    id: reqClient._id,
  };

  const token = jwt.sign(tokenData, jwtSecret);

  res.status(200).json({
    token,
    username: reqClient.username,
    email: reqClient.email,
    success: true,
    isAlreadyLoggedIn: false,
  });
});
router.post("/clients/auth", (req, res) => {
  if (!req.user) {
    return res.json({ success: false, message: "authentication failed" });
  }
  if (req.user) {
    return res.json({
      success: true,
      username: req.user.username,
      email: req.user.email,
    });
  }
});

router.post("/clients/logout", (req, res) => {
  if (!req.user) {
    res
      .status(401)
      .json({ success: false, message: "you need to login first" });
    return;
  }
  res.json({ success: true });
});
module.exports = router;
