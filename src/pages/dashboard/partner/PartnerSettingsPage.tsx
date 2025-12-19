import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import apiClient from '@/services/apiClient';
import { Loader2, CreditCard, Bell } from 'lucide-react';

interface PartnerSettings {
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    emailNotifications: boolean;
    bookingAlerts: boolean;
}

export default function PartnerSettingsPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<PartnerSettings>({
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: '',
        emailNotifications: true,
        bookingAlerts: true,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/partner/settings') as any;
            if (res.success && res.data) {
                setSettings({
                    bankName: res.data.bankName || '',
                    bankAccountName: res.data.bankAccountName || '',
                    bankAccountNumber: res.data.bankAccountNumber || '',
                    emailNotifications: res.data.emailNotifications ?? true,
                    bookingAlerts: res.data.bookingAlerts ?? true,
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (name: keyof PartnerSettings) => {
        setSettings(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await apiClient.put('/partner/settings', settings) as any;
            if (res.success) {
                toast.success(t('partner_settings.save_success', 'Cập nhật cài đặt thành công'));
            } else {
                toast.error(res.message || t('partner_settings.save_error', 'Không thể lưu cài đặt'));
            }
        } catch (error) {
            toast.error(t('partner_settings.save_error', 'Không thể lưu cài đặt'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('partner_settings.title', 'Cài đặt & Tài chính')}</h1>
                <p className="text-muted-foreground">{t('partner_settings.subtitle', 'Quản lý thông tin thanh toán và thông báo')}</p>
            </div>

            <div className="grid gap-6">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Banking Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                <CardTitle>{t('partner_settings.bank_info', 'Thông tin Thanh toán')}</CardTitle>
                            </div>
                            <CardDescription>{t('partner_settings.bank_info_desc', 'Thông tin tài khoản ngân hàng để nhận thanh toán doanh thu')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bankName">{t('partner_settings.bank_name', 'Tên ngân hàng')}</Label>
                                <Input
                                    id="bankName"
                                    name="bankName"
                                    value={settings.bankName}
                                    onChange={handleChange}
                                    placeholder="VD: Vietcombank"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bankAccountNumber">{t('partner_settings.bank_number', 'Số tài khoản')}</Label>
                                <Input
                                    id="bankAccountNumber"
                                    name="bankAccountNumber"
                                    value={settings.bankAccountNumber}
                                    onChange={handleChange}
                                    placeholder="0123456789"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bankAccountName">{t('partner_settings.bank_owner', 'Tên chủ tài khoản')}</Label>
                                <Input
                                    id="bankAccountName"
                                    name="bankAccountName"
                                    value={settings.bankAccountName}
                                    onChange={handleChange}
                                    placeholder="NGUYEN VAN A"
                                    className="uppercase"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                <CardTitle>{t('partner_settings.notifications', 'Cài đặt Thông báo')}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>{t('partner_settings.email_notif', 'Thông báo qua Email')}</Label>
                                    <p className="text-sm text-muted-foreground">Nhận email khi có đơn đặt tour mới</p>
                                </div>
                                <Switch
                                    checked={settings.emailNotifications}
                                    onCheckedChange={() => handleToggle('emailNotifications')}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>{t('partner_settings.booking_alert', 'Cảnh báo đơn hàng')}</Label>
                                    <p className="text-sm text-muted-foreground">Thông báo trong ứng dụng khi có thay đổi trạng thái</p>
                                </div>
                                <Switch
                                    checked={settings.bookingAlerts}
                                    onCheckedChange={() => handleToggle('bookingAlerts')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {t('common.save_changes', 'Lưu thay đổi')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
