import BookingModel from "../models/bookingModel";
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from "./handlerFactory";

export const getAllBookings = getAll(BookingModel, { path: "restaurant" });
export const getBooking = getOne(BookingModel);
export const createBooking = createOne(BookingModel);
export const updateBooking = updateOne(BookingModel);
export const deleteBooking = deleteOne(BookingModel);
