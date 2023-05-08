const cities = require("../models/cities");
const { asyncError } = require("../middleware");
const express = require("express");
const router = express.Router();

const capitalize = (word) => {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
};

router.post(
  "/cities",
  asyncError(async (req, res) => {
    const { query } = req.body;
    const citiesData = await cities.find({
      name: { $regex: `${query}`, $options: "i" },
    });
    citiesData
      ? res.json({ success: true, locations: citiesData })
      : res.json({ success: false });
  })
);

router.get(
  "/city/:id",
  asyncError(async (req, res) => {
    const { id } = req.params;
    const targetCity = await cities.findById(id).populate("restaurants");
    targetCity
      ? res.json({ success: true, restaurants: targetCity })
      : res.json({ success: false, message: "Oops ! unable to fetch that" });
  })
);

router.get(
  "/cities/search/:cityName",
  asyncError(async (req, res) => {
    const { cityName } = req.params;
    const targetName = capitalize(cityName);
    const data = await cities
      .find({ name: targetName })
      .populate("restaurants");
    res.send(data);
  })
);
module.exports = router;
