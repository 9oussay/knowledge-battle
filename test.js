const { MongoClient } = require('mongodb')

const uri = "mongodb+srv://uncleyoshi6_db_user:kaskrout@cluster0.77inqwz.mongodb.net/knowledge_battle?retryWrites=true&w=majority"

async function main() {
  console.log('Connecting...')
  const client = new MongoClient(uri)
  try {
    await client.connect()
    console.log('SUCCESS - Connected to MongoDB!')
    await client.db('knowledge_battle').command({ ping: 1 })
    console.log('Ping successful!')
  } catch (err) {
    console.error('FAILED:', err.message)
  } finally {
    await client.close()
  }
}

main()