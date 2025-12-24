import { NextFunction, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import sharp from 'sharp';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory';
import ConceptRestaurantModel from '../models/conceptModel';
import UserModel from '../models/userModel';
import redis from '../utils/redis';

const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new Error('Not an image! Please upload only images.') as unknown as null,
      false,
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadConceptImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

export const resizeConceptImages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.files) return next();

    const files = req.files as Record<string, Express.Multer.File[]>;

    if (!files.imageCover || !files.images) {
      return next(new AppError('Please provide imageCover and images', 400));
    }
    // 1) Cover image

    const processedBufferCoverImage = await sharp(files['imageCover'][0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toBuffer();

    req.body.imageCover = processedBufferCoverImage;

    // 2) Images
    req.body.images = [];

    await Promise.all(
      files.images.map(async (file, i) => {
        const processedBufferImages = await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toBuffer();

        req.body.images.push(processedBufferImages);
      }),
    );

    next();
  },
);

export const aliasTopConcept = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

export const getFavoriteConcepts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || '';

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing userId' });
    }
    const user = await UserModel.findById(userId)
      .select('favorites')
      .populate('favorites');
    const favoriteConceptsData = user?.favorites || [];

    res.status(200).json({
      status: 'Success',
      data: {
        data: favoriteConceptsData,
      },
    });
  },
);

export const getCheckInConcepts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || '';

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing userId' });
    }
    const user = await UserModel.findById(userId)
      .select('checkInConcepts')
      .populate('checkInConcepts');
    const checkInConceptsData = user?.checkInConcepts || [];

    res.status(200).json({
      status: 'Success',
      data: {
        data: checkInConceptsData,
      },
    });
  },
);

export const conceptReviewPost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { conceptId, score, content } = req.body;

    if (!conceptId || typeof conceptId !== 'string') {
      return next(new AppError('Invalid or missing conceptId', 400));
    }

    const concept = await ConceptRestaurantModel.findOne({ _id: conceptId });
    if (!concept) {
      return next(new AppError('Not find concept', 404));
    }

    const oldCount = concept.reviews.length;
    const oldAvg = concept.avgRatings || 0;

    const newAvg = parseFloat(
      ((oldAvg * oldCount + score) / (oldCount + 1)).toFixed(1),
    );

    const newConcept = await ConceptRestaurantModel.findByIdAndUpdate(
      conceptId,
      {
        $push: { reviews: content },
        avgRatings: newAvg,
      },
      { new: true },
    );

    await redis.del('concepts:all');

    res.status(200).json({
      status: 'Success',
      data: {
        data: newConcept,
      },
    });
  },
);
export const getAllConcepts = getAll(ConceptRestaurantModel, {
  cacheKey: 'concepts:all',
  cacheTTL: 3600,

  async postProcess(docs) {
    return docs.map(doc => {
      const { profit, totalProfit, ...rest } = doc.toObject();
      return rest;
    });
  },
});
export const getConcept = getOne(ConceptRestaurantModel, { path: 'reviews' });
export const createConcept = createOne(ConceptRestaurantModel);
export const updateConcept = updateOne(ConceptRestaurantModel);
export const deleteConcept = deleteOne(ConceptRestaurantModel);

export const getConceptStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await ConceptRestaurantModel.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$type' },
          numRestaurants: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  },
);
