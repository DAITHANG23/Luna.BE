import express from "express";
import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  verifyOtp,
  resendOtp,
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
  favoritesConcepts,
  deleteFavoriteConcept,
  deleteCheckInConcept,
  checkInConcept,
  // singleUpload,
} from "../controllers/userController";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resendOtp", resendOtp);

router.post("/logout", logout);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

// Protect all routes after this middleware
router.use(protect);

router.patch("/updateMyPassword", updatePassword);
router.get("/me", getMe, getUser);
router.patch(
  "/updateMe",
  uploadUserPhoto,
  // singleUpload,
  resizeUserPhoto,
  updateMe
);
router.post("/favorites", favoritesConcepts);
router.delete("/deleteFavoriteConcept", deleteFavoriteConcept);
router.post("/checkInConcept", checkInConcept);
router.delete("/deleteCheckInConcept", deleteCheckInConcept);
router.delete("/deleteMe", deleteMe);

router.use(restrictTo("admin", "restaurantManager", "conceptManager"));

router.route("/").get(getAllUsers).post(createUser);

router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);
export default router;
