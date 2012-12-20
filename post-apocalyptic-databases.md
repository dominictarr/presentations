# POST APOCALYPTIC DATABASES

~ or ~

Why LevelDb is the future

# what is leveldb

* lightweight embedded db
* created by google to build indexedDb in chrome
* ordered key-value store
* GET PUT DEL BATCH and RANGE
* and NOTHING ELSE

# basics
``` js
//levelup bindings by rvagg
var levelup = require('levelup')
levelup('/tmp/levelup-example', {createIfMissing: true}, function (err, db) {
  if(err) throw err

  db....
})

# put, get, del
``` js
db.get(key, function (err) {...})

db.put(key, value, function (err) {...})

db.del(key, function (err) {...})

//key, value, may be string or Buffer
```

# range

``` js
db.readStream(options)
  .on('data', function (data) {
     console.log(data.key, data.value)
  })
```

# options
``` js
opts = {
  start: "A",
  end  : "~",
  limit: Number,
  keys: boolean,   //only keys
  values: boolean, //only values
  reverse: boolean
}
```

# batch

``` js
db.batch([
  {type: 'put', key: "key1", value: "value1"},
  {type: 'del', key: "key0"}
], function (err) {...})
```

# also, did I mention that it's embedded in node.js?

We get to extend leveldb with JS and NPM!

PLUGINS!

# hooks for PUT, DEL, BATCH

var hooks = require('level-hooks')()(db)

db.hooks.pre(function (batch) {
  //before a batch is inserted, may modify!
  //i.e, add another record that will be inserted atomically!
  batch.push({type: 'put', key: '~log:'+Date.now(), value: ""})
  return batch
})

db.hooks.post(function (change) {
  console.log(change.type, change.key, change.value)
})

# job queue
``` js
var levelup = require('levelup')
require('level-queue')()(db)
db.queue.add('job', function (value, done) {
  setTimeout(function () {
    done()
  }, Math.random() * 1000)
})
db.queue('job', 'todo - may be any string or buffer')
```



