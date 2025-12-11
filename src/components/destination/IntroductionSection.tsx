interface IntroductionSectionProps {
  destinationName: string;
  introduction: string;
}

export const IntroductionSection = ({ destinationName, introduction }: IntroductionSectionProps) => {
  return (
    <section className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          Chào mừng đến với Di sản Thiên nhiên Thế giới
        </h2>
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            {introduction}
          </p>
        </div>
      </div>
    </section>
  );
};



