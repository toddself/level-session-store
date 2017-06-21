var util = require('util')
var stringify = require('json-stringify-safe')
var lengthKey = '__length__'

module.exports = function (session) {
  var Store = session.Store

  function LevelSessionStore (db, opts) {
    db = db || 'level-session-store'
    opts = opts || {}
    Store.call(this, opts)
    this.mungeKey = false
    this.storeName = opts.ns || '_session'

    if (typeof db === 'string') {
      this._createDB(db, opts)
    } else {
      this.mungeKey = true
      this.db = db
    }
  }

  util.inherits(LevelSessionStore, Store)

  LevelSessionStore.prototype._createDB = function (name, opts) {
    opts = opts || {}
    var self = this

    try {
      var level = require('level')
    } catch (err) {
      throw new Error('If you are not passing in an existing level instance, you must have the package level installed. ' + err.message)
    }

    this.db = level(name, opts, function (err, db) {
      if (err) {
        throw err
      }

      var key = self.getKey(lengthKey)
      db.get(key, function (err, length) {
        if (err && err.type !== 'NotFoundError') return self.emit('error', err)
        length = parseInt(length, 10) || 0
        db.put(key, length)
        self.emit('connect')
      })
    })
  }

  LevelSessionStore.prototype.getKey = function (key) {
    if (this.mungeKey) {
      return [this.storeName, key].join('/')
    }
    return key
  }

  LevelSessionStore.prototype.get = function (sid, cb) {
    this.db.get(this.getKey(sid), function (err, data) {
      if (err && err.type !== 'NotFoundError') {
        return cb(err)
      }
      var session

      if (data) {
        try {
          session = JSON.parse(data)
        } catch (err) {
          return cb(err)
        }
      }

      cb(null, session)
    })
  }

  LevelSessionStore.prototype.set = function (sid, session, cb) {
    var self = this
    session = stringify(session)
    this.db.get(this.getKey(lengthKey), function (err, len) {
      if (err) return cb(err)
      len = parseInt(len, 10) || 0
      var ops = [
        {type: 'put', key: self.getKey(sid), value: session},
        {type: 'put', key: self.getKey(lengthKey), value: ++len}
      ]
      self.db.batch(ops, cb)
    })
  }

  LevelSessionStore.prototype.destroy = function (sid, cb) {
    var self = this
    this.db.get(this.getKey(lengthKey), function (err, len) {
      if (err) return cb(err)
      len = parseInt(len, 10) || 0
      var ops = [
        {type: 'del', key: self.getKey(sid), value: session},
        {type: 'put', key: self.getKey(lengthKey), value: --len}
      ]
      self.db.batch(ops, cb)
    })
  }

  LevelSessionStore.prototype.touch = function (sid, session, cb) {
    session = stringify(session)
    this.db.put(this.getKey(sid), session, function (err) {
      cb && cb(err)
    })
  }

  LevelSessionStore.prototype.length = function (cb) {
    this.db.get(this.getKey(lengthKey), function (err, len) {
      return cb(err, parseInt(len, 10) || 0)
    })
  }

  LevelSessionStore.prototype.clear = function (cb) {
    var self = this
    var total = 0
    var count = 0
    var streamDone = false

    var done = function () {
      ++count
      if (count === total && streamDone) {
        cb && cb()
      }
    }

    this.db.createKeyStream()
      .on('data', function (key) {
        if (self.mungeKey && key.indexOf(self.storeName) === 0) {
          self.db.del(key, done)
        }
      })
      .on('end', function () {
        self.db.put(self.getKey(lengthKey), 0, function () {
          streamDone = true
          done()
        })
      })
  }

  return LevelSessionStore
}
