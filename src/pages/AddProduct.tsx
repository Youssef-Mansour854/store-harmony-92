import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Save } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const categories = [
  'مواد غذائية',
  'مشروبات',
  'منظفات',
  'أدوات منزلية',
  'مستحضرات تجميل',
  'أدوية',
  'ملابس',
  'إلكترونيات',
  'أخرى'
];

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    purchase_price: '',
    selling_price: '',
    min_quantity: '5'
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert([
          {
            name: formData.name,
            category: formData.category,
            quantity: parseInt(formData.quantity),
            purchase_price: parseFloat(formData.purchase_price),
            selling_price: parseFloat(formData.selling_price),
            min_quantity: parseInt(formData.min_quantity),
            user_id: user.id
          }
        ]);

      if (error) throw error;

      toast({
        title: 'تم الحفظ',
        description: 'تم إضافة المنتج بنجاح'
      });

      navigate('/products');
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في إضافة المنتج',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const profit = formData.selling_price && formData.purchase_price 
    ? (parseFloat(formData.selling_price) - parseFloat(formData.purchase_price)).toFixed(2)
    : '0';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/products')}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">إضافة منتج جديد</h1>
            <p className="text-muted-foreground">أضف منتج جديد إلى مخزونك</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>بيانات المنتج</CardTitle>
                <CardDescription>أدخل تفاصيل المنتج الجديد</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">اسم المنتج *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="مثال: أرز العلالي 5 كيلو"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">نوع المنتج *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">الكمية المتوفرة *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        placeholder="100"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_quantity">الحد الأدنى للكمية</Label>
                      <Input
                        id="min_quantity"
                        type="number"
                        min="1"
                        value={formData.min_quantity}
                        onChange={(e) => handleInputChange('min_quantity', e.target.value)}
                        placeholder="5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchase_price">سعر الشراء (ج.م) *</Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.purchase_price}
                        onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                        placeholder="25.50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="selling_price">سعر البيع (ج.م) *</Label>
                      <Input
                        id="selling_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.selling_price}
                        onChange={(e) => handleInputChange('selling_price', e.target.value)}
                        placeholder="30.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/products')}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={loading}>
                      <Save className="h-4 w-4 ml-2" />
                      {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>معاينة المنتج</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">اسم المنتج</Label>
                  <p className="font-medium">{formData.name || 'غير محدد'}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">النوع</Label>
                  <p className="font-medium">{formData.category || 'غير محدد'}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">الكمية</Label>
                  <p className="font-medium">{formData.quantity || '0'} قطعة</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">سعر الشراء</Label>
                    <p className="font-medium">{formData.purchase_price || '0'} ج.م</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">سعر البيع</Label>
                    <p className="font-medium">{formData.selling_price || '0'} ج.م</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <Label className="text-sm text-muted-foreground">الربح المتوقع</Label>
                  <p className="font-bold text-green-600">{profit} ج.م</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddProduct;