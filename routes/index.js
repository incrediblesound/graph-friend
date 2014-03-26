
/*
 * GET home page.
 */
var NEO = require('neo4j');
var db = new NEO.GraphDatabase('http://localhost:7474');

exports.index = function(req, res){
  res.render('index');
};

exports.register = function(req, res) { 
  req.session.data = {name: req.body.name, password: req.body.password};
  var params = {
    name: req.body.name, 
    password: req.body.password, 
    job: req.body.job
  };
  db.query('CREATE (n:'+req.body.status+' {name: ({name}), password: ({password}), job: ({job})})',params, function (err) {
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
  'WHERE n.name = ({name})',
  'AND n.password = ({password})',
  'RETURN n, labels(n)'
  ].join('\n');

  db.query(query,loginData, function (err, user) {
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
    req.session.user = user[0].n;
    req.session.labels = user[0]['labels(n)'][0];
    req.session.userId = user[0].n.id;
    if(req.session.labels === 'Minion') {
      var params = {job: req.session.user.data.job, complement: 'Lord'};
      } else {
      var params = {job: req.session.user.data.job, complement: 'Minion'};
      };
    db.query('MATCH (n:'+params.complement+')\nWHERE n.job = ({job})\nRETURN n',params, function ( err, sameJob) {
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
      console.log(req.session.labels);
        res.render('home', {
          user: req.session.user,
          others: sameJob,
          otherstatus: params.complement
        })
      }
    })
  }
  })
};

exports.main = function(req, res) {
  db.getNodeById(req.session.userId, function (err, user) {
    req.session.user = user;
    var params = {job: user.data.job};
    db.query('MATCH n\nWHERE n.job = ({job})\nRETURN n',params, function ( err, sameJob) {
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
  var params = {id: req.session.userId};
  db.getNodeById(params.id, function(err, user) {
    db.query('START u=node({id})\nMATCH u-[:occupation]-(friends)\nRETURN friends',params, function (err, frnds) {
      if(err) {
        console.log(err);
      } else {
        db.query('START u=node({id})\nMATCH u-[:occupation]-(link)-[]-(distant)\nRETURN link, distant',params, function (err, distant) {
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