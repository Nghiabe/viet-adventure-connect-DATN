import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface BudgetBreakdown {
  accommodation: number;
  activities: number;
  food: number;
  transport: number;
  other?: number;
}

interface BudgetSummaryData {
  total_estimated: number;
  breakdown: BudgetBreakdown;
  per_person: number;
  contingency: number;
  within_budget: boolean;
  savings_suggestions?: string[];
}

interface BudgetSummaryProps {
  budget: BudgetSummaryData | null;
  userBudget?: number | null;
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#6b7280'];

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({ budget, userBudget }) => {
  if (!budget) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-orange-500" />
            Tổng ngân sách
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chưa có thông tin ngân sách</p>
        </CardContent>
      </Card>
    );
  }

  const { total_estimated, breakdown, per_person, contingency, within_budget, savings_suggestions } = budget;

  // Safe format currency - handles undefined/null gracefully
  const safeFormat = (value: number | undefined | null) => {
    return (value || 0).toLocaleString('vi-VN');
  };

  // SAFETY: If breakdown is missing, render simplified version
  if (!breakdown) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-orange-500" />
            Tổng ngân sách
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tổng ước tính</span>
              <span className="text-2xl font-bold text-primary">
                {safeFormat(total_estimated)} ₫
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Chi tiết ngân sách sẽ được cập nhật sau khi hoàn thiện lịch trình.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normalize breakdown - support both 'activities' and 'attractions' field names
  const normalizedBreakdown = {
    accommodation: breakdown.accommodation || 0,
    activities: breakdown.activities || breakdown.attractions || 0, // Support both field names
    food: breakdown.food || 0,
    transport: breakdown.transport || 0,
    other: breakdown.other || 0
  };

  // Prepare data for pie chart using normalized values
  const chartData = [
    { name: 'Lưu trú', value: normalizedBreakdown.accommodation },
    { name: 'Hoạt động', value: normalizedBreakdown.activities },
    { name: 'Ăn uống', value: normalizedBreakdown.food },
    { name: 'Di chuyển', value: normalizedBreakdown.transport },
    { name: 'Khác', value: normalizedBreakdown.other }
  ].filter(item => item.value > 0);

  const totalWithContingency = (total_estimated || 0) + (contingency || 0);

  // Calculate percentages
  const getPercentage = (value: number) => {
    if (!total_estimated || total_estimated === 0) return 0;
    return Math.round((value / total_estimated) * 100);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-orange-500" />
          Tổng ngân sách
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total */}
        <div className="bg-primary/5 p-4 rounded-lg">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-muted-foreground">Tổng ước tính</span>
            <div className="flex items-center gap-2">
              {within_budget ? (
                <TrendingDown className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-2xl font-bold ${within_budget ? 'text-green-600' : 'text-red-600'}`}>
                {total_estimated.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
          {contingency > 0 && (
            <div className="text-xs text-muted-foreground">
              + Dự phòng {contingency.toLocaleString('vi-VN')} ₫ (15%) ={' '}
              <span className="font-medium">{totalWithContingency.toLocaleString('vi-VN')} ₫</span>
            </div>
          )}
          {per_person > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              ~ {per_person.toLocaleString('vi-VN')} ₫/người
            </div>
          )}
        </div>

        {/* Budget comparison */}
        {userBudget && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            {within_budget ? (
              <>
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">
                  Trong ngân sách (còn dư{' '}
                  {(userBudget - totalWithContingency).toLocaleString('vi-VN')} ₫)
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">
                  Vượt ngân sách{' '}
                  {(totalWithContingency - userBudget).toLocaleString('vi-VN')} ₫
                </span>
              </>
            )}
          </div>
        )}

        {/* Pie Chart */}
        {chartData.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString('vi-VN')} ₫`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Breakdown table */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Chi tiết</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Lưu trú</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {safeFormat(normalizedBreakdown.accommodation)} ₫
                </span>
                <Badge variant="secondary" className="text-xs">
                  {getPercentage(normalizedBreakdown.accommodation)}%
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Hoạt động</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {safeFormat(normalizedBreakdown.activities)} ₫
                </span>
                <Badge variant="secondary" className="text-xs">
                  {getPercentage(normalizedBreakdown.activities)}%
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ăn uống</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {safeFormat(normalizedBreakdown.food)} ₫
                </span>
                <Badge variant="secondary" className="text-xs">
                  {getPercentage(normalizedBreakdown.food)}%
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Di chuyển</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {safeFormat(normalizedBreakdown.transport)} ₫
                </span>
                <Badge variant="secondary" className="text-xs">
                  {getPercentage(normalizedBreakdown.transport)}%
                </Badge>
              </div>
            </div>
            {normalizedBreakdown.other > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Khác</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {safeFormat(normalizedBreakdown.other)} ₫
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {getPercentage(normalizedBreakdown.other)}%
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Savings suggestions */}
        {savings_suggestions && savings_suggestions.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Gợi ý tiết kiệm
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {savings_suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



