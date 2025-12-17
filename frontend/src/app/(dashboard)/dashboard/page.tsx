'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  DollarSign,
  Package,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';

// Mock data for charts (replace with real API data)
const revenueData = [
  { month: 'Jan', revenue: 45000, orders: 120 },
  { month: 'Feb', revenue: 52000, orders: 145 },
  { month: 'Mar', revenue: 48000, orders: 132 },
  { month: 'Apr', revenue: 61000, orders: 168 },
  { month: 'May', revenue: 55000, orders: 155 },
  { month: 'Jun', revenue: 67000, orders: 189 },
];

const orderStatusData = [
  { name: 'Confirmed', value: 35, color: '#3b82f6' },
  { name: 'In Production', value: 28, color: '#eab308' },
  { name: 'Shipped', value: 22, color: '#16b378' },
  { name: 'Delivered', value: 45, color: '#22c55e' },
];

const inventoryByTypeData = [
  { type: 'Raw Materials', count: 450, value: 125000 },
  { type: 'Components', count: 320, value: 89000 },
  { type: 'Finished Goods', count: 180, value: 234000 },
  { type: 'Packaging', count: 95, value: 12000 },
];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  iconBg: string;
  delay?: number;
}

function StatCard({ title, value, subtitle, trend, icon, iconBg, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {(subtitle || trend !== undefined) && (
                <div className="flex items-center gap-2">
                  {trend !== undefined && (
                    <span
                      className={cn(
                        'flex items-center text-xs font-medium',
                        trend >= 0 ? 'text-electric-400' : 'text-danger-400'
                      )}
                    >
                      {trend >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(trend)}%
                    </span>
                  )}
                  {subtitle && (
                    <span className="text-xs text-muted-foreground">{subtitle}</span>
                  )}
                </div>
              )}
            </div>
            <div className={cn('p-3 rounded-xl', iconBg)}>{icon}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: reportsApi.getDashboard,
  });

  // Use mock data while loading or if API fails
  const stats = dashboardStats || {
    orders: { total: 1250, thisMonth: 89, pending: 45, trend: 12 },
    revenue: { total: 2450000, thisMonth: 156000, trend: 8.5 },
    inventory: { totalItems: 1245, lowStock: 23, totalValue: 485000 },
    projects: { active: 34, completed: 156, overdue: 5 },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your business performance
          </p>
        </div>
        <Button asChild>
          <Link href="/reports">
            View Reports
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={formatNumber(stats.orders.total)}
          subtitle="this month"
          trend={stats.orders.trend}
          icon={<ShoppingCart className="w-5 h-5 text-circuit-400" />}
          iconBg="bg-circuit-950/50"
          delay={0.1}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.revenue.total)}
          subtitle="vs last month"
          trend={stats.revenue.trend}
          icon={<DollarSign className="w-5 h-5 text-electric-400" />}
          iconBg="bg-electric-950/50"
          delay={0.2}
        />
        <StatCard
          title="Inventory Items"
          value={formatNumber(stats.inventory.totalItems)}
          subtitle={`${stats.inventory.lowStock} low stock`}
          icon={<Package className="w-5 h-5 text-volt-400" />}
          iconBg="bg-volt-950/50"
          delay={0.3}
        />
        <StatCard
          title="Active Projects"
          value={stats.projects.active}
          subtitle={`${stats.projects.overdue} overdue`}
          icon={<FolderKanban className="w-5 h-5 text-danger-400" />}
          iconBg="bg-danger-950/50"
          delay={0.4}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Revenue Trend
                <Badge variant="success">+8.5%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16b378" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#16b378" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1f',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#16b378"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
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
                {orderStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inventory by Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryByTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#666" fontSize={12} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="type"
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1f',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts & Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Alerts & Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Low Stock Alert */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-volt-950/30 border border-volt-800/30">
                <div className="p-2 rounded-lg bg-volt-900/50">
                  <AlertTriangle className="w-5 h-5 text-volt-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-volt-300">Low Stock Alert</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    23 items are below minimum stock level
                  </p>
                  <Button variant="link" size="sm" className="px-0 mt-2 text-volt-400" asChild>
                    <Link href="/inventory?filter=low-stock">View Items →</Link>
                  </Button>
                </div>
              </div>

              {/* Overdue Projects */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-danger-950/30 border border-danger-800/30">
                <div className="p-2 rounded-lg bg-danger-900/50">
                  <Clock className="w-5 h-5 text-danger-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-danger-300">Overdue Projects</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    5 projects have passed their due date
                  </p>
                  <Button variant="link" size="sm" className="px-0 mt-2 text-danger-400" asChild>
                    <Link href="/projects?filter=overdue">View Projects →</Link>
                  </Button>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Monthly Target</p>
                  <span className="text-sm text-muted-foreground">78%</span>
                </div>
                <Progress value={78} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  $156,000 of $200,000 target achieved
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
