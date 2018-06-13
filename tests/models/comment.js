should = require('should')

Comment = require('../../models/comment')

describe('Model Comment', () => {

  it('get', (done) => {
    const id = '5678'

    Comment.get(id, (err, comment) => {
      comment.id.should.eql(id)
      done()
    })
  })

})