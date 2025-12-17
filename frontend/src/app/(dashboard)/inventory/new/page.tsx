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
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['RAW_MATERIAL', 'COMPONENT', 'FINISHED_GOOD', 'PACKAGING']),
  category: z.string().min(1, 'Category is required'),
  quantity: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(0),
  maxStock: z.coerce.number().min(0).optional(),
  reorderPoint: z.coerce.number().min(0).default(10),
  unitCost: z.coerce.number().min(0, 'Unit cost must be positive'),
  currency: z.string().default('USD'),
  unit: z.string().default('PCS'),
  weight: z.coerce.number().min(0).optional(),
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
        title: 'Success',
        description: 'Inventory item created successfully',
      });
      router.push('/inventory');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create inventory item',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: InventoryFormData) => {
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
            <Link href="/inventory">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Inventory Item</h1>
            <p className="text-muted-foreground mt-1">Create a new inventory item</p>
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
                  Basic Information
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
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Resistor 100Ω"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description"
                    {...register('description')}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      onValueChange={(value) => setValue('type', value as any)}
                      defaultValue="RAW_MATERIAL"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RAW_MATERIAL">Raw Material</SelectItem>
                        <SelectItem value="COMPONENT">Component</SelectItem>
                        <SelectItem value="FINISHED_GOOD">Finished Good</SelectItem>
                        <SelectItem value="PACKAGING">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Electronics"
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
                <CardTitle>Stock Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Current Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      error={errors.quantity?.message}
                      {...register('quantity')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      placeholder="PCS, KG, M, L"
                      {...register('unit')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Min Stock</Label>
                    <Input
                      id="minStock"
                      type="number"
                      placeholder="0"
                      {...register('minStock')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStock">Max Stock</Label>
                    <Input
                      id="maxStock"
                      type="number"
                      placeholder="Optional"
                      {...register('maxStock')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderPoint">Reorder Point</Label>
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
                <CardTitle>Pricing & Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="unitCost">Unit Cost *</Label>
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
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      placeholder="USD"
                      {...register('currency')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (optional)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      {...register('weight')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions (LxWxH)</Label>
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
                <CardTitle>Supplier & Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier</Label>
                  <Select onValueChange={(value) => setValue('supplierId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
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
                  <Label htmlFor="warehouseZone">Warehouse Zone</Label>
                  <Input
                    id="warehouseZone"
                    placeholder="e.g., A-1"
                    {...register('warehouseZone')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="binLocation">Bin Location</Label>
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
                <CardTitle>Import/Export Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hsCode">HS Code</Label>
                  <Input
                    id="hsCode"
                    placeholder="e.g., 8541.10.00"
                    {...register('hsCode')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryOfOrigin">Country of Origin</Label>
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
                  Create Inventory Item
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/inventory')}
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
