[![Circle CI](https://circleci.com/gh/scriptoLLC/level-session-store.svg?style=svg)](https://circleci.com/gh/scriptoLLC/level-session-store)

# Level-Session-Store

[![Greenkeeper badge](https://badges.greenkeeper.io/scriptoLLC/level-session-store.svg)](https://greenkeeper.io/)
A session storage module for [expressjs/session](https://github.com/expressjs/session) that uses [level/level](https://github.com/level/level) to store data.

_Note_: this is different than [rvagg/node-level-session](https://github.com/rvagg/node-level-session) in that it requires express-session to operate. It is merely a backing store.

## Installation

`npm install --save level-session-store`

## Usage

```js
var app = require('express')();
var session = require('express-session');
var LevelStore = require('level-session-store')(session);
var mw = session({
  store: new LevelStore()
});
app.use(mw);
```

So long as you have level installed (it is listed as a peerDependency) this will create a new level db and use it for storing sessions.

You don't like the default location it puts it?

```js
var app = require('express')();
var session = require('express-session');
var LevelStore = require('level-session-store')(session);
var mw = session({
  store: new LevelStore('/path/to/where/you/want/it')
});
app.use(mw);
```

You already have a level instance you want it to use?  Not a problem.

```js
var app = require('express')();
var session = require('express-session');
var LevelStore = require('level-session-store')(session);
var mw = session({
  store: new LevelStore(myLevelInstance)
});
app.use(mw);
```

This will invoke "name munging" -- the keys for session stuff will prefixed with `_session`. You don't like that munging?

```js
var app = require('express')();
var session = require('express-session');
var LevelStore = require('level-session-store')(session);
var mw = session({
  store: new LevelStore(myLevelInstance, {ns: '_sessionsAreRadicalToTheExtreme'})
});
app.use(mw);
```

## License

Copyright 2015 Scripto. Available under the Apache 2 license.
