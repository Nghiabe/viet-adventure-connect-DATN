import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface GuideItem {
  id: string;
  question: string;
  content: string | string[];
  type: 'text' | 'list';
}

interface TravelerGuideSectionProps {
  destinationName: string;
  guideItems: GuideItem[];
}

export const TravelerGuideSection = ({ destinationName, guideItems }: TravelerGuideSectionProps) => {
  const renderContent = (item: GuideItem) => {
    if (item.type === 'list' && Array.isArray(item.content)) {
      return (
        <ul className="space-y-2">
          {item.content.map((listItem, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: listItem }} />
            </li>
          ))}
        </ul>
      );
    }
    
    return (
      <p className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content as string }} />
    );
  };

  return (
    <section className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          Cẩm nang Du lịch Thiết yếu
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          Tất cả thông tin cần thiết để bạn có chuyến đi hoàn hảo tại {destinationName}
        </p>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6">
        <Accordion type="single" collapsible className="w-full space-y-2">
          {guideItems.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="border-b border-border last:border-b-0">
              <AccordionTrigger className="text-left hover:text-primary transition-colors py-4">
                <h3 className="font-semibold text-lg">{item.question}</h3>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="pt-2">
                  {renderContent(item)}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
