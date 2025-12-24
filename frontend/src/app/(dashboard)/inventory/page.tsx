'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';
import { inventoryApi } from '@/lib/api';
import type { InventoryItem, InventoryType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatCurrency, formatNumber, getInventoryTypeColor } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const typeOptions: { value: InventoryType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'همه انواع' },
  { value: 'RAW_MATERIAL', label: 'مواد اولیه' },
  { value: 'COMPONENT', label: 'اجزاء' },
  { value: 'FINISHED_GOOD', label: 'کالاهای تمام شده' },
  { value: 'PACKAGING', label: 'بسته بندی' },
  { value: 'CONSUMABLE', label: 'مواد مصرفی' },
];

function StockIndicator({ item }: { item: InventoryItem }) {
  const stockPercentage = item.maxStock
    ? (item.currentStock / item.maxStock) * 100
    : item.currentStock > item.reorderPoint
    ? 100
    : (item.currentStock / item.reorderPoint) * 100;

  const isLowStock = item.currentStock <= item.reorderPoint;
  const isOutOfStock = item.currentStock === 0;

  return (
    <div className="w-32">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className={cn(isOutOfStock ? 'text-danger-400' : isLowStock ? 'text-volt-400' : 'text-muted-foreground')}>
          {formatNumber(item.currentStock)} / {formatNumber(item.maxStock || item.reorderPoint * 2)}
        </span>
      </div>
      <Progress
        value={Math.min(stockPercentage, 100)}
        className="h-1.5"
        indicatorClassName={cn(
          isOutOfStock ? 'bg-danger-500' : isLowStock ? 'bg-volt-500' : 'bg-electric-500'
        )}
      />
    </div>
  );
}

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<InventoryType | 'ALL'>('ALL');
  const [showLowStock, setShowLowStock] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', { search, type: typeFilter, lowStock: showLowStock, page }],
    queryFn: () =>
      inventoryApi.list({
        search: search || undefined,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        lowStock: showLowStock || undefined,
        page,
        limit: 10,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: inventoryApi.getStats,
  });

  const items = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">موجودی</h1>
          <p className="text-muted-foreground mt-1">
            مدیریت مواد اولیه، قطعات و کالاهای نهایی
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('inventory:write') && (
            <>
              <Button variant="outline" asChild>
                <Link href="/inventory/movements">
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  انتقال رکورد
                </Link>
              </Button>
              <Button asChild>
                <Link href="/inventory/new">
                  <Plus className="w-4 h-4 mr-2" />
                   اضافه کردن ایتم
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-circuit-950/50">
              <Package className="w-5 h-5 text-circuit-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatNumber(stats?.totalItems || 0)}</p>
              <p className="text-xs text-muted-foreground">مجموع اقلام</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-electric-950/50">
              <ArrowDownCircle className="w-5 h-5 text-electric-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats?.totalValue || 0)}</p>
              <p className="text-xs text-muted-foreground">ارزش کل</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-volt-950/50">
              <TrendingDown className="w-5 h-5 text-volt-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.lowStockCount || 0}</p>
              <p className="text-xs text-muted-foreground">اقلام کم موجودی</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-volt-800/50 transition-colors" onClick={() => setShowLowStock(!showLowStock)}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-danger-950/50">
              <AlertTriangle className="w-5 h-5 text-danger-400" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {showLowStock ? 'Show All' : 'Show Low Stock'}
              </p>
              <p className="text-xs text-muted-foreground">برای تغییر وضعیت کلیک کنید</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="جستجو بر اساس نام ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as InventoryType | 'ALL')}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>مورد</th>
                  <th>SKU</th>
                  <th>انواع</th>
                  <th>موجودی انبار</th>
                  <th>هزینه واحد</th>
                  <th>مکان</th>
                  <th className="text-right">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7}>
                        <div className="h-12 bg-muted/50 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <p className="text-muted-foreground">هیچ مورد موجودی یافت نشد</p>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const isLowStock = item.currentStock <= item.reorderPoint;
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(isLowStock && 'bg-volt-950/10')}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            {isLowStock && (
                              <AlertTriangle className="w-4 h-4 text-volt-400 shrink-0" />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.supplier && (
                                <p className="text-xs text-muted-foreground">
                                  {item.supplier.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-sm">{item.sku}</span>
                        </td>
                        <td>
                          <Badge className={cn('text-xs', getInventoryTypeColor(item.type))}>
                            {item.type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td>
                          <StockIndicator item={item} />
                        </td>
                        <td>
                          {formatCurrency(item.unitCost, item.currency)}
                          <span className="text-xs text-muted-foreground">/{item.unit}</span>
                        </td>
                        <td className="text-muted-foreground">
                          {item.location || '—'}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/inventory/${item.id}`}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    مشاهده جزئیات
                                  </Link>
                                </DropdownMenuItem>
                                {hasPermission('inventory:write') && (
                                  <>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/inventory/${item.id}/edit`}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        ویرایش کنید
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <ArrowDownCircle className="w-4 h-4 mr-2" />
                                      رکورد واردات
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                                      رکورد صادرات
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {hasPermission('inventory:delete') && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-danger-400">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      حذف کنید
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, pagination.total)} of{' '}
                {pagination.total} items
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  قبلی
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                >
                  بعدی
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
