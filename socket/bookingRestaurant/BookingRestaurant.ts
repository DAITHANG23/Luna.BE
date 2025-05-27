import { io } from "../../server";

export const emitBookingCreated = (formData: any) => {
  io.emit("bookingCreated", formData);
};
