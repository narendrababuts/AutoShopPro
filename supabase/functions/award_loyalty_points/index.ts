
// This file would be deployed as a Supabase Edge Function
// It handles awarding loyalty points to customers when job cards are completed

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function awardLoyaltyPoints(req: any) {
  try {
    const payload = await req.json();
    const jobCard = payload.record;
    const oldStatus = payload.old_record?.status;
    
    // Only process when status changes to Completed
    if (jobCard.status !== 'Completed' || oldStatus === 'Completed') {
      return {
        success: false,
        message: 'Not a completion event'
      };
    }
    
    console.log(`Processing job card ${jobCard.id} for loyalty points`);
    
    // Get points per job from settings
    const { data: settings, error: settingsError } = await supabase
      .from('promotions_settings')
      .select('membership_point_value')
      .single();
    
    if (settingsError) {
      throw new Error(`Failed to fetch loyalty settings: ${settingsError.message}`);
    }
    
    const pointsToAward = settings.membership_point_value || 10;
    
    // Check if customer already has loyalty points
    const { data: existingPoints, error: pointsError } = await supabase
      .from('loyalty_points')
      .select('id, total_points')
      .eq('customer_id', jobCard.customer_phone)
      .maybeSingle();
    
    if (pointsError) {
      throw new Error(`Failed to check existing loyalty points: ${pointsError.message}`);
    }
    
    let result;
    
    if (existingPoints) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          total_points: existingPoints.total_points + pointsToAward,
          last_updated: new Date().toISOString()
        })
        .eq('id', existingPoints.id);
      
      if (updateError) {
        throw new Error(`Failed to update loyalty points: ${updateError.message}`);
      }
      
      result = {
        success: true,
        message: `Updated loyalty points for customer. New total: ${existingPoints.total_points + pointsToAward}`,
        points: existingPoints.total_points + pointsToAward
      };
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('loyalty_points')
        .insert({
          customer_id: jobCard.customer_phone,
          job_card_id: jobCard.id,
          total_points: pointsToAward,
          last_updated: new Date().toISOString()
        });
      
      if (insertError) {
        throw new Error(`Failed to create loyalty points: ${insertError.message}`);
      }
      
      result = {
        success: true,
        message: `Created new loyalty record for customer with ${pointsToAward} points`,
        points: pointsToAward
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error in awardLoyaltyPoints function:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

// Serve the function
Deno.serve(async (req) => {
  try {
    if (req.method === 'POST') {
      const result = await awardLoyaltyPoints(req);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
