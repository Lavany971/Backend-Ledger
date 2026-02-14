const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');

/** 
* - user registration controller
* - POST /api/auth/register
*/

async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;

        const isExisting = await userModel.findOne({
            email: email
        })

        if (isExisting) {
            return res.status(422).json({
                message: "User already exists with this email.",
                status: "failed"
            })
        }

        const user = await userModel.create({
            email, password, name
        })

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "5d" })
        res.cookie("token", token)

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
            },
            token
        })

        // Fire and forget email to not block response if it fails
        emailService.sendRegistrationEmail(user.email, user.name).catch(err => {
            console.error("Failed to send registration email:", err);
        });

    } catch (error) {
        console.error("Register Error:", error);

        // Mongoose validation errors -> return details to client
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(422).json({ message: "Validation failed", errors });
        }

        // Duplicate key (unique) errors from MongoDB
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue || {})[0];
            return res.status(409).json({ message: `Duplicate value for field ${field}`, field });
        }

        res.status(500).json({ message: "Internal Server Error" });
    }
}

/**
 * - user login controller
 * - POST /api/auth/login
 */
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select("+password")

        if (!user) {
            return res.status(401).json({
                message: "Email or Password is INVALID",
            })
        }
        const isValidPassword = await user.comparePassword(password)
        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or Password is INVALID",
            })
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "5d" })
        res.cookie("token", token)

        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
            },
            token
        })
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const tokenBlackListModel = require('../models/tokenBlacklist.model');

async function userLogoutController(req, res) {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(400).json({ message: "No token provided" });
        }

        // Add token to blacklist
        await tokenBlackListModel.create({ token });

        res.clearCookie("token");
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = { userRegisterController, userLoginController, userLogoutController }