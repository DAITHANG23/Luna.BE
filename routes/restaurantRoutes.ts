import express from "express";
import {
  getRestaurantStats,
  getAllRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getDistances,
  getRestaurantsWithin,
  getAllRestaurantsInConcept,
} from "../controllers/restaurantController";

import { protect, restrictTo } from "../controllers/authController";
const router = express.Router();

router.route("/restaurant-stats").get(getRestaurantStats);

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getRestaurantsWithin);

router.route("/distances/:latlng/unit/:unit").get(getDistances);

router
  .route("/")
  .get(getAllRestaurants)
  .post(protect, restrictTo("admin", "conceptManager"), createRestaurant);

router.get("/restaurantsOfConcept/:id", getAllRestaurantsInConcept);

router
  .route("/:id")
  .get(getRestaurant)
  .patch(protect, restrictTo("admin", "conceptManager"), updateRestaurant)
  .delete(protect, restrictTo("admin", "conceptManager"), deleteRestaurant);

export default router;
