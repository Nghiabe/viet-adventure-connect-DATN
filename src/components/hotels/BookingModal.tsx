// src/components/hotels/BookingModal.tsx
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; // adapt if you don't have these
import { toast } from '@/hooks/use-toast';

type Props = {
  open: boolean;
  onClose: () => void;
  hotel: any; // object returned from /api/hotels/:id
  defaults?: {
    checkin?: string;
    checkout?: string;
    guests?: number;
  }
};

type FormValues = {
  checkin: string;
  checkout: string;
  guests: number;
  bedType?: string;
};

export default function BookingModal({ open, onClose, hotel, defaults }: Props) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      checkin: defaults?.checkin ?? '',
      checkout: defaults?.checkout ?? '',
      guests: defaults?.guests ?? 2,
      bedType: ''
    }
  });

  const checkin = watch('checkin');
  const checkout = watch('checkout');
  const guests = watch('guests') ?? 1;

  const nights = useMemo(() => {
    if (!checkin || !checkout) return null;
    const a = new Date(checkin);
    const b = new Date(checkout);
    if (isNaN(a.getTime()) || isNaN(b.getTime()) || b <= a) return null;
    const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [checkin, checkout]);

  const unitPrice = hotel?.priceVndNumber ?? hotel?.priceNumber ?? null; // unit in VND number
  const totalPrice = unitPrice && nights ? Math.round(unitPrice * nights) : null;

  const onSubmit = async (vals: FormValues) => {
    // client validation
    if (!vals.checkin || !vals.checkout) {
      toast({ title: 'Thiếu ngày', description: 'Vui lòng chọn ngày nhận & trả phòng.' });
      return;
    }
    if (!vals.guests || Number(vals.guests) <= 0) {
      toast({ title: 'Thiếu số khách', description: 'Vui lòng nhập số khách >= 1' });
      return;
    }

    const payload = {
      hotelId: hotel?.id ?? hotel?.raw?.hotel_id ?? hotel?.raw?.id,
      hotelName: hotel?.name ?? hotel?.raw?.hotel_name ?? hotel?.raw?.name,
      providerUrl: hotel?.raw?.url ?? hotel?.raw?.provider_url ?? null,
      checkin: vals.checkin,
      checkout: vals.checkout,
      guests: Number(vals.guests),
      bedType: vals.bedType || null,
      nights: nights,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      raw: hotel?.raw ?? hotel
    };

    // debug log in console
    console.log('Booking payload', payload);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const txt = await res.text();
      let json: any = null;
      try { json = txt ? JSON.parse(txt) : {}; } catch { json = { text: txt }; }

      if (!res.ok) {
        console.error('Booking failed', res.status, json);
        toast({ title: 'Đặt phòng thất bại', description: json?.error || json?.message || String(txt) });
        return;
      }

      // success: API returns { id, provider_url }
      const bookingId = json?.id;
      const provider = json?.provider_url;
      toast({ title: 'Đặt phòng tạm lưu', description: provider ? 'Bạn sẽ được chuyển sang trang đối tác để hoàn tất thanh toán.' : `Booking ID: ${bookingId}` });

      // open provider url in new tab if returned
      if (provider) {
        window.open(provider, '_blank', 'noopener');
      }

      onClose();
    } catch (e: any) {
      console.error('Booking exception', e);
      toast({ title: 'Lỗi mạng', description: e?.message || String(e) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt phòng: {hotel?.name ?? '—'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nhận phòng</label>
            <Input type="date" {...register('checkin', { required: true })} />
            {errors.checkin && <div className="text-red-500 text-sm">Cần chọn ngày nhận phòng</div>}
          </div>

          <div>
            <label className="block text-sm font-medium">Trả phòng</label>
            <Input type="date" {...register('checkout', { required: true })} />
            {errors.checkout && <div className="text-red-500 text-sm">Cần chọn ngày trả phòng</div>}
          </div>

          <div>
            <label className="block text-sm font-medium">Số khách</label>
            <Input type="number" min={1} {...register('guests', { valueAsNumber: true, required: true })} />
          </div>

          <div>
            <label className="block text-sm font-medium">Loại giường (tuỳ chọn)</label>
            <Input type="text" {...register('bedType')} placeholder="Double / Twin / ..."/>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Số đêm: {nights ?? '—'}</p>
            <p className="text-sm text-muted-foreground">Đơn giá (khoảng): {unitPrice ? `${unitPrice.toLocaleString('vi-VN')} ₫` : '—'}</p>
            <p className="text-sm font-semibold">Tạm tính: {totalPrice ? `${totalPrice.toLocaleString('vi-VN')} ₫` : '—'}</p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>Đặt ngay</Button>
            <Button variant="outline" onClick={onClose} type="button">Huỷ</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
