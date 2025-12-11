import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// API function
async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Form validation schema
const ReferralSettingsSchema = z.object({
  rewardAmount: z.number().min(0),
  discountPercentage: z.number().min(0).max(100),
});

type ReferralSettingsFormData = z.infer<typeof ReferralSettingsSchema>;

export default function ReferralsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: currentSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['referralSettings'],
    queryFn: async () => {
      const response = await api<{ success: boolean; data: ReferralSettingsFormData }>('/api/admin/settings/referral');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (formData: ReferralSettingsFormData) => {
      return await api('/api/admin/settings/referral', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    },
    onSuccess: () => {
      // Invalidate and refetch the settings
      queryClient.invalidateQueries({ queryKey: ['referralSettings'] });
      // You can add a toast notification here
      console.log('Settings saved successfully');
    },
    onError: (error: any) => {
      console.error('Failed to save settings:', error);
      // You can add an error toast here
    },
  });

  // Form setup
  const form = useForm<ReferralSettingsFormData>({
    resolver: zodResolver(ReferralSettingsSchema),
    defaultValues: {
      rewardAmount: 0,
      discountPercentage: 10,
    },
  });

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = form;

  // Reset form when settings are loaded
  useEffect(() => {
    if (currentSettings) {
      reset(currentSettings);
    }
  }, [currentSettings, reset]);

  const onSubmit = (data: ReferralSettingsFormData) => {
    saveSettingsMutation.mutate(data);
  };

  if (isLoadingSettings) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-2xl font-semibold">{t('admin_marketing.referrals.title')}</div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="text-2xl font-semibold">{t('admin_marketing.referrals.title')}</div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('admin_marketing.referrals.settings_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Referrer Reward Amount */}
              <div className="space-y-3">
                <Label htmlFor="rewardAmount">
                  {t('admin_marketing.referrals.referrer_reward')}
                </Label>
                <CurrencyInput
                  name="rewardAmount"
                  control={control}
                  placeholder="0"
                  suffix="VNĐ"
                  disabled={saveSettingsMutation.isPending}
                />
                {errors.rewardAmount && (
                  <p className="text-sm text-red-500">
                    {errors.rewardAmount.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('admin_marketing.referrals.referrer_reward_help')}
                </p>
              </div>

              {/* Referred Discount Percentage */}
              <div className="space-y-3">
                <Label htmlFor="discountPercentage">
                  {t('admin_marketing.referrals.referred_discount')}
                </Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  {...form.register('discountPercentage', {
                    valueAsNumber: true,
                    required: 'Giảm giá là bắt buộc',
                    min: { value: 0, message: 'Giảm giá không được âm' },
                    max: { value: 100, message: 'Giảm giá không được vượt quá 100%' },
                  })}
                  placeholder="10"
                  disabled={saveSettingsMutation.isPending}
                />
                {errors.discountPercentage && (
                  <p className="text-sm text-red-500">
                    {errors.discountPercentage.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('admin_marketing.referrals.referred_discount_help')}
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                type="submit"
                disabled={saveSettingsMutation.isPending || !isDirty}
              >
                {saveSettingsMutation.isPending 
                  ? t('admin_marketing.referrals.saving') 
                  : t('admin_marketing.referrals.save_settings')
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
