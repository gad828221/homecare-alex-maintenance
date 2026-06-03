-- إنشاء جدول إيصالات سحب الأجهزة
CREATE TABLE IF NOT EXISTS device_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    device_type TEXT NOT NULL,
    brand TEXT NOT NULL,
    problem_description TEXT,
    deposit_amount DECIMAL(10, 2) DEFAULT 0,
    device_condition TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة صلاحيات الوصول للجميع (Anon) كما هو متبع في المشروع
ALTER TABLE device_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon access" ON device_receipts FOR ALL USING (true) WITH CHECK (true);
