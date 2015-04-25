'use strict';

var path = require('path');
var request = require('request');
var test = require('tap').test;
var express = require('express');
var session = require('express-session');
var rimraf = require('rimraf');
var Store = require('./')(session);

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

  var server = app.use(mw)
  .get('/', function(req, res) {
    res.send('ok');
  })
  .listen(1234);

  request.get('/', {jar: true}, function(err, res, body) {
    console.log(err);
    console.log(body);
    rimraf.sync(path.join(__dirname, 'level-session-store'));
    server.close();
    t.end();
  });
});
