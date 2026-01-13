#!/usr/bin/env python3
import os
import glob

src_dir = r'o:\capstone\paranaledge-main\src'
old_url = 'http://localhost:5050'
new_url = 'https://paranaledge-y7z1.onrender.com'

# Find all .js files
js_files = glob.glob(os.path.join(src_dir, '**/*.js'), recursive=True)

for file_path in js_files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if old_url in content:
            new_content = content.replace(old_url, new_url)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Updated: {file_path}")
    except Exception as e:
        print(f"❌ Error updating {file_path}: {e}")

print("\n✅ All files updated!")
