var express = require('express');
var app = express();
app.use(express.bodyParser());
var url = 'sami:sami@127.0.0.1:27017/test'
var mongojs = require('mongojs');
var ObjectId = mongojs.ObjectId;
var db = mongojs.connect(url, ['users', 'posts']);
var cors = require('cors');
var passwordHash = require('password-hash');
app.use(cors());
app.listen(3000);

var auth = express.basicAuth(function(user, password, callback) {
    db.users.find({user: user}, function(err, result) {
        if (!result.length || err || !passwordHash.verify(password, result[0].password)) {
            callback(null, null);
        } else {
            callback(null, user);
        }
    });
});

app.get('/users/', function(req, res) {
    db.users.find({}, function(err, result) {
        return res.json(result);
    });
});

// Create new user 
app.post('/users/', function(req, res) {
    db.users.find({user: req.body.user}, function(err, result) {
        if (!result.length) {
            var hash = passwordHash.generate(req.body.password);
            db.users.insert({
                user: req.body.user,
                password: hash 
            });
            return res.json(true);
        } else {
            return res.json(false);
        }
    });
});

app.delete('/users/', function(req, res) {
    db.users.remove();
    return res.json(true);
});

app.delete('/users/', auth, function(req, res) {
    db.users.remove({user: req.user});
    db.posts.remove({user: req.user});
    return res.json(true);
});

// Get all items from user
app.get('/posts/:user/', function(req, res) {
    db.posts.find({user: req.params.user}, function(err, result) {
        return res.json(result.slice(0,100));
    });
});

app.delete('/posts/', auth, function(req, res) {
    db.posts.remove();
    return res.json(true);
});

app.post('/posts/', auth, function(req, res) {
    var post = {
        user: req.user,
        content: req.body.content,
        timestamp: Date.now()
    }
    db.posts.insert(post);
    return res.json(post);
});

app.delete('/posts/:id/', auth, function(req, res) {
    db.posts.remove({_id: ObjectId(req.params.id)});
    return res.json(true);
});

app.post('/posts/:id/', auth, function(req, res) {
    var post = {
        _id: ObjectId(req.params.id),
        user: req.user,
        content: req.body.content,
        timestamp: Date.now()
    }
    db.posts.update({_id: ObjectId(req.params.id)}, post);
    return res.json(post);
});