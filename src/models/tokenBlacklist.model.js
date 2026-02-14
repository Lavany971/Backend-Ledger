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
        expires: '5d'
    }
}, {
    timestamps: true
});

const tokenBlackListModel = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

module.exports = tokenBlackListModel;
