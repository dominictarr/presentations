# Playing with Duplo blocks and Colouring with Crayons.

  @dominictarr 

  hex, not hexes.

  node.js !


# Shit Ryan Dahl Says

"Node.js is a platform built on Chrome's JavaScript runtime 
 for easily building fast, scalable network applications.
 Node.js uses an event-driven, non-blocking I/O model that 
 makes it lightweight and efficient, perfect for data-intensive 
 real-time applications that run across distributed devices."

  - from nodejs.org

# I'm just gonna edit this a bit...

"Node.js makes it easy to build fast, scalable network applications!

 Node.js uses V8 with non-blocking I/O to make it lightweight and efficient!
 It's perfect for data-intensive distributed real-time applications."

# Is this TRUE? 

* Network Application ?

* Scalable ?

* Easy ?

what does it even MEAN?

# Ryan Dahl Elaborates...

"I want programming computers to be like coloring with crayons 
 and playing with duplo blocks."

obviously:
  Duplo = modules with simple composable interfaces
  Colouring with Crayons = shallow customizations, templates, css, etc.

# what ARE Duplo Blocks?

  * Different types of blocks.

  * Studs (connectors, bumps, nubs) are the same.

  * Since connectors are standardidized, you don't need glue...

# ~ Overall VIBE ~

Duplo & Crayons are for kids!

  * it's not EnterpriseServerBeans.

  * it's not about feeling clever.

  * it's about being EASY and FUN.

# in case you hadn't already guessed...

studs = streams.

Streams are not just for FAST IO.

Streams are for connecting programs together.

# old-fashioned streams: unix.

One Way Stream (readable XOR writable)

  read / write from file, ls, etc.

Through / Filter / Transform streams.
  (mostly filter/through streams)
  grep, uniq

# Full Duplex

(Much more interesting!)

  ssh
  rsync
  git (push, pull)

# What makes these interesting?

It's much more sophisticated than just reading or writing a file.
or transforming an input...

These streams involve two-way communication.

  ssh
    -- handshake to auth and exchange secret keys.
    then a duplex stream to the shell (by default)

  rsync
    -- uses a duplex stream from ssh, and then handshakes

# It's like a conversation.

rsync

  client: "Hello, i'd like to backup these files <list of files>"
  server: "okay, well I know those files, is naekbrabpkrcoapkrabopgkbarcykbop correct?"
  client: <quickly checks>
  client: "here this has changed! nrkpa.brcbaokprgbayrkgbyagyrgkb"
  <they exchange the changes>

  now both sides are in sync.

# git is the same.

git

They way git pushes/pulls is very similar, 
although the structure of the diffs is very different.

ssh

the user is repeatedly sending messages, 
getting responses, and responding with new commands.

* It's easy to build custom full duplex streams in node.js

# The Duplex Pattern

  A.pipe(B).pipe(A)

some node modules with this pattern:

* dnode
* scuttlebutt
* snob
* crdt
* repred
* mux-demux

we need duplex streams to plug long-lived programs together.

# A Lot Has Changed Since January the 1st 1970.

  * computers are faster.
  * and there are WAY more of them.
  * in January the 1st 1970 a sysadmin
    would have intimate knowledge of each computer they control.
  * also, moore's law, clock cycles, and all that stuff...

  note: the network is unreliable.

# A distributed system is ...

  * scaled out servers 

  * application with multiple processes

  * web/mobile application

# Let's Build One!

max has brought realtimecats.com
wants to upload cat pictures to his servers...

scp cat.jpg -> 1.realtimecats.com
            -> 2.realtimecats.com
            -> 3.realtimecats.com
            -> etc

# But everyone loves cats.

but then suppose another user is uploading cat.jpg

this is async & parallel, 
so all these get updated in different orders.

scp cat.jpg' -> 1.realtimecats.com #
scp cat.jpg  -> 3.realtimecats.com
scp cat.jpg' -> 2.realtimecats.com
scp cat.jpg' -> 3.realtimecats.com
scp cat.jpg  -> 2.realtimecats.com
scp cat.jpg' -> 1.realtimecats.com

# UNPREDICTABLE RESULTS !!!

curl 2.realtimecats.com -> cat.jpg'
curl 3.realtimecats.com -> cat.jpg'
curl 1.realtimecats.com -> cat.jpg

# Solution: coordination.

so, make sure everything happens in the correct order,

* upload to a central server, 
  then that uploads to all servers.

* locking, also, there is locking...

* what if a server is down when you do an update?


# THIS ISN'T FUN ANY MORE! YOU SAID IT WOULD BE FUN!

what if instead of enforcing ordering, 
  you made ordering not matter?

the old way = enforce ordering.
  To make distributed systems
  act like local systems.

the new way = be commutative.

# Commutativity

Commutative === Order Doesn't Matter

  A + B === B + A

# add "commutative" to your vocabulary

``` js
function add (word)
  if(-1 === vocab.indexOf(word)) {
    vocab.push(word)
    vocab.sort()
  }
}
add('commutative')
```

# So What Happens If the Uploads are Commutative?

curl 1.realtimecats.com -> cat.jpg'
curl 2.realtimecats.com -> cat.jpg'
curl 3.realtimecats.com -> cat.jpg'

We could choose first update to win, or last, it doesn't matter.

The important thing: ** results converge **

# Another thing about Duplo

(that we took for granted!)

* The effect of combinations is 
  Predictable and Reliable.
* can think of a combination of blocks as one block.

* Complexity is Hidden

Otherwise, it's more like a ** House Of Cards **.

A house of cards does not scale.

# If order doesn't matter...

We can go crazy!
we can deliberately send things totally out of order!

(gossip protocols anyone?)

# So...

Duplo = Commutativily + Streams

  Streams = standard connectors

  Commutativity = sturdyness, reliability.

# Duplo Blocks so far

  * repred      (replication via a reduce function)
  * Scuttlebutt (simple data models with reconciliation)
  * crdt        (more sophisticated model, with sets and lists)
  * snob        (git style commit trees)

(mostly focused on realtime)

# TODO

  * file replication (mini dropbox)
  * replicate git repos
  * merkle trees
  * more realtime modules
  * gossip protocol / topology manager

  There is no silver bullet.

  Need a whole set of tools!

# Pesuade These People to use Duplex Pattern

* Socket.io
* josephg/ShareJs 

# The Trouble with Socket.io

``` js
  var socket = io.connect('http://localhost');
  //^^^ what type of object is this?
  socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' }, function () {
      //CALLBACK ON EVENT EMITTER?
    });
  });
```

# Should be more like this

``` js
  var socket = io.connect('http://localhost');
  //^ should be a stream!
  var emitter = new RemoteEventEmitter()

  socket.pipe(emitter.createStream()).pipe(socket)

  emitter.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
  });
```

ACTUALLY TWO MODULES!!!

# I propose:

  * duplex pattern
    `a.pipe(b).pipe(a)`

  * abstractions that don't do IO.

  * commutativity

# Welcome to the Jungle

you are now at the fringes of node.js Mad Science.

We need your help to push this and see what it can do!

join [stream-punks](http://github.com/dominictarr/stream-punks)

