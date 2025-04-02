import express from "express";
import {
  getRestaurantStats,
  getAllRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  //   uploadRestaurantImages,
  //   resizeRestaurantImages,
  getDistances,
  getRestaurantsWithin,
} from "../controllers/restaurantController";

import { protect, restrictTo } from "../controllers/authController";
const router = express.Router();

// router.param('id', restaurantController.checkID);

// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews

// router.use('/:tourId/reviews', reviewRouter);

router.route("/restaurant-stats").get(getRestaurantStats);

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getRestaurantsWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

router.route("/distances/:latlng/unit/:unit").get(getDistances);

router
  .route("/")
  .get(getAllRestaurants)
  .post(protect, restrictTo("admin", "conceptManager"), createRestaurant);

router
  .route("/:id")
  .get(getRestaurant)
  .patch(
    protect,
    restrictTo("admin", "conceptManager"),
    // uploadRestaurantImages,
    // resizeRestaurantImages,
    updateRestaurant
  )
  .delete(protect, restrictTo("admin", "conceptManager"), deleteRestaurant);

export default router;
