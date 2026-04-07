const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String
    },
    brand: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    image: {
        type: String
    },
    sku: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        default: "pending" // pending | approved
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Product", productSchema);