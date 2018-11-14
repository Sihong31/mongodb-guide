/*

Numbers are stored as 64bit doubles by default in mongo shell because it is based on JavaScript

Int32 (Integers) - Full Numbers - -2,147,483,648 to 2,147,483,647
Int64 (Longs) - Full Numbers - -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807
Doubles (64bit) - Numbers w/ decimal places - decimal values are approximated
High Precision Doubles (128bit) - Numbers w/ decimal places - decimal values are stored up to 34 decimal digits

*/

// the size of the persons collection will be smaller when using NumberInt(), node.js driver
// db.persons.stats() will show this

db.persons.insertOne({age: 29})

db.persons.insertOne({age: NumberInt("29")})


// max value for NumberInt, larger values will not work as expected
db.companies.insertOne({valuation: NumberInt("2147483647")})

// use NumberLong
db.companies.insertOne({valuation: NumberLong("5000000000")})

// Max Value
db.companies.insertOne({valuation: NumberLong("9223372036854775807")})

// This, without using string, will throw an error saying number is too long
// Always pass number as a STRING when using NumberLong and NumberInt so that mongodb can internally convert it
// Passing just a number faces limitations in the shell, which runs on JavaScript, aka in this case, this is passing the number as a 64bit float wrapped inside of a NumberLong
db.companies.insertOne({valuation: NumberLong(9223372036854775807)})

// In order to retain number type, modifications to original document must also be of that type
db.accounts.insertOne({name: "bob", amount: NumberInt("10")})
db.accounts.updateOne({name: "bob"}, {$inc: {amount: NumberInt("10")}})

db.companies.insertOne({valuation: NumberLong("123456789123456789")})
db.companies.updateOne({}, {$inc: {valuation: NumberLong("1")}})

// example of imprecision with normal doubles
db.science.insertOne({a: 0.3, b: 0.1})
db.science.aggregate([{$project: {result: {$subtract: ["$a", "$b"]}}}])
// => { "_id" : ObjectId("5bec72a3437491b3957fd2fc"), "result" : 0.19999999999999998 }

// use high precision doubles if imprecision matters in your application
db.science.insertOne({a: NumberDecimal("0.3"), b: NumberDecimal("0.1")})
db.science.aggregate([{$project: {result: {$subtract: ["$a", "$b"]}}}])
// => { "_id" : ObjectId("5bec7422437491b3957fd2fd"), "result" : NumberDecimal("0.2") }

// use NumberDecimal when updating to avoid chance for imprecision
db.science.updateOne({}, {$inc: {a: NumberDecimal("0.1")}})
// => { "_id" : ObjectId("5bec7422437491b3957fd2fd"), "a" : NumberDecimal("0.4"), "b" : NumberDecimal("0.1") }

// regarding stats on storage size
// use high precision only for numbers that need it
db.nums.insertOne({a: 0.1})
db.nums.stats()
// results in size of 33
db.nums.insertOne({a: NumberDecimal("0.1")})
db.nums.stats()
// results in size 74