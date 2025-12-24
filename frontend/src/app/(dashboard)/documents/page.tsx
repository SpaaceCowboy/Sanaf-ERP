'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  FileText,
  FileCheck,
  FileClock,
  Receipt,
  Package,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { documentsApi } from '@/lib/api';
import type { Document, DocumentType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn, formatDate, formatRelativeTime, downloadBlob } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const documentTypes: { value: DocumentType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'INVOICE',
    label: 'فاکتور',
    icon: <Receipt className="w-5 h-5" />,
    description: 'Standard commercial invoice',
  },
  {
    value: 'PROFORMA_INVOICE',
    label: 'فاکتور پروفرما',
    icon: <FileClock className="w-5 h-5" />,
    description: 'Preliminary invoice before shipment',
  },
  {
    value: 'PACKING_LIST',
    label: 'لیست بسته بندی',
    icon: <Package className="w-5 h-5" />,
    description: 'Detailed list of package contents',
  },
  {
    value: 'COMMERCIAL_INVOICE',
    label: 'فاکتور تجاری',
    icon: <FileCheck className="w-5 h-5" />,
    description: 'For customs and export purposes',
  },
  {
    value: 'EXPORT_DECLARATION',
    label: 'اعلامیه صادرات',
    icon: <Globe className="w-5 h-5" />,
    description: 'Official export documentation',
  },
  {
    value: 'CERTIFICATE_OF_ORIGIN',
    label: 'گواهی مبدا',
    icon: <FileText className="w-5 h-5" />,
    description: 'Product origin certification',
  },
];

const typeColors: Record<DocumentType, string> = {
  INVOICE: 'bg-electric-950/50 text-electric-300 border-electric-800/50',
  PROFORMA_INVOICE: 'bg-circuit-950/50 text-circuit-300 border-circuit-800/50',
  PACKING_LIST: 'bg-volt-950/50 text-volt-300 border-volt-800/50',
  COMMERCIAL_INVOICE: 'bg-electric-900/50 text-electric-200 border-electric-700/50',
  EXPORT_DECLARATION: 'bg-carbon-700 text-carbon-200 border-carbon-600',
  CERTIFICATE_OF_ORIGIN: 'bg-circuit-800/50 text-circuit-200 border-circuit-700/50',
};

function GenerateDocumentDialog({ orderId }: { orderId?: string }) {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [open, setOpen] = useState(false);

  const generateMutation = useMutation({
    mutationFn: ({ orderId, type }: { orderId: string; type: string }) =>
      documentsApi.generate(orderId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setOpen(false);
      setSelectedType(null);
    },
  });

  const handleGenerate = () => {
    if (orderId && selectedType) {
      generateMutation.mutate({ orderId, type: selectedType });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          ایجاد سند
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ایجاد سند</DialogTitle>
          <DialogDescription>
            نوع سندی را برای تولید برای سفارش انتخاب شده انتخاب کنید
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {documentTypes.map((type) => (
            <div
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={cn(
                'p-4 rounded-lg border-2 cursor-pointer transition-all',
                selectedType === type.value
                  ? 'border-electric-500 bg-electric-950/30'
                  : 'border-border hover:border-electric-800/50'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', typeColors[type.value])}>
                  {type.icon}
                </div>
                <div>
                  <p className="font-medium">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            لغو کنید
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedType || !orderId}
            loading={generateMutation.isPending}
          >
            ایجاد کنید                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, type: typeFilter, page }],
    queryFn: () =>
      documentsApi.list({
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        page,
        limit: 10,
      }),
  });

  const documents = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await documentsApi.download(doc.id);
      downloadBlob(blob, doc.filename);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">اسناد</h1>
          <p className="text-muted-foreground mt-1">
            ایجاد و مدیریت اسناد و فاکتورهای صادراتی
          </p>
        </div>
        {hasPermission('documents:write') && (
          <GenerateDocumentDialog />
        )}
      </div>

      {/* Document Type Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {documentTypes.map((type, index) => (
          <motion.div
            key={type.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={cn(
                'cursor-pointer transition-all hover:border-electric-800/50',
                typeFilter === type.value && 'border-electric-500'
              )}
              onClick={() =>
                setTypeFilter(typeFilter === type.value ? 'ALL' : type.value)
              }
            >
              <CardContent className="p-4 text-center">
                <div className={cn('p-3 rounded-lg inline-flex mb-2', typeColors[type.value])}>
                  {type.icon}
                </div>
                <p className="text-sm font-medium">{type.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="جستجوی اسناد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as DocumentType | 'ALL')}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">همه انواع</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>سند</th>
                  <th>انواع</th>
                  <th>سفارش </th>
                  <th>تولید شده توسط</th>
                  <th>تاریخ</th>
                  <th className="text-right">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6}>
                        <div className="h-12 bg-muted/50 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">هیچ سندی یافت نشد</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        برای مشاهده اسناد از سفارشات، آنها را اینجا ایجاد کنید
                      </p>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, index) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg', typeColors[doc.type])}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium font-mono text-sm">
                              {doc.documentNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">{doc.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge className={cn('text-xs', typeColors[doc.type])}>
                          {doc.type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td>
                        {doc.order ? (
                          <span className="font-mono text-sm text-electric-400">
                            {doc.order.orderNumber}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span className="text-sm">{doc.generatedBy?.name}</span>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm">{formatDate(doc.createdAt)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(doc.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {hasPermission('documents:write') && (
                            <Button variant="ghost" size="icon-sm">
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          {hasPermission('documents:delete') && (
                            <Button variant="ghost" size="icon-sm" className="text-danger-400">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
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
                {pagination.total} documents
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
