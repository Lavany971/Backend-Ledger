const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');
/**
 * - Create a new transaction
 * * The 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Valiadte idempotency key
     * 3. Check account statuses
     * 4. Derive sender balance from ledger
     * 5. Create transaction with PENDING status
     * 6. Create ledger entry for sender (DEBIT)
     * 7. Create ledger entry for receiver (CREDIT)
     * 8. Mark transaction as COMPLETED
     * 9. Commit MongoDB transaction
     * 10. Send email notifications to sender and receiver
 * 
 */


async function createTransaction(req, res) {
    /**
     * 1. Validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required ",

        })
    }
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })
    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount",
        })
    }

    /**
     * 2. Vaildate idempotency key
     */
    const isTransactionAlreadyExits = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExits) {
        if (isTransactionAlreadyExits.status == 'COMPLETED') {
            return res.status(200).json({
                message: "Transaction already Processed",
                transaction: isTransactionAlreadyExits
            })
        }

        if (isTransactionAlreadyExits.status == 'PENDING') {
            return res.status(200).json({
                message: "Transaction is still processing",

            })
        }

        if (isTransactionAlreadyExits.status == 'FAILED') {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExits.status == 'REVERSED') {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    /**
     * 3. Check account status
     */
    if (fromUserAccount.status !== 'ACTIVE' || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: 'Both fromAccount and toAccount must be ACTIVE to process transaction'
        })
    }


    /**
     * 4. Derive sender balance from ledger
     */

    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}.Requested amount is ${amount}`
        })
    }

    /**
     * 5. Create transaction (PENDING)
     */
    const session = await mongoose.startSession()
    session.startTransaction()


    const transaction = new transactionModel({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: 'CREDIT'
    }], { session })


    transaction.status = 'COMPLETED'
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()


    /**
     * 10. Send email notification
     */

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)
    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction,
    })






}


async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }


    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })
}

async function getTransactionsController(req, res) {
    try {
        // 1. Fetch all accounts belonging to the user
        const userAccounts = await accountModel.find({ user: req.user._id });
        const accountIds = userAccounts.map(acc => acc._id);

        // 2. Find transactions where either fromAccount or toAccount is in accountIds
        const transactions = await transactionModel.find({
            $or: [
                { fromAccount: { $in: accountIds } },
                { toAccount: { $in: accountIds } }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transactions',
            error: error.message
        });
    }
}

module.exports = { createTransaction, createInitialFundsTransaction, getTransactionsController }





