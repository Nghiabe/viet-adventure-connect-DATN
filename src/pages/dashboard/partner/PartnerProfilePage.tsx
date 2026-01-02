import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import apiClient from '@/services/apiClient';
import { Loader2, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { uploadImage, validateImageFile } from '@/services/uploadService';

interface PartnerProfile {
    companyName: string;
    description: string;
    website: string;
    phoneNumber: string;
    address: string;
    logo: string;
}

export default function PartnerProfilePage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<PartnerProfile>({
        companyName: '',
        description: '',
        website: '',
        phoneNumber: '',
        address: '',
        logo: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/partner/profile') as any;
            if (res.success && res.data) {
                setProfile({
                    companyName: res.data.companyName || user?.name || '',
                    description: res.data.description || '',
                    website: res.data.website || '',
                    phoneNumber: res.data.phoneNumber || '',
                    address: res.data.address || '',
                    logo: res.data.logo || user?.avatar || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
            setProfile(prev => ({ ...prev, companyName: user?.name || '', logo: user?.avatar || '' }));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const validation = validateImageFile(file);
            if (!validation.isValid) {
                toast.error(validation.error);
                return;
            }

            setUploadingLogo(true);
            try {
                const url = await uploadImage(file);
                setProfile(prev => ({ ...prev, logo: url }));
                toast.success('Upload logo thành công');
            } catch (error) {
                toast.error('Lỗi khi upload logo');
            } finally {
                setUploadingLogo(false);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!profile.companyName.trim()) {
            toast.error('Tên doanh nghiệp không được để trống');
            return;
        }
        if (profile.phoneNumber && !/^[0-9+]{9,15}$/.test(profile.phoneNumber)) {
            toast.error('Số điện thoại không hợp lệ');
            return;
        }

        setSaving(true);
        try {
            const res = await apiClient.put('/partner/profile', profile) as any;
            if (res.success) {
                toast.success(t('partner_profile.save_success', 'Cập nhật hồ sơ thành công'));
            } else {
                toast.error(res.message || t('partner_profile.save_error', 'Không thể lưu hồ sơ'));
            }
        } catch (error) {
            toast.error(t('partner_profile.save_error', 'Không thể lưu hồ sơ'));
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
                <h1 className="text-2xl font-bold">{t('partner_profile.title', 'Hồ sơ Doanh nghiệp')}</h1>
                <p className="text-muted-foreground">{t('partner_profile.subtitle', 'Quản lý thông tin hiển thị với khách hàng')}</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('partner_profile.basic_info', 'Thông tin cơ bản')}</CardTitle>
                        <CardDescription>{t('partner_profile.basic_info_desc', 'Thông tin này sẽ hiển thị trên trang chi tiết Tour')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="flex flex-col gap-4 md:flex-row">
                                <div className="flex flex-col items-center gap-2">
                                    <Avatar className="w-24 h-24">
                                        <AvatarImage src={profile.logo} />
                                        <AvatarFallback>{profile.companyName?.[0] || 'P'}</AvatarFallback>
                                    </Avatar>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <Button variant="outline" size="sm" type="button" onClick={handleLogoClick} disabled={uploadingLogo}>
                                        {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                        {t('common.upload_logo', 'Tải logo')}
                                    </Button>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="companyName">{t('partner_profile.company_name', 'Tên doanh nghiệp / Đối tác')} <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="companyName"
                                            name="companyName"
                                            value={profile.companyName}
                                            onChange={handleChange}
                                            placeholder="VD: Viet Adventure Travel"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">{t('partner_profile.description', 'Giới thiệu ngắn')}</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={profile.description}
                                            onChange={handleChange}
                                            placeholder="Mô tả về kinh nghiệm, sứ mệnh..."
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="website">{t('partner_profile.website', 'Website')}</Label>
                                    <Input
                                        id="website"
                                        name="website"
                                        value={profile.website}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phoneNumber">{t('partner_profile.phone', 'Số điện thoại')}</Label>
                                    <Input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={profile.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="+84..."
                                    />
                                </div>
                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="address">{t('partner_profile.address', 'Địa chỉ')}</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        value={profile.address}
                                        onChange={handleChange}
                                        placeholder="Địa chỉ trụ sở..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {t('common.save_changes', 'Lưu thay đổi')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
