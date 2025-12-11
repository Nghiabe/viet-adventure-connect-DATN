import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

export type DestinationSuggestion = { name: string; slug: string };

type Props = {
  value: DestinationSuggestion | null;
  onSelect: (destination: DestinationSuggestion) => void;
  placeholder?: string;
};

const DestinationAutosuggest = ({ value, onSelect, placeholder = 'Bạn muốn đi đâu?' }: Props) => {
  const [query, setQuery] = useState<string>(value?.name || '');
  const [results, setResults] = useState<DestinationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounced = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(value?.name || '');
  }, [value?.name]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debounced || debounced.trim().length < 2) {
        setResults([]);
        return;
      }
      try {
        setIsLoading(true);
        const res = await fetch(`/api/destinations/search?q=${encodeURIComponent(debounced)}&limit=8`);
        const json = await res.json();
        const items = (json?.data || []).map((d: any) => ({ name: d.name, slug: d.slug })) as DestinationSuggestion[];
        setResults(items);
      } catch (e) {
        console.warn('Failed to fetch suggestions', e);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestions();
  }, [debounced]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: DestinationSuggestion) => {
    onSelect(item);
    setQuery(item.name);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2 rounded-md border bg-background/80 backdrop-blur px-3 py-2">
        <MapPin className="text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder={placeholder}
          className="border-none shadow-none focus-visible:ring-0"
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (results.length > 0 || isLoading) && (
        <div className="absolute z-20 mt-2 w-full rounded-md border bg-popover shadow-md">
          <ul className="max-h-64 overflow-auto">
            {isLoading && (
              <li className="px-3 py-2 text-sm text-muted-foreground">Đang tải...</li>
            )}
            {!isLoading && results.map((item) => (
              <li
                key={item.slug}
                className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                onClick={() => handleSelect(item)}
              >
                {item.name}
              </li>
            ))}
            {!isLoading && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">Không tìm thấy</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DestinationAutosuggest;


