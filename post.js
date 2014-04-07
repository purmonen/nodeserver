var mongojs = require('mongojs');
var settings = require('./settings');
var db = mongojs.connect(settings.dbUrl, ['posts']);

var Post = {};

Post.get = function(user, id, callback) {
    db.posts.find({user: user, id: id}, function(err, post) {
        if (err) callback(err, null);    
        else if (!post.length) callback('Couldnt find post', null);
        else callback(null, post[0]);
    });
};

Post.create = function(post, callback) {
    db.posts.update({id: post.id}, post, {upsert: true}, callback);
};

Post.delete = function(user, id, callback) {
    db.posts.remove({user: user, id: id}, callback);
};

module.exports = Post;