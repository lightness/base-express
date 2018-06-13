const express = require('express');
const router = express.Router();

router.use('/friendship', require('./friendship'));
router.use('/message', require('./message'));
router.use('/user', require('./user'));

router.get('/', function(req, res) {
    res.render('index');
});

module.exports = router;
