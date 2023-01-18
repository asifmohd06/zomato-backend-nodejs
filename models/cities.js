const mongoose = require("mongoose");
const schema = mongoose.Schema;

const citySchema = new schema({
  name: {
    type: String,
    required: true,
  },
  restaurants: [
    {
      type: schema.Types.ObjectId,
      ref: "restaurant",
    },
  ],
});
module.exports = new mongoose.model("city", citySchema);
