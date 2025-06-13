
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NumberInput from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobCardPart } from '@/types/jobCard';
import { formatIndianCurrency } from '@/lib/utils';
import { useOptimizedInventory } from '@/hooks/useOptimizedInventory';
import { X, Plus, Loader2 } from 'lucide-react';

interface JobCardPartsEnhancedProps {
  parts: JobCardPart[];
  onChange: (parts: JobCardPart[]) => void;
}

const JobCardPartsEnhanced = ({ parts, onChange }: JobCardPartsEnhancedProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Fetch only available inventory items (stock > 0) and make it live
  const { data: inventoryData, isLoading: inventoryLoading, refetch: refetchInventory } = useOptimizedInventory({
    enabled: true,
    limit: 100,
    availableOnly: true, // Only show items with stock > 0
    // No staleTime, always fresh data
  });

  const inventoryItems = inventoryData?.data || [];

  const addNewPart = () => {
    const newPart: JobCardPart = {
      id: Date.now().toString(),
      inventoryId: '',
      name: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      inStock: false,
      addedToPurchaseList: false,
    };
    onChange([...parts, newPart]);
    setEditingIndex(parts.length);
  };

  const updatePart = (index: number, field: keyof JobCardPart, value: string | number | boolean) => {
    const updatedParts = [...parts];
    const part = { ...updatedParts[index] };
    
    if (field === 'inventoryId') {
      const stringValue = value as string;
      if (stringValue === 'custom' || stringValue === '') {
        // Custom part
        part.inventoryId = stringValue;
        part.inStock = false;
        part.name = stringValue === 'custom' ? part.name : '';
        part.unitPrice = stringValue === 'custom' ? part.unitPrice : 0;
      } else {
        // Inventory item selected
        const selectedItem = inventoryItems.find(item => item.id === stringValue);
        if (selectedItem) {
          part.inventoryId = stringValue;
          part.name = selectedItem.item_name;
          part.unitPrice = selectedItem.unit_price;
          part.inStock = true;
        }
      }
    } else {
      (part as any)[field] = value;
    }
    
    // Recalculate total
    part.total = (part.quantity || 0) * (part.unitPrice || 0);
    
    updatedParts[index] = part;
    onChange(updatedParts);
  };

  const removePart = (index: number) => {
    const updatedParts = parts.filter((_, i) => i !== index);
    onChange(updatedParts);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleInventoryDropdownOpen = (open: boolean) => {
    if (open) {
      // Always refetch inventory when dropdown opens to ensure live data
      console.log('Refetching live inventory data...');
      refetchInventory();
    }
  };

  const totalPartsValue = parts.reduce((sum, part) => sum + (part.total || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parts & Materials</CardTitle>
        <CardDescription>
          Add parts and materials used for this job (showing only available stock)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {parts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No parts added yet</p>
            <Button onClick={addNewPart} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add First Part
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {parts.map((part, index) => (
              <div key={part.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Part Source</Label>
                      <Select
                        value={part.inventoryId || ''}
                        onValueChange={(value) => updatePart(index, 'inventoryId', value)}
                        onOpenChange={handleInventoryDropdownOpen}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={inventoryLoading ? "Loading available inventory..." : "Select from available stock or add custom"} />
                          {inventoryLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50 max-h-[300px] overflow-y-auto">
                          <SelectItem value="custom">Custom Part (Not in inventory)</SelectItem>
                          {inventoryLoading ? (
                            <SelectItem value="loading" disabled>Loading available inventory...</SelectItem>
                          ) : inventoryItems.length === 0 ? (
                            <SelectItem value="no-items" disabled>No items available in stock</SelectItem>
                          ) : (
                            inventoryItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{item.item_name}</span>
                                  <div className="flex items-center gap-2 ml-4">
                                    <span className="text-muted-foreground">₹{item.unit_price}</span>
                                    <Badge variant={item.quantity > item.min_stock_level ? "secondary" : "destructive"} className="text-xs">
                                      {item.quantity} available
                                    </Badge>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {(part.inventoryId === 'custom' || part.inventoryId === '') && (
                      <div className="space-y-2">
                        <Label>Part Name</Label>
                        <Input
                          value={part.name}
                          onChange={(e) => updatePart(index, 'name', e.target.value)}
                          placeholder="Enter custom part name"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePart(index)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {part.inventoryId && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <NumberInput
                        value={part.quantity}
                        onValueChange={(value) => updatePart(index, 'quantity', value)}
                        min={1}
                        placeholder="Quantity"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price (₹)</Label>
                      <NumberInput
                        value={part.unitPrice}
                        onValueChange={(value) => updatePart(index, 'unitPrice', value)}
                        min={0}
                        allowDecimals={true}
                        placeholder="Unit price"
                        disabled={part.inventoryId !== 'custom' && part.inventoryId !== ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Total</Label>
                      <div className="p-2 bg-muted rounded-md">
                        {formatIndianCurrency(part.total || 0)}
                      </div>
                    </div>
                  </div>
                )}

                {part.inStock && (
                  <Badge variant="secondary" className="w-fit">
                    Available in inventory
                  </Badge>
                )}
                
                {part.inventoryId === 'custom' && part.name && (
                  <Badge variant="outline" className="w-fit">
                    Custom part - will be added to purchase list
                  </Badge>
                )}
              </div>
            ))}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button onClick={addNewPart} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Part
              </Button>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Parts Cost</div>
                <div className="text-lg font-semibold">
                  {formatIndianCurrency(totalPartsValue)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobCardPartsEnhanced;
