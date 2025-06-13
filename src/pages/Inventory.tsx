import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useGarage } from '@/contexts/GarageContext';

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  min_stock_level: number;
  unit_price: number;
  supplier: string;
  garage_id?: string;
  created_at?: string;
}

// Function to convert database items to InventoryItem format
const convertToInventoryItem = (item: any): InventoryItem => {
  return {
    id: item.id,
    item_name: item.item_name || '',
    quantity: item.quantity || 0,
    min_stock_level: item.min_stock_level || 0,
    unit_price: item.unit_price || 0,
    supplier: item.supplier || '',
    garage_id: item.garage_id || '',
    created_at: item.created_at || new Date().toISOString()
  };
};

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<InventoryItem>({
    id: '',
    item_name: '',
    quantity: 0,
    min_stock_level: 10,
    unit_price: 0,
    supplier: '',
    garage_id: '',
    created_at: '',
  });
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const { currentGarage, loading: garageLoading } = useGarage();

  useEffect(() => {
    if (!garageLoading && currentGarage) {
      fetchInventory();
    }
  }, [currentGarage, garageLoading]);

  useEffect(() => {
    if (!currentGarage?.id) return;

    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'inventory',
          filter: `garage_id=eq.${currentGarage.id}`
        }, 
        () => {
          console.log('Inventory change detected, refreshing inventory');
          fetchInventory();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentGarage?.id]);

  const fetchInventory = async () => {
    if (!currentGarage?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('garage_id', currentGarage.id)
        .order('item_name');

      if (error) throw error;

      const inventoryItems: InventoryItem[] = data.map(convertToInventoryItem);
      setInventoryItems(inventoryItems);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addInventoryItem = async () => {
    if (!newItem.item_name || newItem.unit_price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please provide item name and a valid price",
        variant: "destructive",
      });
      return;
    }

    if (!currentGarage?.id) {
      toast({
        title: "Error",
        description: "No garage selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemToInsert = {
        item_name: newItem.item_name,
        quantity: newItem.quantity,
        min_stock_level: newItem.min_stock_level,
        unit_price: newItem.unit_price,
        supplier: newItem.supplier,
        garage_id: currentGarage.id
      };

      console.log('Inserting inventory item:', itemToInsert);

      const { data, error } = await supabase
        .from('inventory')
        .insert(itemToInsert)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });

      setNewItem({
        id: '',
        item_name: '',
        quantity: 0,
        min_stock_level: 10,
        unit_price: 0,
        supplier: '',
        garage_id: '',
        created_at: '',
      });

      fetchInventory();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleNumberChange = (name: string, value: number) => {
    setNewItem(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Filter inventory items based on search query
  const filteredItems = inventoryItems.filter(item => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (garageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentGarage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Garage Found</h2>
          <p className="text-muted-foreground">Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Manage your inventory items and stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <Input
              type="search"
              placeholder="Search inventory..."
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Min. Stock Level</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading inventory...</TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No inventory items found.</TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.min_stock_level}</TableCell>
                    <TableCell>{item.unit_price}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Fill in the details for the new inventory item
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_name">Item Name</Label>
                <Input
                  id="item_name"
                  name="item_name"
                  value={newItem.item_name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="unit_price">Unit Price</Label>
                <Input
                  id="unit_price"
                  type="number"
                  name="unit_price"
                  value={newItem.unit_price}
                  onChange={(e) => handleNumberChange('unit_price', parseFloat(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  value={newItem.supplier}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  name="quantity"
                  value={newItem.quantity}
                  onChange={(e) => handleNumberChange('quantity', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="min_stock_level">Min. Stock Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  name="min_stock_level"
                  value={newItem.min_stock_level}
                  onChange={(e) => handleNumberChange('min_stock_level', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={addInventoryItem}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
