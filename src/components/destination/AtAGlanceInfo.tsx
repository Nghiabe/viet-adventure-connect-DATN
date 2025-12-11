import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { translateMonth } from '@/utils/translation';

interface AtAGlanceInfoProps {
  bestTimeToVisit?: string[];
  essentialTips?: string[];
}

export function AtAGlanceInfo({ bestTimeToVisit, essentialTips }: AtAGlanceInfoProps) {
  const { t } = useTranslation();
  if ((!bestTimeToVisit || bestTimeToVisit.length === 0) && (!essentialTips || essentialTips.length === 0)) return null;

  return (
    <Card className="p-4 md:p-5">
      <div className="space-y-4">
        {bestTimeToVisit && bestTimeToVisit.length > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Thời điểm lý tưởng</div>
            <div className="flex flex-wrap gap-2">
              {bestTimeToVisit.map((item, idx) => (
                <span key={idx} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                  {translateMonth(item, t)}
                </span>
              ))}
            </div>
          </div>
        )}

        {bestTimeToVisit && bestTimeToVisit.length > 0 && essentialTips && essentialTips.length > 0 && (
          <Separator />
        )}

        {essentialTips && essentialTips.length > 0 && (
          <div>
            <div className="text-sm text-muted-foreground mb-2">Mẹo hữu ích</div>
            <ul className="list-disc pl-5 space-y-1">
              {essentialTips.map((tip, idx) => (
                <li key={idx} className="text-sm text-foreground/90">{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}


