import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import {
  deleteNotification,
  getAllNotifications,
  getNotification,
  checkReadNotification,
} from "../controllers/notificationController";
const router = express.Router();

router.route("/").get(protect, restrictTo("customer"), getAllNotifications);
router.patch("/checkReadNotification", checkReadNotification);
router
  .route("/:id")
  .get(getNotification)
  .delete(protect, restrictTo("customer"), deleteNotification);
export default router;
