import { Map, Wallet, Headphones } from "lucide-react";

const items = [
  {
    icon: Map,
    title: "Lên Kế Hoạch Thông Minh",
    desc: "Tìm kiếm và so sánh hàng nghìn lựa chọn chỉ trong vài giây.",
  },
  {
    icon: Wallet,
    title: "Giá Tốt Nhất",
    desc: "Minh bạch, nhiều ưu đãi độc quyền và giá luôn cạnh tranh.",
  },
  {
    icon: Headphones,
    title: "Hỗ Trợ 24/7",
    desc: "Đội ngũ CSKH sẵn sàng bên bạn trên mọi hành trình.",
  },
];

export const WhyUs = () => {
  return (
    <section id="why" className="bg-muted py-16 md:py-20" aria-label="Tại sao chọn chúng tôi?">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">Tại sao chọn chúng tôi?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="rounded-lg bg-card border p-6 shadow-sm">
              <Icon className="text-primary mb-4" size={28} />
              <h3 className="text-lg font-bold mb-1">{title}</h3>
              <p className="text-muted-foreground">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
