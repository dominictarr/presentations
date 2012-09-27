# Writing Custom Streams.

  I'm @dominictarr





  I code for fybe.com and *MadScience*





  I like streams.

# What are Streams?

  * An Abstraction of IO.

  * "chunks of data in time series with back pressure"

  * improve latency

  * reduce memory footprint

  * expand possibilities

  * Real-Time

# Ancient Wisdom.

 "We should have some ways of connecting programs like
  garden hose -- screw in another segment when it becomes
  necessary to massage data in another way.

  This is the way of IO also."

  -- Doug McIlroy. October 11, 1964

# An Early Use of Streams

  [photo of collossus]

# Why you should use streams.

``` js
fs.readFile(file, function (err, data) {
  //this is using streams under the hood.
  //it's just buffering!
})
```
The Real Question:

Do I want to use streams WELL, or BADLY ?

# What are they good for?

  - writeable / readable
    - files, persistence, logging, news-feeds.

  - through
    - compression
    - encryption
    - (de)serialization
    - buffering
    - "effects"

  - duplex
    -  communication.
      - http, tcp, stdio (if you count both sides)
    - connecting data replication, 
      rpc, event emitter, multiplexing.

# How do node.js streams work?

``` js
(readable)                       (writable)
source.emit('data', data)  ----> dest.write(data)
source.emit('end') ------------> dest.end()

source.pause() <---------------- dest.write()===false
source.resume() <--------------- dest.emit('drain')

source.emit('close') ----------> dest.destroy()
dest|source.emit('end'|'close'|'error') 
  |
  `----------------------------> cleanup() 
```

# types of streams

  * one way: readable || writable
    ** readable
    ** writeable

  * two way: writable && readable
    ** through / filter
    ** duplex

# Through vs. Duplex

  * Through is like a meat-grinder.
    (meat goes in, sausage comes out)

  * Duplex is like a telephone.
    (two entities communicate)

# Through, illustrated

  user--,
        |
        v
 ,-------------------.
 |   write(), end()  |
 |                   |
 |emits 'end', 'data'|
 `-------------------`
        |
        |
  user<-/

# Duplex, Illustrated.

                               ///////////////////////
                               |                     |
             ,--------------------,                  |
             |                    |                  |
user ------->| write(), end() ======>   S O M E      |
             |                    |                  |
             |                    |     T H I N G    |
user <-------|emits 'data', 'end' <==                |
             |                    |     E L S E      |
             `--------------------`                  |
                               |                     |
                               |                     |
                               \\\\\\\\\\\\\\\\\\\\\\!
# Through is used like this:

``` js
  readable.pipe(through).pipe(writable)
```
example

``` js
fs.createReadStream(file)
  .pipe(zlib.createGZip())
  .pipe(fs.createWriteStream(file + '.gz'))
```

# Duplex is usually connected in a circle.

``` js
  duplex.pipe(duplex2).pipe(duplex)
```
Example

``` js
var dnode = require('dnode')
var stream = net.connect(port)
sock.pipe(dnode({
  status: function (cb) {
    cb(null, "streamin'")
  }).pipe(sock)
```

# using Through with Duplex

``` js
duplex
  .pipe(through1)
  .pipe(duplex2)
  .pipe(through2)
  .pipe(duplex)
```

# example

``` js
stream = net.connect(PORT)
stream
  .pipe(es.split())
  .pipe(es.parse())
  .pipe(rpcStream())
  .pipe(es.stringify())
  .pipe(stream)
```

# Never do this

``` js
through.pipe(through2).pipe(through)
```

Example:
```
var zip = zlib.createGZip()
var unzip = zlib.createGUnzip()

zip.pipe(unzip).pipe(zip)
```
Will cause an infinite loop, or a dead-lock.

# Gotcha: Synchronous Race Condition.

``` js
MyStream.prototype.write = function(data){
  if(this.paused) {
    this.buffer.push(data)
    return false
  }

  this.emit('data', parse(data))
  return true; //THIS IS WRONG!
}
```

# the fix

``` js
MyStream.prototype.write = function(buffer,encoding){
  if(this.paused) {
    this.buffer.push(data)
    return false
  }

  //emitted events can trigger state changes!
  this.emit('data', parse(data))
  //vvv JUST CHANGE THIS vvv
  return !this.paused; //CORRECT!
}
```

# Gotcha 2: Listener Order.

``` js
stream.on('end', function onEnd () {
  //where is this is the order of 'end' listeners?
  stream.destroy()
})
stream.destroy = function () {
  stream.emit('close')
}
```

If `onEnd` is the first listener, then 'close' will
be emitted _before_ the rest of the 'end' listeners are called!

# The Fix

``` js
stream.on('end', function onEnd () {
  //where is this is the order of 'end' listeners?
  process.nextTick(function () {
    stream.destroy()
  })
})
```

# Remember!

* Change state BEFORE emitting events.

* Take care with listeners that emit events.
  be sure they are the last listener,
  or use nextTick

# Programming Is Hard

but we can use programming to make programming easy.

  **Stream Base Classes**

# from (1)

readable stream from async function.
``` js
var from = require('from')
from(function (i, next) {
  //do whatever,
  this.emit('data', chunk)

  //call next when you are finished for i
  if(i > 100) //or whatever
    this.emit('end')

  //time to call this function again!
  next()
})
```
# from (2)

create readable stream from array.

``` js
var from = require('from')

//will emit 1, 2, 3 as 'data', then 'end'.
var stream = from([1, 2, 3])
```

# map (1, easy) 

convert a async function into a through stream.

``` js
var map = require('map-stream')
var stearm =
  map(function (data, next) {
    //transform data asyncronously!
    process.nextTick(function () {
      next(null, data)
    })
  })
```

# through (1)

``` js
var through = require('through')
var stream =
  through(function (data) {
    //optionally transform the stream...
    this.emit('data', data)
  }, 
  function (end) {
    this.emit('end')
  })
```

# through (2, with buffering)

``` js
var through = require('through')
var stream =
  through(function (data) {
    this.queue(data)
  }, 
  function (end) {
    this.queue(null) //null means 'end'
  })
```

# duplex (advanced)
readable & writable, with buffering on pause.

```js
var emitter = new EventEmitter() //whatever
var duplex = require('duplex')
  var d = duplex()
    .on('_data',  function (data) {
       emitter.update(data)
    })
  emitter.on('update', function (update) {
      d._data(update)
    })

# Testing Streams...

``` js
var spec = require('stream-spec')
var tester = require('stream-spec')

spec(myStream)
  .through({strict: true})
  .validateOnExit()

tester.random()          //random data
  .pipe(myStream)        //pipe through my stream
  .pipe(tester.pauser()) //test pauses are handled properly.

//base classes are already well tested!
```

# See Also

  substack's stream handbook (in progress)
  https://github.com/substack/stream-handbook

  stream-spec has more documentation
  https://github.com/dominictarr/stream-spec


