
/*
 * GET home page.
 */
var NEO = require('neo4j');
var db = new NEO.GraphDatabase('http://localhost:7474');

exports.index = function(req, res){
  res.render('index');
};

exports.register = function(req, res) {
	var user = db.createNode({
    name: req.body.name, 
    password: req.body.password,
    job: req.body.job
  });
  user.save(function (err, node) {
    if (err) {
      console.log(err);
    } else {
    db.query('MATCH n\nWHERE n.job = "'+req.body.job+'"\nRETURN n', function (err, sameJob) {
    if(err) {
      console.log(err);
      res.redirect('/')
    } else { 
      req.session.user = node;
      req.session.userId = node.id;
      res.render('home', {
        user: user,
        others: sameJob
      });
    };
    })
  }
	})
};

exports.login = function(req, res) {
  var query = [
  'MATCH n',
  'WHERE n.name = "'+req.body.name+'"',
  'AND n.password = "'+req.body.password+'"',
  'RETURN n'
  ].join('\n');
  db.query(query, function (err, user) {
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
    console.log(user);
    req.session.user = user[0].n;
    req.session.userId = user[0].n.id;
    db.query('MATCH n\nWHERE n.job = "'+req.session.user.data.job+'"\nRETURN n', function ( err, sameJob) {
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
      console.log(req.session.user.id);
        res.render('home', {
          user: req.session.user,
          others: sameJob
        })
      }
    })
  }
  })
};

exports.main = function(req, res) {
  db.getNodeById(req.session.userId, function (err, user) {
    req.session.user = user;
    db.query('MATCH n\nWHERE n.job = "'+req.session.user.data.job+'"\nRETURN n', function ( err, sameJob) {
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
        res.render('home', {
          user: req.session.user,
          others: sameJob,
        })
      }
    })
  })
};

exports.friend = function(req, res) {
  console.log('Session data: ' + req.session.userId);
  db.getNodeById(req.session.userId, function (err, user) {
    if(err) {
      console.log('find user:' + err);
    } else {
      console.log(user);
    db.getNodeById(req.params.id, function (err, other) {
      user.createRelationshipTo(other, 'occupation', function(err, rel) {
        if(err) {
          console.log(err);
        } else {
          res.redirect('/home')
        }
      })
    })
  }
  })
};

exports.myfriends = function(req, res) {
  db.getNodeById(req.session.userId, function(err, user) {
    db.query('START u=node('+req.session.userId+')\nMATCH u-[:occupation]-(friends)\nRETURN friends', function (err, frnds) {
      if(err) {
        console.log(err);
      } else {
        db.query('START u=node('+req.session.userId+')\nMATCH u-[:occupation]-(link)-[]-(distant)\nRETURN link, distant', function (err, distant) {
          res.render('friends', {
            user: user,
            friends: frnds,
            distant: distant
          })
        })
      }
    })
  })
};