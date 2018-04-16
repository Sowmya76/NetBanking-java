const mongoose = require('mongoose');

var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
    uname: String,
    name: {
        firstName: String,
        middleName: String,
        lastName: String
    },
    debitAccount: String,
    creditAccount: {
        accountNumber: String,
        maxCredit: Number,
        balance: Number,
        interestRate: Number,
        numOfpayments: Number,
        currentpayment: Number
    },
    password: String,
    security: {
        question: String,
        answer: String
    },
    balance: {
        debit: Number,
        credit: Number
    },
    transactions: Array
}))