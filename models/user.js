const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');

const Schema = mongoose.Schema;


const UserSchema = new Schema({
  email: {type: String, unique:true, lowercase: true},
  name: String,
  password: String,
  photo: String,
  tweets: [{
    tweet: {type: Schema.Types.ObjectId, ref: 'Tweet'}
  }],
  following: [{
    type: Schema.Types.ObjectId, ref: 'User'
  }],
  followers: [{
    type: Schema.Types.ObjectId, ref: 'User'
  }]
});

UserSchema.pre('save', function (next) {
  const SALTROUNDS = 10;  // or another integer in that ballpark
  const user = this;
  if(!user.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(SALTROUNDS, (err, salt) => {
    if (err) { return next(err); }

    bcrypt.hash(user.password, salt, null, (error, hash) => {
      if (error) { return next(error); }

      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.gravatar = function(size) {
  if (!size) size = 200;
  if (!this.email) return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
  var md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
};

UserSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password)
}

module.exports = mongoose.model('User', UserSchema);