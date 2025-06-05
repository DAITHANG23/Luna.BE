import cron from "node-cron";
import { subHours } from "date-fns";
import BookingModel from "../models/bookingModel";
import Restaurant from "../models/restaurantModel";
import {
  emitBookingCompleted,
  emitBookingConfirmed,
  emitBookingInProgress,
  emitBookingReminder,
} from "../socket/bookingRestaurant/BookingRestaurant";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const startReminderJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const reminderTime = subHours(now, 1);

      const bookings = await BookingModel.find({
        timeSlot: reminderTime,
        status: "CONFIRMED",
      });

      for (const booking of bookings) {
        const restaurant = await Restaurant.findById(booking.restaurant);
        if (restaurant) {
          emitBookingReminder(booking);
        }
      }
    } catch (err) {
      console.error("Error running reminder job:", err);
    }

    // job to auto confirm bookings
    try {
      const nowTime = dayjs().utc();

      const lowerBound = nowTime.subtract(2, "minute").toDate();
      const upperBound = nowTime.subtract(1, "minute").toDate();

      const bookings = await BookingModel.find({
        createdAt: { $gte: lowerBound, $lte: upperBound },
        status: "PENDING",
      });

      for (const booking of bookings) {
        const restaurant = await Restaurant.findById(booking.restaurant);

        const updateBookingHistory = {
          status: "CONFIRMED",
          updatedAt: new Date(),
          updateBy: "Dom Nguyen",
        };

        const formatBody = {
          status: "CONFIRMED",
          statusHistory: [
            ...(booking?.statusHistory ?? []),
            updateBookingHistory,
          ],
        };

        const docBooking = await BookingModel.findByIdAndUpdate(
          booking._id,
          formatBody,
          {
            new: true,
            runValidators: true,
          }
        );

        if (restaurant) {
          emitBookingConfirmed(docBooking);
        }
      }
    } catch (err) {
      console.error("Error in auto confirm booking job:", err);
    }

    // job to auto in-progress bookings
    try {
      const nowTime = dayjs().utc();

      const lowerBound = nowTime.subtract(2, "minute").toDate();
      const upperBound = nowTime.subtract(1, "minute").toDate();

      const bookings = await BookingModel.find({
        statusHistory: {
          $elemMatch: {
            status: "CONFIRMED",
            updatedAt: { $gte: lowerBound, $lte: upperBound },
          },
        },
      });

      for (const booking of bookings) {
        const restaurant = await Restaurant.findById(booking.restaurant);

        const updateBookingHistory = {
          status: "IN_PROGRESS",
          updatedAt: new Date(),
          updateBy: "Dom Nguyen",
        };

        const formatBody = {
          status: "IN_PROGRESS",
          statusHistory: [
            ...(booking?.statusHistory ?? []),
            updateBookingHistory,
          ],
        };

        const docBooking = await BookingModel.findByIdAndUpdate(
          booking._id,
          formatBody,
          {
            new: true,
            runValidators: true,
          }
        );

        if (restaurant) {
          emitBookingInProgress(docBooking);
        }
      }
    } catch (err) {
      console.error("Error in auto confirm booking job:", err);
    }

    // job to auto complete bookings
    try {
      const nowTime = dayjs().utc();

      const lowerBound = nowTime.subtract(2, "minute").toDate();
      const upperBound = nowTime.subtract(1, "minute").toDate();

      const bookings = await BookingModel.find({
        statusHistory: {
          $elemMatch: {
            status: "IN_PROGRESS",
            updatedAt: { $gte: lowerBound, $lte: upperBound },
          },
        },
      });

      for (const booking of bookings) {
        const restaurant = await Restaurant.findById(booking.restaurant);

        const updateBookingHistory = {
          status: "COMPLETED",
          updatedAt: new Date(),
          updateBy: "Dom Nguyen",
        };

        const formatBody = {
          status: "COMPLETED",
          statusHistory: [
            ...(booking?.statusHistory ?? []),
            updateBookingHistory,
          ],
        };

        const docBooking = await BookingModel.findByIdAndUpdate(
          booking._id,
          formatBody,
          {
            new: true,
            runValidators: true,
          }
        );

        if (restaurant) {
          emitBookingCompleted(docBooking);
        }
      }
    } catch (err) {
      console.error("Error in auto confirm booking job:", err);
    }
  });
};
