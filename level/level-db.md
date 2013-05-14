# The Database of the Future

@dominictarr, Mad Scientist

nearForm.com

# Databases of the past

* navigational databases
* sql "relational" databases
* nosql "key-value" databases

# Distant Past - navigational databases.

* database was tree of sets
* based on linked lists
* may have to iterate over whole database/set to query!

# Recent Past:

* SQL "relational" databases
* define schemas, tables
* fairly rich queries with query planner
* transactions
* optimized for inplace updates
* based on Relational Algebra.

# Present - noSQL

* usually key-value, probably materialize your queries with map-reduce,
* usually no transactions, maybe batch operations.
* diverse: Redis, graph databases.

# the more things change, the more they stay the same.

* request/response
  ask a database a question, get an answer.
* monolithic service.
* cheaper to take computation to the data,
  so there is a extension language - SQL, or JS.

# Database of the future

* Modular.
* Realtime.
* Replication.


# Standing on the Shoulders of Giants

* new kinds of wheels for a new kind of road.


# LevelDb

* [chrome://credits/](chrome://credits/)
* Open Source by Google PHDs.
* Log Structured Merge Tree
* fast range queries.



# philosophy

Unix Philosophy

* build many small tools that work together.

Emacs Philosophy

* build a tight core in C
* many extensions in a flexible
  in a flexible dynamic language

# Node.js Philosophy

Node.js = Emacs Philosophy + Unix Philosophy

(small core - big userland on npm!)


# Basic Operations

``` js
var db = require('levelup')(path_to_db)

db.get(key, function (err, value) {...})

db.put(key, value, function (err) {...})

db.del(key, function (err) {...})
```


# More operations

``` js
db.batch([
  {key: key1, value: value, type: 'put'},
  {key: key2,               type: 'del'}
], function (err) {...})

db.createReadStream({start: s, end: e, reverse: r})
```


# get real-time data, LevelUp

``` js
var LiveStream = require('level-live-stream')
var through    = require('through')

LiveStream(db)
  .pipe(through(console.log))
```


# Group by

``` js
var MapReduce = require('map-reduce')

var mapDb = MapReduce(db, 'count', function (key, value, emit) {
  value = JSON.parse(value)
  emit([value.bar], 1)
}, function (acc, item) {
  return Number(acc || 0) + Number(item)
})
```


# query that aggregate:

``` js
mapDb.createReadStream({range: []})

//for real time...
mapDb.createReadStream({range: [bar], tail: true})
```

# partition data

``` js
var SubLevel = require('level-sublevel')
SubLevel(db)

var fooDb = db.sublevel('foo')

//NESTED PARTITIONS! 
var fooBarDb = fooDb.sublevel('bar')
```

# Extending levelup

``` js
module.exports = function (db, subDb, args...) {
  if('string' === typeof subDb)
    subDb = db.sublevel(subDb)

  //add new features,
  //but don't mutate main db.
  subDb.newFeature = function () {...}
}
```

# build your own database.

``` js
var levelup = require('levelup')
var sublevel = require('level-sublevel')
var db = sublevel(levelup('/tmp/mydb', {encoding: 'json'}))

var MapReduce = require('map-reduce')
var Master = require('level-master')

MapReduce(db, 'map', map, reduce)
Master(db,'master')
```


# trigger code on insert, SQL

``` sql
DELIMITER | --- My Favorite SQL Feature!

CREATE TRIGGER testref BEFORE INSERT ON foo
  FOR EACH ROW BEGIN
    INSERT INTO test2 SET a2 = NEW.a1;
  END;
|

DELIMITER ;  --- change back | -> ;
```


# trigger code on insert

``` js
//before a batch/put/del is applied
db.pre(function (ch, add) {
  add({
    type  : 'put',
    key   : Date.now(),
    value : '~LOG~' + ch.key
  })
})
```


# can insert in other sublevels!

``` js
var logDb = db.sublevel('log')

db.pre(function (ch, add) {
  add({
    type: 'put', key: Date.now(),
    value: ch.key,
    prefix: logDb
  })
})
```

* FAQ: why use multiple sublevels
  over multiple databases?


# arranging your keys for range queries

* Don't use `:` to separate keys.

``` js
',.pyfgcrlaoeu:idhtns;qjkbmwv"<>' + 
'PFCRL?AOEUIQJBMWV!@#$%^&*(){1234567890'
.split('').sort().join('')
// =>
'!"#$%&()*,.0123456789:;<>?@ABCEFIJLMOPQRUVW^abcdefghijklmnopqrstuvwy{'
```


# recommended key patterns:

``` js
aaa\x00bbb
aaa1\x00bbb
\xffPREFIX\xffaaa

// or

aaa!bbb
aaa1!bbb
~PREFIX~aaa
```

# read a range

``` js
db.createReadStream({start: 'aaa!', end: 'aaa!~'})
  .pipe(through(...))
```

# the important of batching

* update multiple keys atomically
(all updates fail or succeed)
* example: work queue.

# trigger async code, LevelUp

``` js
var Trigger = require('level-trigger')

Trigger(db, 'job', function (value, done) {
  //perform a job requiring IO.
})
```

* guaranteed to be processed at least once.


# Relational Join, SQL

``` sql
SELECT * FROM tweets
JOIN following ON tweets.author = following.follows
WHERE following.follower = 'dominictarr'
```

* kinda useless, for twitter,
  because there is no realtime feature


# Join aka "fan-out" LevelUp

but first: need to structure our data into ranges.


# Tweets "table"

tweetsDb: (where tweets are written to)

``` js
author1!tweet-1 ==> [cat pictures]
author1!tweet-2 ==> i <3 bacon
author2!tweet-1 ==> justin bieber, etc
```

Indexed by `authorId, tweetId`


# FollowingDb

followingDb: (a Many-to-Many join table - added to when someone follows someone)

``` js
followed1!follower2 => Date, etc metadata
```


# FeedDb Table 

feedDb: (where tweets are read from)

``` js
follower2!tweet-1!author1! ==> [cat pictures]
follower2!tweet-1!author2! ==> justin bieber, etc
follower2!tweet-2!author1! ==> i <3 bacon
```


# read followers from followingDb.

``` js
Trigger(tweetsDb, function (data) {
  return data.key
}, function (key, done) {
  tweetsDb.get(key, function (err, rawTweet) {
    var tweet = JSON.parse(rawTweet)
    var batch = []
    followsDb.createReadStream({start: tweet.author, end: tweet.author+'~'})
    ...
```


# copy into feedDb.
``` js
  ...
    followsDb.createReadStream({start: tweet.author, end: tweet.author+'~'})
    .pipe(through(function (data) {
      var followed = data.key.split('!').pop()
      this.queue({
        key: [followed, tweet.id, tweet.author].join('!'),
        value: rawTweet, type: 'put', prefix: feedDb
      })
    }))
    .pipe(db.createWriteStream())
    .on('close', done)
  })
})
```


# Replication (Master -> Slave)

``` js
var Master = require('level-master')
var net    = require('net')

var masterDb = Master(db) //can be section, or a whole DB.

net.createServer(function (stream) {
  stream.pipe(masterDb.createStream()).pipe(stream)
}).listen(port)

var slaveDb = Master.Slave(db2)

var s = net.connect(port)
s.pipe(slaveDb.createStream()).pipe(s)
```


# uses for master-slave replication

* write to single master
* load balance reads to multiple slaves

OR

* write to distributed masters
* aggreagate (map-reduce)
* replicate aggregation to single master

# Master-Master replication

``` js
var Master = require('level-master')
var net    = require('net')

var masterDb = Master(db) //can be section, or a whole DB.

net.createServer(function (stream) {
  stream.pipe(masterDb.createStream()).pipe(stream)
}).listen(port)

var master2Db = Master(db2)

var s = net.connect(port)
s.pipe(master2Db.createStream()).pipe(s)
```

# warning

* Overwrites not reliable with Master-Master

* deletes must be an update.

(will _just work_ with twitter example)

# Disclaimer

master-slave is implemented,
master-master next week...

# level-inverted-index

(index text stored in levelup.
``` js
var Index = require('level-inverted-index')

Index(db, 'index', function map(key, value, index) {
    //parse, and pull out any bits of text you want,
    //call index with an index and a rank!

    //here we split by anything that is not a letter
    //or a number
    index(value.split(/[^\w\d]+/))
  }, 
  function stub(doc, query) {
    return doc.substring(0, 140) + '...\n'
  })
```

# query inverted-index

``` js
indexDb.query(['search', 'term'], function (err, docs){
  console.log(docs)
})

//stream stubs of documents
indexDb.createQueryStream(['search', 'term'])
  .on('data', console.log)
```

* TODO: search json properties...

# level-* people

people who are hacking on cool stuff!


# rvagg

![rvagg](./images/rvagg.png)

* levelup / leveldown
* level-session
* levelbot


# juliangruber

![juliangruber](./images/juliangruber.png)

* multilevel
* level-store
* level-rpc
* level-schedule
* level-benchmark

# hij1nx

![hij1nx](./images/hij1nx.jpeg)

* lev
* levelweb


# maxodgen

![maxodgen](./images/maxogden.png)

* level.js
* voxel-level


# mcollina

![mcollina](./images/mcollina.jpeg)

* levelgraph

# and many more...

new people are getting involved all the time!

# TODO

* ORM mapper
* universal search (index structure of json)
* jQueryesque selector syntax
* get running in phonegap
* time series data, trends, machine learning etc.
* geospatial data

# and much much more!

https://github.com/rvagg/node-levelup/wiki/Modules

Thank You!

