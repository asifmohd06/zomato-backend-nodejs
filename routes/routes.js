const multer = require("multer");
const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const city = require("../models/cities");
const client = require("../models/clients");
const restaurant = require("../models/restaurants");
const jwtSecret = process.env.TOKEN_SECRET;
const mongoose = require("mongoose");

//middlewares
const { storage, cloudinary } = require("../cloudinary");
const { asyncError, verifyClientRestaurant } = require("../middleware");
const { isAlreadyLoggedIn } = require("../middleware");

const upload = multer({ storage });

const capitalize = (word) => {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
};

router.get(
  "/cities",
  asyncError(async (req, res) => {
    const citiesData = await city.find();
    res.send(citiesData);
  })
);

router.get(
  "/cities/search/:cityName",
  asyncError(async (req, res) => {
    const { cityName } = req.params;
    const targetName = capitalize(cityName);
    const data = await city.find({ name: targetName }).populate("restaurants");
    res.send(data);
  })
);
// adding restaurant
router.post(
  "/restaurants/add",
  verifyClientRestaurant,
  upload.array("image"),
  asyncError(async (req, res) => {
    if (!req.user) {
      return res.json({ success: false, message: "You should login first" });
    }
    const owner = await client.findById(req.user._id);
    if (owner.restaurants) {
      return res.json({
        success: false,
        message: "you already have a restaurant registered",
      });
    }
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
    return res.json({
      success: true,
      message: "Successfully added your restaurant",
    });
  })
);
// adding menu
router.post(
  "/restaurants/addmenu",
  upload.array("image"),
  asyncError(async (req, res) => {
    if (!req.user) {
      res.json({ success: false, message: "You should login first" });
      return;
    }
    const { menuName, basePrice, quantityType, minQuantity, type, category } =
      req.body;
    const restaurantId = req.user.restaurants;
    const targetRestaurant = await restaurant.findById({ _id: restaurantId });
    if (targetRestaurant) {
      const newmenu = {
        menuName,
        quantityType,
        minQuantity: parseFloat(eval(minQuantity)),
        basePrice,
        type,
        category,
        enabled: false,
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
    } else {
      res.json({
        success: false,
        message: "You should add restaurant details first",
      });
    }
  })
);

/******************************** CLIENTS AUTH ****************************/

router.post(
  "/clients/register",
  isAlreadyLoggedIn,
  asyncError(async (req, res, next) => {
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
  })
);
router.post(
  "/clients/login",
  isAlreadyLoggedIn,
  asyncError(async (req, res) => {
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
      restaurants: reqClient.restaurants,
      success: true,
      isAlreadyLoggedIn: false,
    });
  })
);
router.post(
  "/clients/auth",
  asyncError((req, res) => {
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
  })
);

router.post(
  "/clients/restaurants",
  asyncError(async (req, res) => {
    if (!req.user) {
      return res.json({ success: false, message: "You should login first" });
    }
    const restaurant = await req.user.populate("restaurants").then((user) => {
      return user.restaurants;
    });

    restaurant
      ? res.json({ success: true, restaurant })
      : res.json({ success: false });
  })
);
router.get(
  "/clients/restaurants/:id/menu/:menuId/details",
  async (req, res) => {
    const { id, menuId } = req.params;
    const targetRes = await restaurant.findById(id);
    const targetMenu = targetRes.menu.find((menu) => menu.id === menuId);
    targetMenu
      ? res.json({ success: true, targetMenu })
      : res.json({ success: false, message: "No such menu available" });
  }
);
router.put(
  "/clients/restaurants/:id/editmenu/:menuId",
  upload.array("image"),
  async (req, res) => {
    const { id, menuId } = req.params;
    const {
      menuName,
      basePrice,
      quantityType,
      minQuantity,
      type,
      category,
      imagesToDelete,
    } = req.body;

    const targetRes = await restaurant.findById(id);
    const targetMenu = await targetRes.menu.find((menu) => menu.id === menuId);
    // console.log(targetMenu);
    const imagesToDeleteId = imagesToDelete?.split(",");

    targetMenu.menuName = menuName;
    targetMenu.basePrice = parseFloat(basePrice);
    targetMenu.quantityType = quantityType;
    targetMenu.minQuantity = parseFloat(minQuantity);
    targetMenu.type = type;
    targetMenu.category = category;

    req.files?.forEach((file) => {
      targetMenu.images.push({ url: file.path, fileName: file.filename });
    });

    if (imagesToDeleteId) {
      const newImages = targetMenu.images.filter(
        (image) => !imagesToDeleteId.includes(image._id.toString())
      );
      const toDeleteImages = targetMenu.images.filter((image) =>
        imagesToDeleteId.includes(image._id.toString())
      );
      targetMenu.images = newImages;
      if (targetMenu.images.length < 1) {
        return res.json({
          success: false,
          message: "Menu must contain atleast one image",
        });
      }
      toDeleteImages.map((image) =>
        cloudinary.uploader.destroy(image.fileName)
      );
    }
    await targetRes.save();
    const targetMenu2 = await targetRes.menu.find((menu) => menu.id === menuId);
    targetMenu
      ? res.json({ success: true, targetMenu2 })
      : res.json({ success: false, message: "Unable to  fetch menu details" });
  }
);
router.patch("/clients/restaurants/deletemenu", async (req, res) => {
  const { id, menuId } = req.body;
  const targetRes = await restaurant.findById(id);
  const newMenu = targetRes?.menu?.filter(
    (menu) => menu._id.toString() !== menuId
  );
  if (targetRes.menu.length - newMenu.length === 1) {
    const menuToDelete = targetRes.menu.find(
      (menu) => menu._id.toString() === menuId
    );
    menuToDelete.images.map((image) => {
      cloudinary.uploader.destroy(image.fileName);
    });
    targetRes.menu = newMenu;
    await targetRes.save();
    return res.json({ success: true, message: "Successfully deleted menu" });
  }
  res.json({ success: false, message: "Unable to delete that menu" });
});

router.post(
  "/clients/logout",
  asyncError((req, res) => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "you need to login first" });
      return;
    }
    res.json({ success: true });
  })
);
module.exports = router;
