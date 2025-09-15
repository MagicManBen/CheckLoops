// Test script to fix the nickname issue in staff-welcome.html
// First, let's try to directly update the staff_app_welcome table

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js'

// These should match your config.js
const SUPABASE_URL = 'https://unveoqnlqnobufhublyway.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.P5Gu_LG5F6lLBDJ3KV6xQJdh4bL1Wvqh4tWqL8q4Lz0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testNicknameUpdate() {
    // Let's test with the user ID from the JSON data you provided
    const userId = "e7b1da52-fc45-4296-aaa9-263ccc2d759f"
    const siteId = 2
    const nickname = "Ben"
    
    console.log('Testing nickname update for user:', userId)
    
    // First, let's see what's currently in the table
    const { data: currentData, error: selectError } = await supabase
        .from('staff_app_welcome')
        .select('*')
        .eq('user_id', userId)
        .eq('site_id', siteId)
    
    console.log('Current data:', currentData)
    console.log('Select error:', selectError)
    
    // Now try to update the nickname
    const { data: updateData, error: updateError } = await supabase
        .from('staff_app_welcome')
        .upsert({
            user_id: userId,
            site_id: siteId,
            nickname: nickname,
            full_name: 'Ben Howard'
        }, { onConflict: 'user_id,site_id' })
    
    console.log('Update data:', updateData)
    console.log('Update error:', updateError)
    
    // Check the result
    const { data: newData, error: checkError } = await supabase
        .from('staff_app_welcome')
        .select('*')
        .eq('user_id', userId)
        .eq('site_id', siteId)
    
    console.log('New data:', newData)
    console.log('Check error:', checkError)
}

testNicknameUpdate().catch(console.error)