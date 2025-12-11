import React from 'react';

interface TableSkeletonLoaderProps {
  rows?: number;
  columns: number;
  // Allows custom styling for specific columns, e.g., a smaller avatar column
  columnWidths?: string[]; 
}

/**
 * A reusable, semantically correct skeleton loader for data tables.
 * It renders valid <tr> and <td> elements to be placed inside a <tbody>.
 */
const TableSkeletonLoader: React.FC<TableSkeletonLoaderProps> = ({
  rows = 5,
  columns,
  columnWidths = [],
}) => {
  // Rationale: We create an array of a specific length to map over,
  // which is a standard React pattern for rendering a set number of elements.
  const tableRows = Array.from({ length: rows }, (_, i) => i);
  const tableCells = Array.from({ length: columns }, (_, i) => i);

  return (
    <>
      {tableRows.map((row) => (
        <tr key={`skeleton-row-${row}`} className="animate-pulse border-t border-border">
          {tableCells.map((cell) => {
            // Get custom width if provided, otherwise use default
            const customWidth = columnWidths[cell];
            const cellClassName = `p-3 ${customWidth || ''}`;
            
            return (
              <td
                key={`skeleton-cell-${row}-${cell}`}
                className={cellClassName}
              >
                <div className="h-4 bg-secondary rounded w-full"></div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
};

export default TableSkeletonLoader;





































