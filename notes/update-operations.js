// ---------------------- UPDATE operations ---------------------
// updateOne
// $set adds / modifies specified field, leaves unspecified fields alone
db.users.updateOne(
  { _id: ObjectId("5be9b32073a39ab29ce69e06") },
  {
    $set: {
      hobbies: [
        { title: "Sports", frequency: 5 },
        { title: "Cooking", frequency: 3 }
      ]
    }
  }
);

// updateMany
db.users.updateMany({"hobbies.title": "Sports"}, {$set: {isSporty: true}})

// $set, can be used to add / modify one or more fields
db.users.updateOne({_id: ObjectId("5be9b32073a39ab29ce69e06")}, {$set: {age: 40, phone: 123456789}})

// $unset, used to remove a field from a document
db.users.updateMany({isSporty: true}, {$unset: {phone: ""}})

// $rename, used to rename a specified field
db.users.updateMany({}, {$rename: {age: "totalAge"}})

// $inc, can be used to increase a field by a numeric value, can also be used to decrease value
db.users.updateOne({name: "Manuel"}, {$inc: {age: 1}})
db.users.updateOne({name: "Manuel"}, {$inc: {age: 2}})
db.users.updateOne({name: "Manuel"}, {$inc: {age: -1}})

// can use multiple update operations, not possible to have multiple operations update the same field
db.users.updateOne({name: "Manuel"}, {$inc: {age: 1}, $set: {isSporty: false}})

// $min, sets to desired value only if current field value is higher
db.users.updateOne({name: "Chris"}, {$min: {age: 35}})

// $max, sets to desired value only if current field value is lower
db.users.updateOne({name: "Chris"}, {$max: {age: 38}})

// $mul, multiplies specified field value
db.users.updateOne({name: "Chris"}, {$mul: {age: 1.1}})

// upsert is useful for updating or inserting a document if it doesn't exist, will also try to insert the filter as part of the document
db.users.updateOne({name: "Maria"}, {$set: {age: 29, hobbies: [{title: "Good food", frequency: 3}], isSporty: true}}, {upsert: true})

// updating arrays
// update elements inside of the hobbies array, "hobbies.$" will automatically refer to element matched in our query
db.users.updateMany({hobbies: {$elemMatch: {title: "Sports", frequency: {$gte: 3}}}}, {$set: {"hobbies.$.highFrequency": true, isSporty: true }})

// update all array elements with $[] syntax
db.users.updateMany({totalAge: {$gt:30}}, {$inc: {"hobbies.$[].frequency":-1}})

// updating specific fields in arrays, array filter can be totally different from initial update many filter used
db.users.updateMany({"hobbies.frequency": {$gt: 2}}, {$set: {"hobbies.$[el].goodFrequency": true}}, {arrayFilters: [{"el.frequency":{$gt:2}}]})

// $push, add an element to array
db.users.updateOne({name: "Maria"}, {$push: {hobbies: {title: "Sports", frequency: 2}}})

// $push, push multiple elements into array, sort those elements in descending order by frequency, this will sort the entire array, not just what is being pushed in
db.users.updateOne({name: "Maria"}, {$push: {hobbies: {$each: [{title: "Good Wine", frequency: 1}, {title: "Hiking", frequency: 2}], $sort:{frequency: -1}}}})

// $addToSet adds unique values only unlike $push, only adds 1 element can't be used with $each
db.users.updateOne({name: "Maria"}, {$addToSet: {hobbies: {title: "Hiking", frequency: 2}}})

// $pull, delete array elements
db.users.updateOne({name: "Maria"}, {$pull: {hobbies: {title: "Hiking"}}})

// $pop, 1 deletes last array element, -1 deletes first array element
db.users.updateOne({name: "Chris"}, {$pop: {hobbies: 1}})