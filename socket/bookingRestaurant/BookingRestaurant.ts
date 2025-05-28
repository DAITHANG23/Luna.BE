import NotificationModel from "../../models/notificationModel";
import Restaurant from "../../models/restaurantModel";
import { io } from "../../server";

export const emitBookingCreated = async (formData: any) => {
  const restaurant = await Restaurant.findById(formData.restaurant);

  const formDataBookingRestaurant = {
    recipient: formData.customer,
    restaurant: formData.restaurant,
    title: "Đặt bàn mới",
    customer: formData.fullName,
    message: `Bạn đã đặt bàn thành công tại nhà hàng ${restaurant?.name || "Domique Fusion"}`,
    type: "bookingCreated",
    createdAt: Date.now(),
    read: false,
  };

  io.emit("bookingCreated", formDataBookingRestaurant);

  await NotificationModel.create(formDataBookingRestaurant);
};

export const emitBookingConfirmed = async (formData: any) => {
  const restaurant = await Restaurant.findById(formData.restaurant);

  const formDataBookingRestaurant = {
    recipient: formData.customer,
    restaurant: formData.restaurant,
    title: "Đặt bàn đã được xác nhận",
    customer: formData.fullName,
    message: `Nhà hàng ${restaurant?.name || "Domique Fusion"} đã xác nhận đặt bàn của bạn.`,
    type: "bookingConfirmed",
    createdAt: Date.now(),
    read: false,
  };

  io.emit("bookingConfirmed", formDataBookingRestaurant);

  await NotificationModel.create(formDataBookingRestaurant);
};

export const emitBookingCanceled = async (formData: any) => {
  const restaurant = await Restaurant.findById(formData.restaurant);

  const formDataBookingRestaurant = {
    recipient: formData.customer,
    restaurant: formData.restaurant,
    title: "Đặt bàn đã bị hủy",
    customer: formData.fullName,
    message: `Đặt bàn tại ${restaurant?.name || "Domique Fusion"} đã bị hủy.`,
    type: "bookingCanceled",
    createdAt: Date.now(),
    read: false,
  };

  io.emit("bookingCanceled", formDataBookingRestaurant);

  await NotificationModel.create(formDataBookingRestaurant);
};
