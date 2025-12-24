import { NextFunction, Request, Response } from 'express';
import { Model, Document, PopulateOptions } from 'mongoose';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import APIFeatures from '../utils/apiFeatures';
import ConceptRestaurantModel from '../models/conceptModel';
import redis from '../utils/redis';
import BookingModel from '../models/bookingModel';
import {
  emitBookingCanceled,
  emitBookingCompleted,
  emitBookingConfirmed,
  emitBookingCreated,
} from '../socket/bookingRestaurant/BookingRestaurant';
import NotificationModel from '../models/notificationModel';

export const deleteOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

export const updateOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const nameUser = req.user?.fullName;

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (Model.modelName === BookingModel.modelName) {
      const bookingItem = await BookingModel.findById(req.params.id);

      const updateBookingHistory = {
        status: req.body.status,
        updatedAt: new Date(),
        updateBy: nameUser,
      };

      const formatBody = {
        status: req.body.status,
        statusHistory: [
          ...(bookingItem?.statusHistory ?? []),
          updateBookingHistory,
        ],
      };

      const docBooking = await BookingModel.findByIdAndUpdate(
        req.params.id,
        formatBody,
        {
          new: true,
          runValidators: true,
        },
      );
      if (!docBooking) {
        return next(new AppError('No document found with that ID', 404));
      }

      if (req.body.status === 'CANCELLED_BY_ADMIN') {
        emitBookingCanceled(docBooking);
      } else if (req.body.status === 'CONFIRMED') {
        emitBookingConfirmed(docBooking);
      } else if (req.body.status === 'COMPLETED') {
        emitBookingCompleted(docBooking);
      }
    }

    if (Model.modelName === ConceptRestaurantModel.modelName) {
      await redis.del('concepts:all');
    }

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const createOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.create(req.body);

    if (Model.modelName === BookingModel.modelName) {
      emitBookingCreated(doc);
    }
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const getOne = <T extends Document>(
  Model: Model<T>,
  popOptions?: PopulateOptions | (string | PopulateOptions)[],
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return next(new AppError('Please provide a valid id', 400));
    }
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const getAll = <T extends Document>(
  Model: Model<T>,
  options?: {
    filterBuilder?: (req: Request) => Record<string, any>;
    preQuery?: (query: any, req: Request) => any;
    postProcess?: (docs: T[], req: Request) => any;
    cacheKey?: string;
    cacheTTL?: number;
  },
) =>
  catchAsync(async (req: Request, res: Response) => {
    if (options?.cacheKey && Object.keys(req.query).length === 0) {
      const cached = await redis.get(options.cacheKey);
      if (cached) {
        return res.status(200).json({
          status: 'success',
          results: JSON.parse(cached).length,
          data: { data: JSON.parse(cached) },
        });
      }
    }
    const filter = options?.filterBuilder?.(req) || {};

    let query = Model.find(filter);

    if (options?.preQuery) {
      query = options.preQuery(query, req);
    }

    const features = new APIFeatures(query, req.query)
      .filter()
      .sort()
      .limitField()
      .pagination();

    let docs = await features.query;

    if (options?.postProcess) {
      docs = await options.postProcess(docs, req);
    }

    if (options?.cacheKey && Object.keys(req.query).length === 0) {
      await redis.set(
        options.cacheKey,
        JSON.stringify(docs),
        'EX',
        options.cacheTTL || 3600,
      );
    }

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: { data: docs },
    });
  });
