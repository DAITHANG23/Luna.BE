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

export const getAllNotifications = getAll(NotificationModel);
export const getNotification = getOne(NotificationModel);
export const deleteNotification = deleteOne(NotificationModel);
