import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CouponFormData {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  rules: {
    minimumSpend: number;
  };
  limits: {
    totalUses: number;
    usesPerCustomer: boolean;
  };
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface AddCouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CouponFormData, couponId?: string) => void;
  isLoading?: boolean;
  existingCoupon?: any;
}

export function AddCouponModal({ open, onOpenChange, onSubmit, isLoading = false, existingCoupon }: AddCouponModalProps) {
  const { t } = useTranslation();
  
  const form = useForm<CouponFormData>({
    defaultValues: {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      rules: {
        minimumSpend: 0,
      },
      limits: {
        totalUses: 0,
        usesPerCustomer: false,
      },
      startDate: undefined,
      endDate: undefined,
    },
  });

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = form;
  const watchedDiscountType = watch('discountType');

  // Pre-populate form when editing
  useEffect(() => {
    if (existingCoupon) {
      // Convert the existing coupon data to match our form structure
      const formData = {
        code: existingCoupon.code || '',
        description: existingCoupon.description || '',
        discountType: existingCoupon.discountType || 'percentage',
        discountValue: existingCoupon.discountValue || 0,
        rules: {
          minimumSpend: existingCoupon.rules?.minimumSpend || 0,
        },
        limits: {
          totalUses: existingCoupon.limits?.totalUses || 0,
          usesPerCustomer: existingCoupon.limits?.usesPerCustomer || false,
        },
        startDate: existingCoupon.startDate ? new Date(existingCoupon.startDate) : undefined,
        endDate: existingCoupon.endDate ? new Date(existingCoupon.endDate) : undefined,
      };
      reset(formData);
    } else {
      // Clear form for create mode
      reset({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        rules: { minimumSpend: 0 },
        limits: { totalUses: 0, usesPerCustomer: false },
        startDate: undefined,
        endDate: undefined,
      });
    }
  }, [existingCoupon, reset]);

  const generateRandomCode = () => {
    const code = `SALE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setValue('code', code);
  };

  const onFormSubmit = (data: CouponFormData) => {
    onSubmit(data, existingCoupon?._id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {existingCoupon ? t('admin_marketing.coupons.edit_coupon') : t('admin_marketing.coupons.create_edit')}
          </DialogTitle>
        </DialogHeader>
        
        {/* Main content area with scrollbar */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 p-1">
              {/* Coupon Code Section */}
              <div className="space-y-3">
                <Label htmlFor="code">{t('admin_marketing.coupons.code')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    {...form.register('code', { required: true })}
                    placeholder="Enter coupon code"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateRandomCode}
                    disabled={!!existingCoupon}
                  >
                    {t('admin_marketing.coupons.generate')}
                  </Button>
                </div>
                {errors.code && (
                  <p className="text-sm text-red-500">Code is required</p>
                )}
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <Label htmlFor="description">{t('admin_marketing.coupons.description')}</Label>
                <Textarea
                  id="description"
                  {...form.register('description', { required: true })}
                  rows={3}
                  placeholder="Enter coupon description"
                />
                {errors.description && (
                  <p className="text-sm text-red-500">Description is required</p>
                )}
              </div>

              {/* Discount Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="discountType">{t('admin_marketing.coupons.discount_type')}</Label>
                  <Controller
                    name="discountType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">{t('admin_marketing.coupons.percentage')}</SelectItem>
                          <SelectItem value="fixed_amount">{t('admin_marketing.coupons.fixed_amount')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="discountValue">
                    {t('admin_marketing.coupons.discount_value')}
                    {watchedDiscountType === 'percentage' && ' (%)'}
                    {watchedDiscountType === 'fixed_amount' && ' (VND)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    {...form.register('discountValue', { 
                      required: true, 
                      min: 0,
                      max: watchedDiscountType === 'percentage' ? 100 : undefined
                    })}
                    placeholder={watchedDiscountType === 'percentage' ? '0-100' : '0'}
                  />
                  {errors.discountValue && (
                    <p className="text-sm text-red-500">
                      {watchedDiscountType === 'percentage' ? 'Percentage must be between 0-100' : 'Value must be positive'}
                    </p>
                  )}
                </div>
              </div>

              {/* Conditions Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('admin_marketing.coupons.conditions')}</h3>
                <div className="space-y-3">
                  <Label htmlFor="minimumSpend">{t('admin_marketing.coupons.minimum_spend')} (VND)</Label>
                  <Input
                    id="minimumSpend"
                    type="number"
                    {...form.register('rules.minimumSpend', { min: 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Limits Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('admin_marketing.coupons.limits')}</h3>
                <div className="space-y-3">
                  <Label htmlFor="totalUses">{t('admin_marketing.coupons.total_uses')}</Label>
                  <Input
                    id="totalUses"
                    type="number"
                    {...form.register('limits.totalUses', { min: 0 })}
                    placeholder="0 (unlimited)"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="usesPerCustomer"
                      {...form.register('limits.usesPerCustomer')}
                    />
                    <Label htmlFor="usesPerCustomer">
                      {t('admin_marketing.coupons.uses_per_customer')}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Active Dates Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('admin_marketing.coupons.active_dates')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>{t('admin_marketing.coupons.start_date')}</Label>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "LLL dd, y")
                              ) : (
                                <span>{t('admin_marketing.coupons.start_date')}</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>{t('admin_marketing.coupons.end_date')}</Label>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "LLL dd, y")
                              ) : (
                                <span>{t('admin_marketing.coupons.end_date')}</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const startDate = watch('startDate');
                                return startDate ? date <= startDate : date < new Date();
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          </ScrollArea>
        </div>

        {/* Fixed footer with action buttons */}
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onFormSubmit)}
            disabled={isLoading}
          >
            {isLoading 
              ? (existingCoupon ? 'Updating...' : 'Creating...') 
              : t('admin_marketing.coupons.save')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
