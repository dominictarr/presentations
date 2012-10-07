# Distributed Systems for "RealTime".

I'm @dominictarr. 

I'm into distributed systems.

# Last Summer

started playing with single page apps...

* MVC doesn't *feel right*

but my intuition wanted:

* ui change <-> model change.
* model change <-> db change.


# Why is it not like this?

* ui change <-> model change. == true

* database api is a different shape.

* what if two people update simultanously?


# Funny Idea

hang on, isn't git all about sending changes?

* git is DISTRIBUTED Version Control System. (DVCS)

* if your program (app) runs across multiple
  devices, then it's DISTRIBUTED, too right?

so, what if we used git, or the git architecture?


# how does git work?

* track diffs in a tree of commits.

* each commit points to previous commit,
  with a secure hash.

* diff, diff3, patch

* three-way-merge = when two people update at once.


# diff

`diff` computes changes in a file
the original `diff` by Doug McIlroy, in 1975.

```
diff file_new file_old | patch file_old
```


# diff3

`diff3` is by Randy Smith, in 1988.

computes differences between 3 files

`diff3 mine concestor yours`

`diff3` had been in use in the real world
for 19 years before an academic decides to study it.

A Formal Investigation of diff3 - 2007


# How git manages concurrent updates?

```
         me

A---B---C
     \
      E---F

          you
```
C is concurrent to E, F


# merge, to make each node consistent.

```
G = patch(C, diff3(C, B, F))
```

produces a diff that can be applied to C.

```
A---B---C---G
     \     /
      E---F
```
git lets the human handle an unclean merge.
a realtime application probably wants to 
handle that automatically...


# "doesn't look that hard"

started implementing this in js...

[snob](http://npm.im/snob)

* every node has it's own database.
* intermittent connections (offline): no problem 
* works without a central server
  - robot explorers


# Serialization patterns
```js
// across the network!
net.createServer(function (stream) {
  stream.pipe(repo.createStream()).pipe(stream)
})

// to disk
repo.createReadStream().pipe(fs.createWriteStream(file))

// from disk
fs.createReadStream(file).pipe(repo.createWriteStream())
```


# problems:

* kinda complex...

* most apps don't need the whole history.

* kinda cumbersome to attach to UI.

(really, we need some sort of Backbone like thing...)


# @bnogushi (of derby) to the rescue!

* Lamport 79 (vector clocks)
* A comprehensive study of convergent 
  and commutative replicated data types. 2011
  (crdt)
* Dynamo: Amazon's highly available key-value store. 2007


# meaning of "concurrent".
```
- - - - - - - - 
A --> B --> C
       \
- - - - \ - - -
         `-> D
- - - - - - - -
```
Sections represent nodes,
Arrows represent async messages.

``` js
before(A, B) === true
before(A, C) === true
before(A, D) === true
before(C, D) === false //concurrent
```


# crdt - commutativity

Design datastructures that are trivial to merge.

so you get Eventual Consistency for free!


# Membership in a set:

Set of non-virgins (A grow-only set)

(the effect of sex on your virginity 
is both idempotent and commutative)


# Deletes

  * a `delete` must be an update.

  * __delete = true

or difference between two sets

`virgins = born - nonVirgins`


# example of a real system - dynamo.

Dynamo. note: combination of several communication styles.
gossip, scuttlebutt, merkle trees, vector clocks...
``` 
   (B)-(D)
   /     \
  A      (E)
  |       |
  I       F
   \     /
    H---G
```

documents are replicated between adjacent node,

list of nodes is replicated to every node.

every node knows where a document is stored.


# gossip protocol

nodes just connect RANDOMLY!

there is no leader. when gossiping, 
any node can connect to any other.

Distributed patterns are super scalable.

(so you can use more resources)


# Take 2

new ideas are much easier!

New idea: just make something simple, that commutes,
and maps to DOM / ui frameworks easily.

Implement [crdt](http://npm.im/crdt)


# Simple Example

``` js
var Doc = require('crdt').Doc
var doc = new Doc()

// set propertys
var m = doc.add({ id: 'id:02576432', prop: "value" })

m.on('update', function () { 
  //respond to updates
  console.log(m.get('prop')) 
})

m.set('key', value)
```


# lists

``` js
var todo = doc.createSeq('list', 'todo')
var done = doc.createSeq('list', 'done')

var drnk = todo.push({text: 'beer'})
var meet = todo.push({text: 'reject.js'})

todo.before(meet, drnk)
done.push(meet)
//will be removed from todo list!
```


# Scuttlebutt

Later, I refactored the core out into `scuttlebutt`.

[scuttlebutt](http://npm.im/scuttlebutt) 
is a base class for a replicatable data type!

implemented examples for:

  * key-value store: scuttlebutt/model

  * reliable event-emitter: scuttlebutt/events


# Impressions

simpler and better!

Maps more closely to the DOM.

(both act like a linked list...)

but there was room to simplify EVEN MORE.


# The Simplicity the Other Side of Complexity.
``` js
var rr = repred(function (collect, update) {

  var changes = {}
  for(var u in update) {
    changes [u] = collect[u] = true
  }
  return changes

}, initial={})

rr.update({thing: true})
```

# peer to peer example

repred/example/peer server_port client_port


# Distributed Systems are EASY

  Any Questions?

