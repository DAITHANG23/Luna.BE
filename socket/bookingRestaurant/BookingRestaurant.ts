import NotificationModel from "../../models/notificationModel";
import Restaurant from "../../models/restaurantModel";
import { io } from "../../server";
import dayjs from "dayjs";

export const emitBookingCreated = async (formData: any) => {
  const restaurant = await Restaurant.findById(formData.restaurant);

  const formatted = dayjs(formData.timeOfBooking).format("DD/MM/YYYY");
  const dateBooking = `${formatted}  ${formData.timeSlot}`;

  const formDataBookingRestaurant = {
    recipient: formData.customer,
    restaurant: formData.restaurant,
    title: "Đặt bàn mới",
    customer: formData.fullName,
    message: `Bạn đã đặt bàn thành công tại nhà hàng ${restaurant?.name || "Domique Fusion"}`,
    type: "bookingCreated",
    bookingDate: dateBooking,
    createdAt: Date.now(),
    read: false,
    numberOfGuests: formData.peopleQuantity,
  };

  io.emit("bookingCreated", formDataBookingRestaurant);

  await NotificationModel.create(formDataBookingRestaurant);
};

export const emitBookingConfirmed = async (formData: any) => {
  const restaurant = await Restaurant.findById(formData.restaurant);

  const formatted = dayjs(formData.timeOfBooking).format("DD/MM/YYYY");
  const dateBooking = `${formatted}  ${formData.timeSlot}`;
  const formDataBookingRestaurant = {
    recipient: formData.customer,
    restaurant: formData.restaurant,
    title: "Đặt bàn đã được xác nhận",
    customer: formData.fullName,
    message: `Nhà hàng ${restaurant?.name || "Domique Fusion"} đã xác nhận đặt bàn của bạn.`,
    type: "bookingConfirmed",
    createdAt: Date.now(),
    read: false,
    numberOfGuests: formData.peopleQuantity,
    bookingDate: dateBooking,
  };

  io.emit("bookingConfirmed", formDataBookingRestaurant);

  await NotificationModel.create(formDataBookingRestaurant);
};

export const emitBookingCanceled = async (formData: any) => {
  const restaurant = await Restaurant.findById(formData.restaurant);
  const formatted = dayjs(formData.timeOfBooking).format("DD/MM/YYYY");
  const dateBooking = `${formatted}  ${formData.timeSlot}`;
  const formDataBookingRestaurant = {
    recipient: formData.customer,
    restaurant: formData.restaurant,
    title: "Đặt bàn đã bị hủy",
    customer: formData.fullName,
    message: `Đặt bàn tại ${restaurant?.name || "Domique Fusion"} đã bị hủy.`,
    type: "bookingCanceled",
    numberOfGuests: formData.peopleQuantity,
    bookingDate: dateBooking,
    createdAt: Date.now(),
    read: false,
  };

  io.emit("bookingCanceled", formDataBookingRestaurant);

  await NotificationModel.create(formDataBookingRestaurant);
};

export const emitBookingReminder = async (formData: any) => {
  const restaurant = await Restaurant.findById(formData.restaurant);
  const formatted = dayjs(formData.timeOfBooking).format("DD/MM/YYYY");
  const dateBooking = `${formatted}  ${formData.timeSlot}`;

  const formDataBookingRestaurant = {
    recipient: formData.customer,
    restaurant: formData.restaurant,
    title: "Nhắc lịch đặt bàn",
    customer: formData.fullName,
    message: `Bạn có một lịch đặt bàn sắp tới tại ${restaurant?.name || "Domique Fusion"}.`,
    type: "bookingReminder",
    numberOfGuests: formData.peopleQuantity,
    bookingDate: dateBooking,
    createdAt: Date.now(),
    read: false,
  };

  io.emit("bookingReminder", formDataBookingRestaurant);

  await NotificationModel.create(formDataBookingRestaurant);
};
