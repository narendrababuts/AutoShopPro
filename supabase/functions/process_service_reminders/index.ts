
// This file would be deployed as a Supabase Edge Function
// It runs periodically to check for job cards that need service reminders

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function processServiceReminders() {
  try {
    console.log('Starting service reminders processing');
    
    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from('promotions_settings')
      .select('reminder_interval_months, enable_service_reminder')
      .single();
    
    if (settingsError) {
      throw new Error(`Failed to fetch promotion settings: ${settingsError.message}`);
    }
    
    if (!settings.enable_service_reminder) {
      console.log('Service reminders are disabled in settings');
      return { success: true, message: 'Service reminders are disabled' };
    }
    
    const reminderIntervalMonths = settings.reminder_interval_months;
    
    // Get completed jobs
    const { data: completedJobs, error: jobsError } = await supabase
      .from('job_cards')
      .select('id, customer_name, customer_phone, actual_completion_date')
      .eq('status', 'Completed')
      .order('actual_completion_date', { ascending: false });
    
    if (jobsError) {
      throw new Error(`Failed to fetch completed jobs: ${jobsError.message}`);
    }
    
    console.log(`Found ${completedJobs.length} completed jobs`);
    
    // Get existing reminders
    const { data: existingReminders, error: remindersError } = await supabase
      .from('service_reminders')
      .select('job_card_id');
    
    if (remindersError) {
      throw new Error(`Failed to fetch existing reminders: ${remindersError.message}`);
    }
    
    const existingReminderJobIds = new Set(
      (existingReminders || []).map((reminder: any) => reminder.job_card_id)
    );
    
    // Find jobs that need reminders
    const today = new Date();
    const remindersToCreate = [];
    
    for (const job of completedJobs) {
      // Skip if reminder already exists
      if (existingReminderJobIds.has(job.id)) continue;
      
      const completionDate = new Date(job.actual_completion_date);
      
      // Calculate when the reminder should be due
      const reminderDueDate = new Date(completionDate);
      reminderDueDate.setMonth(reminderDueDate.getMonth() + reminderIntervalMonths);
      
      // If the due date is in the past or within the next 30 days, create a reminder
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      if (reminderDueDate <= thirtyDaysFromNow) {
        remindersToCreate.push({
          customer_id: job.customer_phone, // Using customer phone as ID
          job_card_id: job.id,
          due_date: reminderDueDate.toISOString(),
          status: 'pending'
        });
      }
    }
    
    console.log(`Creating ${remindersToCreate.length} new service reminders`);
    
    // Create new reminders
    if (remindersToCreate.length > 0) {
      const { error: createError } = await supabase
        .from('service_reminders')
        .insert(remindersToCreate);
      
      if (createError) {
        throw new Error(`Failed to create service reminders: ${createError.message}`);
      }
    }
    
    return {
      success: true,
      message: `Processed service reminders. Created ${remindersToCreate.length} new reminders.`
    };
  } catch (error) {
    console.error('Error in processServiceReminders function:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

// Invoke the function
Deno.serve(async (req) => {
  if (req.method === 'POST') {
    const result = await processServiceReminders();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
});
