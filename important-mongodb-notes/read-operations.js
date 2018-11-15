// ---------------------- READ operations ---------------------
// .findOne does not give back cursor
// .find gives back cursor

// $in looks for documents that match these specific values in array in runtime
db.movies.find({runtime: {$in: [30, 42]}}).pretty()

// $or here finds all documents that meet either filter criteria
// $nor here would do the opposite
db.movies.find({$or: [{"rating.average": {$lt: 5}}, {"rating.average": {$gt: 9.3}}]})

// $and, The following two queries are the same
db.movies.find({$and: [{"rating.average": {$gt:9}}, {genres:"Drama"}]})
db.movies.find({"rating.average":{$gt:9}, genres: "Drama"})

// $and is useful when filtering through the same field name, find 'Drama' and 'Horror' in genres field specified for document
db.movies.find({$and: [{genres: "Drama"}, {genres: "Horror"}] })

// If the below query is used without $and, the second filter for genre will override the first
db.movies.find({genres: "Drama", genres: "Horror"})

// $ne => not equal
db.movies.find({ runtime: {$ne: 60}})

// same as using $ne above
db.movies.find({runtime: {$not: {$eq: 60}}})

// $exists, finds documents where a field exists
db.users.find({age: {$exists: true}})
// to also make sure age field doesn't equal to null
db.users.find({age: {$exists: true, $ne: null}})
db.users.find({age: {$exists: true, $gt: 30}})

// $type, can also pass an array
db.users.find({phone: {$type: "number"}})
db.users.find({phone: {$type: ["double", "string"]}})

// $regex
db.movies.find({summary: {$regex: /musical/}})

// $expr
// find documents where volume field is greater than target field
db.sales.find({$expr: {$gt: ["$volume", "$target"]}})
// find documents where volume is greater than target with criteria of, if volume is greater than or equal to 190 difference between volume and target is not greater than 10
db.sales.find({$expr: {$gt: [{$cond: {if: {$gte: ["$volume", 190]}, then: {$subtract: ["$volume", 10]}, else: "$volume"}}, "$target"]}})

// query arrays the same way you would query embedded documents
db.users.find({"hobbies.title": "Coding"})

// $size, which is used on an array, has to be an exact number
db.users.find({hobbies: {$size: 3}})

// $all, find all the specified values in the array of a field for a given document, order doesn't matter
db.movies.find({genre: {$all: ["action", "thriller"]}})

// $elemMatch, ensures what a single document should look like in order to match our query
db.users.find({hobbies: {$elemMatch: {title: "Sports", frequency: { $gte: 3}}}})
db.movies.find({ratings: {$elemMatch: {$gt: 8, $lt: 10}}})

// common cursor (e.g., db.collection.find() ) methods: .next(), .hasNext(), .forEach(), .count(), .pretty(), .sort(), .skip(), .limit()
// sort(), 1 = ascending, -1 = descending
db.movies.find().sort({"rating.average": 1})
// sort rating.average by ascending and then runtime by descending
db.movies.find().sort({"rating.average": 1, runtime: -1})

// skip() skips number of documents
db.movies.find().skip(100)

// limit() limits number of documents shown
db.movies.find().limit(10)

// sort, skip, limit, mongodb will always sort first, then skip, and lastly limit
db.movies.find().sort({"rating.average": 1, runtime: -1}).skip(100).limit(10)

// projection, 1 = include, 0 = exclude, _id needs to be explicitly excluded
db.movies.find({},{name: 1, genres: 1, runtime: 1, rating: 1, _id: 0})
db.movies.find({},{name: 1, genres: 1, runtime: 1, "rating.average": 1, "schedule.time": 1, _id: 0})

// using projection for arrays

// in this case "genres.$" means give me back the one genre that you found, behind the scenes, the documents themselves could still have other genres
db.movies.find({genres: "Drama"}, {"genres.$" : 1})
// result
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a10a"), "genres" : [ "Drama" ] }
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a10b"), "genres" : [ "Drama" ] }
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a10c"), "genres" : [ "Drama" ] }

db.movies.find({genres: {$all: ["Drama", "Horror"]}}, {"genres.$" : 1})
// result
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a0fd"), "genres" : [ "Horror" ] }
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a0fe"), "genres" : [ "Horror" ] }
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a100"), "genres" : [ "Horror" ] }

db.movies.find({genres: "Drama"}, {genres: {$elemMatch: {$eq: "Horror"}}})
// result
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a0fa") }
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a0fb") }
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a0fc") }
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a0fd"), "genres" : [ "Horror" ] }
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a0fe"), "genres" : [ "Horror" ] }

db.movies.find({"rating.average": {$gt: 9}}, {genres: {$elemMatch: {$eq: "Horror"}}})
// result
// { "_id" : ObjectId("5be89817dd2d3ea80fd1a110"), "genres" : [ "Horror" ] }
// { "_id" : ObjectId("5be89818dd2d3ea80fd1a145") }
// { "_id" : ObjectId("5be89818dd2d3ea80fd1a197") }

// $slice, shows certain number of values in an array for a projection, [#toSkip, #toShow]
db.movies.find({"rating.average": {$gt: 9}}, {genres: {$slice: 2}, name: 1})
db.movies.find({"rating.average": {$gt: 9}}, {genres: {$slice: [1, 2]}, name: 1})