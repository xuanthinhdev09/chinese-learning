import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface ImportLessonsCliOptions {
  file: string;
  output?: string;
  apiUrl?: string;
  dryRun?: boolean;
}

export async function importLessonsCli(options: ImportLessonsCliOptions) {
  const {
    file,
    output = './mappings',
    apiUrl = 'http://localhost:3000',
    dryRun = false
  } = options;

  console.log(`📚 Importing lessons from ${file}...`);

  try {
    // Check file exists
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }

    // Read JSON file
    const jsonContent = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(jsonContent);

    // Validate structure
    if (!data.hsk_level || !Array.isArray(data.lessons)) {
      throw new Error('Invalid JSON structure: missing hsk_level or lessons array');
    }

    console.log(`   HSK Level: ${data.hsk_level}`);
    console.log(`   Lessons: ${data.lessons.length}`);

    if (dryRun) {
      console.log('✅ Dry-run: Validation passed');
      return;
    }

    // Call API
    const response = await axios.post(`${apiUrl}/import/lessons`, data);
    const result = response.data;

    // Save mapping
    if (result.success) {
      const mappingPath = path.join(output, 'lesson-id-mapping.json');
      fs.mkdirSync(output, { recursive: true });
      fs.writeFileSync(mappingPath, JSON.stringify(result.mapping, null, 2));

      console.log(`✅ Successfully imported ${result.created_count} lessons`);
      if (result.skipped_count > 0) {
        console.log(`⏭️  Skipped ${result.skipped_count} existing lessons`);
      }
      console.log(`📄 Mapping saved to ${mappingPath}`);
    } else {
      console.error('❌ Import failed:');
      result.errors.forEach((err: string, i: number) => console.error(`   ${i + 1}. ${err}`));
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   API Response:', error.response.data);
    }
    process.exit(1);
  }
}
