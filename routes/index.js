
/*
 * GET home page.
 */
var NEO = require('neo4j');
var db = new NEO.GraphDatabase('http://localhost:7474');

exports.index = function(req, res){
  res.render('index');
};

exports.register = function(req, res) { 
  db.query('CREATE (n: '+req.body.status+' {name: "'+req.body.name+'", password: "'+req.body.password+'", job: "'+req.body.job+'"})', function (err) {
    req.session.data = {name: req.body.name, password: req.body.password};
    res.redirect('/login');
	})
};

exports.login = function(req, res) {
  if(req.body.name && req.body.password) {
    var loginData = {name: req.body.name, password: req.body.password};
  } else if (req.session.data) {
    var loginData = req.session.data;
  } else { res.redirect('/'); }

  var query = [
  'MATCH n',
  'WHERE n.name = "'+loginData.name+'"',
  'AND n.password = "'+loginData.password+'"',
  'RETURN n, labels(n)'
  ].join('\n');

  db.query(query, function (err, user) {
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
    req.session.user = user[0].n;
    req.session.labels = user[0]['labels(n)'][0];
    req.session.userId = user[0].n.id;
    if(req.session.labels === 'Minion') {
        var complement = 'Lord';
      } else {
        var complement = 'Minion';
      }
    db.query('MATCH (n:'+complement+')\nWHERE n.job = "'+req.session.user.data.job+'"\nRETURN n', function ( err, sameJob) {
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
      console.log(req.session.labels);
        res.render('home', {
          user: req.session.user,
          others: sameJob,
          otherstatus: complement
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