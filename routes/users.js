const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const db = require('../models');

// @route     POST api/users
// @desc      Register a user
// @access    Public
router.post(
    '/',
    [
        check('name', 'Please add name')
            .not()
            .isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check(
            'password',
            'Please enter a password with 6 or more characters'
        ).isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;
        console.log('User Route req.body - ', req.body);
        try {
            let user = await db.User.findOne({
                where: {
                    email
                }
            });
            console.log('User Route - ', user);

            if (user) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            user = {
                name,
                email,
                password
            };

            const salt = await bcrypt.genSalt(10);
            console.log('bcrypt salt', salt);

            user.password = await bcrypt.hash(password, salt);

            await db.User.create(user);

            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                {
                    expiresIn: 360000
                },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                    console.log('register user token: - ', token);
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;
