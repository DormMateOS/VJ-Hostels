/**
 * Migration script to fix Guard username index
 * This script drops the old username_1 index and creates a new partial index
 * that only enforces uniqueness when username is actually provided (not null)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function fixGuardUsernameIndex() {
  try {
    const mongoUri = process.env.DBURL || process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('Database URI not found in environment variables (DBURL, MONGO_URI, or MONGODB_URI)');
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const guardsCollection = db.collection('guards');

    // Check existing indexes
    console.log('\nExisting indexes on guards collection:');
    const existingIndexes = await guardsCollection.indexes();
    existingIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the old username_1 index if it exists
    try {
      console.log('\nAttempting to drop old username_1 index...');
      await guardsCollection.dropIndex('username_1');
      console.log('✓ Successfully dropped username_1 index');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('✓ Index username_1 does not exist (already dropped or never created)');
      } else {
        console.error('✗ Error dropping index:', error.message);
        throw error;
      }
    }

    // Create new partial index for username
    // Only index documents where username exists and is not null
    console.log('\nCreating new partial index for username...');
    await guardsCollection.createIndex(
      { username: 1 },
      {
        unique: true,
        partialFilterExpression: { username: { $exists: true, $type: 'string' } },
        name: 'username_partial_unique'
      }
    );
    console.log('✓ Successfully created partial unique index on username');

    // Verify the new indexes
    console.log('\nNew indexes on guards collection:');
    const newIndexes = await guardsCollection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
      if (index.partialFilterExpression) {
        console.log(`    Partial filter:`, JSON.stringify(index.partialFilterExpression));
      }
    });

    // Count guards with and without usernames
    const totalGuards = await guardsCollection.countDocuments();
    const guardsWithUsername = await guardsCollection.countDocuments({ 
      username: { $type: 'string', $ne: null } 
    });
    const guardsWithoutUsername = totalGuards - guardsWithUsername;

    console.log('\nGuard statistics:');
    console.log(`  Total guards: ${totalGuards}`);
    console.log(`  Guards with username: ${guardsWithUsername}`);
    console.log(`  Guards without username (OAuth): ${guardsWithoutUsername}`);

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixGuardUsernameIndex();
