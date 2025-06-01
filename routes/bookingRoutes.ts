import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import {
  createBooking,
  deleteBooking,
  getBooking,
  updateBooking,
  getAllBookings,
} from "../controllers/bookingController";
const router = express.Router();

router
  .route("/")
  .get(
    protect,
    restrictTo(
      "customer",
      "admin",
      "user",
      "restaurantManager",
      "conceptManager"
    ),
    getAllBookings
  )
  .post(protect, restrictTo("customer"), createBooking);

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
