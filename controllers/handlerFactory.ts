import { NextFunction, Request, Response } from "express";
import { Model, Document, PopulateOptions } from "mongoose";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import APIFeatures from "../utils/apiFeatures";
import ConceptRestaurantModel from "../models/conceptModel";
import redis from "../utils/redis";

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
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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

export const getAll = <T extends Document>(Model: Model<T>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const hasFilterOrQuery =
      Object.keys(req.query).length > 0 || !!req.params.conceptId;

    // Chỉ dùng cache nếu là ConceptModel và không có filter hay query param nào
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
