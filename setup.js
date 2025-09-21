const fs = require('fs');
const path = require('path');

// Create .env file from example
const envExamplePath = path.join(__dirname, 'env.example');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env file from env.example');
  console.log('📝 Please update the DATABASE_URL and JWT_SECRET in .env file');
} else {
  console.log('ℹ️  .env file already exists or env.example not found');
}

// Create necessary directories
const directories = [
  'public/qrcodes',
  'public/reports'
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`ℹ️  Directory already exists: ${dir}`);
  }
});

console.log('\n🚀 Setup complete! Next steps:');
console.log('1. Update .env file with your database credentials');
console.log('2. Run: npm run db:push (to create database tables)');
console.log('3. Run: npm run dev (to start development server)');
console.log('4. Create admin user via API or manually in database');
