const express = require('express');
const cookieParser = require('cookie-parser');



const app = express();


app.use(express.json());
app.use(cookieParser());

/**
 * - Route handlers required for the application
 * - Middleware
 */
const authRoutes = require('./routes/auth.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes')

/**
 * - API Routes
 */
app.get('/', (req, res) => {
    res.send('Backend Ledger API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes)

module.exports = app;