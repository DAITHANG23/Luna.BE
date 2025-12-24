import BookingModel from "../models/bookingModel";
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from "./handlerFactory";

export const getAllBookings = getAll(BookingModel, { 
  filterBuilder(req) {
    const user = req.user;

    if(user?.role === 'customer') {
      return {customer: user._id}
    }

    if(req.body?.restaurantId) {
      return {restaurant: req.body.restaurantId}
    }

    return {}
  },

  preQuery(query) {
    return query.sort("-createdAt").populate('restaurant')
  }
 });
export const getBooking = getOne(BookingModel, { path: "restaurant" });
export const createBooking = createOne(BookingModel);
export const updateBooking = updateOne(BookingModel);
export const deleteBooking = deleteOne(BookingModel);
