import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IBooking } from '@/types/models';

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as any;
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin','booking',id], queryFn: ()=> api<{ success:boolean; data:any }>(`/api/admin/bookings/${id}`) });
  const booking = data?.data as any;

  const statusMutation = useMutation({
    mutationFn: async (next: string) => { await api(`/api/admin/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: next }) }); },
    onSuccess: ()=> qc.invalidateQueries({ queryKey: ['admin','booking',id] })
  });
  const resendMutation = useMutation({
    mutationFn: async () => { await api(`/api/admin/bookings/${id}/resend-confirmation`, { method: 'POST' }); },
  });

  if (!booking) return <div className="p-6">Loading...</div>;

  const statusClass = booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">Booking #BK-{String(booking._id).slice(-6)}</div>
        <div className={`px-3 py-1 rounded-full text-sm ${statusClass}`}>{booking.status}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="font-semibold mb-3">Booking Details</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Tour Date</div><div>{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : ''}</div>
              <div className="text-muted-foreground">Booking Date</div><div>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : ''}</div>
              <div className="text-muted-foreground">Participants</div><div>{booking.participants}</div>
              <div className="text-muted-foreground">Price Breakdown</div>
              <div>
                <div>Base: {new Intl.NumberFormat('vi-VN',{style:'currency', currency:'VND'}).format(booking?.priceBreakdown?.basePrice || 0)}</div>
                <div>Taxes: {new Intl.NumberFormat('vi-VN',{style:'currency', currency:'VND'}).format(booking?.priceBreakdown?.taxes || 0)}</div>
                <div>Fees: {new Intl.NumberFormat('vi-VN',{style:'currency', currency:'VND'}).format(booking?.priceBreakdown?.fees || 0)}</div>
              </div>
              <div className="text-muted-foreground">Total Price</div><div className="font-medium">{new Intl.NumberFormat('vi-VN',{style:'currency', currency:'VND'}).format(booking.totalPrice || 0)}</div>
              <div className="text-muted-foreground">Payment Method</div><div>{booking.paymentMethod || '—'}</div>
              <div className="text-muted-foreground">Payment Txn ID</div><div className="font-mono">{booking.paymentTransactionId || '—'}</div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="font-semibold mb-3">Customer Information</div>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={booking.user?.avatar || ''} />
                <AvatarFallback>{booking.user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{booking.user?.name}</div>
                <div className="text-sm text-muted-foreground">{booking.user?.email}</div>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <Link to={`/dashboard/users?search=${encodeURIComponent(booking.user?.email || '')}`} className="text-primary">Customer History: view all bookings</Link>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="font-semibold mb-3">Tour & Partner</div>
            <div className="space-y-2 text-sm">
              <div className="font-medium"><Link to={`/experience/${booking.tour?._id || ''}`} className="text-primary">{booking.tour?.title || booking.tourInfo?.title}</Link></div>
              <div className="text-muted-foreground">Partner: {booking.tour?.owner?.name || '—'}</div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="font-semibold mb-3">Actions & History</div>
            <div className="flex items-center gap-2 mb-3">
              {booking.status === 'pending' && (
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={()=> statusMutation.mutate('confirmed')}>Confirm Booking</Button>
              )}
              {booking.status !== 'cancelled' && (
                <Button variant="destructive" onClick={()=> statusMutation.mutate('cancelled')}>Cancel Booking</Button>
              )}
              <Button variant="secondary" onClick={()=>resendMutation.mutate()}>Resend Confirmation Email</Button>
            </div>
            <div className="space-y-2 text-sm">
              {(booking.history || []).slice().reverse().map((h: any, idx: number)=> (
                <div key={idx} className="text-muted-foreground">
                  {new Date(h.at).toLocaleString()} - {h.action}{h.by ? ` by ${h.by}` : ''}{h.note ? `. ${h.note}` : ''}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


