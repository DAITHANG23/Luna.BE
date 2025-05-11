import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import {
  createConcept,
  deleteConcept,
  getAllConcepts,
  getConcept,
  getFavoriteConcepts,
  resizeConceptImages,
  updateConcept,
  uploadConceptImages,
  getCheckInConcepts,
  conceptReviewPost,
} from "../controllers/conceptController";

const router = express.Router();

router
  .route("/")
  .get(getAllConcepts)
  .post(protect, restrictTo("admin"), createConcept);

router.get("/favoriteConcepts", protect, getFavoriteConcepts);
router.get("/getCheckInConcepts", protect, getCheckInConcepts);
router.post("/review", protect, conceptReviewPost);
router
  .route("/:id")
  .get(getConcept)
  .patch(
    protect,
    restrictTo("admin", "conceptManager", "customer"),
    uploadConceptImages,
    resizeConceptImages,
    updateConcept
  )
  .delete(protect, restrictTo("admin", "conceptManager"), deleteConcept);

export default router;
