import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Lightbulb, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AtAGlanceInfoProps {
  bestTimeToVisit?: string[] | string;
  essentialTips?: string[];
}

export function AtAGlanceInfo({ bestTimeToVisit, essentialTips }: AtAGlanceInfoProps) {
  const { t } = useTranslation();

  const hasBestTime = bestTimeToVisit && (Array.isArray(bestTimeToVisit) ? bestTimeToVisit.length > 0 : bestTimeToVisit.length > 0);
  const hasTips = essentialTips && essentialTips.length > 0;

  if (!hasBestTime && !hasTips) return null;

  return (
    <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm sticky top-24 overflow-hidden">
      <div className="bg-primary/5 p-4 border-b border-primary/10">
        <h3 className="font-semibold flex items-center gap-2 text-primary">
          <MapPin className="w-4 h-4" />
          Thông tin nhanh
        </h3>
      </div>
      <CardContent className="p-5 space-y-6">
        {hasBestTime && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="w-4 h-4 text-orange-500" />
              Thời điểm lý tưởng
            </div>

            <div className="pl-6">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const processTime = (item: string) => {
                    const months = [
                      'january', 'february', 'march', 'april', 'may', 'june',
                      'july', 'august', 'september', 'october', 'november', 'december'
                    ];
                    const lowerItem = item.toLowerCase().trim();
                    if (months.includes(lowerItem)) {
                      return t(`common.months.${lowerItem}`);
                    }
                    return item.charAt(0).toUpperCase() + item.slice(1);
                  };

                  if (Array.isArray(bestTimeToVisit)) {
                    return bestTimeToVisit.map((item, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none font-normal">
                        {processTime(item)}
                      </Badge>
                    ));
                  }

                  // Fallback for string
                  return (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none font-normal">
                      {processTime(bestTimeToVisit as string)}
                    </Badge>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {hasBestTime && hasTips && <Separator className="bg-border/60" />}

        {hasTips && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Mẹo hữu ích
            </div>
            <ul className="space-y-3 pl-6">
              {essentialTips.map((tip, idx) => (
                <li key={idx} className="text-sm text-foreground/80 leading-relaxed flex gap-2 relative group">
                  <span className="absolute -left-4 top-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 group-hover:scale-125 transition-transform" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
