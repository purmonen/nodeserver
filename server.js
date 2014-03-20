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

app.use(function(req, res, next) {
    if(req.url.substr(-1) === '/' && req.url.length > 1) {
       res.redirect(301, req.url.slice(0, -1));
   } else {
       next();
   }
});

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

app.get('/', function(req, res) {
    db.users.find({}, function(err, result) {
        return res.json(result);
    });
});

// Create new user 
app.post('/', function(req, res) {
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

app.delete('/:user', auth, function(req, res) {
    if (req.params.user === req.user) {
        return res.json(false);
    }
    db.users.remove({user: req.user});
    db.posts.remove({user: req.user});
    return res.json(true);
});

// Get all items from user
app.get('/:user', function(req, res) {
    db.posts.find({user: req.params.user}, function(err, result) {
        return res.json(result);
    });
});

// Get all items from user
app.get('/:user/:id', function(req, res) {
    db.posts.find({user: req.params.user, id: req.params.id}, function(err, result) {
        return res.json(result[0].content);
    });
});

app.post('/:user/:id', auth, function(req, res) {
    if (req.params.user !== req.user) {
        return res.json(false);
    }
    var post = {
        id: req.params.id,
        user: req.params.user,
        content: req.body,
        timestamp: Date.now()
    }
    db.posts.update({id: post.id}, post, {upsert: true});
    return res.json({});
});

app.delete('/:user/:id', function(req, res) {
    db.posts.remove({user: req.params.user, id: req.params.id});
    return res.json(true);
});