var settings = require('./settings.js');
var mongojs = require('mongojs');
var db = mongojs(settings.dbUrl, ['users', 'posts']);
var passwordHash = require('password-hash');

var User = {};

User.get = function(user, password, callback) {
    db.users.find({user: user}, function(err, users) {
        if (err) callback(err, null);
        else if (!users.length) callback('User not found', null);
        else if (!passwordHash.verify(password, users[0].password)) callback('Wrong password', null);
        else callback(null, users[0]);
    });
};

User.create = function(user, password, callback) {
    db.users.find({user: user}, function(err, result) {
        if (err) callback(err, null);
        else if (result.length) callback('User already exists', null);
        else {
            db.users.insert({
                user: user,
                password: passwordHash.generate(password),
                timestamp: Date.now()
            }, function(err) {  
                if (err) callback(err, null);
                else callback(null, 'User created');
            });
        }
    });
};

User.delete = function(user, callback) {
    db.users.find({user: user}, function(err, result) {
        if (err) callback(err, null);
        else if (!result.length) callback('User does not exist', null);
        else {
            callback(null, 'User deleted');
            db.users.remove({user: user});
            db.posts.remove({user: user});
        }
    });
};

module.exports = User;