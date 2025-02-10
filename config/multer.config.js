const multer = require("multer");

const storage = multer.memoryStorage({
  unique: true,
});
const upload = multer({ storage });

module.exports = upload;
