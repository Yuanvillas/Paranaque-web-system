const fs = require('fs');
const path = require('path');

const srcDir = 'o:\\capstone\\paranaledge-main\\src';
const apiImport = 'import API_BASE_URL from "../config/api";';

function updateFilesRecursively(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules')) {
        updateFilesRecursively(filePath);
      }
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      
      if (content.includes('localhost:5050')) {
        // Add import if not already present
        if (!content.includes('import API_BASE_URL from')) {
          // Find the last import statement
          const lastImportMatch = content.match(/^import .+ from ['"'].+[''"]\;?$/m);
          if (lastImportMatch) {
            const lastImport = lastImportMatch[0];
            // Add the new import after the last import
            content = content.replace(lastImport, lastImport + '\n' + apiImport);
          } else {
            // If no imports found, add at the top
            content = apiImport + '\n' + content;
          }
        }
        
        // Replace localhost:5050 with API_BASE_URL
        content = content.replace(/http:\/\/localhost:5050/g, '${API_BASE_URL}');
        
        fs.writeFileSync(filePath, content);
        console.log('Updated:', filePath);
      }
    }
  });
}

updateFilesRecursively(srcDir);
console.log('✅ All files updated!');
