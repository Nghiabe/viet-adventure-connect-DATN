import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Header } from '@/components/home/Header';
import { Footer } from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { useBooking } from '@/context/BookingContext';
import apiClient from '@/services/apiClient';

const schema = z.object({
  name: z.string().min(2, 'Vui lòng nhập họ tên'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ'),
  note: z.string().optional(),
  paymentMethod: z.enum(['cod', 'bank_transfer', 'credit_card'], { required_error: 'Vui lòng chọn phương thức thanh toán' })
});

type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { bookingDetails, clearBooking } = useBooking();

  useEffect(() => {
    if (!bookingDetails) navigate('/');
  }, [bookingDetails, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'bank_transfer' }
  });

  const { mutate: finalizeBooking, isPending } = useMutation({
    mutationFn: (finalBookingData: any) => apiClient.post<any>('/bookings', finalBookingData),
    onSuccess: (response: any) => {
      if (!response?.success) throw new Error(response?.error || 'Đặt tour thất bại');
      toast.success('Đặt tour thành công! Email xác nhận đang được gửi đến bạn.');
      clearBooking();
      const id = response?.data?._id || response?.data?.id;
      navigate(`/booking/success/${id || ''}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Không thể hoàn tất đặt tour. Vui lòng thử lại.');
    }
  });

  const onSubmit = (formData: FormValues) => {
    if (!bookingDetails) return;
    const finalData = {
      tourId: bookingDetails.tourId,
      bookingDate: bookingDetails.bookingDate,
      participants: bookingDetails.participantsTotal,
      participantsBreakdown: bookingDetails.participantsBreakdown,
      customerInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        note: formData.note,
      },
      paymentMethod: formData.paymentMethod,
    };
    finalizeBooking(finalData);
  };

  if (!bookingDetails) return null;

  const adults = bookingDetails.participantsBreakdown?.adults || 0;
  const children = bookingDetails.participantsBreakdown?.children || 0;
  const adultsTotal = bookingDetails.unitPrice * adults;
  const childrenTotal = bookingDetails.unitPrice * 0.7 * children;
  const total = adultsTotal + childrenTotal;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin khách hàng</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Họ tên</Label>
                <Input placeholder="Nguyễn Văn A" {...register('name')} />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input placeholder="email@domain.com" {...register('email')} />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <Input placeholder="09xxxxxxxx" {...register('phone')} />
                  {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
                </div>
              </div>
              <div>
                <Label>Ghi chú</Label>
                <Input placeholder="Yêu cầu đặc biệt (nếu có)" {...register('note')} />
              </div>

              <Separator className="my-2" />

              <div>
                <Label>Phương thức thanh toán</Label>
                <RadioGroup defaultValue="bank_transfer" className="mt-2" onValueChange={(v)=> (document.getElementById('pm-'+v) as HTMLInputElement | null)?.click()}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer">Chuyển khoản ngân hàng</Label>
                    <input id="pm-bank_transfer" type="radio" className="hidden" value="bank_transfer" {...register('paymentMethod')} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod">Thanh toán tại quầy</Label>
                    <input id="pm-cod" type="radio" className="hidden" value="cod" {...register('paymentMethod')} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card">Thẻ tín dụng</Label>
                    <input id="pm-credit_card" type="radio" className="hidden" value="credit_card" {...register('paymentMethod')} />
                  </div>
                </RadioGroup>
                {errors.paymentMethod && <p className="text-sm text-red-600 mt-1">{errors.paymentMethod.message as any}</p>}
              </div>

              <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
                {isPending ? 'Đang xử lý...' : 'Thanh toán ngay'}
              </Button>
            </form>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-6 space-y-3">
            <h2 className="text-xl font-semibold">Tóm tắt đơn hàng</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tour</span>
              <span className="font-medium">{bookingDetails.tourName}</span>
            </div>
            {bookingDetails.duration && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Thời lượng</span>
                <span className="font-medium">{bookingDetails.duration}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ngày khởi hành</span>
              <span className="font-medium">{new Date(bookingDetails.bookingDate).toLocaleDateString('vi-VN')}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Người lớn x {adults}</span>
              <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(adultsTotal)}₫</span>
            </div>
            {children > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trẻ em x {children}</span>
                <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(childrenTotal)}₫</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-semibold">Tổng cộng</span>
              <span className="font-semibold text-primary">{new Intl.NumberFormat('vi-VN').format(total)}₫</span>
            </div>
          </Card>
        </aside>
      </main>
      <Footer />
    </div>
  );
}




