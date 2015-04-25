'use strict';

var fs = require('fs');
var path = require('path');
var request = require('request');
var test = require('tap').test;
var express = require('express');
var session = require('express-session');
var Store = require('./');

test('it stores session', function(t) {
  var app = express();
  var store = new Store();
  var mw = session({
    store: store,
    key: 'sid',
    secret: 'foobar',
    resave: true,
    saveUninitialized: true
  });
  app.use(mw)
  .get('/', function(req, res) {
    res.send('ok');
  })
  .listen(1234);

  request.get('/', {jar: true}, function(err, res, body) {
    console.log(err);
    console.log(res.headers);
    console.log(body);
    fs.unlinkSync(path.join(__dirname, 'level-session-store'));
    t.end();
  });
});
