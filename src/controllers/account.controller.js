const accountModel = require('../models/account.model');

/**
 * - Controller for handling account-related operations
 * - This will include creating accounts, fetching account details, updating account status, etc.
 * - Each function will interact with the accountModel to perform database operations
 */

async function createAccountController(req, res) {
    try {
        const user = req.user;  // Assuming authMiddleware adds the authenticated user to req.user

        const account = await accountModel.create({
            user: user._id
        });


        res.status(201).json({
            success: true,
            account
        });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating account',
            error: error.message
        });
    }
}

async function getUserAccountsController(req, res) {
    try {
        const accounts = await accountModel.find({ user: req.user._id });

        const data = await Promise.all(accounts.map(async (account) => {
            const balance = await account.getBalance();
            return {
                ...account.toObject(),
                balance
            };
        }));

        res.status(200).json({
            accounts: data
        });
        console.log(`Sent ${data.length} accounts for user ${req.user._id}. First account balance: ${data[0]?.balance}`);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching accounts',
            error: error.message
        });
    }
}

async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }
        const balance = await account.getBalance();

        res.status(200).json({
            accountId: account._id,
            balance: balance
        });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching balance',
            error: error.message
        });
    }
}

module.exports = { createAccountController, getUserAccountsController, getAccountBalanceController };

