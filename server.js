var express = require('express');
var cors = require('cors');
var Post = require('./post.js');
var User = require('./user.js');

var app = express();
app.use(cors());
app.use(express.bodyParser());

// Remove trailing slash from url 
app.use(function(req, res, next) {
    if(req.url.substr(-1) === '/' && req.url.length > 1) {
       res.redirect(301, req.url.slice(0, -1));
   } else {
       next();
   }
});

app.listen(3000);

// Authenticates with password hash
var auth = express.basicAuth(function(user, password, callback) {
    User.get(user, password, function(err, user) {
        if (err) callback(err, null);
        else callback(null, user.user);
    });
});

//---------------------------------------------------------------
// User routes
//---------------------------------------------------------------

// Create user
app.post('/', function(req, res) {
    User.create(req.body.user, req.body.password, function(err) {
        if (err) res.send(403);
        else res.send(200);
    });
});

// Delete user
app.delete('/:user', auth, function(req, res) {
    if (req.params.user !== req.user) {
        return res.send(401);
    }
    User.delete(req.user, function(err) {
        if (err) res.send(500);
        else res.send(200);
    });
});


//---------------------------------------------------------------
// Post routes
//---------------------------------------------------------------

// Get post
app.get('/:user/:id', function(req, res) {
    Post.get(req.params.user, req.params.id, function(err, post) {
        if (err) res.send(404);
        else res.json(post.content);    
    });
});

// Create or update post
app.post('/:user/:id', auth, function(req, res) {
    if (req.params.user !== req.user) {
        return res.send(401);
    }
    Post.create({
        id: req.params.id,
        user: req.params.user,
        content: req.body,
        timestamp: Date.now()
    }, function(err) {
        if (err) res.send(500);
        else res.send(200); 
    });
});

// Delete post
app.delete('/:user/:id', auth, function(req, res) {
    if (req.params.user !== req.user) {
        return res.send(401);
    }
    Post.delete(req.params.user, req.params.id, function(err) {
        if (err) res.send(404);   
        else res.send(200);
    });
});