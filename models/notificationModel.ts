import mongoose from "mongoose";
import { INotification } from "../@types";
import { Schema } from "mongoose";

const notificationSchema = new mongoose.Schema<INotification>({
  read: { type: Boolean, required: true, default: false },
  title: { type: String, required: true },
  message: { type: String, required: true },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  //   booking: {
  //     type: Schema.Types.ObjectId,
  //     ref: "BookingModel",
  //     required: true,
  //   },
  numberOfGuests: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "bookingCreated",
      "bookingConfirmed",
      "bookingCanceled",
      "bookingReminder",
      "bookingCompleted",
      "bookingInProgress",
    ],
    required: true,
  },
  bookingDate: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const NotificationModel = mongoose.model("Notification", notificationSchema);
export default NotificationModel;
