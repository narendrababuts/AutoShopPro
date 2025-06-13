
-- Complete promotions database setup
-- Run this in your Supabase SQL editor to create all promotions tables

-- Create promotions_settings table
CREATE TABLE IF NOT EXISTS public.promotions_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_interval_months INTEGER NOT NULL DEFAULT 3,
  enable_service_reminder BOOLEAN NOT NULL DEFAULT true,
  reminder_message_template TEXT DEFAULT 'Hi {{customerName}}, your vehicle {{vehicle.make}} {{vehicle.model}} service is due. Please contact us to schedule a service appointment.',
  enable_promotional_offers BOOLEAN NOT NULL DEFAULT true,
  promotional_offers JSONB DEFAULT '[]'::JSONB,
  membership_point_value INTEGER NOT NULL DEFAULT 10,
  tenant_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create service_reminders table
CREATE TABLE IF NOT EXISTS public.service_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tenant_id TEXT
);

-- Create loyalty_points table
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  job_card_id UUID REFERENCES public.job_cards(id) ON DELETE SET NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tenant_id TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_reminders_status ON public.service_reminders(status);
CREATE INDEX IF NOT EXISTS idx_service_reminders_due_date ON public.service_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_service_reminders_customer_id ON public.service_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_reminders_tenant_id ON public.service_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_total_points ON public.loyalty_points(total_points);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tenant_id ON public.loyalty_points(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_settings_tenant_id ON public.promotions_settings(tenant_id);

-- Add unique constraint to prevent duplicate loyalty records per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_points_unique_customer 
ON public.loyalty_points(customer_id, tenant_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.promotions_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations on promotions_settings" ON public.promotions_settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on service_reminders" ON public.service_reminders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on loyalty_points" ON public.loyalty_points
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO public.promotions_settings (
  reminder_interval_months,
  enable_service_reminder,
  reminder_message_template,
  enable_promotional_offers,
  promotional_offers,
  membership_point_value
) VALUES (
  3,
  true,
  'Hi {{customerName}}, your vehicle {{vehicle.make}} {{vehicle.model}} service is due. Please contact us to schedule a service appointment.',
  true,
  '[{"title": "20% Off Oil Change", "description": "Get 20% off your next oil change service. Valid for all vehicle types.", "valid_until": "2024-12-31T23:59:59.000Z"}]'::JSONB,
  10
) ON CONFLICT DO NOTHING;

-- Create some sample service reminders based on existing completed job cards
INSERT INTO public.service_reminders (customer_id, job_card_id, due_date, status)
SELECT 
  COALESCE(customer_phone, customer_name) as customer_id,
  id as job_card_id,
  (COALESCE(actual_completion_date, job_date)::date + INTERVAL '3 months') as due_date,
  'pending' as status
FROM public.job_cards 
WHERE status = 'Completed' 
AND COALESCE(actual_completion_date, job_date)::date + INTERVAL '3 months' <= CURRENT_DATE + INTERVAL '30 days'
LIMIT 5
ON CONFLICT DO NOTHING;

-- Create loyalty points for customers with completed jobs
INSERT INTO public.loyalty_points (customer_id, job_card_id, total_points)
SELECT 
  COALESCE(customer_phone, customer_name) as customer_id,
  id as job_card_id,
  10 as total_points
FROM public.job_cards 
WHERE status = 'Completed'
ON CONFLICT (customer_id, tenant_id) DO UPDATE SET
  total_points = loyalty_points.total_points + 10,
  last_updated = now();
