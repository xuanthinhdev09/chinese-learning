import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ValidationError {
  row?: number;
  field?: string;
  message: string;
  type: 'structure' | 'data' | 'constraint';
}

interface ValidationErrorsProps {
  errors: ValidationError[];
  onFix?: () => void;
  onDismiss?: () => void;
}

export function ValidationErrors({
  errors,
  onFix,
  onDismiss,
}: ValidationErrorsProps) {
  const { t } = useTranslation();

  if (errors.length === 0) return null;

  const groupedErrors = {
    structure: errors.filter((e) => e.type === 'structure'),
    data: errors.filter((e) => e.type === 'data'),
    constraint: errors.filter((e) => e.type === 'constraint'),
  };

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-red-800">
          {t('import.validationTitle', { count: errors.length })}
        </h4>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            {t('import.dismiss')}
          </button>
        )}
      </div>

      {/* Structure Errors */}
      {groupedErrors.structure.length > 0 && (
        <ErrorGroup
          title={t('import.structureErrors')}
          errors={groupedErrors.structure}
          icon="🏗️"
        />
      )}

      {/* Data Errors */}
      {groupedErrors.data.length > 0 && (
        <ErrorGroup title={t('import.dataErrors')} errors={groupedErrors.data} icon="📊" />
      )}

      {/* Constraint Errors */}
      {groupedErrors.constraint.length > 0 && (
        <ErrorGroup
          title={t('import.constraintErrors')}
          errors={groupedErrors.constraint}
          icon="🔗"
        />
      )}

      {onFix && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={onFix}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            {t('import.fixRetry')}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            {t('import.reset')}
          </button>
        </div>
      )}
    </div>
  );
}

interface ErrorGroupProps {
  title: string;
  errors: ValidationError[];
  icon: string;
}

function ErrorGroup({ title, errors, icon }: ErrorGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const { t } = useTranslation();

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center w-full text-left font-medium text-red-700 hover:text-red-800"
      >
        <span className="mr-2">{icon}</span>
        <span>{title}</span>
        <span className="ml-2 text-sm text-red-600">({errors.length})</span>
        <span className="ml-auto">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <ul className="mt-2 ml-6 space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="text-sm text-red-600">
              {error.row && <span className="font-medium">{t('import.rowPrefix', { row: error.row })} </span>}
              {error.field && <span className="font-medium">{error.field} - </span>}
              {error.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
