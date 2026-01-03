import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, value, onChange, placeholder, className }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(option => value.includes(option.value));

  return (
    <div className={cn('relative', className)}>
      {/* Selected Tags */}
      <div
        className="min-h-[40px] p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map(option => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm rounded-md"
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(option.value);
                  }}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400 text-sm">{placeholder}</span>
        )}
      </div>

      {/* Dropdown Button (Hidden if clicking main box works, but kept for visual consistency if needed, or remove absolute to avoid overlap) 
          Adjusted to be transparent and overlay or just act as icon
      */}
      <div className="absolute right-2 top-2 pointer-events-none">
        <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', isOpen && 'rotate-180')} />
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <>
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm',
                  'text-gray-900 dark:text-gray-100',
                  value.includes(option.value) && 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                )}
                onClick={() => toggleOption(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
}
