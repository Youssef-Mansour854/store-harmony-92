/*
  # إنشاء جداول نظام إدارة المتجر

  1. الجداول الجديدة
    - `products` - جدول المنتجات
      - `id` (uuid, primary key)
      - `name` (text) - اسم المنتج
      - `category` (text) - نوع المنتج
      - `quantity` (integer) - الكمية المتوفرة
      - `purchase_price` (decimal) - سعر الشراء
      - `selling_price` (decimal) - سعر البيع
      - `min_quantity` (integer) - الحد الأدنى للكمية (للتنبيهات)
      - `user_id` (uuid) - معرف المستخدم
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `sales` - جدول المبيعات
      - `id` (uuid, primary key)
      - `invoice_number` (text) - رقم الفاتورة
      - `total_amount` (decimal) - إجمالي المبلغ
      - `profit` (decimal) - صافي الربح
      - `user_id` (uuid) - معرف المستخدم
      - `created_at` (timestamp)

    - `sale_items` - جدول عناصر المبيعات
      - `id` (uuid, primary key)
      - `sale_id` (uuid) - معرف البيع
      - `product_id` (uuid) - معرف المنتج
      - `quantity` (integer) - الكمية المباعة
      - `unit_price` (decimal) - سعر الوحدة
      - `total_price` (decimal) - إجمالي السعر
      - `profit` (decimal) - الربح من هذا العنصر

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - إضافة سياسات للمستخدمين المصرح لهم فقط
*/

-- إنشاء جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'عام',
  quantity integer NOT NULL DEFAULT 0,
  purchase_price decimal(10,2) NOT NULL,
  selling_price decimal(10,2) NOT NULL,
  min_quantity integer NOT NULL DEFAULT 5,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء جدول المبيعات
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  profit decimal(10,2) NOT NULL DEFAULT 0,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- إنشاء جدول عناصر المبيعات
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  profit decimal(10,2) NOT NULL
);

-- تفعيل RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- سياسات المنتجات
CREATE POLICY "Users can view their own products"
  ON products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسات المبيعات
CREATE POLICY "Users can view their own sales"
  ON sales
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales"
  ON sales
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- سياسات عناصر المبيعات
CREATE POLICY "Users can view sale items for their sales"
  ON sale_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sale items for their sales"
  ON sale_items
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.user_id = auth.uid()
  ));

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- دالة لتحديث timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- دالة لتوليد رقم فاتورة تلقائي
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  invoice_num TEXT;
BEGIN
  SELECT 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         LPAD((COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-\d{8}-(\d+)') AS INTEGER)), 0) + 1)::TEXT, 4, '0')
  INTO invoice_num
  FROM sales 
  WHERE invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;