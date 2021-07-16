const express = require("express");
const router = new express.Router();
const User = require("../models/user");
const auth = require("../middleware/auth");
const {
  sendWelcomeEmail,
  sendCancellationEmail,
} = require("../emails/account");
const multer = require("multer");
const sharp = require("sharp");

router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send("logged out");
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    req.token = null;
    await req.user.save();
    res.send("logged out All");
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
router.get("/users/me", auth, async (req, res) => {
  try {
    res.send({ user: req.user, token: req.token });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "age", "password", "email"];
  const isValidate = updates.every((update) => allowedUpdates.includes(update));
  if (!isValidate) res.status(400).send({ errors: "Invalid Update!!" });
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    // const user = await User.findByIdAndDelete(req.user._id);
    // if (!user) return res.status(404).send("user not found");
    await req.user.remove();
    sendCancellationEmail(req.user.email, req.user.name);
    res.send({ msg: "Deleted successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("File must be a IMAGE"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    // req.user.avatar = req.file.buffer;
    req.user.avatar = buffer;

    await req.user.save();
    return res.send("Uploaded !!");
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);
router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send("deleted");
  } catch (err) {
    res.send({ error: error.message });
  }
});
router.get("/users/:id/avatar", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error("Not found");
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (err) {
    res.status(404).send({ error: err.message });
  }
});
module.exports = router;
