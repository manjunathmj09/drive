const express = require("express");
const router = express.Router();
const upload = require("../config/multer.config.js");
const { getSupabaseWithAuth } = require("../config/supabase.config.js");
const fileModel = require("../models/files.model.js");
const authMiddleware = require("../middleware/auth.js");

router.get("/home", authMiddleware, async (req, res) => {
  try {
    const userFiles = await fileModel.find({ user: req.user.userId });

    res.render("home", { files: userFiles });
  } catch (error) {
    console.error("Error fetching user files:", error);
    res.status(500).render("error", {
      message: "Failed to load files. Please try again later.",
    });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/user/login");
});

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const token =
        req.cookies.token || req.headers.authorization?.split(" ")[1];
      const supabaseWithAuth = getSupabaseWithAuth(token);
      const fileName = `${Date.now()}_${req.file.originalname}`;
      const { data, error } = await supabaseWithAuth.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });
      const newFile = await fileModel.create({
        path: fileName,
        originalname: req.file.originalname,
        user: req.user.userId,
      });

      if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token found" });
      }

      if (error) throw error;

      const { publicUrl } = supabaseWithAuth.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(fileName);

      res.redirect("/home");
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

router.get("/download/:path", authMiddleware, async (req, res) => {
  const loggedInUserId = req.user.userId;
  const path = req.params.path;
  const file = await fileModel.findOne({
    user: loggedInUserId,
    path: path,
  });
  if (!file) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  const supabaseWithAuth = getSupabaseWithAuth(token);
  const { data } = await supabaseWithAuth.storage
    .from(process.env.SUPABASE_BUCKET)
    .createSignedUrl(file.path, 60);
  const response = await fetch(data.signedUrl);
  const fileBuffer = await response.arrayBuffer();
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${file.originalname}"`
  );
  res.setHeader("Content-Type", response.headers.get("content-type"));
  res.send(Buffer.from(fileBuffer));
});

router.get("/delete/:path", authMiddleware, async (req, res) => {
  try {
    const loggedInUserId = req.user.userId;
    const path = req.params.path;

    const file = await fileModel.findOne({
      user: loggedInUserId,
      path: path,
    });

    if (!file) {
      return res
        .status(404)
        .json({ message: "File not found or unauthorized" });
    }

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    const supabaseWithAuth = getSupabaseWithAuth(token);

    const { error } = await supabaseWithAuth.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([file.path]);

    if (error) {
      throw new Error("Failed to delete file from Supabase");
    }

    await fileModel.deleteOne({ _id: file._id });

    res.redirect("/home");
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
