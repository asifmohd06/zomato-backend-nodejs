const express = require("express");
const router = express.Router();
const city = require("../models/cities");
const multer = require("multer");
const restaurant = require("../models/restaurants");
const client = require("../models/clients");

//middlewares
const { isAlreadyLoggedIn, logoutUser } = require("../middleware");

const { storage } = require("../cloudinary");
const passport = require("passport");
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
    const isAlreadyRegistered = await client.find({ email: email });
    if (isAlreadyRegistered.length < 1) {
      const newUser = new client({ email, username }); // creating a mongoose database using the User schema
      const regUser = await client.register(newUser, password); //regitering, ie adding the password field with hashed password from passport
      req.logIn(regUser, (err) => {
        // req.login to login the registered user
        if (err) return res.json({ success: false, ...err }); // req.login requires a callback as it is asynchrounous, but cant be awaited
        const { email, _id, username } = regUser;
        res.json({ success: true, email, _id, username });
      });
    } else {
      res.json({ success: false, error: "Email is already registered" });
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});
router.post(
  "/clients/login",
  isAlreadyLoggedIn,
  passport.authenticate("local", {
    keepSessionInfo: true,
    failureMessage: true,
  }),
  (req, res) => {
    res
      .status(200)
      .json({ success: true, isAlreadyLoggedIn: false, ...req.user });
  }
);
router.post("/clients/auth", (req, res) => {
  if (req.user) res.status(200).json({ success: true, ...req.user });
  if (!req.user) res.json({ success: false, message: "authentication failed" });
});

router.post("/clients/logout", (req, res) => {
  if (!req.user) {
    res.send("you need to login first");
    return;
  }
  req.logOut((err) => {
    if (err) res.send("something went wrong");
    res.json({ logout: "success" });
  });
});
module.exports = router;
