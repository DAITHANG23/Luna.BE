import mongoose, { Schema } from "mongoose";
import { IConcept } from "../@types";

const conceptSchema = new mongoose.Schema<IConcept>({
  name: { type: String, require: [true, "Please provider name."] },
  description: {
    type: String,
    require: [true, "Please provider description."],
  },
  address: { type: String, require: [true, "Please provider address."] },
  images: [{ type: String }],
  conceptManager: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Concept must have a manager"],
  },
  totalProfit: {
    type: Number,
    require: [true, "Concept Restaurant must be have total profit."],
  },
  imageCover: {
    type: String,
    required: [true, "Restaurant must be have imageCover."],
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
  type: {
    type: String,
    enum: ["HOTPOT", "BBQ", "JAPANESE", "STEAK HOUSE", "OTHER"],
    required: [true, "Concept must be have type."],
  },
  avgRatings: {
    type: Number,
    default: 4.5,
  },
});

const ConceptRestaurantModel = mongoose.model("Concept", conceptSchema);

export default ConceptRestaurantModel;
