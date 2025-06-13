
-- Create promotions_settings table
CREATE TABLE IF NOT EXISTS public.promotions_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_interval_months INTEGER NOT NULL DEFAULT 3,
  enable_service_reminder BOOLEAN NOT NULL DEFAULT true,
  reminder_message_template TEXT DEFAULT 'Hi {{customerName}}, your vehicle {{vehicle.make}} {{vehicle.model}} service is due. Please contact us to schedule a service appointment.',
  enable_promotional_offers BOOLEAN NOT NULL DEFAULT true,
  promotional_offers JSONB DEFAULT '[]'::JSONB,
  membership_point_value INTEGER NOT NULL DEFAULT 10,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create loyalty_points table
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE SET NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_reminders_status ON public.service_reminders(status);
CREATE INDEX IF NOT EXISTS idx_service_reminders_due_date ON public.service_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_service_reminders_customer_id ON public.service_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_total_points ON public.loyalty_points(total_points);

-- Add unique constraint to prevent duplicate loyalty records per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_points_unique_customer 
ON public.loyalty_points(customer_id);

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
