import axios from 'axios';
import * as fs from 'fs';

export interface ImportConversationsCliOptions {
  file: string;
  lessonMapping: string;
  vocabMapping: string;
  apiUrl?: string;
  dryRun?: boolean;
}

export async function importConversationsCli(options: ImportConversationsCliOptions) {
  const {
    file,
    lessonMapping,
    vocabMapping,
    apiUrl = 'http://localhost:3000',
    dryRun = false
  } = options;

  console.log(`💬 Importing conversations from ${file}...`);

  try {
    // Check files exist
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }
    if (!fs.existsSync(lessonMapping)) {
      throw new Error(`Lesson mapping file not found: ${lessonMapping}`);
    }
    if (!fs.existsSync(vocabMapping)) {
      throw new Error(`Vocab mapping file not found: ${vocabMapping}`);
    }

    // Read files
    const convoContent = fs.readFileSync(file, 'utf-8');
    const convoData = JSON.parse(convoContent);

    const lessonMapContent = fs.readFileSync(lessonMapping, 'utf-8');
    const lessonMappingData = JSON.parse(lessonMapContent);

    const vocabMapContent = fs.readFileSync(vocabMapping, 'utf-8');
    const vocabMappingData = JSON.parse(vocabMapContent);

    // Validate
    if (!convoData.hsk_level || !Array.isArray(convoData.conversations)) {
      throw new Error('Invalid conversations JSON');
    }

    console.log(`   HSK Level: ${convoData.hsk_level}`);
    console.log(`   Conversations: ${convoData.conversations.length}`);
    console.log(`   Lesson mapping: ${Object.keys(lessonMappingData).length} entries`);
    console.log(`   Vocab mapping: ${Object.keys(vocabMappingData).length} entries`);

    if (dryRun) {
      console.log('✅ Dry-run: Validation passed');
      return;
    }

    // Call API
    const response = await axios.post(`${apiUrl}/import/conversations`, {
      ...convoData,
      lesson_mapping: lessonMappingData,
      vocab_mapping: vocabMappingData
    });
    const result = response.data;

    if (result.success) {
      console.log(`✅ Successfully imported ${result.created_count} conversations`);
      if (result.skipped_count > 0) {
        console.log(`⏭️  Skipped ${result.skipped_count} existing conversations`);
      }
      console.log(`🔗 Created vocabulary links (check database for details)`);
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
