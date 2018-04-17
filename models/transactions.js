const mongoose = require('mongoose');

var Schema = mongoose.Schema;

module.exports = mongoose.model('Transaction', new Schema({
    payee: Number,
    payer: Number,
    amount: Number
}))