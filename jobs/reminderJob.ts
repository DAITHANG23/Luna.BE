import cron from "node-cron";
import { subHours } from "date-fns";
import BookingModel from "../models/bookingModel";
import Restaurant from "../models/restaurantModel";
import { emitBookingReminder } from "../socket/bookingRestaurant/BookingRestaurant";

export const startReminderJob = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const reminderTime = subHours(now, 1); // 1 hour before the current time

    const bookings = await BookingModel.find({
      timeSlot: reminderTime,
      status: "CONFIRMED",
    });

    bookings.forEach(async (booking) => {
      const restaurant = await Restaurant.findById(booking.restaurant);
      if (restaurant) {
        emitBookingReminder(booking);
      }
    });
  });
};
