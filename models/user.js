const mongoose = require("mongoose");
const { productSchema } = require("./product");
const { notificationSchema } = require("./notifications");


const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value) => {
        const re =
          /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        return value.match(re);
      },
      message: "Invalid Email",
    },
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    default: '',
  },
  picture: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "user",
  },
  fcmToken: {
    type: String,
    default: "",
  },
  cart: [
    {
      product: productSchema,
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  notifications: [
    {
      notification: notificationSchema,
    }
  ]
});

const User = mongoose.model("User", userSchema);
module.exports = User;
