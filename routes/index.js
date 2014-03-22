
/*
 * GET home page.
 */
var NEO = require('neo4j');
var db = new NEO.GraphDatabase('http://localhost:7474');

exports.index = function(req, res){
  res.render('index');
};

exports.register = function(req, res) {
	var user = db.createNode({name: req.body.name, password: req.body.password})
  user.save(function (err, node) {
		if(err) {
			console.log(err);
      res.redirect('/')
		} else { 
			console.log(node)
      req.session.user = node
      res.render('home', {
        user: user
      });
		};
	})
};

exports.login = function(req, res) {
  var params = {
    name: req.body.name,
    password: req.body.password
  };
  var query = [
  'START usr=node(*)',
  'WHERE usr.name = "'+params.name+'"',
  'AND usr.password = "'+params.password+'"',
  'RETURN usr'
  ].join('\n');

  db.query(query, params, function (err, user) {
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
    req.session.user = user[0].usr;
    req.session.userId = user[0].usr.id;
    db.query('START othr=node(*)\nRETURN othr', params, function ( err, others) {
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
      console.log(req.session.user.id);
        res.render('home', {
          user: req.session.user,
          others: others
        })
      }
    })
  }
  })
};

exports.main = function(req, res) {
  var params = {};
  db.getNodeById(req.session.userId, function (err, user) {
    req.session.user = user
    db.query('START othr=node(*)\nRETURN othr', params, function ( err, others) {
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
        console.log(others)
        res.render('home', {
          user: req.session.user,
          others: others
        })
      }
    })
  })
};

exports.friend = function(req, res) {
  console.log('Session data: ' + req.session.userId);
  db.getNodeById(req.session.userId, function ( err, user) {
    if(err) {
      console.log('find user:' + err);
    } else {
      console.log(user);
    db.getNodeById(req.params.id, function (err, other) {
      user.createRelationshipTo(other, 'friend', function(err, rel) {
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
    user.getRelationships('friend', function (err, rels) {
      res.render('friends', {
        user: user,
        rels: rels
      })
    })
  })
}