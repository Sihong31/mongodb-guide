// ------------ Aggregation Framework --------------

// ---------------- $match
db.persons.aggregate([
    { $match: {gender: "female"} }
])

// ---------------- $group
// find all females in collection, group them by state and sum total persons with each state
db.persons.aggregate([
    { $match: {gender: "female"} },
    { $group: { _id: { state: "$location.state" }, totalPersons: { $sum: 1 }}}
]).pretty()

// sort by totalPersons in descending order
db.persons.aggregate([
    { $match: {gender: "female"} },
    { $group: { _id: { state: "$location.state" }, totalPersons: { $sum: 1 }}},
    { $sort: { totalPersons: -1 } }
]).pretty()

// find persons older than 50, group by gender and find total of each gender, find average age of each gender, order by totalPersons per gender in descending order
db.persons.aggregate([
    { $match: {"dob.age": {$gt: 50}} },
    { $group: {_id: {gender: "$gender"}, totalPersons: {$sum: 1}, averageAge: { $avg: "$dob.age"}}},
    { $sort: { totalPersons: -1}}
]).pretty()

// ---------------- $project
// $project phase is all about transforming data, in this example we create new field called fullName and concatenate the first and last name fields of a document while capitalizing the first letter of each.
// can add new fields with $project in aggregation framework with hardcoded data or dynamic data
// $concat, concatenate strings, $toUpper, make entire string uppdercase, $substrCP get a substring from string
// $subtract two numbers, $strLenCP finds length of a string
db.persons.aggregate([
    { $project: { _id: 0, gender: 1, fullName: { 
        $concat: [
            {$toUpper: { $substrCP: ["$name.first", 0, 1]}}, 
            { $substrCP: ["$name.first", 1, { $subtract: [ { $strLenCP: "$name.first"}, 1 ] }]},
            " ",
            {$toUpper: { $substrCP: ["$name.last", 0, 1]}}, 
            { $substrCP: ["$name.last", 1, { $subtract: [ { $strLenCP: "$name.last"}, 1 ] }]}
        ] }} }
]).pretty()

// $group is for grouping multiple documents into 1 document, grouped by one or more categories of choice
// $group stage does things such as sum, count, average, build array
// $project is a 1 to 1 relation, you input one document and you output one document with projected changes
// $project stage does things such as include/exclude fields, transform fields within a single document
// can add multiples of same stage, must include fields projected from one stage into the next projected stage
// $convert from current type to a new type
// $toDate can be used as shortcut to $convert since no onError or onNull => birthdate: { $convert: { input: "$dob.date", to: "date"} }
// $isoWeekYear extracts year from a date type
// $out will funnel your results into a new collection
db.persons.aggregate([
    {
      $project: {
        _id: 0,
        gender: 1,
        name: 1,
        email: 1,
        birthdate: { $toDate: "$dob.date" },
        age: "$dob.age",
        location: {
          type: "Point",
          coordinates: [
            { $convert: { input: "$location.coordinates.longitude", to: "double", onError: 0.0, onNull: 0.0 } },
            { $convert: { input: "$location.coordinates.latitude", to: "double", onError: 0.0, onNull: 0.0} },
          ]
        }
      }
    },
    {
      $project: {
        gender: 1,
        email: 1,
        location: 1,
        birthdate: 1,
        age: 1,
        fullName: {
          $concat: [
            { $toUpper: { $substrCP: ["$name.first", 0, 1] } },
            {
              $substrCP: [
                "$name.first",
                1,
                { $subtract: [{ $strLenCP: "$name.first" }, 1] }
              ]
            },
            " ",
            { $toUpper: { $substrCP: ["$name.last", 0, 1] } },
            {
              $substrCP: [
                "$name.last",
                1,
                { $subtract: [{ $strLenCP: "$name.last" }, 1] }
              ]
            }
          ]
        }
      }
    },
    { $group: { _id: { birthYear: { $isoWeekYear: "$birthdate"} }, totalPersons: { $sum: 1} }},
    { $sort: { totalPersons: -1}},
    { $out: "transformedPersons"}
  ]).pretty();

// comment out $group and $sort stages above to get the correct $out transformation for $geoNear
// $geoNear must be first stage in the pipeline
db.transformedPersons.createIndex({location: "2dsphere"})

db.transformedPersons.aggregate([
  { $geoNear: {
    near: { 
      type: "Point", 
      coordinates: [-18.4,-42.8]
    },
    maxDistance: 1000000,
    num: 10,
    query: { age: { $gt: 30} },
    distanceField: "distance"
  }}
]).pretty()

  // $push will push the field value of every incoming document into our allHobbies array
  // $addToSet will do the same as $push, except no duplicate values are pushed into our allHobbies array
  // what happens if the value being pushed is also an array? 
  // $unwind stage will take one document and output multiple documents, one for each element of the array field passed into the stage
  db.friends.aggregate([
      { $unwind: "$hobbies"},
      { $group: { _id: { age: "$age"}, allHobbies: { $addToSet: "$hobbies"}}}
  ]).pretty()

// projection with arrays
// $slice [array, # of elements to slice from the start]
db.friends.aggregate([
  { $project: { _id: 0, examScore: { $slice: ["$examScores", 1]} } }
]).pretty()

// $slice negative value get # of scores from end of array
db.friends.aggregate([
  { $project: { _id: 0, examScore: { $slice: ["$examScores", -2]} } }
]).pretty()

// $slice [array, start position, # of elements]
db.friends.aggregate([
  { $project: { _id: 0, examScore: { $slice: ["$examScores", 2, 1]} } }
]).pretty()

// $size, finds length of array
db.friends.aggregate([
  { $project: { _id: 0, numScores: { $size: "$examScores"} } }
]).pretty()

// $filter takes input, as, cond. filter arrays inside projection stage, $$scores is syntax for a temporary variable
// $examScores in this case is an array of embedded documents
db.friends.aggregate([
  { $project: { 
    _id: 0, 
    examScores: { $filter: { input: "$examScores", as: "scores", cond: { $gt: ["$$scores.score", 60] } } } }
  }
]).pretty()

// find the max score
// $first allows us to use first instance of field in group stage, $max finds the max value of the field in the grouped documents
db.friends.aggregate([
  { $unwind: "$examScores" },
  { $project: { _id: 1, name: 1, age: 1, score: "$examScores.score"} },
  { $sort: { score: -1} },
  { $group: {_id: "$_id", name: {$first: "$name"}, maxScore: { $max: "$score" } } },
  { $sort: { maxScore: -1 } }
]).pretty()

// result
/** 
{
        "_id" : ObjectId("5beb7826cc1806b3269e3a03"),
        "name" : "Max",
        "maxScore" : 88.5
}
{
        "_id" : ObjectId("5beb7826cc1806b3269e3a05"),
        "name" : "Maria",
        "maxScore" : 75.1
}
{
        "_id" : ObjectId("5beb7826cc1806b3269e3a04"),
        "name" : "Manu",
        "maxScore" : 74.3
}
*/

// $bucket lets you output data in buckets for which you can calculate various summary statistics
// groupBy the age, boundaries in this case set for $dob.age
db.persons.aggregate([
  { $bucket: { 
    groupBy: "$dob.age", 
    boundaries: [18, 30, 40, 50, 60, 120], 
    output: {
      numPersons: { $sum : 1},
      averageAge: { $avg: "$dob.age" },
    } } }
]).pretty()

// result
/**
{ "_id" : 18, "numPersons" : 868, "averageAge" : 25.101382488479263 }
{ "_id" : 30, "numPersons" : 910, "averageAge" : 34.51758241758242 }
{ "_id" : 40, "numPersons" : 918, "averageAge" : 44.42265795206972 }
{ "_id" : 50, "numPersons" : 976, "averageAge" : 54.533811475409834 }
{ "_id" : 60, "numPersons" : 1328, "averageAge" : 66.55798192771084 }
**/

// $bucketAuto mongodb will help in determining boundaries to set depending on dataset
// buckets sets number of buckets
// min and max in results of this aggregation indicates the age boundaries
db.persons.aggregate([
  { $bucketAuto: {
    groupBy: "$dob.age",
    buckets: 5,
    output: {
      numPersons: { $sum : 1},
      averageAge: { $avg: "$dob.age" },
    }
  }}
]).pretty()

// results
/**
{
        "_id" : {
                "min" : 21,
                "max" : 32
        },
        "numPersons" : 1042,
        "averageAge" : 25.99616122840691
}
{
        "_id" : {
                "min" : 32,
                "max" : 43
        },
        "numPersons" : 1010,
        "averageAge" : 36.97722772277228
}
{
        "_id" : {
                "min" : 43,
                "max" : 54
        },
        "numPersons" : 1033,
        "averageAge" : 47.98838334946757
}
{
        "_id" : {
                "min" : 54,
                "max" : 65
        },
        "numPersons" : 1064,
        "averageAge" : 58.99342105263158
}
{
        "_id" : {
                "min" : 65,
                "max" : 74
        },
        "numPersons" : 851,
        "averageAge" : 69.11515863689776
}
 */

// find the 10 people with the oldest birthdates, and then find next ten
// $skip MUST come before $limit in an aggregation since pipeline is processed step by step, $sort before $skip and $limit
db.persons.aggregate([
  { $match: { gender: "male" }},
  { $project: { _id: 0, name: { $concat: ["$name.first", " ", "$name.last"] }, birthdate: { $toDate: "$dob.date"} } },
  { $sort: { birthdate: 1 }},
  { $skip: 10 },
  { $limit: 10 }
]).pretty()





// persons collection -> one document example
/**
{
        "_id" : ObjectId("5beb609c706ba93b6f0605ab"),
        "gender" : "male",
        "name" : {
                "title" : "mr",
                "first" : "victor",
                "last" : "pedersen"
        },
        "location" : {
                "street" : "2156 stenbjergvej",
                "city" : "billum",
                "state" : "nordjylland",
                "postcode" : 56649,
                "coordinates" : {
                        "latitude" : "-29.8113",
                        "longitude" : "-31.0208"
                },
                "timezone" : {
                        "offset" : "+5:30",
                        "description" : "Bombay, Calcutta, Madras, New Delhi"
                }
        },
        "email" : "victor.pedersen@example.com",
        "login" : {
                "uuid" : "fbb3c298-2cea-4415-84d1-74233525c325",
                "username" : "smallbutterfly536",
                "password" : "down",
                "salt" : "iW5QrgwW",
                "md5" : "3cc8b8a4d69321a408cd46174e163594",
                "sha1" : "681c0353b34fae08422686eea190e1c09472fc1f",
                "sha256" : "eb5251e929c56dfd19fc597123ed6ec2d0130a2c3c1bf8fc9c2ff8f29830a3b7"
        },
        "dob" : {
                "date" : "1959-02-19T23:56:23Z",
                "age" : 59
        },
        "registered" : {
                "date" : "2004-07-07T22:37:39Z",
                "age" : 14
        },
        "phone" : "23138213",
        "cell" : "30393606",
        "id" : {
                "name" : "CPR",
                "value" : "506102-2208"
        },
        "picture" : {
                "large" : "https://randomuser.me/api/portraits/men/23.jpg",
                "medium" : "https://randomuser.me/api/portraits/med/men/23.jpg",
                "thumbnail" : "https://randomuser.me/api/portraits/thumb/men/23.jpg"
        },
        "nat" : "DK"
}
 */

// friends collection
/** 
{
  "_id" : ObjectId("5beb7826cc1806b3269e3a03"),
  "name" : "Max",
  "hobbies" : [
          "Sports",
          "Cooking"
  ],
  "age" : 29,
  "examScores" : [
          {
                  "difficulty" : 4,
                  "score" : 57.9
          },
          {
                  "difficulty" : 6,
                  "score" : 62.1
          },
          {
                  "difficulty" : 3,
                  "score" : 88.5
          }
  ]
}
{
  "_id" : ObjectId("5beb7826cc1806b3269e3a04"),
  "name" : "Manu",
  "hobbies" : [
          "Eating",
          "Data Analytics"
  ],
  "age" : 30,
  "examScores" : [
          {
                  "difficulty" : 7,
                  "score" : 52.1
          },
          {
                  "difficulty" : 2,
                  "score" : 74.3
          },
          {
                  "difficulty" : 5,
                  "score" : 53.1
          }
  ]
}
{
  "_id" : ObjectId("5beb7826cc1806b3269e3a05"),
  "name" : "Maria",
  "hobbies" : [
          "Cooking",
          "Skiing"
  ],
  "age" : 29,
  "examScores" : [
          {
                  "difficulty" : 3,
                  "score" : 75.1
          },
          {
                  "difficulty" : 8,
                  "score" : 44.2
          },
          {
                  "difficulty" : 6,
                  "score" : 61.5
          }
  ]
}
**/