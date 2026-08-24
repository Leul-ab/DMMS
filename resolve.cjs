const fs = require('fs');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = require('path').join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let updatedCount = 0;
walkDir('resources/js', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('<<<<<<< HEAD')) {
      const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [^\r\n]+/g;
      const newContent = content.replace(regex, '$1');
      fs.writeFileSync(filePath, newContent, 'utf8');
      updatedCount++;
      console.log('Resolved conflicts in ' + filePath);
    }
  }
});

console.log('Total files resolved: ' + updatedCount);
