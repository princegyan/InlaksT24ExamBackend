const { MongoClient, ServerApiVersion } = require('mongodb');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inlaks_t24';
let client = null;
let db = null;

const connectDB = async () => {
  if (client) {
    return db;
  }

  try {
    client = new MongoClient(mongoURI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    db = client.db('inlaks_t24');

    // Create collections and indexes
    await initializeCollections();

    console.log('✅ Connected to MongoDB Atlas');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

const initializeCollections = async () => {
  try {
    // Questions collection
    const questionsCollection = db.collection('questions');
    
    // Create indexes
    await questionsCollection.createIndex({ examCode: 1 });
    // Text index skipped due to MongoDB Atlas apiStrict setting
    await questionsCollection.createIndex({ createdAt: -1 });
    await questionsCollection.createIndex({ examCode: 1, createdAt: -1 });

    console.log('✅ Collections and indexes initialized');
  } catch (error) {
    console.error('⚠️ Index creation warning:', error.message);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
};

module.exports = {
  connectDB,
  getDB,
  closeDB,
};
