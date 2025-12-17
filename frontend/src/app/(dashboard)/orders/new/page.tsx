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
  productName: z.string().min(1, 'Product name is required'),
  productCode: z.string().min(1, 'Product code is required'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be positive'),
  hsCode: z.string().optional(),
});

const orderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  requiredDate: z.string().min(1, 'Required date is required'),
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  shippingCity: z.string().min(1, 'Shipping city is required'),
  shippingCountry: z.string().min(1, 'Shipping country is required'),
  shippingMethod: z.string().optional(),
  incoterms: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  shippingCost: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ['customers'],
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
  const taxAmount = (subtotal * (watch('taxRate') || 0)) / 100;
  const totalAmount = subtotal + taxAmount + (watch('shippingCost') || 0) - (watch('discount') || 0);

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Order created successfully',
      });
      router.push('/orders');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create order',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
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
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Order</h1>
            <p className="text-muted-foreground mt-1">Create a new customer order</p>
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
                  Customer & Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer *</Label>
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
                  <Label htmlFor="requiredDate">Required Date *</Label>
                  <Input
                    id="requiredDate"
                    type="date"
                    error={errors.requiredDate?.message}
                    {...register('requiredDate')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Shipping Address *</Label>
                  <Input
                    id="shippingAddress"
                    placeholder="Street address"
                    error={errors.shippingAddress?.message}
                    {...register('shippingAddress')}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shippingCity">City *</Label>
                    <Input
                      id="shippingCity"
                      placeholder="City"
                      error={errors.shippingCity?.message}
                      {...register('shippingCity')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingCountry">Country *</Label>
                    <Input
                      id="shippingCountry"
                      placeholder="Country"
                      error={errors.shippingCountry?.message}
                      {...register('shippingCountry')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shippingMethod">Shipping Method</Label>
                    <Input
                      id="shippingMethod"
                      placeholder="e.g., Air Freight"
                      {...register('shippingMethod')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incoterms">Incoterms</Label>
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
                  <span>Order Items</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      append({ productName: '', productCode: '', quantity: 1, unitPrice: 0 })
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
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
                        <Label>Product Name *</Label>
                        <Input
                          placeholder="Product name"
                          error={errors.items?.[index]?.productName?.message}
                          {...register(`items.${index}.productName`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Product Code *</Label>
                        <Input
                          placeholder="SKU/Code"
                          error={errors.items?.[index]?.productCode?.message}
                          {...register(`items.${index}.productCode`)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="Item description"
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
                        <Label>Unit Price *</Label>
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
                        <Label>HS Code</Label>
                        <Input
                          placeholder="Optional"
                          {...register(`items.${index}.hsCode`)}
                        />
                      </div>
                    </div>

                    <div className="text-right text-sm text-muted-foreground">
                      Total: ${((items[index]?.quantity || 0) * (items[index]?.unitPrice || 0)).toFixed(2)}
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
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
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
                  <Label htmlFor="shippingCost">Shipping Cost</Label>
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
                  <Label htmlFor="discount">Discount</Label>
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
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>${(watch('shippingCost') || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span>-${(watch('discount') || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>Total:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Optional notes"
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
                  Create Order
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/orders')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
