import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DestinationForm from '@/components/dashboard/destinations/DestinationForm';

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as any;
}

export default function DestinationEditorPage() {
  const { slugOrId } = useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch destination data
  const { data: destinationData, isLoading: isFetching } = useQuery({
    queryKey: ['destination', slugOrId],
    queryFn: async () => {
      if (!slugOrId) throw new Error('No destination ID provided');
      const response = await api<{ success: boolean; data: any }>(`/api/admin/destinations/${slugOrId}`);
      if (!response.success) throw new Error('Failed to fetch destination');
      return response.data;
    },
    enabled: !!slugOrId,
  });

  // Update destination mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!slugOrId || !destinationData?._id) throw new Error('No destination ID');
      const response = await api(`/api/admin/destinations/${destinationData._id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: () => {
      toast.success(t('toasts.update_success'));
      queryClient.invalidateQueries({ queryKey: ['destination', slugOrId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('toasts.generic_error'));
    }
  });

  // Publish destination mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!slugOrId || !destinationData?._id) throw new Error('No destination ID');
      const response = await api(`/api/admin/destinations/${destinationData._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'published' })
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Điểm đến đã được xuất bản!');
      queryClient.invalidateQueries({ queryKey: ['destination', slugOrId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('toasts.generic_error'));
    }
  });

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await updateMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    await publishMutation.mutateAsync();
  };

  const handlePreview = () => {
    if (destinationData?.slug) {
      window.open(`/destinations/${destinationData.slug}`, '_blank');
    }
  };

  if (isFetching) {
    return (
      <div className="p-6">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!destinationData) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Không tìm thấy điểm đến</div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 flex items-center gap-2">
        <div className="text-lg font-semibold flex-1">{t('admin_destinations.editor.title_edit')}</div>
        <Button variant="outline" onClick={handlePreview}>Xem trước</Button>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700" 
          onClick={handlePublish}
          disabled={publishMutation.isPending || destinationData.status === 'published'}
        >
          {publishMutation.isPending ? 'Đang xuất bản...' : 'Xuất bản'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <DestinationForm
          initialData={destinationData}
          onSubmit={handleSubmit}
          isLoading={isLoading || updateMutation.isPending}
          mode="edit"
        />
      </div>
    </div>
  );
}


