import { useState } from 'react';
import { FileUploadZone } from './components/file-upload-zone';
import { ImportProgress } from './components/import-progress';
import { ValidationErrors } from './components/validation-errors';
import { useImportStore } from '../../stores/import-store';
import {
  useImportLessonsMutation,
  useImportVocabulariesMutation,
  useImportConversationsMutation,
} from './hooks/use-import-mutations';
import { useImportProgress } from './hooks/use-import-progress';
import { useJsonValidation } from './hooks/use-json-validation';
import { ValidationResult } from './hooks/use-json-validation';
import type {
  ImportLessonsResponse,
  ImportVocabulariesResponse,
  ImportConversationsResponse,
} from '../../api/import-api';
import { Header } from '../../components/layout/header/header';
import { Breadcrumbs } from '../../components/layout/breadcrumbs/breadcrumbs';

interface ImportStep {
  id: number;
  title: string;
  description?: string;
}

interface StepValidation {
  lessons: ValidationResult | null;
  vocabularies: ValidationResult | null;
  conversations: ValidationResult | null;
}

type ImportResult = ImportLessonsResponse | ImportVocabulariesResponse | ImportConversationsResponse;

// Helper to get created count from various response types
function getCreatedCount(result: ImportResult): number {
  if ('created_count' in result) return result.created_count;
  if ('conversations_imported' in result) return result.conversations_imported;
  return 0;
}

// Helper to get skipped count from various response types
function getSkippedCount(result: ImportResult): number {
  if ('skipped_count' in result) return result.skipped_count;
  if ('conversations_skipped' in result) return result.conversations_skipped;
  return 0;
}

// Helper to get mapping from response types that have it
function getMapping(result: ImportResult): Record<string, string> | null {
  if ('mapping' in result) return result.mapping;
  return null;
}

const STEPS: ImportStep[] = [
  { id: 1, title: 'Import Lessons', description: 'Upload lessons JSON file' },
  { id: 2, title: 'Import Vocabularies', description: 'Upload vocabularies JSON file' },
  { id: 3, title: 'Import Conversations', description: 'Upload conversations JSON file' },
];

export default function ImportPage() {
  const {
    currentStep,
    lessons,
    vocabularies,
    conversations,
    isImporting,
    setLessonsFile,
    setVocabulariesFile,
    setConversationsFile,
    setCurrentStep,
  } = useImportStore();

  const lessonsMutation = useImportLessonsMutation();
  const vocabulariesMutation = useImportVocabulariesMutation();
  const conversationsMutation = useImportConversationsMutation();

  const { progress } = useImportProgress(
    isImporting,
    !!lessons.result || !!vocabularies.result || !!conversations.result
  );

  const lessonsValidation = useJsonValidation();
  const vocabulariesValidation = useJsonValidation();
  const conversationsValidation = useJsonValidation();

  const [stepValidations, setStepValidations] = useState<StepValidation>({
    lessons: null,
    vocabularies: null,
    conversations: null,
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImportLessons = () => {
    if (lessons.file) {
      lessonsMutation.mutate(lessons.file);
    }
  };

  const handleImportVocabularies = () => {
    if (vocabularies.file) {
      vocabulariesMutation.mutate(vocabularies.file);
    }
  };

  const handleImportConversations = () => {
    if (conversations.file) {
      conversationsMutation.mutate(conversations.file);
    }
  };

  const handleFileSelect = async (stepId: number, file: File) => {
    try {
      const text = await file.text();
      let validationResult;

      if (stepId === 1) {
        validationResult = lessonsValidation.validateJson(text);
        setStepValidations((prev) => ({ ...prev, lessons: validationResult }));
      } else if (stepId === 2) {
        validationResult = vocabulariesValidation.validateJson(text);
        setStepValidations((prev) => ({
          ...prev,
          vocabularies: validationResult,
        }));
      } else if (stepId === 3) {
        validationResult = conversationsValidation.validateJson(text);
        setStepValidations((prev) => ({
          ...prev,
          conversations: validationResult,
        }));
      }

      // Only set file if validation passes
      if (validationResult?.valid) {
        if (stepId === 1) {
          setLessonsFile(file);
        } else if (stepId === 2) {
          setVocabulariesFile(file);
        } else if (stepId === 3) {
          setConversationsFile(file);
        }
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleFileRemove = (stepId: number) => {
    if (stepId === 1) {
      setLessonsFile(null);
      setStepValidations((prev) => ({ ...prev, lessons: null }));
    } else if (stepId === 2) {
      setVocabulariesFile(null);
      setStepValidations((prev) => ({ ...prev, vocabularies: null }));
    } else if (stepId === 3) {
      setConversationsFile(null);
      setStepValidations((prev) => ({ ...prev, conversations: null }));
    }
  };

  const getStepStatus = (stepId: number): 'locked' | 'active' | 'completed' => {
    if (isImporting) return 'locked';
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'locked';
  };

  const getCurrentFile = (stepId: number) => {
    if (stepId === 1) return lessons.file;
    if (stepId === 2) return vocabularies.file;
    if (stepId === 3) return conversations.file;
    return null;
  };

  const getCurrentResult = (stepId: number) => {
    if (stepId === 1) return lessons.result;
    if (stepId === 2) return vocabularies.result;
    if (stepId === 3) return conversations.result;
    return undefined;
  };

  const getCurrentMutation = (stepId: number) => {
    if (stepId === 1) return lessonsMutation;
    if (stepId === 2) return vocabulariesMutation;
    if (stepId === 3) return conversationsMutation;
    return null;
  };

  const getCurrentValidation = (stepId: number) => {
    if (stepId === 1) return stepValidations.lessons;
    if (stepId === 2) return stepValidations.vocabularies;
    if (stepId === 3) return stepValidations.conversations;
    return null;
  };

  return (
    <>
      <Header />
      <Breadcrumbs />
      <div className="min-h-screen bg-gray-50 pt-32 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Import HSK Data</h1>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Step Cards */}
        {STEPS.map((step) => {
          const status = getStepStatus(step.id);
          const file = getCurrentFile(step.id);
          const result = getCurrentResult(step.id);
          const mutation = getCurrentMutation(step.id);
          const validation = getCurrentValidation(step.id);

          return (
            <ImportStep
              key={step.id}
              step={{ ...step, status }}
              file={file}
              result={result}
              isActive={currentStep === step.id}
              onFileSelect={(f) => handleFileSelect(step.id, f)}
              onFileRemove={() => handleFileRemove(step.id)}
              onImport={
                step.id === 1
                  ? handleImportLessons
                  : step.id === 2
                  ? handleImportVocabularies
                  : handleImportConversations
              }
              isImporting={isImporting}
              mutationError={mutation?.error || null}
              progress={progress}
              validation={validation}
            />
          );
        })}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || isImporting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous Step
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === 3 || isImporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Step
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

// Step Indicator Component
interface StepIndicatorProps {
  currentStep: number;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((stepNum, index) => {
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              {index < 2 && (
                <div
                  className={`w-16 h-1 ${
                    stepNum < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Import Step Component
interface ImportStepProps {
  step: {
    id: number;
    title: string;
    description?: string;
    status: 'locked' | 'active' | 'completed';
  };
  isActive: boolean;
  file: File | null;
  result?: ImportResult;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onImport: () => void;
  isImporting: boolean;
  mutationError: Error | null;
  progress: { progress: number; created_count: number; skipped_count: number; error_count: number } | null;
  validation: ValidationResult | null;
}

function ImportStep({
  step,
  isActive,
  file,
  result,
  onFileSelect,
  onFileRemove,
  onImport,
  isImporting,
  mutationError,
  progress,
  validation,
}: ImportStepProps) {
  const statusColors = {
    locked: 'border-gray-200 bg-gray-50',
    active: 'border-blue-500 bg-white',
    completed: 'border-green-500 bg-green-50',
  };

  const statusIcons = {
    locked: '🔒',
    active: '⏳',
    completed: '✅',
  };

  const isDisabled = step.status === 'locked' || isImporting;
  const canImport =
    file &&
    !result &&
    !isImporting &&
    validation?.valid !== false;
  const hasResult = result?.success;
  const isStepImporting = isImporting && isActive && !result;
  const hasValidationErrors = validation && !validation.valid;

  return (
    <div
      className={`border-2 rounded-lg p-6 mb-4 ${statusColors[step.status]} ${
        isActive ? 'shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {statusIcons[step.status]} Step {step.id}: {step.title}
        </h3>
        {step.status === 'locked' && !isImporting && (
          <span className="text-sm text-gray-500">
            Complete previous step first
          </span>
        )}
      </div>

      {step.description && (
        <p className="text-sm text-gray-600 mt-2">{step.description}</p>
      )}

      {isActive && !hasResult && (
        <div className="mt-4">
          <FileUploadZone
            label={`Upload ${step.id === 1 ? 'Lessons' : step.id === 2 ? 'Vocabularies' : 'Conversations'} JSON file`}
            disabled={isDisabled}
            onFileSelect={onFileSelect}
            onFileRemove={onFileRemove}
          />
          {hasValidationErrors && (
            <ValidationErrors
              errors={validation.errors}
              onDismiss={() => onFileRemove()}
            />
          )}
          {mutationError && (
            <div className="mt-2 text-sm text-red-600">
              Error: {mutationError.message}
            </div>
          )}
          {isStepImporting && progress && (
            <ImportProgress
              progress={progress.progress || 0}
              created={progress.created_count || 0}
              skipped={progress.skipped_count || 0}
              errors={progress.error_count || 0}
              isImporting={isImporting}
            />
          )}
          {canImport && (
            <button
              onClick={onImport}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Import {step.id === 1 ? 'Lessons' : step.id === 2 ? 'Vocabularies' : 'Conversations'}
            </button>
          )}
        </div>
      )}

      {hasResult && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 text-2xl">✓</span>
            <h4 className="font-semibold text-green-800">Import Successful</h4>
          </div>
          <div className="text-sm text-green-700">
            <p>
              Created: {getCreatedCount(result)}
            </p>
            <p>
              Skipped: {getSkippedCount(result)}
            </p>
            {result.errors && result.errors.length > 0 && (
              <p className="text-yellow-700">Errors: {result.errors.length}</p>
            )}
            {getMapping(result) && (
              <button className="mt-2 text-blue-600 hover:text-blue-700 underline">
                Download mapping file
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
