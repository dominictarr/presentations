# Streaming Real Time Data

I'm dominictarr (on anything)




  * been using node since v0.2.1

  * lots of npm modules.



# Mad Science

  I'm interested in 

           **distributed computing**,

  and 

           **realtime applications** 

  (...same thing)


# CRUD/REST Application

  user makes a request ->

  <- server gives an answer

  * All interactions initiated by the client.

# Real-Time Application

  user sends messages ->

  <- server sends messages

  * Either end can initiate an interaction.
  * (so you don't have to press <F5> all the time.

# Patterns For Realtime apps.

  * RPC (request-response)

  * EventEmitters / Pub-Sub

  * Streams (newsfeeds)

but there is another pattern!


# Real-Time Data Replication.

  What is "Real-Time Data Replication"

  ... or what isn't it?

# Traditional (CRUD) data model

  * Centralized database, 
    that users make requests to.

  * Like a "book" or "ledger" that records 
    stock, accounts, reservations 

  (boring stuff like that)

# Data model for real-time collaboration

  * Monkeys hooting & poking each other.

  * Data is spread throughout the system

  * Changes are propagated to each node.

  * Good for things like communication, 
    and games. (fun things)

# Data Replication Style Data Models.

``` js
var Doc = require('crdt').Doc
var doc = new Doc()

// set propertys
var m = doc.add({ id: 'id:02576432', prop: "value" })

m.on('update', function () { 
  //respond to updates
  console.log(m.get('prop')) 
})
```
Updates may happen at any time.
The application must "deal with it".
# Demo 

  * crdt/examples/autonode.js

  * crdt/examples/simple/

  note how the models are streamed together!
  no save() method that makes requests!

# Explain

Create objects, update keys, send a message

``` js
  [key, value, timestamp, source]
```

When recieve a message,

Update your `value` for `key` if 
the `timestamp` is newer.

Models may be out of sync, 
but are Eventually Consistent.

# Scuttlebutt

  Tell me something I don't know:

  * use "scuttlebutt reconciliation" to figure out
    what messages another node has not heard yet.

# Another Example.

  From just updating key:value pairs with timestamps
  we can build more complicated structures.

  crdt/example/complex
  trello.com

# CRDT (Commutative Replicated Data Types)

Distributed Systems are easy, 
IF they have these properties:

  * Commutative: A + B == B + A 
    (Order doesn't matter)
  * Idempotent : A * 1 == A * 1 * 1 
    (applying the same operation twice has same result)

so: remember what you did, so you don't redo things.
    ignore old news if you have new news.

# Membership in a set:

Set of non-virgins (A grow-only set)

(the effect of sex on your virginity 
is both idempotent and commutative)

# Deletes

  * a `delete` must be an update.

  * __delete = true

    (or something like that)

# More interesting Model: Sequences.

  * Collaborative Text Editing.

  * Trello, etc.

  * more applications we havn't event thought of yet

# The Hard Thing...

If I insert B at 4 while you delete A at 2
that changes the what I meant by "4".

``` js
  //me
  [ 3, A, 6, B, 4, 1]
  //         ^ insert B at 4
  //you
  //   v delete A at 2
  [ 3, 6, 4, B, 1]
  //         ^ b is inserted at wrong place!
```

# Solutions

  Complex Solutions
    * OT (for collaborative text editing)
    * diff tree (git)

  Simple Solution
    * CRDTs (but not really suited to text editing)

# Lists in crdts

Don't represent position in lists as an index.

Use either:

  * Pointer to ID of previous element.
  * "Sort" field. 

Move an A between B & C
by setting A.sort such that B.sort < A.sort < C.sort 
is true.

# Example

``` js
var todo = doc.createSeq('list', 'todo')
var done = doc.createSeq('list', 'done')

var drnk = todo.push({text: 'vodka'})
var meet = todo.push({text: 'meet.js'})

todo.before(meet, drnk)
done.push(meet)
//will be removed from todo list!
```

# Sequences and Rows are EventEmitters

``` js
todo.on('add', function (row) {
  //add row to your UI
}).on('move', function (row) {
  var index = seq.at(row) //move row in UI
}).on('remove', function (row) {
  //remove row from UI
  //(for this list at least)
})
```

# Any Questions?





  Also:

    hit me up in #node.js on irc.freenode.net

