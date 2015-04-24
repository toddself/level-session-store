'use strict';

var sublevel = require('level-sublevel');

function LevelSessionStore(opts) {
  this.length = 0;
  this.storeName = opts.ns || '_session';
  typeof opts.db === 'string' ? this._createDB(opts.db, opts.opts) : this._wrapDB(opts.db);
}

LevelSessionStore.prototype._createDB = function(name, opts) {
  opts = opts || {};
  try {
    var level = require('level');
  } catch (err) {
    throw new Error('If you are not passing in an existing level instance, you must have the package level installed');
  }
  this._wrapDB(level(name, opts));
};

LevelSessionStore.prototype._wrapDB = function(db) {
  this.db = sublevel(db).sublevel(this.storeName);
};

LevelSessionStore.prototype.get = function(sid, cb){
  this.db.get(sid, cb);
};

LevelSessionStore.prototype.set = function(sid, session, cb){
  var self = this;
  this.db.put(sid, session, function(err) {
    if (err) {
      return cb(err);
    }
    ++self.length;
    cb();
  });
};

LevelSessionStore.prototype.destroy = function(sid, cb){
  var self = this;
  this.db.del(sid, function(err) {
    if (err) {
      return cb(err);
    }
    --self.length;
    cb();
  });
};

LevelSessionStore.prototype.touch = function(sid, session, cb){
  this.db.put(sid, session, cb);
};

LevelSessionStore.prototype.length = function(cb){
  cb(this.length);
};

LevelSessionStore.prototype.clear = function(cb){
  var self = this;
  var count = 0;
  var total = 0;
  var streamDone = false;

  var done = function(){
    ++count;
    if (count === total && streamDone) {
      cb();
    }
  };

  this.db.createKeyStream()
    .on('data', function(key){
      ++total;
      self.del(key, done);
    })
    .on('end', function(){
      streamDone = true;
      done();
    });
};

module.exports = LevelSessionStore;
