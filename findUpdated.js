const fs = require('fs');
const path = require('path');

const packageLockPath = path.join(__dirname, 'package-lock.json');

// Get the current date
const currentDate = new Date();

// Function to convert a Date object to a YYYY-MM-DD format string
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to check if the last modified date is today
function isFileModifiedToday(filePath) {
  const stats = fs.statSync(filePath);
  const fileModifiedDate = new Date(stats.mtime);
  const formattedFileModifiedDate = formatDate(fileModifiedDate);
  const formattedCurrentDate = formatDate(currentDate);
  return formattedFileModifiedDate === formattedCurrentDate;
}

// Read package-lock.json and parse its content
fs.readFile(packageLockPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading package-lock.json:', err);
    return;
  }

  try {
    const packageLockData = JSON.parse(data);
    const updatedPackages = [];

    // Iterate through all the dependencies
    for (const packageName in packageLockData.dependencies) {
      const packageInfo = packageLockData.dependencies[packageName];
      const packagePath = path.join(__dirname, 'node_modules', packageName);

      // Check if the package directory was modified today
      if (fs.existsSync(packagePath) && isFileModifiedToday(packagePath)) {
        updatedPackages.push(packageName);
      }
    }

    console.log('Updated packages today:', updatedPackages);
  } catch (err) {
    console.error('Error parsing package-lock.json:', err);
  }
});
