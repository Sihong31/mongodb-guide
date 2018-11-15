// ---------------------- DELETE operations ---------------------

// deleteOne
db.users.deleteOne({name: "Chris"})

// deleteMany
db.users.deleteMany({totalAge: {$exists: false}, isSporty: true})
db.users.deleteMany({})

// drop collection, returns true if works, false if fails
db.users.drop()

// drop the database that's currently in use
db.dropDatabase()

