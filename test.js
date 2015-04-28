'use strict';

var path = require('path');
var request = require('request');
var tap = require('tap');
var test = tap.test;
var express = require('express');
var session = require('express-session');
var rimraf = require('rimraf');
var Store = require('./')(session);

tap.tearDown(function() {
  rimraf.sync(path.join(__dirname, 'level-session-store'));
  rimraf.sync(path.join(__dirname, 'foo'));
  server.close();
});

var app = express();
var store = new Store();
var mw = session({
  store: store,
  key: 'sid',
  secret: 'foobar',
  resave: true,
  saveUninitialized: true,
  unset: 'destroy'
});

var server = app.use(mw)
.get('/', function(req, res) {
  res.send('ok');
})
.get('/bye', function(req, res) {
  req.session.destroy();
  res.send('ok');
})
.listen(1234);


test('it stores session', function(t) {
  request.get('http://localhost:1234/', function(err, res) {
    t.notOk(!!err, 'no errors');
    t.ok(res.headers['set-cookie'], 'setting a cookie');
    store.length(function(err, len) {
      t.notOk(!!err, 'no errors');
      t.equal(len, 1, 'there is a session');
      t.end();
    });
  });
});

test('it deletes a session', function(t) {
  request.get('http://localhost:1234/', function(err, res) {
    t.notOk(!!err, 'no errors');
    t.ok(res.headers['set-cookie'], 'setting a cookie');
    var jar = request.jar();
    var cookieVal = res.headers['set-cookie'][0].split('%')[1].split('.')[0];
    var cookie = request.cookie('sid=' + cookieVal);
    jar.setCookie(cookie, 'http://localhost:1234');
    request({url: 'http://localhost:1234/bye', jar: jar}, function(err) {
      store.length(function(err, len) {
        t.notOk(!!err, 'no errors');
        t.equal(len, 1, 'there is a session');
        t.end();
      });
    });
  });
});

test('it returns a falsy value when getting a non-existing session', function(t) {
  var store = new Store('foo');
  store.get('bar', function(err, session) {
    t.notOk(!!err, 'no errors');
    t.notOk(session, 'session was falsy');
    t.end();
  });
});
