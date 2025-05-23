import { NextFunction, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import sharp from "sharp";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import {
  getOne,
  getAll,
  updateOne,
  deleteOne,
  createOne,
} from "../controllers/handlerFactory";
import Restaurant from "../models/restaurantModel";
import ConceptRestaurantModel from "../models/conceptModel";
import mongoose from "mongoose";
// const multerStorage = multer.memoryStorage();

// const multerFilter = (
//   req: Request,
//   file: Express.Multer.File,
//   cb: FileFilterCallback
// ) => {
//   if (file.mimetype.startsWith("image")) {
//     cb(null, true);
//   } else {
//     cb(
//       new Error("Not an image! Please upload only images.") as unknown as null,
//       false
//     );
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// export const uploadRestaurantImages = upload.fields([
//   { name: "imageCover", maxCount: 1 },
//   { name: "images", maxCount: 3 },
// ]);

// export const resizeRestaurantImages = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     if (!req.files) return next();

//     const files = req.files as Record<string, Express.Multer.File[]>;

//     if (!files.imageCover || !files.images) {
//       return next(new AppError("Please provide imageCover and images", 400));
//     }
//     // 1) Cover image

//     const processedBufferCoverImage = await sharp(files["imageCover"][0].buffer)
//       .resize(2000, 1333)
//       .toFormat("jpeg")
//       .jpeg({ quality: 90 })
//       .toBuffer();

//     req.body.imageCover = processedBufferCoverImage;

//     // 2) Images
//     req.body.images = [];

//     await Promise.all(
//       files.images.map(async (file, i) => {
//         const processedBufferImages = await sharp(file.buffer)
//           .resize(2000, 1333)
//           .toFormat("jpeg")
//           .jpeg({ quality: 90 })
//           .toBuffer();

//         req.body.images.push(processedBufferImages);
//       })
//     );

//     next();
//   }
// );

export const getAllRestaurantsInConcept = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const searchText = req.query.searchText as string;

    if (!id || typeof id !== "string") {
      return next(new AppError("Please provide id concept", 400));
    }

    const concept = await ConceptRestaurantModel.findById(id);

    if (!concept) {
      return next(new AppError("Concept is not exited !", 400));
    }

    let filterObj: any = { concept: new mongoose.Types.ObjectId(id as string) };
    if (searchText) {
      filterObj.$or = [
        { name: { $regex: searchText, $options: "i" } },
        { type: { $regex: searchText, $options: "i" } },
        { address: { $regex: searchText, $options: "i" } },
      ];
    }

    const restaurants = await Restaurant.find(filterObj);

    res.status(200).json({
      status: "success",
      results: restaurants.length,
      data: {
        restaurants,
      },
    });
  }
);

export const getAllRestaurants = getAll(Restaurant);
export const getRestaurant = getOne(Restaurant, { path: "reviews" });
export const createRestaurant = createOne(Restaurant);
export const updateRestaurant = updateOne(Restaurant);
export const deleteRestaurant = deleteOne(Restaurant);

export const getRestaurantStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await Restaurant.aggregate([
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

export const getRestaurantsWithin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { distance, latlng, unit } = req.params as {
      distance: string;
      latlng: string;
      unit: "mi" | "km";
    };
    const [lat, lng] = latlng.split(",");

    const parsedDistance = parseFloat(distance);

    const radius =
      unit === "mi" ? parsedDistance / 3963.2 : parsedDistance / 6378.1;

    if (!lat || !lng) {
      next(
        new AppError(
          "Please provide latitutr and longitude in the format lat,lng.",
          400
        )
      );
    }

    const tours = await Restaurant.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: "success",
      results: tours.length,
      data: {
        data: tours,
      },
    });
  }
);

export const getDistances = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { latlng, unit } = req.params as { latlng: string; unit: string };

    const parts = latlng.split(",");
    if (parts.length !== 2) {
      return next(
        new AppError(
          "Please provide latitude and longitude in the format lat,lng.",
          400
        )
      );
    }
    const [lat, lng] = parts.map(Number);
    if (isNaN(lat) || isNaN(lng)) {
      return next(new AppError("Invalid latitude or longitude values.", 400));
    }

    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    if (!lat || !lng) {
      next(
        new AppError(
          "Please provide latitutr and longitude in the format lat,lng.",
          400
        )
      );
    }

    const distances = await Restaurant.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng * 1, lat * 1],
          },
          distanceField: "distance",
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        data: distances,
      },
    });
  }
);
