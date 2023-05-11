const jwt = require("jsonwebtoken");
const city = require("../models/cities");
const client = require("../models/clients");
const restaurant = require("../models/restaurants");
const bcrypt = require("bcryptjs");
const jwtSecret = process.env.TOKEN_SECRET;

const { cloudinary } = require("../cloudinary");

const addrestaurant = async (req, res) => {
  // res.json({ success: false, message: "minimum 3 images required" });
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
};
const fetchEditrestaurant = async (req, res) => {
  const { id } = req.params;
  const targetRes = await restaurant.findById(id);

  restaurant
    ? res.json({ success: true, restaurant: targetRes })
    : res.json({ success: false });
};
const submitEditRestaurant = async (req, res) => {
  const { name, city, category, imagesToDelete } = req.body;
  let imagesToDeleteId = [];
  if (!imagesToDelete.includes("undefined")) {
    imagesToDeleteId = imagesToDelete.split(",");
  }
  const { id } = req.params;
  const targetRes = await restaurant.findById(id);
  if (!targetRes)
    return res.json({ success: false, message: "No such Restaurant" });
  targetRes.name = name;
  targetRes.city = city;
  targetRes.category = category;
  req.files?.forEach((file) => {
    targetRes.images.push({ url: file.path, fileName: file.filename });
  });
  if (imagesToDeleteId) {
    const newImages = targetRes.images.filter(
      (image) => !imagesToDeleteId.includes(image._id.toString())
    );
    const toDeleteImages = targetRes.images.filter((image) =>
      imagesToDeleteId.includes(image._id.toString())
    );
    targetRes.images = newImages;
    if (targetRes.images.length < 3) {
      return res.json({
        success: false,
        message: "Restaurant must contain atleast three images",
      });
    }
    toDeleteImages.map((image) => cloudinary.uploader.destroy(image.fileName));
  }
  // if (
  //   req?.files?.length + targetRes?.images?.length - imagesToDeleteId?.length <
  //   3
  // ) {
  //   return res.json({
  //     success: false,
  //     message: "Restaurant cannot have less tham 3 images",
  //   });
  // }
  // const toDeleteImages = targetRes.images.filter((image) =>
  //   imagesToDeleteId?.includes(image._id.toString())
  // );
  // console.log(toDeleteImages);
  // req.files?.map((file) => {
  //   targetRes.images.push({ url: file.path, fileName: file.filename });
  // });
  // toDeleteImages.map((image) => cloudinary.uploader.destroy(image.fileName));
  await targetRes.save();
  res.json({ success: true, message: "checking" });
};

const addMenu = async (req, res) => {
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
};
const registerClient = async (req, res, next) => {
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
};
const loginClient = async (req, res) => {
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
};
const authenticateClient = (req, res) => {
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
};

const fetchClientOwnedRestaurant = async (req, res) => {
  if (!req.user) {
    return res.json({ success: false, message: "You should login first" });
  }
  const restaurant = await req.user.populate("restaurants").then((user) => {
    return user.restaurants;
  });

  restaurant
    ? res.json({ success: true, restaurant })
    : res.json({ success: false });
};

const fetchMenuDetails = async (req, res) => {
  const { id, menuId } = req.params;
  const targetRes = await restaurant.findById(id);
  const targetMenu = targetRes.menu.find((menu) => menu.id === menuId);
  targetMenu
    ? res.json({ success: true, targetMenu })
    : res.json({ success: false, message: "No such menu available" });
};

const updateEditedMenu = async (req, res) => {
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
  //copy below code
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
    toDeleteImages.map((image) => cloudinary.uploader.destroy(image.fileName));
  }
  await targetRes.save();
  const targetMenu2 = await targetRes.menu.find((menu) => menu.id === menuId);
  targetMenu
    ? res.json({ success: true, targetMenu2 })
    : res.json({ success: false, message: "Unable to  fetch menu details" });
};
const deleteMenu = async (req, res) => {
  const { id, menuId } = req.body;
  console.log({ id, menuId });
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
    return res.json({
      success: true,
      message: "Successfully deleted menu",
      targetRes,
    });
  }
  res.json({ success: false, message: "Unable to delete that menu" });
};
const logoutClient = (req, res) => {
  if (!req.user) {
    res
      .status(401)
      .json({ success: false, message: "you need to login first" });
    return;
  }
  res.json({ success: true });
};

// export {
//   addrestaurant,
//   submitEditRestaurant,
//   fetchEditrestaurant,
//   addMenu,
//   registerClient,
//   loginClient,
//   authenticateClient,
//   fetchClientOwnedRestaurant,
//   fetchMenuDetails,
//   updateEditedMenu,
//   deleteMenu,
//   logoutClient,
// };

module.exports = {
  addrestaurant,
  submitEditRestaurant,
  fetchEditrestaurant,
  addMenu,
  registerClient,
  loginClient,
  authenticateClient,
  fetchClientOwnedRestaurant,
  fetchMenuDetails,
  updateEditedMenu,
  deleteMenu,
  logoutClient,
};
