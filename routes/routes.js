const express = require('express');
var User = require('../models/user');
var config = require('../config');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose'),
    app = express(),
    bodyParser = require('body-parser'),
    bcrypt = require('bcrypt');

const saltRounds = config.saltRounds;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var router = express.Router();

router.get('/', function (req, res) {
    res.send('Detailed shit will go here')
})

router.post('/signup', function (req, res) {
    var cursor = User.findOne({ uname: req.body.uname });
    cursor.exec(function (err, person) {
        if (err) console.log(err);
        else if (person) {
            res.json({
                success: false,
                message: 'User name already in use',
                token: null
            })
        } else {
            req.session.uname = req.body.uname;
            console.log(req.body);
            var hashed = bcrypt.hashSync(req.body.password, 8);
            var newUser = new User({
                uname: req.body.uname,
                /*
                name: {
                    firstName: req.body.name.firstName,
                    middleName: req.body.name.middleName,
                    lastName: req.body.name.lastName
                },*/
                password: hashed,
                debitAccount: req.body.debitAccount,

                creditAccount: {
                    accountNumber: req.body.creditAccount.accountNumber,
                    maxCredit: req.body.creditAccount.maxCredit,
                    balance: req.body.creditAccount.balance,
                    interestRate: req.body.interestRate,
                    numOfpayments: req.body.interest
                }, security: {
                    question: req.body.security.question,
                    answer: req.body.security.question
                },
                balance: {
                    debit: req.body.balance.debit,
                    credit: req.body.balance.credit
                }
            })

            newUser.save(function (err) {
                if (err) { 
                    console.log(err); 
                    res.json({
                        success: false,
                        message: "Trouble signing up!"
                    })
                }

                console.log('saved!');
                var token = jwt.sign({ foo: "bar" }, config.secret, {
                    expiresIn: 1440
                });
                res.json({ success: true, token: token });
            })
        }
    })


})

router.post('/login', function (req, res) {
    User.findOne(
        { uname: req.body.uname },
        function (err, user) {
            if (err) throw err;

            if (!user) {
                res.json({
                    success: false,
                    message: 'Auth failed. User not found'
                })
            } else if (user) {
                var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
                if (!passwordIsValid) {
                    res.json({ success: false, message: 'Auth failed. Wrong password' });
                } else {
                    var token = jwt.sign({ foo: "bar" }, config.secret, {
                        expiresIn: 1440
                    });
                    req.session.uname = req.body.uname;
                    //console.log(req.session.uname)
                    res.json({
                        success: true,
                        message: 'Enjoy your Token',
                        token: token,
                        debitAccount: user.debitAccount
                    })
                }
            }
        })
})

module.exports = router;