'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { inventoryApi, suppliersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';

const inventorySchema = z.object({
  sku: z.string().min(1, 'SKU مورد نیاز است'),
  name: z.string().min(1, 'نام الزامی است'),
  description: z.string().optional(),
  type: z.enum(['RAW_MATERIAL', 'COMPONENT', 'FINISHED_GOOD', 'PACKAGING']),
  category: z.string().min(1, 'دسته بندی الزامی است'),
  quantity: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  maxStock: z.coerce.number().int().min(0).optional(),
  reorderPoint: z.coerce.number().int().min(0).default(10),
  unitCost: z.coerce.number().positive('هزینه واحد باید مثبت باشد'),
  currency: z.string().default('USD'),
  unit: z.string().default('PCS'),
  weight: z.coerce.number().positive().optional(),
  dimensions: z.string().optional(),
  hsCode: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  supplierId: z.string().optional(),
  warehouseZone: z.string().optional(),
  binLocation: z.string().optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

export default function NewInventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      type: 'RAW_MATERIAL',
      currency: 'USD',
      unit: 'PCS',
      quantity: 0,
      minStock: 0,
      reorderPoint: 10,
    },
  });

  const createMutation = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => {
      toast({
        title: 'موفقیت',
        description: 'کالای موجودی با موفقیت ایجاد شد',
      });
      router.push('/inventory');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'ایجاد کالا در انبار ناموفق بود',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: InventoryFormData) => {
    setIsSubmitting(true);
    try {
      // Ensure all numbers are proper types and remove empty optional fields
      const formattedData = {
        ...data,
        quantity: Number(data.quantity),
        minStock: Number(data.minStock),
        maxStock: data.maxStock ? Number(data.maxStock) : undefined,
        reorderPoint: Number(data.reorderPoint),
        unitCost: Number(data.unitCost),
        weight: data.weight && Number(data.weight) > 0 ? Number(data.weight) : undefined,
        supplierId: data.supplierId || undefined,
        description: data.description || undefined,
        dimensions: data.dimensions || undefined,
        hsCode: data.hsCode || undefined,
        countryOfOrigin: data.countryOfOrigin || undefined,
        warehouseZone: data.warehouseZone || undefined,
        binLocation: data.binLocation || undefined,
      };
      await createMutation.mutateAsync(formattedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/inventory">
              <ArrowLeft className="w-4 h-4 mr-2" />
              برگشت
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">افزودن کالا به موجودی</h1>
            <p className="text-muted-foreground mt-1">یک کالای موجودی جدید ایجاد کنید</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  اطلاعات پایه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      placeholder="e.g., SKU-001"
                      error={errors.sku?.message}
                      {...register('sku')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">نام مورد *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Resistor 100Ω"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">توضیحات</Label>
                  <Input
                    id="description"
                    placeholder="شرح مختصر"
                    {...register('description')}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">انواع *</Label>
                    <Select
                      onValueChange={(value) => setValue('type', value as any)}
                      defaultValue="RAW_MATERIAL"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RAW_MATERIAL">مواد خام</SelectItem>
                        <SelectItem value="COMPONENT">جزء</SelectItem>
                        <SelectItem value="FINISHED_GOOD">تمام شد</SelectItem>
                        <SelectItem value="PACKAGING">بسته بندی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">دسته بندی *</Label>
                    <Input
                      id="category"
                      placeholder="به عنوان مثال، الکترونیک"
                      error={errors.category?.message}
                      {...register('category')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Information */}
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات انبار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">مقدار فعلی</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      error={errors.quantity?.message}
                      {...register('quantity')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">واحد</Label>
                    <Input
                      id="unit"
                      placeholder="PCS, KG, M, L"
                      {...register('unit')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="minStock">حداقل سهام</Label>
                    <Input
                      id="minStock"
                      type="number"
                      placeholder="0"
                      {...register('minStock')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStock">حداکثر سهام</Label>
                    <Input
                      id="maxStock"
                      type="number"
                      placeholder="اختیاری"
                      {...register('maxStock')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderPoint">نقطه سفارش مجدد</Label>
                    <Input
                      id="reorderPoint"
                      type="number"
                      placeholder="10"
                      {...register('reorderPoint')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>قیمت و جزئیات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="unitCost">هزینه واحد *</Label>
                    <Input
                      id="unitCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      error={errors.unitCost?.message}
                      {...register('unitCost')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">ارز</Label>
                    <Input
                      id="currency"
                      placeholder="USD"
                      {...register('currency')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weight">وزن (اختیاری)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      {...register('weight')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">ابعاد (ارتفاع × عرض × طول)</Label>
                    <Input
                      id="dimensions"
                      placeholder="e.g., 10x5x3 cm"
                      {...register('dimensions')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Supplier & Location */}
            <Card>
              <CardHeader>
                <CardTitle>تامین کننده و مکان</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier</Label>
                  <Select onValueChange={(value) => setValue('supplierId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="تامین کننده را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.data?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouseZone">منطقه انبار</Label>
                  <Input
                    id="warehouseZone"
                    placeholder="e.g., A-1"
                    {...register('warehouseZone')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="binLocation">محل سطل</Label>
                  <Input
                    id="binLocation"
                    placeholder="e.g., A-1-001"
                    {...register('binLocation')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Import/Export */}
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات واردات/صادرات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hsCode">کد HS</Label>
                  <Input
                    id="hsCode"
                    placeholder="e.g., 8541.10.00"
                    {...register('hsCode')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryOfOrigin">کشور مبدا</Label>
                  <Input
                    id="countryOfOrigin"
                    placeholder="e.g., China"
                    {...register('countryOfOrigin')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  ایجاد کالا در انبار
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/inventory')}
                  disabled={isSubmitting}
                >
                  لغو کنید
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
