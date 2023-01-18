require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const mongoUrl = process.env.MONGO_DB_URL;
const routes = require("./routes/routes");
const cors = require("cors");

mongoose.connect("mongodb://localhost:27017/zomato" || mongoUrl);
const dataBase = mongoose.connection;

dataBase.on("error", (error) => {
  console.log(error);
});
dataBase.once("connected", () => {
  console.log("database connected");
});

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(
  cors({
    origin: "*",
  })
);

app.listen(5000, () => {
  console.log("listening to port 5000");
});

app.use("/api", routes);
