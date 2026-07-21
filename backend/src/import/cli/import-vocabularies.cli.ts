import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface ImportVocabsCliOptions {
  file: string;
  lessonMapping: string;
  output?: string;
  apiUrl?: string;
  dryRun?: boolean;
}

export async function importVocabsCli(options: ImportVocabsCliOptions) {
  const {
    file,
    lessonMapping,
    output = './mappings',
    apiUrl = 'http://localhost:3000',
    dryRun = false
  } = options;

  console.log(`📖 Importing vocabularies from ${file}...`);

  try {
    // Check files exist
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }
    if (!fs.existsSync(lessonMapping)) {
      throw new Error(`Lesson mapping file not found: ${lessonMapping}`);
    }

    // Read vocabularies file
    const vocabContent = fs.readFileSync(file, 'utf-8');
    const vocabData = JSON.parse(vocabContent);

    // Read lesson mapping
    const mappingContent = fs.readFileSync(lessonMapping, 'utf-8');
    const lessonMappingData = JSON.parse(mappingContent);

    // Validate
    if (!vocabData.hsk_level || !Array.isArray(vocabData.vocabularies)) {
      throw new Error('Invalid vocabularies JSON');
    }

    console.log(`   HSK Level: ${vocabData.hsk_level}`);
    console.log(`   Vocabularies: ${vocabData.vocabularies.length}`);
    console.log(`   Lesson mapping: ${Object.keys(lessonMappingData).length} entries`);

    if (dryRun) {
      console.log('✅ Dry-run: Validation passed');
      return;
    }

    // Call API
    const response = await axios.post(`${apiUrl}/import/vocabularies`, {
      ...vocabData,
      lesson_mapping: lessonMappingData
    });
    const result = response.data;

    // Save mapping
    if (result.success) {
      const mappingPath = path.join(output, 'vocab-id-mapping.json');
      fs.mkdirSync(output, { recursive: true });
      fs.writeFileSync(mappingPath, JSON.stringify(result.mapping, null, 2));

      console.log(`✅ Successfully imported ${result.created_count} vocabularies`);
      if (result.skipped_count > 0) {
        console.log(`⏭️  Skipped ${result.skipped_count} existing vocabularies`);
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
