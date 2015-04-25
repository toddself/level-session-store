'use strict';

var util = require('util');

module.exports = function(session) {
  var Store = session.Store;

  function LevelSessionStore(db, opts) {
    db = db || 'level-session-store';
    opts = opts || {};
    Store.call(this, opts);
    this._length = 0;
    this.mungeKey = false;
    this.storeName = opts.ns || '_session';

    if (typeof db === 'string') {
      this._createDB(db, opts);
    } else {
      this.mungeKey = true;
      this.db = db;
    }
  }

  util.inherits(LevelSessionStore, Store);

  LevelSessionStore.prototype._createDB = function(name, opts) {
    opts = opts || {};

    if (!opts.valueEncoding) {
      opts.valueEncoding = 'json';
    }

    try {
      var level = require('level');
    } catch (err) {
      throw new Error('If you are not passing in an existing level instance, you must have the package level installed');
    }
    this.db = level(name, opts);
    this.emit('connect');
  };

  LevelSessionStore.prototype.getKey = function(key) {
    if (this.mungeKey) {
      return [this.storeName, key].join('/');
    }
    return key;
  };

  LevelSessionStore.prototype.get = function(sid, cb){
    this.db.get(this.getKey(sid), cb);
  };

  LevelSessionStore.prototype.set = function(sid, session, cb){
    var self = this;
    this.db.put(this.getKey(sid), session, function(err) {
      if (err) {
        return cb && cb(err);
      }
      ++self._length;
      cb && cb();
    });
  };

  LevelSessionStore.prototype.destroy = function(sid, cb){
    var self = this;
    this.db.del(this.getKey(sid), function(err) {
      if (err) {
        return cb && cb(err);
      }
      --self._length;
      cb && cb();
    });
  };

  LevelSessionStore.prototype.touch = function(sid, session, cb){
    this.db.put(this.getKey(sid), session, function(err) {
      cb && cb(err);
    });
  };

  LevelSessionStore.prototype.length = function(cb){
    cb && cb(this.length);
  };

  LevelSessionStore.prototype.clear = function(cb){
    var self = this;
    var total = 0;
    var count = 0;
    var streamDone = false;

    var done = function() {
      ++count;
      if (count === total && streamDone) {
        cb && cb();
      }
    };

    this.db.createKeyStream()
      .on('data', function(key){
        if(self.mungeKey && key.indexOf(self.storeName) === 0) {
          self.db.del(key, done);
        }
      })
      .on('end', function() {
        done();
      });
  };

  return LevelSessionStore;
};
