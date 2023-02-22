const mongoose = require("mongoose");
const schema = mongoose.Schema;

const clientSchema = new schema({
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  restaurants: {
    type: schema.Types.ObjectId,
    ref: "restaurant",
  },
  passwordHashed: {
    type: String,
    required: true,
  },
});
module.exports = new mongoose.model("client", clientSchema);
