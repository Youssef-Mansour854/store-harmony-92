import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Edit, Trash2, Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  min_quantity: number;
  created_at: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل المنتجات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== id));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المنتج بنجاح'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حذف المنتج',
        variant: 'destructive'
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.quantity <= p.min_quantity);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري تحميل المنتجات...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">المنتجات</h1>
            <p className="text-muted-foreground">إدارة منتجات متجرك</p>
          </div>
          <Link to="/products/add">
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </Link>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <AlertTriangle className="h-5 w-5 ml-2" />
                تنبيه: منتجات قاربت على النفاد
              </CardTitle>
              <CardDescription className="text-yellow-700">
                {lowStockProducts.length} منتج يحتاج إلى إعادة تموين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockProducts.map(product => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="font-medium">{product.name}</span>
                    <Badge variant="destructive">
                      {product.quantity} متبقي
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>البحث في المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المنتجات ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">لا توجد منتجات</p>
                <Link to="/products/add">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة أول منتج
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المنتج</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>سعر الشراء</TableHead>
                      <TableHead>سعر البيع</TableHead>
                      <TableHead>الربح المتوقع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <Badge variant={product.quantity <= product.min_quantity ? "destructive" : "secondary"}>
                            {product.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.purchase_price} ج.م</TableCell>
                        <TableCell>{product.selling_price} ج.م</TableCell>
                        <TableCell className="text-green-600">
                          {(product.selling_price - product.purchase_price).toFixed(2)} ج.م
                        </TableCell>
                        <TableCell>
                          {product.quantity <= product.min_quantity ? (
                            <Badge variant="destructive">نفد تقريباً</Badge>
                          ) : product.quantity > 50 ? (
                            <Badge variant="default">متوفر</Badge>
                          ) : (
                            <Badge variant="secondary">قليل</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link to={`/products/edit/${product.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Products;