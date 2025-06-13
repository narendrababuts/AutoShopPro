
export interface PromotionalOffer {
  title: string;
  description: string;
  valid_until: Date | string;
}

export interface PromotionsSettings {
  id?: string;
  reminder_interval_months: number;
  enable_service_reminder: boolean;
  reminder_message_template: string;
  enable_promotional_offers: boolean;
  promotional_offers: PromotionalOffer[];
  membership_point_value: number;
}

export interface ServiceReminder {
  id: string;
  customer_id: string;
  job_card_id: string;
  due_date: string;
  status: string;
  created_at?: string;
  job_cards?: {
    id: string;
    customer_name: string;
    customer_phone: string;
    car_make: string;
    car_model: string;
    car_number: string;
  };
}

export interface LoyaltyMember {
  id: string;
  customer_id: string;
  total_points: number;
  last_updated: string;
  job_cards?: {
    customer_name: string;
    customer_phone: string;
    car_make: string;
    car_model: string;
    car_number: string;
  };
}
