const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const schema = mongoose.Schema;

const userSchema = new schema({
  email: {
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
userSchema.plugin(passportLocalMongoose);
module.exports = new mongoose.model("user", userSchema);
