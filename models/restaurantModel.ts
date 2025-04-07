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
  ratingsQuantity: {
    type: Number,
    required: [true, "Restaurant must be have ratings quantity."],
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, "Rating must be above 1.0"],
    max: [5, "Rating must be below 5.0"],
    set: (val: number) => Math.round(val * 10) / 10,
  },
  priceDiscount: {
    type: Number,
    required: [true, "Restaurant must be have price discount."],
  },
  summary: {
    type: String,
    required: [true, "Restaurant must be have summary."],
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

restaurantSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "restaurant",
  localField: "_id",
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
