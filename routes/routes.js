const express = require("express");
const router = express.Router();
const city = require("../models/cities");
const multer = require("multer");
const restaurant = require("../models/restaurants");
const user = require("../models/users");

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
  const requestedCity = req.body.city;
  const requiredCity = await city.find({ name: requestedCity });
  const newRestaurant = new restaurant(req.body);
  newRestaurant.images = req.files.map((f) => ({
    url: f.path,
    fileName: f.filename,
  }));

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
  res.send(newRestaurant);
});

router.post(
  "/restaurants/:id/addmenu",
  upload.array("image"),
  async (req, res) => {
    const { menuName, basePrice, quantityType, minQuantity, type } = req.body;
    const targetRestaurant = await restaurant.findById({ _id: req.params.id });
    if (targetRestaurant) {
      const newmenu = {
        menuName,
        quantityType,
        minQuantity: parseFloat(eval(minQuantity)),
        basePrice,
        type,
      };
      console.log(req.files);
      newmenu.images = req.files.map((f) => ({
        url: f.path,
        fileName: f.filename,
      }));

      targetRestaurant.menu.push(newmenu);
      await targetRestaurant.save();
      res.send(targetRestaurant);
      // await targetRestaurant.save()
    } else {
      res.send("no such restaurant");
    }
  }
);

router.post("/restaurants/register", async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    const newUser = new user({ email, username }); // creating a mongoose database using the User schema
    const regUser = await user.register(newUser, password); //regitering, ie adding the password field with hashed password from passport
    req.logIn(regUser, (err) => {
      // req.login to login the registered user
      if (err) return next(err); // req.login requires a callback as it is asynchrounous, but cant be awaited
      res.send("success");
    });
  } catch (e) {
    res.send(`error = ${e.message}`);
  }
});
router.post(
  "/restaurants/login",
  isAlreadyLoggedIn,
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/",
    keepSessionInfo: true,
  }),
  (req, res) => {
    res.send("you just logged in");
  }
);

router.get("/restaurants/logout", logoutUser);
module.exports = router;
