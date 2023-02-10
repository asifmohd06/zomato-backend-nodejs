const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const schema = mongoose.Schema;

const clientSchema = new schema({
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
clientSchema.plugin(passportLocalMongoose);
module.exports = new mongoose.model("client", clientSchema);
