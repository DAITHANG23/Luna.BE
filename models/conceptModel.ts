import mongoose, { Schema } from "mongoose";
import { IConcept } from "../@types";

const conceptSchema = new mongoose.Schema<IConcept>(
  {
    name: {
      type: String,
      require: [true, "Please provider name."],
      default: "Dom Fusion",
    },
    description: {
      type: String,
      require: [true, "Please provider description."],
      default: "",
    },
    address: {
      type: String,
      require: [true, "Please provider address."],
      default: "",
    },
    images: [{ type: String }],
    conceptManager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Concept must have a manager"],
      default: "67c038768dac9ae6b24d7d56",
    },
    totalProfit: {
      type: Number,
      require: [true, "Concept Restaurant must be have total profit."],
      default: 1000000,
    },
    imageCover: {
      type: String,
      required: [true, "Restaurant must be have imageCover."],
      default: "",
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
        catelogy: { type: String },
        items: [{ image: String, name: String, price: Number }],
        name: { type: String, required: true, default: "" },
        description: { type: String },
        type: { type: String, required: true, default: "other" },
        image: { type: String },
        images: [{ type: String }],
        price: { type: Number, required: true, default: 1000000 },
      },
    ],
    type: {
      type: String,
      enum: ["hotpot", "bbq", "japanese", "steakHouse", "other"],
      required: [true, "Concept must be have type."],
      default: "other",
    },
    avgRatings: {
      type: Number,
      default: 4.5,
    },
    reviews: [{ type: String }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

conceptSchema.virtual("restaurants", {
  ref: "Restaurant",
  localField: "_id",
  foreignField: "concept",
});

const ConceptRestaurantModel = mongoose.model("Concept", conceptSchema);

export default ConceptRestaurantModel;
