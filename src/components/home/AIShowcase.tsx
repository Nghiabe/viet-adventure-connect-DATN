import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AIWizardModal from "@/components/ai-planner/AIWizardModal";
import aiMock from "@/assets/ai-phone-mock.jpg";
import { Sparkles, ArrowRight, CheckCircle } from "lucide-react";

export const AIShowcase = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const navigate = useNavigate();

  const handlePlanComplete = (plannerData: any) => {
    setIsWizardOpen(false);
    navigate("/itinerary", { state: { plannerData } });
  };

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50" aria-label="Trợ lý Du lịch AI">
      {/* Background Abstract Shapes - Submit */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-[100px]"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div className="order-2 lg:order-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                Trợ lý AI 24/7
              </div>

              <h2 className="text-4xl lg:text-6xl font-extrabold leading-tight text-slate-900 tracking-tight">
                Du Lịch Thông Minh <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                  Chỉ Trong Tầm Tay
                </span>
              </h2>

              <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Tạm biệt việc lên kế hoạch phức tạp. Hãy để AI thiết kế chuyến đi hoàn hảo cho bạn - từ khách sạn, vé máy bay đến những trải nghiệm "hidden gems" chỉ người bản địa mới biết.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={() => setIsWizardOpen(true)}
                className="h-16 px-10 text-xl font-bold rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-xl shadow-blue-500/30 ring-4 ring-blue-50 hover:ring-blue-100 transition-all hover:scale-105 active:scale-95 group"
              >
                <Sparkles className="mr-3 h-6 w-6 animate-pulse text-yellow-300" />
                Lập Kế Hoạch Ngay
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-10 pt-4 opacity-80">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-slate-700">
                  <span className="font-bold text-slate-900">10k+</span> người dùng
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative group perspective-1000">
            {/* Main Image Container */}
            <div className="relative transform transition-transform duration-700 group-hover:rotate-y-2 group-hover:rotate-x-2">
              <div className="absolute inset-4 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <img
                src={aiMock}
                alt="AI Travel Planner Interface"
                className="relative w-full rounded-[2rem] border-8 border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] bg-white z-10"
                loading="lazy"
              />
            </div>

            {/* Floating Cards - High Contrast Light Theme */}
            <div className="absolute bottom-[10%] -left-[5%] md:-left-[10%] bg-white p-4 pr-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-bounce duration-[4000ms] border border-gray-100 z-20 hidden md:block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-slate-900 font-bold text-base">Tối ưu chi phí</div>
                  <div className="text-sm text-slate-500 font-medium">Tiết kiệm tới 20%</div>
                </div>
              </div>
            </div>

            <div className="absolute top-[15%] -right-[5%] md:-right-[10%] bg-white p-4 pr-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-bounce delay-1000 duration-[4000ms] border border-gray-100 z-20 hidden md:block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-slate-900 font-bold text-base">Trải nghiệm độc bản</div>
                  <div className="text-sm text-slate-500 font-medium">Thiết kế riêng 100%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AIWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </section>
  );
};

export default AIShowcase;
