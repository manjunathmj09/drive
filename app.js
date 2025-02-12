const express = require("express");
const router = express.Router();
const helmet = require("helmet");
const dotenv = require("dotenv");
dotenv.config();
const connectToDB = require("./config/db.js");
const cookieParser = require("cookie-parser");
const indexRouter = require("./routes/index.routes.js");
const userRouter = require("./routes/user.routes.js");

connectToDB();
const app = express();

const port = process.env.PORT || 4000;

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/", indexRouter);
app.use("/user", userRouter);
// app.listen(port, '0.0.0.0', () => {
//     console.log(`Server is running on port ${port}`);
// });
app.listen(3000, () => {
    console.log(`Server is running on port ${port}`);
});
