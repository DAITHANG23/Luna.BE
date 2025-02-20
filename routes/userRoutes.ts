import express from "express";
import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
} from "../controllers/authController";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/logout", logout);

router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

// Protect all routes after this middleware
router.use(protect);

router.patch("/updateMyPassword", updatePassword);
export default router;
