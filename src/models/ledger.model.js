const mongoose = require('mongoose');
const transactionModel = require('./transaction.model');

const ledgerSchema = new mongoose.Schema({
    account:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: [true, 'Ledger entry must be associated with an account'],
        index:true,
        immutable:true, // Once set, the account reference cannot be changed    
    },
    
    amount:{
        type: Number,
        required: [true, 'Amount is required for a ledger entry'],
        immutable:true, 

    },
    transaction:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'transaction',
        required: [true, 'Ledger entry must be associated with a transaction'],
        index:true,
        immutable:true, 
    },

    type:{
        type: String,
        enum:{
            values: ['DEBIT', 'CREDIT'],
            message: 'Ledger entry type must be either DEBIT or CREDIT',
        },
        required: [true, 'Ledger entry type is required'],
        immutable:true,
    }
})

function preventLedgerModification(){ // This function will be used as a pre 'update' and 'delete' hook to prevent any modifications to ledger entries after they are created
    throw new Error('Ledger entries cannot be modified or deleted once created'); // Prevent any updates or deletions to ledger entries

}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);

const ledgerModel = mongoose.model('ledger', ledgerSchema);

module.exports = ledgerModel;