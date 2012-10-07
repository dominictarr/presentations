# distributed systems for real-time.

phase one: finding the right problem.

playing with UI stuff.

everyone has a slightly different "solution"
no ane can agree about the "solution",
the problem is too messy. 
and cannot be abstracted without leaking...

Noticed this thing,
I update the model, want to send changes to ui.
make a change in UI, send changes to model.

hmm, so this sounds familiar... 
GIT is also about sending changes around...

/* -> move this section somewhere

realized: a "distributed system" is just a program that runs across
multiple computers. It's not just scaled-out databases, but also realtime apps,
or other thick clients are also distributed systems. 

in the cloud, things like network partitions will probably not become an issue
untill you have massive scale. but the part of your application that runs on phones, etc,
has a much less reliable network.

*/

so, I start learning about git. 

phase two: "this doesn't look that hard"

start implementing git in JS.


# protip

- contact others working on similar problems.
  (thanks to @bnogushi)
  get them to recommend you reading.
  AND THEN READ IT!!!

- learn what "concurrent" means.

  lamport '79
  
  A--->B--->C
       \
        `-->D

A is causally before B, C, D. 
It is impossible for C & D to have caused each other,
(please no one mention "quantum entanglement")

[vector clocks] Create a Total ordering of events, consistent across nodes.

Three way merge, aka: diff3.
two way diff (diff) written in 1974 wrote diff.

Khanna et al. 2007. A Formal Investigation of diff3.

this is a key part of git, allows a consistent merge to list structured data.

this allows you to resolve concurrency, creating a consistent total ordering of events.
the important thing here is that the changes CONVERGE. not that they are "correct".
(whatever that means, anyway)

so, after 6 weeks, I had a working commit tree, 
3 way merge for arrays, and js objects
(warning not arbitary objects. detecting merges on trees is not computatable)

I could replicate between two browsers. but then I realized that I this was not approiate 
for the sort of applications I was imagening.

phase three: start over. CRDT.

CRDT & CALM. 

commutative replicated data structures. 
  - commutative updates are trivial to merge.

CALM - Consistency as logical monotonicity.
retractions need coordination.

simplest example - grow only set.
                 - deletes as g1 - g2 (with tombstone)
                 - state update with timestamp

things that are not calm: deletes/retractions require coordination.

basically, the meaning of CALM is that distributed systems are EASY.
if we refactor our thinking, and just build systems that are easy to distribute.

crdt. 
replicated data that is trivial to merge & eventually consistent.

phase 3: putting it all together

Dynamo: Amazon's Highly Available Key-Value Store. 2007

  - Gossip Protocol.
  - consistent hashing.
  - replicated buckets.
  - send requests to paralel nodes.
  - objective is consistently low latency.
    (performance is measured at 99th percentile)

Life Beyond Distributed Transactions. Helland 2007
  as scaling approaches infinity (could also mean scaling down to tiny cores)
  -  applications are seperated into entities, "documents", "resources".
  - must assume that each entity (document) is on a different machine.
  - any async call may fail.
    - must retry after failures.
    - must allow retries.

  because you must anticipate failures, coordination is expensive.
  early work in distributed systems focused on patterns of achieving coordination.
  "distributed transactions", ACID, (atomicity, consistency, isolation, durability)

  the newer aproach is more about how you can avoid the need for coordination.

  example, coordinating between all clients could be prohibitive.

# gossip protocol.

seems a little crazy at first. each node just communicates with other nodes at random.

  - if a exchange fails, the next one will probably work.
  - eventually, each message will get to each node.

When your data structures are CALM, any topology will work.

# scuttlebutt & merkle trees.

  two approaches to replicating data efficiently.
  both depends on a version number and node ids.

  notice that dynamo used TWO replication patterns.
  it's important to use the right kind of hammer with the right kind of nail.
  this is why we need many types of hammers (modules)

  scuttlebutt is used for replicating the list of nodes in the cluster,
  which is a relatively small amount of data, and is kept in memory.
  merkle trees is used for replicating the actual data in the database
  (large amount of data on disk)

# merge approaches

in dynamo, scuttlebutt just merges like a crdt, 
later timestamp overwrites the previous.

when merkle tree finds a concurrent update, it keeps both,
and returns it to the application when they request that document.
the application is responsible for merging any conflicts.

note, dynamo does not remember the concestor, 
so you need to use a CRDT like data structure
that can easily merge in a way appropiate to your application.

# summary,

  be distributed by default!

  if your updates are idempotend and commute,

    - merges will be trivial!
    - eventual consistency!
    - offline will _just_work_!
    - topology doesn't matter!

The simplicity on the other side of complexity.

example with repred.

var rr = repred(function map (value) {
  //transform to same shape as collection.
}, function (collection, update) {
  //merge update into collection
  //return the change!
}, inital = [])

//connect together with streams...
function onConnect (stream) {
  stream.pipe(rr.createStream())
}

//start a server.
net.createServer(rr).listen(PORT)
//connect to a server.
onConnect(net.connect(PORT2))

// live demo...

# Moving forward.

  * framework this. 
  * use CRDT/scuttlebutt to extend this.
  * more modules.
  * replication for files & git repos.


