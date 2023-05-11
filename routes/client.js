const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
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
} = require("../controllers/clients");

//middlewares
const { storage } = require("../cloudinary");
const upload = multer({ storage });
const upload2 = multer();
const {
  asyncError,
  verifyClientRestaurant,
  // verifyFileCount,
} = require("../middleware");
const { isAlreadyLoggedIn } = require("../middleware");

const capitalize = (word) => {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
};

// adding restaurant
router.post(
  "/restaurants/add",
  verifyClientRestaurant,
  // verifyFileCount,
  upload.array("image"),
  asyncError(addrestaurant)
);
//fetching res details for edit form
router.get("/editrestaurant/:id", asyncError(fetchEditrestaurant));
router.post(
  "/editrestaurant/:id",
  upload.array("image"),
  asyncError(submitEditRestaurant)
);
// adding menu
router.post("/restaurants/addmenu", upload.array("image"), asyncError(addMenu));

/******************************** CLIENTS AUTH ****************************/

router.post("/register", isAlreadyLoggedIn, asyncError(registerClient));
router.post("/login", isAlreadyLoggedIn, asyncError(loginClient));
router.get("/auth", asyncError(authenticateClient));

router.post("/restaurants", asyncError(fetchClientOwnedRestaurant));
router.get(
  "/restaurants/:id/menu/:menuId/details",
  asyncError(fetchMenuDetails)
);
router.put(
  "/restaurants/:id/editmenu/:menuId",
  upload.array("image"),
  asyncError(updateEditedMenu)
);
router.patch("/restaurants/deletemenu", asyncError(deleteMenu));

router.post("/logout", asyncError(logoutClient));
module.exports = router;
