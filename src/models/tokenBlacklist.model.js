const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '5d' // Automatically remove blacklisted tokens after 5 days (matching JWT expiry)
    }
}, {
    timestamps: true
});

const tokenBlackListModel = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

module.exports = tokenBlackListModel;
