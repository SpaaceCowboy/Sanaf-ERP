'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ordersApi, customersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';

const orderItemSchema = z.object({
  productName: z.string().min(1, 'نام محصول الزامی است'),
  productCode: z.string().min(1, 'کد محصول مورد نیاز است'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, 'تعداد باید حداقل ۱ باشد'),
  unitPrice: z.coerce.number().min(0, 'قیمت واحد باید مثبت باشد'),
  hsCode: z.string().optional(),
});

const orderSchema = z.object({
  customerId: z.string().min(1, 'مشتری مورد نیاز است'),
  requiredDate: z.string().min(1, 'تاریخ مورد نیاز است'),
  shippingAddress: z.string().min(1, 'آدرس حمل و نقل الزامی است'),
  shippingCity: z.string().min(1, 'شهر حمل و نقل الزامی است'),
  shippingCountry: z.string().min(1, 'کشور حمل و نقل الزامی است'),
  shippingMethod: z.string().optional(),
  incoterms: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  shippingCost: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'حداقل یک مورد الزامی است'),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ['مشتریان'],
    queryFn: () => customersApi.list(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      taxRate: 0,
      shippingCost: 0,
      discount: 0,
      items: [{ productName: '', productCode: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const taxAmount = (subtotal * (watch('نرخ مالیات') || 0)) / 100;
  const totalAmount = subtotal + taxAmount + (watch('هزینه حمل و نقل') || 0) - (watch('تخفیف') || 0);

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      toast({
        title: 'موفقیت',
        description: 'سفارش با موفقیت ایجاد شد',
      });
      router.push('/orders');
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'ایجاد سفارش ناموفق بود',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    try {
      // Convert date to ISO datetime format and ensure numbers are proper types
      const formattedData = {
        ...data,
        requiredDate: new Date(data.requiredDate).toISOString(),
        taxRate: Number(data.taxRate),
        shippingCost: Number(data.shippingCost),
        discount: Number(data.discount),
        shippingMethod: data.shippingMethod || undefined,
        incoterms: data.incoterms || undefined,
        notes: data.notes || undefined,
        items: data.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          description: item.description || undefined,
          hsCode: item.hsCode || undefined,
        })),
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
            <Link href="/orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              برگشت
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ایجاد سفارش</h1>
            <p className="text-muted-foreground mt-1">ایجاد سفارش جدید مشتری</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Shipping */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  اطلاعات مشتری و حمل و نقل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">مشتری *</Label>
                  <Select onValueChange={(value) => setValue('customerId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.data?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.customerId && (
                    <p className="text-sm text-danger-400">{errors.customerId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredDate">تاریخ مورد نیاز *</Label>
                  <Input
                    id="requiredDate"
                    type="date"
                    error={errors.requiredDate?.message}
                    {...register('تاریخ مورد نیاز')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Shipping Address *</Label>
                  <Input
                    id="shippingAddress"
                    placeholder="آدرس خیابان"
                    error={errors.shippingAddress?.message}
                    {...register('shippingAddress')}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shippingCity">شهر *</Label>
                    <Input
                      id="shippingCity"
                      placeholder="شهر"
                      error={errors.shippingCity?.message}
                      {...register('shippingCity')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingCountry">کشور *</Label>
                    <Input
                      id="shippingCountry"
                      placeholder="کشور"
                      error={errors.shippingCountry?.message}
                      {...register('shippingCountry')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shippingMethod">روش حمل و نقل</Label>
                    <Input
                      id="shippingMethod"
                      placeholder="e.g., Air Freight"
                      {...register('shippingMethod')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incoterms">اینکوترمز</Label>
                    <Input
                      id="incoterms"
                      placeholder="e.g., FOB, CIF"
                      {...register('incoterms')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>سفارش اقلام</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      append({ productName: '', productCode: '', quantity: 1, unitPrice: 0 })
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    آیتم را اضافه کنید
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4 text-danger-400" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>نام محصول *</Label>
                        <Input
                          placeholder="نام محصول"
                          error={errors.items?.[index]?.productName?.message}
                          {...register(`items.${index}.productName`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>کد محصول *</Label>
                        <Input
                          placeholder="کد/SKU"
                          error={errors.items?.[index]?.productCode?.message}
                          {...register(`items.${index}.productCode`)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="توضیحات مورد"
                        {...register(`items.${index}.description`)}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          error={errors.items?.[index]?.quantity?.message}
                          {...register(`items.${index}.quantity`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>قیمت واحد *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          error={errors.items?.[index]?.unitPrice?.message}
                          {...register(`items.${index}.unitPrice`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>کد HS</Label>
                        <Input
                          placeholder="اختیاری"
                          {...register(`items.${index}.hsCode`)}
                        />
                      </div>
                    </div>

                    <div className="text-right text-sm text-muted-foreground">
                      مجموع: ${((items[index]?.quantity || 0) * (items[index]?.unitPrice || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
                {errors.items?.root && (
                  <p className="text-sm text-danger-400">{errors.items.root.message}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>قیمت گذاری</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">نرخ مالیات (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0"
                    {...register('taxRate')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingCost">هزینه حمل و نقل</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('shippingCost')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">تخفیف</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('discount')}
                  />
                </div>

                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>جمع فرعی:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>مالیات:</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>حمل و نقل:</span>
                    <span>${(watch('shippingCost') || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>تخفیف:</span>
                    <span>-${(watch('discount') || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>مجموع:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>یادداشت ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">یادداشت های اضافی</Label>
                  <Input
                    id="notes"
                    placeholder="یادداشت های اختیاری"
                    {...register('notes')}
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
                  ایجاد سفارش
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/orders')}
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
