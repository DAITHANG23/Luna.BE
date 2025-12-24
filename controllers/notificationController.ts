import { NextFunction, Request, Response } from "express";
import NotificationModel from "../models/notificationModel";
import catchAsync from "../utils/catchAsync";
import { deleteOne, getAll, getOne } from "./handlerFactory";
import AppError from "../utils/appError";

export const checkReadNotification = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.body;
    if (!id) {
      return next(new AppError("Please provide ID of notification", 400));
    }

    const updatedUser = await NotificationModel.findByIdAndUpdate(
      id,
      {
        read: true,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: { data: updatedUser },
    });
  }
);

export const getAllNotifications = getAll(NotificationModel,  {
  filterBuilder(req) {
    if (req.user?.role === "customer") {
      return { recipient: req.user._id };
    }
    return {};
  },

  preQuery(query, req) {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    return query
      .sort("-createdAt")
      .skip(offset)
      .limit(limit);
  },
});
export const getNotification = getOne(NotificationModel, {
  path: "restaurant recipient",
});
export const deleteNotification = deleteOne(NotificationModel);
