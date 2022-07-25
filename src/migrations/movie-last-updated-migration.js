const MongoClient = require("mongodb").MongoClient
const ObjectId = require("mongodb").ObjectId
const MongoError = require("mongodb").MongoError
require("dotenv").config()

;(async () => {
  try {
    const host = process.env.MFLIX_DB_URI
    const client = await MongoClient.connect(
      host,
      {
        useNewUrlParser: true,
        poolSize: 50,
        wtimeout: 2500 
      },
    )
    const mflix = client.db('sample_mflix')

    console.log('\x1b[1m', 'Databsase connected!!!')

    const cursor = await mflix
      .collection("movies")
      .find({})
      .toArray()
    const moviesToMigrate = cursor.map(({ _id, lastupdated }) => ({
      updateOne: {
        filter: { _id: ObjectId(_id) },
        update: {
          $set: { lastupdated: new Date(Date.parse(lastupdated)) },
        },
      },
    }))
    
    console.log(
      "\x1b[35m",
      `Found ${moviesToMigrate.length} documents to update`,
    )
    
    const { modifiedCount } = await mflix.collection('movies').bulkWrite(moviesToMigrate)

    console.log("\x1b[32m", `${modifiedCount} documents updated`)
    client.close()
    process.exit(0)
  } catch (e) {
    if (
      e instanceof MongoError &&
      e.message.slice(0, "Invalid Operation".length) === "Invalid Operation"
    ) {
      console.log("\x1b[32m", "No documents to update")
    } else {
      console.error("\x1b[31m", `Error during migration, ${e}`)
    }
    process.exit(1)
  }
})()
