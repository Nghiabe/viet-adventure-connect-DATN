import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useBooking } from '@/context/BookingContext';

export interface BookingParticipants {
  adults: number;
  children?: number;
}

export interface BookingConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourId: string;
  tourName: string;
  duration?: string;
  departureDate: Date;
  participants: BookingParticipants;
  unitPrice: number; // price per adult
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + '₫';
}

export default function BookingConfirmationModal({ open, onOpenChange, tourId, tourName, duration, departureDate, participants, unitPrice }: BookingConfirmationModalProps) {
  const navigate = useNavigate();
  const { initiateBooking } = useBooking();

  const adultsTotal = unitPrice * (participants.adults || 0);
  const childrenTotal = unitPrice * 0.7 * (participants.children || 0);
  const totalPrice = adultsTotal + childrenTotal;

  const handleContinue = () => {
    initiateBooking({
      tourId,
      tourName,
      duration,
      bookingDate: departureDate.toISOString(),
      participantsTotal: (participants.adults || 0) + (participants.children || 0),
      participantsBreakdown: participants,
      unitPrice,
      clientComputedTotal: totalPrice,
    });
    navigate('/checkout');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận đặt tour</DialogTitle>
          <DialogDescription>Vui lòng kiểm tra lại thông tin trước khi tiếp tục thanh toán.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tour</span>
            <span className="font-medium">{tourName}</span>
          </div>
          {duration && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Thời lượng</span>
              <span className="font-medium">{duration}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ngày khởi hành</span>
            <span className="font-medium">{new Date(departureDate).toLocaleDateString('vi-VN')}</span>
          </div>

          <Separator className="my-2" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Người lớn x {participants.adults || 0}</span>
              <span className="font-medium">{formatVnd(adultsTotal)}</span>
            </div>
            {(participants.children || 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trẻ em x {participants.children}</span>
                <span className="font-medium">{formatVnd(childrenTotal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-2 text-base">
              <span className="font-semibold">Tổng cộng</span>
              <span className="font-semibold text-primary">{formatVnd(totalPrice)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleContinue}>Tiếp tục đến thanh toán</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




