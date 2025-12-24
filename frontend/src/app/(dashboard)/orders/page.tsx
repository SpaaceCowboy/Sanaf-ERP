'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { ordersApi } from '@/lib/api';
import type { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const statusOptions: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'همه وضعیت ها' },
  { value: 'DRAFT', label: 'پیش نویس' },
  { value: 'CONFIRMED', label: 'تایید شد' },
  { value: 'IN_PRODUCTION', label: 'در تولید' },
  { value: 'READY', label: 'آماده است' },
  { value: 'SHIPPED', label: 'رسال شد' },
  { value: 'DELIVERED', label: 'تحویل داده شد' },
  { value: 'CANCELLED', label: 'لغو شد' },
];

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { search, status: statusFilter, page }],
    queryFn: () =>
      ordersApi.list({
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 10,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    },
  });

  const orders = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleDelete = (order: Order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">سفارشات</h1>
          <p className="text-muted-foreground mt-1">
            مدیریت سفارشات مشتریان و پیگیری وضعیت آنها
          </p>
        </div>
        {hasPermission('orders:write') && (
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="w-4 h-4 mr-2" />
              سفارش جدید
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="جستجوی سفارشات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OrderStatus | 'ALL')}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>سفارش دهید #</th>
                  <th>مشتری</th>
                  <th>وضعیت</th>
                  <th>موارد</th>
                  <th>مجموع</th>
                  <th>تاریخ</th>
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
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <p className="text-muted-foreground">هیچ سفارشی یافت نشد</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td>
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono text-sm font-medium text-electric-400 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{order.customer?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer?.country}
                          </p>
                        </div>
                      </td>
                      <td>
                        <Badge className={cn('capitalize', getStatusColor(order.status))}>
                          {order.status.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </td>
                      <td>{order.items?.length || 0} items</td>
                      <td className="font-medium">
                        {formatCurrency(order.total, order.currency)}
                      </td>
                      <td className="text-muted-foreground">
                        {formatDate(order.createdAt)}
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
                                <Link href={`/orders/${order.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  مشاهده جزئیات
                                </Link>
                              </DropdownMenuItem>
                              {hasPermission('orders:write') && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/orders/${order.id}/edit`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    ویرایش کنید
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/documents?orderId=${order.id}`}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  اسناد
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                صادرات
                              </DropdownMenuItem>
                              {hasPermission('orders:delete') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-danger-400"
                                    onClick={() => handleDelete(order)}
                                  >
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, pagination.total)} of{' '}
                {pagination.total} orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سفارش را حذف کنید</DialogTitle>
            <DialogDescription>
              آیا از حذف سفارش مطمئن هستید؟{' '}
              <span className="font-mono font-medium">{orderToDelete?.orderNumber}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              لغو کنید
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              loading={deleteMutation.isPending}
            >
              حذف کنید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
