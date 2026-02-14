const { Router } = require('express');
const { authMiddleware, authSystemUserMiddleware } = require('../middlewares/auth.middleware')
const { createTransaction, createInitialFundsTransaction, getTransactionsController } = require('../controllers/transaction.controller')
const transactionRoutes = Router();

/**
 *  - GET /api/transactions/
 *  - Get all transactions of authenticated user
 */
transactionRoutes.get('/', authMiddleware, getTransactionsController);

/**
 *  - POST /api/transactions/
 * - Create a new transcation
 */

transactionRoutes.post('/', authMiddleware, createTransaction);

/**
 * - POST /api/transaction/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post('/system/initial-funds', authSystemUserMiddleware, createInitialFundsTransaction)



module.exports = transactionRoutes;