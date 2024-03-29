require("dotenv").config();

// basic setup
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const localDbUrl = "mongodb://localhost:27017/zomato";
const localOrigin = process.env.LOCAL_ORIGIN;
const dbUrl = process.env.MONGO_DB_URL;
const mainOrigin = process.env.MAIN_ORIGIN;
const clientRoute = require("./routes/client");
const routes = require("./routes/users");
const client = require("./models/clients");
const jwtSecret = process.env.TOKEN_SECRET;
const PORT = 5000;

//Authentication
mongoose.connect(dbUrl);

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

app.use(
  cors({
    origin: mainOrigin,
  })
);
app.use(async (req, res, next) => {
  try {
    const getTokenFrom = (req) => {
      const authorization = req.get("Authorization");
      if (authorization && authorization.startsWith("Bearer ")) {
        return authorization.replace("Bearer ", "");
      }
      return null;
    };
    const isTokenAvailable = getTokenFrom(req);
    if (
      isTokenAvailable &&
      isTokenAvailable !== "undefined" &&
      isTokenAvailable !== "null"
    ) {
      const decodedToken = jwt.verify(isTokenAvailable, jwtSecret);
      //  if (!decodedToken) return next();
      const user = await client.findById(decodedToken.id);
      if (user) {
        req.user = user;
      }
      next();
    } else {
      next();
    }
  } catch (error) {
    console.log(`error = ${error}`);
    next();
  }
});

app.listen(PORT, () => {
  console.log("listening to port 5000");
});

app.use("/api/users", routes);
app.use("/api/clients", clientRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});
