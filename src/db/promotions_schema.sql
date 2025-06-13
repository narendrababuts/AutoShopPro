
-- Create a promotions_settings table
CREATE TABLE IF NOT EXISTS public.promotions_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_interval_months INTEGER NOT NULL DEFAULT 3,
  enable_service_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_message_template TEXT DEFAULT 'Hi {{customerName}}, your vehicle {{vehicle.make}} {{vehicle.model}} service is due. Please contact us to schedule a service appointment.',
  enable_promotional_offers BOOLEAN NOT NULL DEFAULT TRUE,
  promotional_offers JSONB DEFAULT '[]'::JSONB,
  membership_point_value INTEGER NOT NULL DEFAULT 10,
  tenant_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create service reminders table
CREATE TABLE IF NOT EXISTS public.service_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tenant_id TEXT
);

-- Create loyalty points table
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE SET NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tenant_id TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_service_reminders_status ON public.service_reminders(status);
CREATE INDEX IF NOT EXISTS idx_service_reminders_due_date ON public.service_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);

-- RLS Policies for promotions_settings
ALTER TABLE public.promotions_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY promotions_settings_tenant_isolation ON public.promotions_settings 
  USING (tenant_id = (SELECT current_setting('app.current_tenant')));

-- RLS Policies for service_reminders
ALTER TABLE public.service_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_reminders_tenant_isolation ON public.service_reminders 
  USING (tenant_id = (SELECT current_setting('app.current_tenant')));

-- RLS Policies for loyalty_points
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY loyalty_points_tenant_isolation ON public.loyalty_points 
  USING (tenant_id = (SELECT current_setting('app.current_tenant')));
