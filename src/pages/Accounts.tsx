import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, PlusCircle, TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGarage } from '@/contexts/GarageContext';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  garage_id: string;
}

const categoryOptions = {
  Income: ['Service', 'Parts Sale', 'Other'],
  Expense: ['Parts', 'Tools', 'Salary', 'Rent', 'Utilities', 'Other'],
};

const Accounts = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction>({
    id: '',
    date: new Date().toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    description: '',
    amount: 0,
    type: 'Income',
    category: '',
    garage_id: '',
  });
  const { toast } = useToast();
  const { currentGarage, loading: garageLoading } = useGarage();

  useEffect(() => {
    if (!garageLoading && currentGarage) {
      fetchTransactions();
    }
  }, [currentGarage, garageLoading]);

  const fetchTransactions = async () => {
    if (!currentGarage?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('garage_id', currentGarage.id) // Enforce garage isolation
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedTransactions: Transaction[] = (data || []).map(account => ({
        id: account.id,
        date: new Date(account.date).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        description: account.description || '',
        amount: account.amount || 0,
        type: account.type === 'income' ? 'Income' : 'Expense',
        category: account.description || 'Other',
        garage_id: account.garage_id,
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (transaction?: Transaction) => {
    if (transaction) {
      setCurrentTransaction(transaction);
      setIsEditing(true);
    } else {
      setCurrentTransaction({
        id: `T${String(transactions.length + 1).padStart(3, '0')}`,
        date: new Date().toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        description: '',
        amount: 0,
        type: 'Income',
        category: '',
        garage_id: currentGarage?.id || '',
      });
      setIsEditing(false);
    }
    setOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentTransaction(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (value: string, name: string) => {
    const updates: Partial<Transaction> = {
      [name]: value,
    };
    
    if (name === 'type') {
      updates.category = '';
    }
    
    setCurrentTransaction(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentGarage?.id) {
      toast({
        title: "Error",
        description: "No garage selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const accountData = {
        description: currentTransaction.description,
        amount: currentTransaction.amount,
        type: currentTransaction.type.toLowerCase() as 'income' | 'expense',
        garage_id: currentGarage.id, // Ensure garage association
        date: new Date().toISOString(),
      };

      if (isEditing) {
        // Only update if the transaction belongs to current garage
        const { error } = await supabase
          .from('accounts')
          .update(accountData)
          .eq('id', currentTransaction.id)
          .eq('garage_id', currentGarage.id); // Double-check garage ownership

        if (error) throw error;

        toast({
          title: "Transaction Updated",
          description: `Transaction ${currentTransaction.id} has been updated.`,
        });
      } else {
        const { error } = await supabase
          .from('accounts')
          .insert(accountData);

        if (error) throw error;

        toast({
          title: "Transaction Added",
          description: `${currentTransaction.type} transaction has been added.`,
        });
      }

      setOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to delete this transaction?`)) {
      try {
        // Only delete if it belongs to current garage
        const { error } = await supabase
          .from('accounts')
          .delete()
          .eq('id', id)
          .eq('garage_id', currentGarage?.id); // Double-check garage ownership

        if (error) throw error;

        toast({
          title: "Transaction Deleted",
          description: `Transaction has been removed from records.`,
          variant: "destructive",
        });

        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast({
          title: "Error",
          description: "Failed to delete transaction",
          variant: "destructive",
        });
      }
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  if (garageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentGarage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">No Garage Found</h2>
          <p className="text-gray-600">Please contact support if this issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Accounts</h1>
          <p className="text-gray-600">
            Manage financial transactions and track expenses and income.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{isEditing ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
              <DialogDescription className="text-gray-600">
                {isEditing
                  ? 'Update the transaction details.'
                  : 'Fill in the details to record a new transaction.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right text-gray-700">
                    Type
                  </Label>
                  <Select
                    onValueChange={(value) => handleSelectChange(value, 'type')}
                    value={currentTransaction.type}
                    required
                  >
                    <SelectTrigger className="col-span-3 bg-white border-gray-300">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="Income">Income</SelectItem>
                      <SelectItem value="Expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right text-gray-700">
                    Category
                  </Label>
                  <Select
                    onValueChange={(value) => handleSelectChange(value, 'category')}
                    value={currentTransaction.category}
                    required
                  >
                    <SelectTrigger className="col-span-3 bg-white border-gray-300">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      {categoryOptions[currentTransaction.type].map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right text-gray-700">
                    Description
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    value={currentTransaction.description}
                    onChange={handleChange}
                    className="col-span-3 bg-white border-gray-300"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right text-gray-700">
                    Amount ($)
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentTransaction.amount}
                    onChange={handleChange}
                    className="col-span-3 bg-white border-gray-300"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isEditing ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-700">Total Income</CardTitle>
            <div className="w-8 h-8 p-1 bg-green-100 rounded-md flex items-center justify-center text-green-700">
              <TrendingUp size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-700">Total Expenses</CardTitle>
            <div className="w-8 h-8 p-1 bg-red-100 rounded-md flex items-center justify-center text-red-700">
              <TrendingDown size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-700">Net Profit</CardTitle>
            <div className="w-8 h-8 p-1 bg-blue-100 rounded-md flex items-center justify-center text-blue-700">
              <DollarSign size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-gray-600">Loading transactions...</div>
      ) : (
        <div className="rounded-md border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-gray-700">ID</TableHead>
                <TableHead className="text-gray-700">Date</TableHead>
                <TableHead className="text-gray-700">Description</TableHead>
                <TableHead className="text-gray-700">Category</TableHead>
                <TableHead className="text-gray-700">Type</TableHead>
                <TableHead className="text-gray-700">Amount</TableHead>
                <TableHead className="text-right text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">{transaction.id}</TableCell>
                  <TableCell className="text-gray-700">{transaction.date}</TableCell>
                  <TableCell className="text-gray-700">{transaction.description}</TableCell>
                  <TableCell className="text-gray-700">{transaction.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        transaction.type === 'Income'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
                    ${transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDialog(transaction)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-600">
                    No transactions found for this garage.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Accounts;
