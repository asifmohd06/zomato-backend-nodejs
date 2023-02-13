require("dotenv").config();

// basic setup
const express = require("express");
const mongoose = require("mongoose");
const dbUrl = process.env.MONGO_DB_URL;
const routes = require("./routes/routes");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

//Authentication
const session = require("express-session");
// const session = require("cookie-session");
const passport = require("passport");
const localStrategy = require("passport-local");
const mongoDbStore = require("connect-mongo");
const secret = process.env.SECRET;
const client = require("./models/clients");

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

// app.use(
//   cors({
//     origin: [
//       "https://zomato06.netlify.app",
//       "https://zomato-zar0.onrender.com",
//     ],
//     methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
//     credentials: true,
//   })
// );

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin === "https://zomato06.netlify.app" ||
    origin === "https://zomato-zar0.onrender.com"
  ) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//for auth
const store = mongoDbStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 3600,
  crypto: {
    secret,
  },
});

const sessionConfig = {
  store,
  name: "session",
  secret,
  resave: true,
  saveUninitialized: true,
  cookie: {
    httponly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));

app.use(passport.session());
app.use(passport.initialize());
passport.use(new localStrategy(client.authenticate()));
passport.serializeUser(client.serializeUser());
passport.deserializeUser(client.deserializeUser());
//

app.listen(PORT, () => {
  console.log("listening to port 5000");
});

app.use("/api", routes);
