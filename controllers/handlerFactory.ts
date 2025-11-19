import { NextFunction, Request, Response } from "express";
import { Model, Document, PopulateOptions } from "mongoose";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import APIFeatures from "../utils/apiFeatures";
import ConceptRestaurantModel from "../models/conceptModel";
import redis from "../utils/redis";
import BookingModel from "../models/bookingModel";
import {
  emitBookingCanceled,
  emitBookingCompleted,
  emitBookingConfirmed,
  emitBookingCreated,
} from "../socket/bookingRestaurant/BookingRestaurant";
import NotificationModel from "../models/notificationModel";

export const deleteOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
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
        }
      );
      if (!docBooking) {
        return next(new AppError("No document found with that ID", 404));
      }

      if (req.body.status === "CANCELLED_BY_ADMIN") {
        emitBookingCanceled(docBooking);
      } else if (req.body.status === "CONFIRMED") {
        emitBookingConfirmed(docBooking);
      } else if (req.body.status === "COMPLETED") {
        emitBookingCompleted(docBooking);
      }
    }

    if (Model.modelName === ConceptRestaurantModel.modelName) {
      await redis.del("concepts:all");
    }

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
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
      status: "success",
      data: {
        data: doc,
      },
    });
  });

export const getOne = <T extends Document>(
  Model: Model<T>,
  popOptions?: PopulateOptions | (string | PopulateOptions)[]
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return next(new AppError("Please provide a valid id", 400));
    }
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

export const getAll = <T extends Document>(
  Model: Model<T>,
  popOptions?: PopulateOptions | (string | PopulateOptions)[]
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const hasFilterOrQuery =
      Object.keys(req.query).length > 0 || !!req.params.conceptId;

    const idUser = req.user?._id;
    const roleUser = req.user?.role;

    const idRestaurant = req.body?.restaurantId;

    const limit = parseInt(req.query.limit as string) || 100;

    const cursor = req.query.cursor ? String(req.query.cursor).trim() : "";

    if (
      Model.modelName === ConceptRestaurantModel.modelName &&
      !hasFilterOrQuery
    ) {
      const cache = await redis.get("concepts:all");

      if (cache) {
        const data = JSON.parse(cache);

        return res.status(200).json({
          status: "success",
          results: data.length,
          data: { data },
          source: "redis",
        });
      }
    }

    //notifications
    if (
      Model.modelName === NotificationModel.modelName &&
      idUser &&
      roleUser === "customer"
    ) {
      let allNotifications = [];
      const query: any = { recipient: idUser };

      // Nếu có cursor, lấy notifications TRƯỚC cursor đó
      if (cursor) {
        query._id = { $lt: cursor };
      }

      allNotifications = await NotificationModel.find(query)
        .sort("-createdAt")
        .limit(limit + 1);

      const hasMore = allNotifications.length > limit;

      // Trả về chỉ limit items
      const dataToReturn = hasMore
        ? allNotifications.slice(0, limit)
        : allNotifications;

      // Lấy cursor cho page tiếp theo
      const nextCursor =
        dataToReturn.length > 0
          ? dataToReturn[dataToReturn.length - 1]._id
          : null;

      return res.status(200).json({
        status: "success",
        results: dataToReturn?.length,
        data: { data: dataToReturn },
        nextCursor,
        hasMore,
      });
    }

    if (
      Model.modelName === BookingModel.modelName &&
      idUser &&
      roleUser === "customer"
    ) {
      let allBookingOfCustomer = BookingModel.find({
        customer: idUser,
      }).sort("-createdAt");
      if (popOptions)
        allBookingOfCustomer = allBookingOfCustomer.populate(popOptions);
      const doc = await allBookingOfCustomer;
      return res.status(200).json({
        status: "success",
        result: doc.length,
        data: { data: doc },
      });
    }

    if (
      Model.modelName === BookingModel.modelName &&
      idRestaurant &&
      roleUser !== "customer"
    ) {
      const allBookingOfRestaurant = await BookingModel.find({
        restaurant: idRestaurant,
      }).sort("-createdAt");

      return res.status(200).json({
        status: "success",
        result: allBookingOfRestaurant.length,
        data: { data: allBookingOfRestaurant },
      });
    }

    // Xử lý filter nếu có conceptId
    let filter = {};
    if (req.params.conceptId) filter = { concept: req.params.conceptId };

    // Sử dụng APIFeatures với query param từ client (filter, sort, pagination...)
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitField()
      .pagination();

    const doc = await features.query;

    const sanitizedDocs = doc.map((item: any) => {
      const { profit, totalProfit, ...rest } = item.toObject();
      return rest;
    });

    if (
      Model.modelName === ConceptRestaurantModel.modelName &&
      !hasFilterOrQuery
    ) {
      await redis.set(
        "concepts:all",
        JSON.stringify(sanitizedDocs),
        "EX",
        3600
      );
    }

    res.status(200).json({
      status: "success",
      results: sanitizedDocs.length,
      data: { data: sanitizedDocs },
    });
  });
