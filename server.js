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

// Remove trailing slash from url 
app.use(function(req, res, next) {
    if(req.url.substr(-1) === '/' && req.url.length > 1) {
       res.redirect(301, req.url.slice(0, -1));
   } else {
       next();
   }
});

app.listen(3000);

var User = {};

User.get = function(user, success, error) {
    db.users.find({user: user}, function(err, result) {
        if (err || !result.length) error();
        else success(result[0]);
    });
}

User.create = function(user, password, success, error) {
    db.users.find({user: user}, function(err, result) {
        if (err || result.length) {
            error();
        } else {
            var newUser = {
                user: user,
                password: passwordHash.generate(password),
                timestamp: Date.now()
            };
            db.users.insert(newUser);
            success(newUser);
        }
    });
};

User.delete = function(user) {
    db.users.find({user: user}, function(err, result) {
        if (err || !result.length) error();
        else {
            db.users.remove({user: user});
            db.posts.remove({user: user});
        }
    });
}

var Post = {};

Post.get = function(user, id, success, error) {
    db.posts.find({user: user, id: id}, function(err, result) {
        if (err || !result.length) error();
        else success(result[0]);
    });
}

Post.create = function(post, success, error) {
    db.posts.update({id: post.id}, post, {upsert: true});
    return;
}

Post.delete = function(user, id) {
    db.posts.remove({user: user, id: id});
    return;
}

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

app.post('/', function(req, res) {
    User.create(req.body.user, req.body.password, function() {
        return res.json(true);
    }, function() {
        return res.json(false);
    })
});

app.delete('/:user', auth, function(req, res) {
    if (req.params.user === req.user) {
        return res.json(false);
    }
    User.delete(req.user);
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
    Post.get(req.params.user, req.params.id, function(post) {
        return res.json(post.content);
    }, function() {
        return res.send(404, 'Error!');
    });
});

app.post('/:user/:id', auth, function(req, res) {
    if (req.params.user !== req.user) {
        return res.json(false);
    }
    console.log(req.body);
    Post.create({
        id: req.params.id,
        user: req.params.user,
        content: req.body,
        timestamp: Date.now()
    });
    return res.json({});
});

app.delete('/:user/:id', function(req, res) {
    if (req.params.user !== req.user) {
        return res.send(400, 'Idiot');
    }
    Post.delete({user: req.params.user, id: req.params.id});
    return res.json(true);
});