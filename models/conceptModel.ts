import mongoose, { Schema, Types } from "mongoose";
import { IConcept } from "../@types";

const conceptSchema = new mongoose.Schema<IConcept>({
  name: { type: String, require: [true, "Please provider name."] },
  description: {
    type: String,
    require: [true, "Please provider description."],
  },
  address: { type: String, require: [true, "Please provider address."] },
  managerConcept: {
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
  totalProfit: {
    type: Number,
    require: [true, "Concept Restaurant must be have total profit."],
  },
});

const ConceptRestaurant = mongoose.model("User", conceptSchema);

export default ConceptRestaurant;
