const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  productId: {
    type: Number,
    required: true
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    default: 1
  },
  userId: {
    type: String,
    default: "guest"
  }
});

module.exports = mongoose.model("Cart", cartSchema);