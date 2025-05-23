import mongoose, { Schema } from "mongoose";
import { IBooking } from "../@types";

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, default: "PENDING" },
    updatedAt: { type: Date, default: Date.now },
    updateBy: { type: String, default: "" },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema<IBooking>({
  customer: {
    type: Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  timeOfBooking: {
    type: String,
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  numberPhone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  peopleQuantity: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    num: [
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED_BY_USER",
      "CANCELLED_BY_ADMIN",
      "NO_SHOW",
    ],
    default: "PENDING",
  },
  statusHistory: [statusHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
bookingSchema.pre("save", function (next) {
  const updater = this._updateBy || this.fullName || "";
  if (this.isNew) {
    this.statusHistory = [
      {
        status: "PENDING",
        updateBy: updater,
        updatedAt: new Date(),
      },
    ];
  } else if (this.isModified("status") && this.statusHistory) {
    this.statusHistory.push({
      status: this.status,
      updateBy: updater,
      updatedAt: new Date(),
    });
  }
  next();
});
const BookingModel = mongoose.model("Booking", bookingSchema);
export default BookingModel;
