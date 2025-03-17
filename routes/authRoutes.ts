import express from "express";

import passport from "../utils/passport";
import { googleAuthCallback } from "../controllers/authController";

const router = express.Router();
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleAuthCallback
);
export default router;
