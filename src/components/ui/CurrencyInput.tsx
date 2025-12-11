import React, { useState, useEffect, useCallback } from 'react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control: Control<TFieldValues>;
  placeholder?: string;
  suffix?: string;
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
}

export function CurrencyInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  placeholder = "0",
  suffix,
  disabled = false,
  className,
  min,
  max,
}: CurrencyInputProps<TFieldValues, TName>) {
  const [displayValue, setDisplayValue] = useState<string>('');

  // Format number for display (add commas, handle decimals)
  const formatDisplayValue = useCallback((value: number | undefined): string => {
    if (value === undefined || value === null) return '';
    
    // Handle percentage values (0-100)
    if (suffix === '%') {
      return value.toString();
    }
    
    // Handle currency values
    return value.toLocaleString('vi-VN');
  }, [suffix]);

  // Parse display value back to number
  const parseDisplayValue = useCallback((displayValue: string): number => {
    // Remove all non-numeric characters except decimal point
    const numericValue = displayValue.replace(/[^\d.]/g, '');
    
    if (numericValue === '' || numericValue === '.') return 0;
    
    const parsed = parseFloat(numericValue);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, onChange: (value: number) => void) => {
    const inputValue = e.target.value;
    
    // Allow empty input for better UX
    if (inputValue === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }
    
    // Parse the numeric value
    const numericValue = parseDisplayValue(inputValue);
    
    // Apply min/max constraints
    let constrainedValue = numericValue;
    if (min !== undefined && numericValue < min) constrainedValue = min;
    if (max !== undefined && numericValue > max) constrainedValue = max;
    
    // Update display value with formatting
    const formattedValue = formatDisplayValue(constrainedValue);
    setDisplayValue(formattedValue);
    
    // Update form value
    onChange(constrainedValue);
  }, [parseDisplayValue, formatDisplayValue, min, max]);

  // Handle blur event to ensure proper formatting
  const handleBlur = useCallback((onChange: (value: number) => void) => {
    const numericValue = parseDisplayValue(displayValue);
    const formattedValue = formatDisplayValue(numericValue);
    setDisplayValue(formattedValue);
    onChange(numericValue);
  }, [displayValue, parseDisplayValue, formatDisplayValue]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // Initialize display value when field value changes
        useEffect(() => {
          if (field.value !== undefined && field.value !== null) {
            setDisplayValue(formatDisplayValue(field.value));
          }
        }, [field.value, formatDisplayValue]);

        return (
          <div className="relative">
            <Input
              {...field}
              value={displayValue}
              onChange={(e) => handleInputChange(e, field.onChange)}
              onBlur={() => handleBlur(field.onChange)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "pr-8", // Make room for suffix
                error && "border-red-500 focus:border-red-500",
                className
              )}
              type="text" // Use text to allow custom formatting
              inputMode="decimal" // Show numeric keyboard on mobile
            />
            
            {/* Suffix */}
            {suffix && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground">
                {suffix}
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <p className="text-sm text-red-500 mt-1">
                {error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
