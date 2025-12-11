import React from 'react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = ''
}) => {
  const { t } = useTranslation();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={startDate.toISOString().slice(0, 10)}
          onChange={(e) => onStartDateChange(new Date(e.target.value))}
          className="w-40"
        />
      </div>
      <span className="text-gray-400 font-medium">
        {t('admin_analytics.date_range_separator')}
      </span>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={endDate.toISOString().slice(0, 10)}
          onChange={(e) => onEndDateChange(new Date(e.target.value))}
          className="w-40"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
