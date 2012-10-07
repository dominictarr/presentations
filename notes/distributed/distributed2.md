# Distributed Systems for "RealTime".

I'm @dominictarr. 

I'm into distributed systems.

# Prelude.

  I was playing around with single page apps.
  realized something...

# Confession.

I've never understood what "MVC" actually means.

I mean, what it REALLY means. 

If MVC is a "thing".
then how come every implementation is slightly different?

# Realization.

```

  M V C  

      IS  A  LEAKY

   A B S T R A C T I O N !!!

```

# what is really happening?

when the `Model` updates
 -> update the UI.

when the UI updates,
  -> update the Model.

(also, propagate the changes to the "database")

async -> concurrent updates is possible!

How de we handle that?

# meaning of concurrent.

Lamport 79

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

before(C, D) === false
```

# Propagating Changes...

Sound familiar?

hmm, don't we all use something like that to
manage changes in our code?


# Git is a Distributed Sytem.

git is diffs in a tree.

A diff is only the changes in a file.
the original `diff` by Doug McIlroy, in 1975.

`diff3` is by Randy Smith, in 1988.

```
diff3 mine concestor yours
```

# send updates to the database...

but what if there is a conflict?

# Interesting.

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
F = patch(C, diff3(C, B, F))
```

produces a diff that can be applied to C.

```
A---B---C---F
     \     /
      D---E
```
git lets the human handle an unclean merge.
a realtime application probably wants to 
handle that automatically.

# "doesn't look that hard"

started implementing this in js...

[snob](http://npm.im/snob)

after six weeks...

# it worked!

but...

# meanwhile...

found @bnoguchi of derby.

he had already done more research than me,
and recommended me some papers!

# Lamport 79

defines the concept of "concurrent"
and represents this with vector clocks.

``` js
{ Anna: 1, Bill: 2, Charlie: 1}
```
is concurrent to
``` js
{ Anna: 1, Bill: 1, Charlie: 2 }
```

but both are before 
``` js
{ Anna: 2, Bill: 2, Charlie: 2 }
```

# CRDT

A comprehensive study of convergent and commutative
replicated data types. 2011

CRDTs are data structures which merge trivially after
concurrent updates and guarantee Eventual Consistency.

# grow only set.

The set of non virgins.

you can't be deleted from the set!

# deletes by subtracting two sets.

virgins = born - non-virgins.

# State

update a key with a timestamp.
overwrite it if another update is more recent.

``` js
[ key, value, timestamp ]
```

# CALM conjecture.

Consistency as Logical Monotonicity.

"monotonic" is operations that once true,
will always be true -> free eventually consistency.

# dynamo

Dynamo: Amazon's highly available key-value store. 2007

often mistaken for a database.

Actually: a replication layer.
          that contains some databases!

- gossip protocol replicates list of nodes.

- plugin database (even mysql!) that holds the data.

- merkle tree replicates actual data
  vector clocks.

Performance is measured from the 99th percentile.

# merkle tree

TODO: implement this.

hash every object/key

hash prefix groups of hashes.

until you have hashed the whole database!

(then compare hashes!)

# hash-ring.

when updating a key,
send to this node:
``` js
min(nodes, function (node) {
  return hash(node) - hash(key)
}, 0) || last(nodes)
```

makes it easy to know which node a document is scaled out to!

# actually...

PUT: send it to N=3 nodes!
GET: retrive from N=2 nodes!

if responses are different, send both to user app.
application is expected to merge, and POST back.

# crdt

way simpler idea. 

build interesting models with crdt.
objects, Set, Seq.

``` js
var doc = new crdt.Doc()
var row = doc.set({key: value})

row.on('update', function (change) {
  //respond to the update.
})

net.createServer(function (stream) {
  stream.pipe(doc.createStream()).pipe(stream)
})
```

# Scuttlebutt

Efficient Reconciliation and Flow Control
for Anti-Entropy Protocols 2008

  thanks @izs !

each node has an ID, and a strictly increasing timestamp/seq.
when two nodes connect (randomly) they first exchange a 
handshake listing timestamps of the gossip they have recieved per node.

exchange only new news.

eventually, I refactored scuttlebutt out of crdt.


