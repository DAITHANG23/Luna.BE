import mongoose, { Schema, Types } from "mongoose";
import { IRestaurant, Dish } from "../@types";

const dishSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
});

const restaurantSchema = new mongoose.Schema<IRestaurant>({
  name: { type: String, require: [true, "Please provider name."] },
  description: {
    type: String,
    require: [true, "Please provider description."],
  },
  address: { type: String, require: [true, "Please provider address."] },
  numberPhone: {
    type: String,
    require: [true, "Please provider number phone."],
  },
  bookingManager: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Concept must have a manager"],
  },
  staffs: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  ratings: {
    type: Number,
    require: [true, "Restaurant must be have ratings."],
  },
  timeSlot: {
    type: String,
    required: [true, "Restaurant must be have time slot."],
  },
  dishes: [
    {
      type: dishSchema,
    },
  ],
  images: [{ type: String }],
  ratingsQuantity: {
    type: Number,
    required: [true, "Restaurant must be have ratings quantity."],
  },
  priceDiscount: {
    type: Number,
    required: [true, "Restaurant must be have price discount."],
  },
  summary: {
    type: String,
    required: [true, "Restaurant must be have summary."],
  },
  imageCover: {
    type: String,
    required: [true, "Restaurant must be have imageCover."],
  },
  active: {
    type: Boolean,
    default: true,
  },
  locations: [
    {
      type: String,
      required: [true, "Restaurant must be have imageCover."],
    },
  ],
  type: {
    type: String,
    required: [true, "Restaurant must be have type."],
  },
  voucher: {
    type: String,
    required: [true, "Restaurant must be have voucher."],
  },
  profit: {
    type: Number,
    required: [true, "Restaurant must be have profit."],
  },
  totalSale: {
    type: Number,
    required: [true, "Restaurant must be have total sale."],
  },
  totalExpense: {
    type: Number,
    required: [true, "Restaurant must be have total xxpense."],
  },
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
