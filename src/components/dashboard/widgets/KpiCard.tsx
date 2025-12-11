import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

type Props = {
  title: string;
  value: string;
  comparison?: { value: string; isPositive: boolean };
  link?: string;
  icon?: ReactNode;
};

export default function KpiCard({ title, value, comparison, link, icon }: Props) {
  const content = (
    <Card className="bg-card border border-border p-4 hover:bg-secondary/60 transition-colors cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="text-sm text-secondary-foreground">{title}</div>
        {icon}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {comparison && (
        <div className={`mt-1 text-xs inline-flex items-center gap-1 ${comparison.isPositive ? 'text-green-300' : 'text-red-300'}`}>
          {comparison.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          <span>{comparison.value}</span>
        </div>
      )}
    </Card>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}













