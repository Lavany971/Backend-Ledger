const express = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');

const { createAccountController, getUserAccountsController, getAccountBalanceController } = require('../controllers/account.controller');
const router = express.Router();


/**
 * - POST /api/accounts/
 * - Create a new account for the authenticated user.
 * - Protected route, requires authentication.
 */
router.post('/', authMiddleware, createAccountController)


/**
 * - GET /api/accounts/
 * - Get all accounts of ledger-in user
 *  - Protected Route
 */
router.get('/', authMiddleware, getUserAccountsController)


/**
 * - GET /api/accounts/balance/:accountId
 */

router.get('/balance/:accountId', authMiddleware, getAccountBalanceController)


module.exports = router;