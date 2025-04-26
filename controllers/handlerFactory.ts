import { NextFunction, Request, Response } from "express";
import { Model, Document, PopulateOptions } from "mongoose";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import APIFeatures from "../utils/apiFeatures";

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
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.conceptId) filter = { concept: req.params.conceptId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitField()
      .pagination();
    // const doc = await features.query.explain();
    const doc = await features.query;

    const sanitizedDocs = doc.map((item: any) => {
      const { profit, totalProfit, ...rest } = item.toObject();
      return rest;
    });
    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: sanitizedDocs.length,
      data: {
        data: sanitizedDocs,
      },
    });
  });
