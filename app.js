const express = require("express");
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

app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        // Add other directives as needed
      },
    })
  );
//   app.use((req, res, next) => {
//     res.setHeader(
//       "Content-Security-Policy",
//       "default-src 'self'; font-src 'self' https://fonts.gstatic.com;"
//     );
//     next();
//   });
app.use("/", indexRouter);
app.use("/user", userRouter);
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
