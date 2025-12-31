import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/services/apiClient';
import { StarRating } from '@/components/ui/StarRating';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
    tourId: string;
    onSuccess?: () => void;
}

export default function ReviewForm({ tourId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Vui lòng chọn số sao đánh giá');
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await apiClient.post('/reviews', { tourId, rating, comment });

            if (res.success) {
                toast.success('Gửi đánh giá thành công! Cảm ơn bạn đã chia sẻ.');
                setRating(0);
                setComment('');
                onSuccess?.();
            } else {
                toast.error(res.error || 'Không thể gửi đánh giá');
            }
        } catch (error: any) {
            toast.error(error.message || 'Lỗi kết nối');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Viết đánh giá của bạn</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Đánh giá chung</label>
                    <StarRating value={rating} onChange={setRating} size={28} />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Nhận xét chi tiết</label>
                    <Textarea
                        placeholder="Chia sẻ trải nghiệm của bạn về chuyến đi này..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="resize-none"
                    />
                </div>

                <Button type="submit" disabled={isSubmitting || rating === 0}>
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang gửi...</> : 'Gửi đánh giá'}
                </Button>
            </form>
        </div>
    );
}
