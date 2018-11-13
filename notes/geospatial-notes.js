// ------------ Geospatial data --------------

// syntax for geoJSON data, coordinates are [longitude, latitude]
// structure for location (location field can be named anything) must be { type: "", coordinates: []}
db.places.insertOne({name: "California Academy of Sciences", location: {type: "Point", coordinates: [-122.4723636,37.7708426]}})

// create a geospatial index, geospatial queries will benefit from this, otherwise may throw an error
db.places.createIndex({location: "2dsphere"})

// querying geoJSON data
// $near, $geometry, coordinates: [longitude, latitude], finding a document where the location is close to our query coordinates
// $maxDistance, $minDistance, distance measured in meters in a radius
db.places.find({location: {$near: {$geometry: {type: "Point", coordinates: [-122.4817261,37.7795345]}, $maxDistance: 10000, $minDistance:
10}}})

// $geoWithin, check whether certain points are within a certain area
// p1 to p4 points are commented out below, need to end with p1 in order to close the Polygon
db.places.find({location: {$geoWithin: {$geometry: {type: "Polygon", coordinates: [[p1, p2, p3, p4, p1]]}}}})

// $centerSphere, draw a circle from specified coordinate to find all points located within specified radius
// 1 km / 6378.1 = new radians value
db.places.find({location: {$geoWithin: {$centerSphere: [[-122.46343,37.77157], 1 / 6378.1]}}})

//-----------------
// determine if a point/area intersects with a given area
db.areas.insertOne({name: "Golden Gate Park", area: {type: "Polygon", coordinates: [[p1, p2, p3, p4, p1]]}})
db.areas.createIndex({area: "2dsphere"})

// $geoIntersects returns all places/areas with which a point/area intersects
db.areas.find({area: {$geoIntersects: {$geometry: {type: "Point", coordinates: [-122.487,37.77043]}}}})
//-----------------




// const p1 = [-122.45478, 37.77471]
// const p2 = [-122.45306, 37.76642]
// const p3 = [-122.51028, 37.76412]
// const p4 = [-122.5109, 37.77133]

// {
//     "_id" : ObjectId("5beb2a0f78568e4d33410481"),
//     "name" : "California Academy of Sciences",
//     "location" : {
//             "type" : "Point",
//             "coordinates" : [
//                     -122.4723636,
//                     37.7708426
//             ]
//     }
// }
// {
//     "_id" : ObjectId("5beb2d3c78568e4d33410482"),
//     "name" : "Conversatory of Flowers",
//     "location" : {
//             "type" : "Point",
//             "coordinates" : [
//                     -122.4626599,
//                     37.7711105
//             ]
//     }
// }
// {
//     "_id" : ObjectId("5beb2dc278568e4d33410483"),
//     "name" : "Golden Gate Park Tennis Courts",
//     "location" : {
//             "type" : "Point",
//             "coordinates" : [
//                     -122.460251,
//                     37.7706757
//             ]
//     }
// }
// {
//     "_id" : ObjectId("5beb2e1178568e4d33410484"),
//     "name" : "Nopa",
//     "location" : {
//             "type" : "Point",
//             "coordinates" : [
//                     -122.4384178,
//                     37.7749117
//             ]
//     }
// }