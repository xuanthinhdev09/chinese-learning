#!/usr/bin/env ts-node
import { Command } from 'commander';
import {
  importLessonsCli,
  ImportLessonsCliOptions
} from '../src/import/cli/import-lessons.cli';
import {
  importVocabsCli,
  ImportVocabsCliOptions
} from '../src/import/cli/import-vocabularies.cli';
import {
  importConversationsCli,
  ImportConversationsCliOptions
} from '../src/import/cli/import-conversations.cli';

const program = new Command();

program
  .name('import')
  .description('HSK Data Import CLI')
  .version('1.0.0');

// Lessons import
program
  .command('lessons')
  .description('Import lessons from JSON file')
  .requiredOption('-f, --file <path>', 'Path to lessons.json file')
  .option('-o, --output <path>', 'Output directory for mappings', './mappings')
  .option('-u, --api-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--dry-run', 'Validate without importing')
  .action(async (options) => {
    await importLessonsCli(options as ImportLessonsCliOptions);
  });

// Vocabularies import
program
  .command('vocabularies')
  .description('Import vocabularies from JSON file')
  .requiredOption('-f, --file <path>', 'Path to vocabularies.json file')
  .requiredOption('-l, --lesson-mapping <path>', 'Path to lesson-id-mapping.json')
  .option('-o, --output <path>', 'Output directory for mappings', './mappings')
  .option('-u, --api-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--dry-run', 'Validate without importing')
  .action(async (options) => {
    await importVocabsCli(options as ImportVocabsCliOptions);
  });

// Conversations import
program
  .command('conversations')
  .description('Import conversations from JSON file')
  .requiredOption('-f, --file <path>', 'Path to conversations.json file')
  .requiredOption('-l, --lesson-mapping <path>', 'Path to lesson-id-mapping.json')
  .requiredOption('-v, --vocab-mapping <path>', 'Path to vocab-id-mapping.json')
  .option('-u, --api-url <url>', 'API base URL', 'http://localhost:3000')
  .option('--dry-run', 'Validate without importing')
  .action(async (options) => {
    await importConversationsCli(options as ImportConversationsCliOptions);
  });

program.parse(process.argv);
