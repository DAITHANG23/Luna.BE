import { NextFunction, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import sharp from "sharp";
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from "./handlerFactory";
import ConceptRestaurant from "../models/conceptModel";

const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new Error("Not an image! Please upload only images.") as unknown as null,
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadConceptImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

export const resizeConceptImages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.files) return next();

    const files = req.files as Record<string, Express.Multer.File[]>;

    if (!files.imageCover || !files.images) {
      return next(new AppError("Please provide imageCover and images", 400));
    }
    // 1) Cover image

    const processedBufferCoverImage = await sharp(files["imageCover"][0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toBuffer();

    req.body.imageCover = processedBufferCoverImage;

    // 2) Images
    req.body.images = [];

    await Promise.all(
      files.images.map(async (file, i) => {
        const processedBufferImages = await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toBuffer();

        req.body.images.push(processedBufferImages);
      })
    );

    next();
  }
);

export const aliasTopConcept = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

export const getAllConcepts = getAll(ConceptRestaurant);
export const getConcept = getOne(ConceptRestaurant, { path: "reviews" });
export const createConcept = createOne(ConceptRestaurant);
export const updateConcept = updateOne(ConceptRestaurant);
export const deleteConcept = deleteOne(ConceptRestaurant);

export const getConceptStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await ConceptRestaurant.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: "$type" },
          numRestaurants: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  }
);
