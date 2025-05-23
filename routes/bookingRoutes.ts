import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import {
  createBooking,
  deleteBooking,
  getBooking,
  updateBooking,
} from "../controllers/bookingController";
const router = express.Router();

router.route("/").post(protect, restrictTo("customer"), createBooking);

router
  .route("/:id")
  .get(getBooking)
  .patch(protect, restrictTo("admin", "conceptManager"), updateBooking)
  .delete(
    protect,
    restrictTo("admin", "conceptManager", "customer"),
    deleteBooking
  );
export default router;
