const { spawn } = require('child_process');
const path = require('path');

console.log('Starting migration process...');

// Path to the migration script
const migrationScriptPath = path.join(__dirname, 'migrateToMultiTenant.js');

// Spawn a new Node.js process to run the migration script
const migration = spawn('node', [migrationScriptPath], {
  stdio: 'inherit', // Inherit stdio streams from parent process
  env: { ...process.env } // Pass environment variables
});

// Handle process events
migration.on('error', (err) => {
  console.error('Failed to start migration process:', err);
});

migration.on('close', (code) => {
  if (code === 0) {
    console.log('Migration completed successfully');
  } else {
    console.error(`Migration process exited with code ${code}`);
  }
});
