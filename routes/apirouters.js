const express = require('express'),
    apiRouter = express.Router(),
    User = require('../models/user'),
    jwt = require('jsonwebtoken'),
    bodyParser = require('body-parser'),
    Transaction = require('../models/transactions')
app = express(),
    bcrypt = require('bcrypt');

const secret = require('../config').secret;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

apiRouter.use(function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        jwt.verify(token, secret, function (err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Wrong token!'
                })
            }
            else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        })
    }
})

apiRouter.post('/pinchange', (req, res) => {
    //console.log(req.session.uname);
    uname1 = req.body.uname
    User.findOne({ uname: req.body.uname }, function (err, user) {
        if (err) throw err;

        else {
            console.log(user.password)
            console.log(req.body.password)
            var passwordAlreadyExists = bcrypt.compareSync(req.body.password, user.password);
            if (passwordAlreadyExists) {
                res.json({
                    success: false,
                    message: "password same as previous password"
                })
            } else {
                var hashed = bcrypt.hashSync(req.body.password, 8);
                console.log(req.body.uname)
                User.update({ uname: req.body.uname }, { $set: { password: hashed } }, function (err, usr) {
                    if (err) console.log(err)
                    console.log(usr.password)
                })

                res.json({
                    success: true,
                    message: 'password changed'
                })
            }

        }
    })
})

apiRouter.post('/balance', (req, res) => {
    User.findOne({ uname: req.body.uname }, function (err, user) {
        if (err) throw err

        else {
            console.log({
                debitbalance: user.balance.debit,
                creditbalance: user.balance.credit
            })
            res.json({
                success: true,
                debitbalance: user.balance.debit,
                creditbalance: user.balance.credit
            })
        }
    })
})

apiRouter.post('/transaction', function (req, res) {
    var transactionAmount = req.body.amount;
    console.log(-1 * transactionAmount)
    User.update({ debitAccount: req.body.payer }, { $inc: { 'balance.debit': transactionAmount } }, function (err, doc) {
        if (err) return res.send(500, { success: false, message: err })
        console.log(doc)
    });
    User.update({ debitAccount: req.body.payee }, { $inc: { 'balance.debit': -1 * transactionAmount } }, function (err, doc) {
        if (err) return res.send(500, { success: false, message: err })
        console.log(doc)
    });
    var transaction = new Transaction({
        payee: req.body.payee,
        payer: req.body.payer,
        amount: req.body.amount
    })
    transaction.save(function (err, trans) {
        if (err) {
            console.log(err);
            User.findOneAndUpdate({ debitAccount: req.body.payer }, { $inc: { 'balance.debit': -1 * transactionAmount } }, function (err, doc) {
                if (err) return res.json({
                    success: false,
                    message: err
                })
                console.log(doc)
            });
            User.update({ debitAccount: req.body.payee }, { $inc: { 'balance.debit': transactionAmount } });
            res.json({
                success: false,
                message: 'Transaction failed!'
            })
        }
        else {
            User.update({ debitAccount: req.body.payer }, { $push: { transactions: trans.id } }, function (err, doc) {
                if (err) return res.json({
                    success: false,
                    message: err
                })
                console.log(doc)
            })
            User.update({ debitAccount: req.body.payee }, { $push: { transactions: trans.id } }, function (err, doc) {
                if (err) return res.send({
                    success: false,
                    message: err
                })
                console.log(doc)
            })
            console.log('Transaction Complete!');
            res.json({
                success: true,
                message: "Transaction Successful!"
            })
        }

    })
})

function callback(arr) {
    res.send(200, arr)
}

apiRouter.post('/miniStatement', function (req, res) {
    User.findOne({ uname: req.body.uname }, function (err, user) {
        if (err) return res.send(500, { success: false, message: err })
        if (!user) return res.send(404, { success: false, message: 'User not found' })
        else {
            console.log(user);
            var transact = user.transactions;
            console.log(transact.length)
            var array = []
            itemProcessed = 0;
            if (transact.length === 0) {
                return res.send(array)
            }
            transact.forEach(el => {
                Transaction.findById(el, function (err, doc) {
                    if (err) return res.send(500, { success: false, message: err })
                    if (!doc) return res.send(404, { success: false, message: 'No transactions' })
                    array.push(doc)
                    console.log(doc)
                    itemProcessed++;
                    if (itemProcessed === 3) {
                        return res.send(array)
                    }
                })
            });
            //res.send(array)
        }
    })
})

apiRouter.post('/debtPaying', (req, res) => {
    User.findOne({ uname: req.body.uname }, function (err, user) {
        if (err) return res.json({ success: false, message: err, inp: 1 })
        if (!user) return res.json({ success: false, message: 'No usr', inp: 1 })
        else {
            var Interest = 0;
            var interestRate = user.creditAccount.interestRate;
            var currentTransactionNo = user.creditAccount.currentInstallmentNo + 1;
            if (currentTransactionNo === user.creditAccount.numOfpayments) {
                Interest = (user.creditAccount.maxCredit - user.balance.credit) * interestRate * currentTransactionNo / 100 + (user.creditAccount.maxCredit - user.balance.credit);
                console.log("last transaction"+Interest)
                if (Interest < user.balance.debit) {
                    User.update({ uname: req.body.uname }, { $inc: { 'creditAccount.currentInstallmentNo': 1, 'balance.debit': -1 * Interest, 'balance.credit': Interest } }, function (err, doc) {
                        if (err) return res.json({
                            success: false,
                            message: 'failed to update',
                            inp: 0
                        })
                        else {
                            console.log(doc)
                            return res.json({
                                success: true,
                                message: 'success',
                                inp: 1
                            })
                        }
                    })
                }
                else if(currentTransactionNo > user.creditAccount.numOfpayments) {
                    return res.json({
                        success: false,
                        message: 'Exceeded Max no of traansactions',
                        inp: 1
                    })
                }
                else {
                    return res.json({
                        success: 'false',
                        message: 'debit too less to cover credit',
                        inp: 1
                    })
                }
            }
            else {
                Interest = (user.creditAccount.maxCredit - user.balance.credit) * interestRate * currentTransactionNo / 100;
                console.log("not last" + Interest)
                if (Interest < user.balance.debit) {
                    User.update({ uname: req.body.uname }, { $inc: { 'creditAccount.currentInstallmentNo': 1, 'balance.debit': -1 * Interest } }, function (err, doc) {
                        if (err) return res.json({
                            success: false,
                            message: 'failed to update',
                            inp: 1
                        })
                        else {
                            console.log(doc)
                            return res.json({
                                success: true,
                                message: 'success',
                                inp: 1
                            })
                        }
                    })
                }
                else {
                    return res.json({
                        success: 'false',
                        message: 'debit too less to cover credit',
                        inp: 1
                    })
                }
            }
        }
    })
})

module.exports = apiRouter;