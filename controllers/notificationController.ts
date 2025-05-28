import NotificationModel from "../models/notificationModel";
import { deleteOne, getAll, getOne } from "./handlerFactory";

export const getAllNotifications = getAll(NotificationModel);
export const getNotification = getOne(NotificationModel);
export const deleteNotification = deleteOne(NotificationModel);
