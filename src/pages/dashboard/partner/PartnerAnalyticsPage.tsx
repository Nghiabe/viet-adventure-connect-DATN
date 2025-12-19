
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, CreditCard, Activity, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function PartnerAnalyticsPage() {
    const [dateRange, setDateRange] = useState<{ from: Date, to: Date }>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date()
    });

    const { data, isLoading } = useQuery({
        queryKey: ['partnerAnalytics', dateRange.from, dateRange.to],
        queryFn: async () => {
            try {
                const params = new URLSearchParams({
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString()
                });
                const res = await apiClient.get(`/partner/analytics/overview?${params}`);
                if (res.success && res.data) return res.data;
                return { revAgg: [], kpis: [] }; // Default empty data
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
                return { revAgg: [], kpis: [] }; // Default empty data
            }
        }
    });

    const revAgg = data?.revAgg || [];
    const kpis = data?.kpis || [{ revenue: 0, bookings: 0 }, 0];
    const [totalStats, newCustomersCount] = Array.isArray(kpis) && kpis.length >= 2 ? kpis : [{ revenue: 0, bookings: 0 }, 0];
    const bookingsCount = totalStats?.bookings || 0;
    const revenueTotal = totalStats?.revenue || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Phân tích & Báo cáo</h1>
                    <p className="text-muted-foreground">Theo dõi hiệu suất kinh doanh từ hệ thống</p>
                </div>

                {/* Date Range Parser Placeholder - Using simple buttons for now or valid DateRangePicker if available */}
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y", { locale: vi })} -{" "}
                                            {format(dateRange.to, "LLL dd, y", { locale: vi })}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y", { locale: vi })
                                    )
                                ) : (
                                    <span>Chọn ngày</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange.from}
                                selected={{ from: dateRange.from, to: dateRange.to }}
                                onSelect={(range) => {
                                    if (range?.from) {
                                        setDateRange({ from: range.from, to: range.to || range.from });
                                    }
                                }}
                                numberOfMonths={2}
                                locale={vi}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(revenueTotal)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Trong giai đoạn đã chọn</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Lượt đặt tour</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{bookingsCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">Đơn hàng đã xác nhận</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Khách hàng (Unique)</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{newCustomersCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">Khách đặt tour trong kỳ</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Giá trị TB/Đơn</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {bookingsCount > 0
                                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(revenueTotal / bookingsCount)
                                        : '0 ₫'}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Trung bình mỗi đơn hàng</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Biểu đồ doanh thu</CardTitle>
                                <CardDescription>Chi tiết theo thời gian</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revAgg}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="_id" />
                                            <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                                            <Tooltip
                                                formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value as number)}
                                                labelStyle={{ color: '#333' }}
                                            />
                                            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Doanh thu" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Xu hướng đặt tour</CardTitle>
                                <CardDescription>Số lượng đơn theo thời gian</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={revAgg}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="_id" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip labelStyle={{ color: '#333' }} />
                                            <Line type="monotone" dataKey="bookings" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} name="Đơn đặt" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
