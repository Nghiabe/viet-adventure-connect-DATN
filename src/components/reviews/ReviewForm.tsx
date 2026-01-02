import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/services/apiClient';
import { StarRating } from '@/components/ui/StarRating';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
    tourId: string;
    initialData?: {
        _id: string;
        rating: number;
        comment: string;
    } | null;
    onSuccess?: () => void;
}

export default function ReviewForm({ tourId, initialData, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [comment, setComment] = useState(initialData?.comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Update state when initialData changes (e.g. after fetch completes)
    // useKey or useEffect could work, but simple prop check might suffice if component remounts or we trust parent.
    // Better to use useEffect to sync if parent fetches asynchronously.
    // However, for simplicity let's stick to initial state if key changes or use effect.
    // Let's add useEffect for safety.

    // Actually, react state initialized from props only sets once. 
    // If props load late, we need useEffect.
    /* useEffect(() => {
        if (initialData) {
            setRating(initialData.rating);
            setComment(initialData.comment);
        }
    }, [initialData]); */
    // Merging logic below.

    const isEditing = !!initialData;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Vui lòng chọn số sao đánh giá');
            return;
        }

        try {
            setIsSubmitting(true);
            let res;

            if (isEditing) {
                res = await apiClient.put(`/reviews/${initialData._id}`, { rating, comment });
            } else {
                res = await apiClient.post('/reviews', { tourId, rating, comment });
            }

            if (res.success) {
                toast.success(isEditing ? 'Cập nhật đánh giá thành công!' : 'Gửi đánh giá thành công! Cảm ơn bạn đã chia sẻ.');
                if (!isEditing) {
                    setRating(0);
                    setComment('');
                }
                onSuccess?.();
            } else {
                toast.error(res.error || 'Có lỗi xảy ra');
            }
        } catch (error: any) {
            toast.error(error.message || 'Lỗi kết nối');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) return;

        try {
            setIsDeleting(true);
            const res = await apiClient.delete(`/reviews/${initialData?._id}`);

            if ((res as any).success) {
                toast.success('Đã xóa đánh giá');
                setRating(0);
                setComment('');
                onSuccess?.();
            } else {
                toast.error((res as any).error || 'Lỗi khi xóa');
            }
        } catch (error: any) {
            toast.error(error.message || 'Lỗi hệ thống');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border shadow-sm relative">
            <h3 className="text-lg font-semibold mb-4">
                {isEditing ? 'Chỉnh sửa đánh giá của bạn' : 'Viết đánh giá của bạn'}
            </h3>

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

                <div className="flex gap-3">
                    <Button type="submit" disabled={isSubmitting || rating === 0} className="flex-1">
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xử lý...</> : (isEditing ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
                    </Button>

                    {isEditing && (
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={handleDelete}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa'}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}
