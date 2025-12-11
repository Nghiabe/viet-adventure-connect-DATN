import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Hồ sơ của bạn đang được xem xét</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cảm ơn bạn đã đăng ký tài khoản Host. Chúng tôi sẽ xem xét hồ sơ của bạn trong thời gian sớm nhất.
          Bạn sẽ nhận được email thông báo khi tài khoản được phê duyệt.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/">Trở về Trang chủ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}














