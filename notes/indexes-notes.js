// ---------------------- Working with Indexes ----------------------

// COLLSCAN => A collection scan that scans every document in a collection
// IXSCAN => Values in an index are already sorted, so index scans quickly go to values you're looking for and finds matching documents that are already referenced by the value
// IXSCAN returns keys which are pointers to the documents. These pointers reach out to the collection where documents are and fetch them
// Index looks something like this (for the "age" field):
(29, "address in memory/ collection a1")

(30, "address in memory/ collection a2")

(33, "address in memory/ collection a3")

// Do not use too many indexes. Indexes do not come for free, pay performance cost on writes. Costs performance when inserting documents because each index would have to be updated.

// .explain() helps us analyze our query, explain works for find, update, delete
db.contacts.explain().find({"dob.age": {$gt: 60}})

// shows execution details
db.contacts.explain("executionStats").find({"dob.age": {$gt: 60}})

// Building Index => Foreground vs Background
// Foreground => collection is locked during index creation, faster
// Background => collection is accessible during index creation, slower
// default is background: false
db.ratings.createIndex({age: 1}, {background: false})
// background set to true is useful for production databases because you don't want collection to be locked during index creation
db.ratings.createIndex({age: 1}, {background: true})

// creating an index by field, sort by ascending = 1 or descending = -1
db.contacts.createIndex({"dob.age": 1})

// dropping an index
db.contacts.dropIndex({"dob.age":1})

// dropping a compound index
db.contacts.dropIndex("dob.age_1_gender_1")

// IMPORTANT: if you have a query that brings back most or all of your documents an index scan can actually be slower than a collection scan
// The reason being the extra step of going through most of the Index list and then going to collection and getting all the documents

// compound index, the order matters when creating the index
// e.g. => (30, male), (30, male), (31, female), (31, male)
db.contacts.createIndex({"dob.age":1, gender: 1})

// example queries that would use the compound index created above, index will be used left to right
db.contacts.explain().find({"dob.age":35, gender: "male"})
db.contacts.explain().find({"dob.age":35})

// sorting with indexes, since indexes already order the list, mongodb can quickly give us back the order of documents we need
// IMPORTANT: if you are using sort with no index, mongodb can time out if it is a very large collection of documents, > 32MB of memory
db.contacts.explain().find({"dob.age": 35}).sort({gender: 1})

// find all indexes
db.contacts.getIndexes()

// creating a unique index
db.contacts.createIndex({email: 1}, {unique: true})

// creating a unique index, existing documents where email field does not exist are not indexed as a value, otherwise this happens by default
// would be able to insert a new document without an email field, without getting an error
db.users.createIndex({email: 1}, {unique: true, partialFilterExpression: { email: { $exists: true}}})

// partial filters
// this partial filter index will only store the males
db.contacts.createIndex({"dob.age": 1}, {partialFilterExpression: {gender: "male"}})
// this partial filter index will only store ages greater than 60
db.contacts.createIndex({"dob.age": 1}, {partialFilterExpression: {"dob.age": {$gt: 60}}})

// to use partial filter, need to also query for partial filter expression
db.contacts.explain().find({"dob.age": {$gt: 60}, gender: "male"})

// TTL, time to live index works only on single indexes and date objects
db.sessions.insertOne({data: 'dasfasdf', createdAt: new Date()})
// after 10 seconds, newly inserted documents and also existing documents (which is re-evaluated by the time to live index when new inserts are made) will be removed
db.sessions.createIndex({createdAt: 1}, {expireAfterSeconds: 10})

// covered queries are very efficient, essentially you are filtering and projecting for the specific index you created
// in a covered query, 0 documents will need to be examined, as what is queried for already exists in the index itself
db.customers.createIndex({name: 1})
db.customers.explain("executionStats").find({name: "Max"}, {_id: 0, name: 1})

// multi-key indexes are larger than single indexes
// each element of an array is pulled out and stored as its own value in a multi-key index
// address is an array in this case
db.contacts.createIndex({addresses: 1})
db.contacts.createIndex({"addresses.street": 1})
db.contacts.explain("executionStats").find({"addresses.street": "Main Street"})

// text index, only one allowed per collection because they are expensive
db.products.insertMany([{title: "A Book", description: "This is an awesome book about a young artist!"},{title: "Red T-Shirt", description: "This T-Shirt is red and it's pretty awesome"}])
db.products.createIndex({description: "text"})
db.products.find({$text: {$search: "awesome"}})
db.products.find({$text: {$search: "book"}})
// red book is not a connected phrase, it will look for these 2 words separately in all documents
db.products.find({$text: {$search: "red book"}})
// syntax for a connected phrase
db.products.find({$text: {$search: "\"red book\""}})

// sort text index results, score and $meta are special to text index, this will sort the documents and provided a score field
db.products.find({$text: {$search: "awesome t-shirt"}}, {score: {$meta: "textScore"}})

// some extra options besides $search
db.products.find({$text: {$search: "awesome t-shirt", $language: "german", $caseSensitive: true}}, {score: {$meta: "textScore"}})

// to enforce the sorting, we can chain .sort()
db.products.find({$text: {$search: "awesome t-shirt"}}, {score: {$meta: "textScore"}}).sort({score: {$meta: "textScore"}})

// drop a text index by its name
db.products.dropIndex("description_text")

// merging the text of multiple fields together into one text index (since we can only have one per collection)
db.products.createIndex({title: "text", description: "text"})

// you can change default language
db.products.createIndex({title: "text", description: "text"}, {default_language: "english"})

// setting weights, puts weight on the field that has the most important key words
db.products.createIndex({title: "text", description: "text"}, {default_language: "english", weights: {title: 1, description: 10}})

// exclude words with text indexes
// adding a '-' minus sign in front of the word will exclude documents containing that word
db.products.find({$text: {$search: "awesome -t-shirt"}})

