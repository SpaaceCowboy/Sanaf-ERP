'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { reportsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';

// Mock data for charts
const revenueByMonth = [
  { month: 'Jan', revenue: 125000, orders: 45, target: 120000 },
  { month: 'Feb', revenue: 145000, orders: 52, target: 130000 },
  { month: 'Mar', revenue: 132000, orders: 48, target: 140000 },
  { month: 'Apr', revenue: 168000, orders: 61, target: 150000 },
  { month: 'May', revenue: 155000, orders: 55, target: 160000 },
  { month: 'Jun', revenue: 189000, orders: 67, target: 170000 },
];

const ordersByCountry = [
  { country: 'Germany', orders: 45, revenue: 234000 },
  { country: 'France', orders: 38, revenue: 198000 },
  { country: 'UK', orders: 32, revenue: 167000 },
  { country: 'Italy', orders: 28, revenue: 145000 },
  { country: 'Spain', orders: 22, revenue: 112000 },
  { country: 'Netherlands', orders: 18, revenue: 95000 },
];

const inventoryByCategory = [
  { name: 'الکترونیک', value: 35, color: '#3b82f6' },
  { name: 'اجزاء', value: 28, color: '#16b378' },
  { name: 'مواد اولیه', value: 22, color: '#eab308' },
  { name: 'بسته بندی', value: 15, color: '#6366f1' },
];

const projectPerformance = [
  { month: 'Jan', completed: 12, onTime: 10, delayed: 2 },
  { month: 'Feb', completed: 15, onTime: 13, delayed: 2 },
  { month: 'Mar', completed: 18, onTime: 15, delayed: 3 },
  { month: 'Apr', completed: 14, onTime: 12, delayed: 2 },
  { month: 'May', completed: 20, onTime: 17, delayed: 3 },
  { month: 'Jun', completed: 22, onTime: 19, delayed: 3 },
];

const topProducts = [
  { name: 'Circuit Board A-100', orders: 156, revenue: 78000 },
  { name: 'Power Module PM-50', orders: 132, revenue: 66000 },
  { name: 'Sensor Unit SU-200', orders: 98, revenue: 49000 },
  { name: 'Control Panel CP-75', orders: 87, revenue: 43500 },
  { name: 'Display Module DM-30', orders: 76, revenue: 38000 },
];

const reportTypes = [
  { id: 'orders', label: 'گزارش سفارشات', icon: ShoppingCart, description: 'سفارش روندها و تجزیه و تحلیل' },
  { id: 'inventory', label: 'گزارش موجودی', icon: Package, description: 'سطوح و حرکات سهام' },
  { id: 'financial', label: 'گزارش مالی', icon: DollarSign, description: 'درآمد و هزینه‌ها' },
  { id: 'projects', label: 'گزارش پروژه ها', icon: FileText, description: 'معیارهای عملکرد پروژه' },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('6m');
  const [activeReport, setActiveReport] = useState('orders');

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: reportsApi.getDashboard,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">گزارش ها</h1>
          <p className="text-muted-foreground mt-1">
            تحلیل‌ها و بینش‌هایی برای کسب و کار شما
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">ماه گذشته</SelectItem>
              <SelectItem value="3m">۳ ماه گذشته</SelectItem>
              <SelectItem value="6m">۶ ماه گذشته</SelectItem>
              <SelectItem value="1y">سال گذشته</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            صادرات
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid gap-4 md:grid-cols-4">
        {reportTypes.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={cn(
                'cursor-pointer transition-all',
                activeReport === report.id
                  ? 'border-electric-500 bg-electric-950/20'
                  : 'hover:border-electric-800/50'
              )}
              onClick={() => setActiveReport(report.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    activeReport === report.id
                      ? 'bg-electric-600'
                      : 'bg-muted'
                  )}
                >
                  <report.icon
                    className={cn(
                      'w-5 h-5',
                      activeReport === report.id ? 'text-white' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <div>
                  <p className="font-medium">{report.label}</p>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-electric-400" />
                درآمد در مقابل هدف
              </CardTitle>
              <CardDescription>درآمد ماهانه در مقایسه با اهداف</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueByMonth}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16b378" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#16b378" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1f',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#16b378"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="Target"
                      stroke="#666"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders by Country */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-circuit-400" />
                سفارشات بر اساس کشور
              </CardTitle>
              <CardDescription>توزیع جغرافیایی سفارشات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByCountry} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#666" fontSize={12} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="country"
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1f',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Secondary Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Inventory Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>توزیع موجودی</CardTitle>
              <CardDescription>سهام بر اساس دسته بندی</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {inventoryByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1f',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {inventoryByCategory.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.name} ({item.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>عملکرد پروژه</CardTitle>
              <CardDescription>تکمیل به موقع پروژه در مقابل تکمیل با تأخیر</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1f',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="onTime" name="On Time" stackId="a" fill="#16b378" />
                    <Bar dataKey="delayed" name="Delayed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>محصولات برتر</CardTitle>
            <CardDescription>محصولات با بهترین عملکرد بر اساس سفارش و درآمد</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th>رتبه</th>
                  <th>محصول</th>
                  <th>سفارشات</th>
                  <th>درآمد</th>
                  <th>% از کل</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => {
                  const totalRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);
                  const percentage = ((product.revenue / totalRevenue) * 100).toFixed(1);
                  return (
                    <tr key={product.name}>
                      <td>
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold',
                            index === 0
                              ? 'bg-volt-500 text-black'
                              : index === 1
                              ? 'bg-carbon-400 text-black'
                              : index === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="font-medium">{product.name}</td>
                      <td>{formatNumber(product.orders)}</td>
                      <td>{formatCurrency(product.revenue)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-electric-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
