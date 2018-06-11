var express = require('express')
  , router = express.Router()

router.use('/message', require('./message'))
router.use('/users', require('./users'))

router.get('/', function(req, res) {
  res.render('index')
})

module.exports = router