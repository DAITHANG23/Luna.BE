import express from "express";
import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  refreshToken,
  restrictTo,
  verifyOtp,
  resendOtp,
  googleAuthCallback,
} from "../controllers/authController";

import {
  getMe,
  getUser,
  uploadUserPhoto,
  resizeUserPhoto,
  updateMe,
  deleteMe,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  singleUpload,
} from "../controllers/userController";
import passport from "../utils/passport";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resendOtp", resendOtp);
// router.get(
//   "/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );
// router.get(
//   "/google/callback",
//   passport.authenticate("google", { session: false }),
//   googleAuthCallback
// );

router.post("/logout", logout);
router.post("/refreshToken", refreshToken);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

// Protect all routes after this middleware
router.use(protect);

router.patch("/updateMyPassword", updatePassword);
router.get("/me", getMe, getUser);
router.patch(
  "/updateMe",
  uploadUserPhoto,
  singleUpload,
  resizeUserPhoto,
  updateMe
);
router.delete("/deleteMe", deleteMe);

router.use(restrictTo("admin"));

router.route("/").get(getAllUsers).post(createUser);

router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);
export default router;
