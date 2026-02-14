const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    fromAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must have a from account"],
        index: true,
    },
    toAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must have a to account"],
        index: true,
    },
    status: {
        type: String,
        enum:{
            values:["PENDING", "COMPLETED", "FAILED","REVERSED"],
            message: "Status must be one of PENDING, COMPLETED, FAILED, REVERSED"
        },
        default: "PENDING"
    },
    amount:{
        type: Number,
        required: [true, "Amount is required for a transaction"],
        min: [0, "Transaction amount must be a positive number"],
    },
       
    idempotencyKey: {
        type: String,
        required: [true, "Idempotency key is required for a transaction"],
        unique: true,
        index: true,
    },
},{
    timestamps: true
})

const transactionModel = mongoose.model("transaction", transactionSchema)

module.exports = transactionModel;