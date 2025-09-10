import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, ShoppingCart, Printer, Trash2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
  profit: number;
}

const Sales = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id)
        .gt('quantity', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل المنتجات',
        variant: 'destructive'
      });
    }
  };

  const addToCart = () => {
    if (!selectedProduct || !quantity) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(quantity);
    if (qty > product.quantity) {
      toast({
        title: 'خطأ',
        description: 'الكمية المطلوبة أكبر من المتوفر',
        variant: 'destructive'
      });
      return;
    }

    const existingItem = cart.find(item => item.product.id === selectedProduct);
    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (newQty > product.quantity) {
        toast({
          title: 'خطأ',
          description: 'إجمالي الكمية أكبر من المتوفر',
          variant: 'destructive'
        });
        return;
      }
      
      setCart(cart.map(item => 
        item.product.id === selectedProduct
          ? {
              ...item,
              quantity: newQty,
              total: newQty * product.selling_price,
              profit: newQty * (product.selling_price - product.purchase_price)
            }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: qty,
        total: qty * product.selling_price,
        profit: qty * (product.selling_price - product.purchase_price)
      }]);
    }

    setSelectedProduct('');
    setQuantity('1');
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product || newQuantity > product.quantity) return;

    setCart(cart.map(item => 
      item.product.id === productId
        ? {
            ...item,
            quantity: newQuantity,
            total: newQuantity * product.selling_price,
            profit: newQuantity * (product.selling_price - product.purchase_price)
          }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getTotals = () => {
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const profit = cart.reduce((sum, item) => sum + item.profit, 0);
    return { total, profit };
  };

  const completeSale = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      // Generate invoice number
      const { data: invoiceData, error: invoiceError } = await supabase
        .rpc('generate_invoice_number');

      if (invoiceError) throw invoiceError;

      const { total, profit } = getTotals();
      
      // Create sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          invoice_number: invoiceData,
          total_amount: total,
          profit: profit,
          user_id: user?.id
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        total_price: item.total,
        profit: item.profit
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product quantities
      for (const item of cart) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            quantity: item.product.quantity - item.quantity 
          })
          .eq('id', item.product.id);

        if (updateError) throw updateError;
      }

      setLastInvoice({
        ...saleData,
        items: cart,
        created_at: new Date().toISOString()
      });

      setCart([]);
      fetchProducts(); // Refresh products to update quantities

      toast({
        title: 'تم البيع',
        description: `تم إتمام البيع بنجاح - فاتورة رقم ${invoiceData}`
      });

    } catch (error) {
      console.error('Error completing sale:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في إتمام البيع',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = () => {
    if (!lastInvoice) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const { total, profit } = getTotals();
    const now = new Date();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>فاتورة ${lastInvoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
            .header { text-align: center; margin-bottom: 20px; }
            .invoice-details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            .totals { margin-top: 20px; }
            .total-row { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>StoreManager Pro</h1>
            <h2>فاتورة بيع</h2>
          </div>
          
          <div class="invoice-details">
            <p><strong>رقم الفاتورة:</strong> ${lastInvoice.invoice_number}</p>
            <p><strong>التاريخ:</strong> ${now.toLocaleDateString('ar-EG')}</p>
            <p><strong>الوقت:</strong> ${now.toLocaleTimeString('ar-EG')}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${lastInvoice.items.map((item: CartItem) => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.product.selling_price} ج.م</td>
                  <td>${item.total} ج.م</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <p class="total-row"><strong>الإجمالي: ${total} ج.م</strong></p>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <p>شكراً لتعاملكم معنا</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const { total, profit } = getTotals();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">المبيعات</h1>
          <p className="text-muted-foreground">إدارة مبيعات متجرك</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add to Cart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>إضافة منتج للبيع</CardTitle>
                <CardDescription>اختر المنتج والكمية المطلوبة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>المنتج</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر منتج" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.selling_price} ج.م (متوفر: {product.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الكمية</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button onClick={addToCart} className="w-full">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cart */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>سلة المبيعات</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد منتجات في السلة
                  </p>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المنتج</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>سعر الوحدة</TableHead>
                          <TableHead>الإجمالي</TableHead>
                          <TableHead>الربح</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.product.id}>
                            <TableCell className="font-medium">
                              {item.product.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                                  disabled={item.quantity >= item.product.quantity}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>{item.product.selling_price} ج.م</TableCell>
                            <TableCell>{item.total} ج.م</TableCell>
                            <TableCell className="text-green-600">
                              {item.profit.toFixed(2)} ج.م
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">
                          الإجمالي: {total.toFixed(2)} ج.م
                        </p>
                        <p className="text-sm text-green-600">
                          صافي الربح: {profit.toFixed(2)} ج.م
                        </p>
                      </div>
                      <Button onClick={completeSale} disabled={loading || cart.length === 0}>
                        <ShoppingCart className="h-4 w-4 ml-2" />
                        {loading ? 'جاري الحفظ...' : 'إتمام البيع'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Last Invoice */}
          <div>
            {lastInvoice && (
              <Card>
                <CardHeader>
                  <CardTitle>آخر فاتورة</CardTitle>
                  <CardDescription>
                    فاتورة رقم {lastInvoice.invoice_number}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">التاريخ والوقت</Label>
                    <p className="font-medium">
                      {new Date(lastInvoice.created_at).toLocaleString('ar-EG')}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">المنتجات</Label>
                    <div className="space-y-2 mt-2">
                      {lastInvoice.items.map((item: CartItem) => (
                        <div key={item.product.id} className="flex justify-between text-sm">
                          <span>{item.product.name}</span>
                          <span>{item.quantity} × {item.product.selling_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>الإجمالي:</span>
                      <span className="font-bold">{lastInvoice.total_amount} ج.م</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>صافي الربح:</span>
                      <span className="font-bold">{lastInvoice.profit} ج.م</span>
                    </div>
                  </div>

                  <Button onClick={printInvoice} variant="outline" className="w-full">
                    <Printer className="h-4 w-4 ml-2" />
                    طباعة الفاتورة
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Sales;