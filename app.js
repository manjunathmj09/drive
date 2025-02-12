const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const connectToDB = require("./config/db.js");
const cookieParser = require("cookie-parser");
const indexRouter = require("./routes/index.routes.js");
const userRouter = require("./routes/user.routes.js");

connectToDB();
const app = express();

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", indexRouter);
app.use("/user", userRouter);
const port = process.env.PORT
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
