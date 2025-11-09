import { promises as fs } from 'fs';
import path from 'path';

async function cleanupCheckoutBackups() {
  const bookingDir = path.join(process.cwd(), 'components', 'booking');
  
  try {
    const files = await fs.readdir(bookingDir);
    
    // Find all backup files
    const backupFiles = files.filter(file => 
      file.startsWith('checkout-form-') && 
      (file.includes('backup') || file.includes('working') || file.includes('old') || file.includes('new'))
    );
    
    console.log(`Found ${backupFiles.length} backup files to delete`);
    
    // Delete each backup file
    for (const file of backupFiles) {
      const filePath = path.join(bookingDir, file);
      await fs.unlink(filePath);
      console.log(`Deleted: ${file}`);
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${backupFiles.length} backup files.`);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupCheckoutBackups();
