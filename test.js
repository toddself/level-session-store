var os = require('os')
var path = require('path')
var request = require('request')
var tap = require('tap')
var test = tap.test
var express = require('express')
var session = require('express-session')
var rimraf = require('rimraf')
var cookieParser = require('cookie-parser')
var Store = require('./')(session)

var app = express()
var store = new Store(path.join(os.tmpdir(), 'level-session-store'))
var noPermPath = path.join(os.tmpdir(), 'noperms')
var mw = session({
  store: store,
  key: 'sid',
  secret: 'foobar',
  resave: true,
  saveUninitialized: true,
  unset: 'destroy'
})

var server = app
  .use(cookieParser())
  .use(mw)
  .get('/', function (req, res) {
    if (typeof req.session === 'undefined') {
      return res.status(500).send('no')
    }
    res.send('ok')
  })
  .get('/bye', function (req, res) {
    req.session.destroy()
    res.send('ok')
  })
  .get('/nuke', function (req, res) {
    store.destroy(req.cookies.sid, function () {
      res.send()
    })
  })
  .listen(1234)

test('it stores session', function (t) {
  request.get('http://localhost:1234/', function (err, res) {
    t.notOk(!!err, 'no errors')
    t.ok(res.headers['set-cookie'], 'setting a cookie')
    store.length(function (err, len) {
      t.notOk(!!err, 'no errors')
      t.equal(len, 1, 'there is a session')
      t.end()
    })
  })
})

test('it deletes a session', function (t) {
  request.get('http://localhost:1234/', function (err, res) {
    t.notOk(!!err, 'no errors')
    t.ok(res.headers['set-cookie'], 'setting a cookie')
    var jar = request.jar()
    var cookieVal = res.headers['set-cookie'][0].split('%3A')[1].split('.')[0]
    var cookie = request.cookie('sid=' + cookieVal)
    jar.setCookie(cookie, 'http://localhost:1234')
    request({url: 'http://localhost:1234/bye', jar: jar}, function () {
      store.length(function (err, len) {
        t.notOk(!!err, 'no errors')
        t.equal(len, 1, 'there is a session')
        t.end()
      })
    })
  })
})

test('it returns a falsy value when getting a non-existing session', function (t) {
  var store = new Store(path.join(os.tmpdir(), 'foo'))
  store.get('bar', function (err, session) {
    t.notOk(!!err, 'no errors')
    t.notOk(session, 'session was falsy')
    t.end()
  })
})

test('deleting the session from the store works', function (t) {
  request.get('http://localhost:1234/', function (err, res) {
    t.error(err)
    var jar = request.jar()
    var cookieVal = res.headers['set-cookie'][0].split('%3A')[1].split('.')[0]
    var cookie = request.cookie('sid=' + cookieVal)
    jar.setCookie(cookie, 'http://localhost:1234')
    request({url: 'http://localhost:1234/nuke', jar: jar}, function (err, res) {
      t.notOk(!!err, 'no errors')
      t.equal(res.statusCode, 200, 'got 200')
      request({url: 'http://localhost:1234/', jar: jar}, function (err, res) {
        t.notOk(!!err, 'no errors')
        t.equal(res.statusCode, 200, 'got 200')
        t.end()
      })
    })
  })
})

test('teardown', function (t) {
  rimraf.sync(path.join(os.tmpdir(), 'level-session-store'))
  rimraf.sync(path.join(os.tmpdir(), 'foo'))
  rimraf.sync(noPermPath)
  server.close()
  t.end()
})
