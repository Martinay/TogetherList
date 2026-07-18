import os
import re

for root, dirs, files in os.walk('./backend/internal/features'):
    for file in files:
        if file == 'handler_test.go':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            original_content = content

            # Replace test-list-XXX with uuid.New().String()
            content = re.sub(r'listID := "test-list-[^"]*"', r'listID := uuid.New().String()', content)
            content = re.sub(r'itemID := "test-item-[^"]*"', r'itemID := uuid.New().String()', content)

            new_content = content
            
            if new_content != original_content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
