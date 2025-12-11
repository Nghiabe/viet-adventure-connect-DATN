import React, { useState } from 'react';
import { format, subDays, startOfYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Define the presets with proper typing
const presets = [
  { labelKey: '7_days', days: 7 },
  { labelKey: '30_days', days: 30 },
  { labelKey: '90_days', days: 90 },
  { 
    labelKey: 'this_year', 
    getRange: () => ({ 
      from: startOfYear(new Date()), 
      to: new Date() 
    }) 
  },
];

export interface DateRangeFilterProps {
  // The component receives the current range and lifts state up
  // This makes it a controlled component, which is a best practice
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange, className }) => {
  const [activePreset, setActivePreset] = useState<string | null>('30_days'); // Default to 30 days

  const handlePresetClick = (preset: typeof presets[0]) => {
    setActivePreset(preset.labelKey);
    
    let range: DateRange;
    if (preset.getRange) {
      range = preset.getRange();
    } else {
      range = { 
        from: subDays(new Date(), preset.days - 1), 
        to: new Date() 
      };
    }
    
    onChange(range);
  };

  const handleDateSelect = (selectedRange: DateRange | undefined) => {
    if (selectedRange?.from && selectedRange?.to) {
      setActivePreset(null); // Deselect any active preset
      onChange(selectedRange);
    }
  };

  // Get the display text for the custom range button
  const getCustomRangeDisplayText = () => {
    if (value?.from && value?.to) {
      return `${format(value.from, 'dd/MM/yyyy', { locale: vi })} - ${format(value.to, 'dd/MM/yyyy', { locale: vi })}`;
    }
    return 'Chọn khoảng thời gian';
  };

  // Check if a custom range is currently selected
  const isCustomRangeSelected = !activePreset && value?.from && value?.to;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* --- The Custom Date Range Picker Button --- */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              isCustomRangeSelected && "border-primary text-primary"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getCustomRangeDisplayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {/* THE FIX: The Calendar is now the direct child of the content */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={value}
              onSelect={handleDateSelect}
              locale={vi}
              initialFocus
              numberOfMonths={2}
              className="rounded-md border-0"
            />
          </div>
          {/* Action buttons for better UX */}
          <div className="flex items-center justify-between p-3 border-t">
            <div className="text-sm text-muted-foreground">
              {value?.from && value?.to ? (
                <>
                  {format(value.from, 'dd/MM/yyyy', { locale: vi })} - {format(value.to, 'dd/MM/yyyy', { locale: vi })}
                </>
              ) : (
                'Chọn khoảng thời gian'
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* --- The Preset Buttons Group --- */}
      <div className="flex items-center space-x-2">
        {presets.map((preset) => (
          <Button
            key={preset.labelKey}
            variant={activePreset === preset.labelKey ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetClick(preset)}
            className="text-xs"
          >
            {/* Vietnamese labels for the presets */}
            {preset.labelKey === '7_days' && '7 ngày'}
            {preset.labelKey === '30_days' && '30 ngày'}
            {preset.labelKey === '90_days' && '90 ngày'}
            {preset.labelKey === 'this_year' && 'Năm nay'}
          </Button>
        ))}
      </div>

      {/* Custom Range Indicator */}
      {isCustomRangeSelected && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium">
          <span>Tùy chỉnh</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange({ from: undefined, to: undefined });
              setActivePreset('30_days'); // Reset to default preset
            }}
            className="h-auto p-0 text-primary hover:text-primary/80"
          >
            ×
          </Button>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
