import mongoose, { Query, Schema, Types } from "mongoose";
import { IRestaurant } from "../@types";

const restaurantSchema = new mongoose.Schema<IRestaurant>(
  {
    name: { type: String, required: [true, "Please provider name."] },
    address: { type: String, required: [true, "Please provider address."] },
    numberPhone: {
      type: String,
      require: [true, "Please provider number phone."],
    },
    concept: {
      type: Schema.Types.ObjectId,
      ref: "Concept",
      required: true,
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
    active: {
      type: Boolean,
      default: true,
    },
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
      },
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

restaurantSchema.pre(/^find/, function (this: Query<any, any>, next) {
  this.populate({ path: "concept", select: "name imageCover" });
  next();
});

restaurantSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "restaurant",
  localField: "_id",
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
