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
    { $sort: { totalPersons: -1}}
  ]).pretty();

  // $push will push the field value of every incoming document into our allHobbies array
  // $addToSet will do the same as $push, except no duplicate values are pushed into our allHobbies array
  // what happens if the value being pushed is also an array? 
  // $unwind stage will take one document and output multiple documents, one for each element of the array field passed into the stage
  db.friends.aggregate([
      { $unwind: "$hobbies"},
      { $group: { _id: { age: "$age"}, allHobbies: { $addToSet: "$hobbies"}}}
  ]).pretty()