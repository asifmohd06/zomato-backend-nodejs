const mongoose = require("mongoose");
const schema = mongoose.Schema;

const imageSchema = new schema({
  url: String,
  fileName: String,
});

const menuImageSchema = new schema({
  url: String,
  fileName: String,
});

const menuSchema = new schema({
  menuName: String,
  type: {
    type: String,
    enum: ["Veg", "Non-veg"],
  },
  quantityType: {
    type: String,
    enum: ["Portion", "Full"],
  },
  minQuantity: Number,
  basePrice: Number,
  images: [menuImageSchema],
});

const restaurantSchema = new schema({
  name: {
    type: String,
    required: true,
  },
  city: String,
  category: String,
  owner: {
    type: schema.Types.ObjectId,
    ref: "user",
  },
  images: [imageSchema],
  menu: [menuSchema],
});
module.exports = new mongoose.model("restaurant", restaurantSchema);
