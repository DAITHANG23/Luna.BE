import mongoose, { Schema, Types } from "mongoose";
import { IRestaurant, Dish } from "../@types";

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
  concept: { type: Schema.Types.ObjectId, ref: "Concept", required: true },
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
    min: 0,
    max: 5,
    require: [true, "Restaurant must be have ratings."],
  },
  timeSlot: [
    {
      startTime: String,
      endTime: String,
      available: Boolean,
    },
  ],
  dishes: [
    {
      name: { type: String, required: true },
      description: { type: String },
      type: { type: String, required: true },
      image: { type: String },
      price: { type: Number, required: true },
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
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
  ],
  type: {
    type: String,
    enum: ["HOTPOT", "BBQ", "JAPANESE", "STEAK HOUSE", "OTHER"],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
