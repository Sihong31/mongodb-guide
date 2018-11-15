// MongoDB does not roll back successful inserts, it will continue to insert documents until it finds one that already exists
// and then throws an error. Use ordered: false to continue inserting documents if an existing document error is found.
// The default is ordered: true
db.hobbies.insertMany(
  [
    { _id: "hiking", name: "hiking" },
    { _id: "cooking", name: "cooking" },
    { _id: "sleeping", name: "sleeping" }
  ],
  { ordered: false }
);

//  mongoimport used to import a json file into your database and collection, --jsonarray for array of data, --drop will drop existing database and add to new database otherwise data would be appended to existing database.
// -> mongoimport tv-shows.json -d movieData -c movies --jsonArray --drop