#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Use secret key to bypass RLS
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_j2J5SdPNTzbodsmfJi4IZw_Mg-Rlrxs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// Ben Howard's user ID
const BEN_ID = '55f1b4e6-01f4-452d-8d6c-617fe7794873';

async function addTestHolidayWithDestination() {
    console.log('🏖️ Adding Test Holiday with Destination to Paris...\n');
    
    try {
        // Calculate dates - holiday starting in 5 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 5);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 4); // 5 day holiday
        
        // Create holiday request with destination
        const holidayRequest = {
            user_id: BEN_ID,
            site_id: 2,
            request_type: 'holiday',
            status: 'approved',
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            destination: 'Paris',
            approved_at: new Date().toISOString(),
            approved_by: BEN_ID
        };
        
        console.log('📝 Creating holiday request:');
        console.log(`  Dates: ${holidayRequest.start_date} to ${holidayRequest.end_date}`);
        console.log(`  Destination: ${holidayRequest.destination}`);
        console.log(`  Status: ${holidayRequest.status}`);
        
        // Insert the holiday request
        const { data: requestData, error: requestError } = await supabase
            .from('holiday_requests')
            .insert(holidayRequest)
            .select()
            .single();
        
        if (requestError) {
            console.error('❌ Error creating holiday request:', requestError);
            return;
        }
        
        console.log(`✅ Holiday request created with ID: ${requestData.id}`);
        
        // Add individual holiday days
        const days = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            // Skip weekends
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                days.push({
                    holiday_request_id: requestData.id,
                    holiday_date: currentDate.toISOString().split('T')[0],
                    hours_requested: 7.5,
                    sessions_requested: 0
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        if (days.length > 0) {
            const { error: daysError } = await supabase
                .from('holiday_request_days')
                .insert(days);
            
            if (daysError) {
                console.error('❌ Error inserting holiday days:', daysError);
            } else {
                console.log(`✅ Inserted ${days.length} holiday days`);
            }
        }
        
        // Verify the holiday exists
        console.log('\n🔍 Verifying holiday in database...');
        
        const { data: verifyData, error: verifyError } = await supabase
            .from('holiday_requests')
            .select('*')
            .eq('id', requestData.id)
            .single();
        
        if (verifyData) {
            console.log('✅ Holiday verified in database:');
            console.log(`  - ID: ${verifyData.id}`);
            console.log(`  - Destination: ${verifyData.destination}`);
            console.log(`  - Status: ${verifyData.status}`);
            console.log(`  - Dates: ${verifyData.start_date} to ${verifyData.end_date}`);
            
            console.log('\n🎯 SUCCESS! Test holiday with destination added.');
            console.log('📌 Next steps:');
            console.log('  1. Login as ben.howard@stoke.nhs.uk');
            console.log('  2. Navigate to the holidays page');
            console.log('  3. You should see:');
            console.log('     - A countdown banner saying "5 days to go!" for Paris');
            console.log('     - An AI-generated avatar image of Paris vacation');
            console.log('     - The holiday in the approved holidays list');
        } else {
            console.log('❌ Could not verify holiday in database');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the function
addTestHolidayWithDestination();