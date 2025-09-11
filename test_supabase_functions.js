// Test script to verify Supabase Edge Functions are working
import { createClient } from '@supabase/supabase-js';

// Read Supabase info from SupabaseInfo.txt
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getSupabaseConfig() {
    // Use the same config as the application
    return {
        url: 'https://unveoqnlqnobufhublyw.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
    };
}

async function testHolidayAvatarFunction() {
    console.log('🧪 Testing generate-holiday-avatar function...');
    
    const config = getSupabaseConfig();
    if (!config) return { success: false, error: 'No config' };
    
    const supabase = createClient(config.url, config.key);
    
    try {
        const { data, error } = await supabase.functions.invoke('generate-holiday-avatar', {
            body: {
                destination: 'Paris',
                avatarUrl: 'test-url'
            }
        });

        if (error) {
            console.error('❌ Supabase function error:', error);
            return { success: false, error: error };
        }

        console.log('✅ Holiday avatar function successful!');
        console.log('📄 Response data:', data);
        return { success: true, data };

    } catch (err) {
        console.error('💥 Exception calling holiday avatar function:', err);
        return { success: false, error: err.message };
    }
}

async function testGenerateAvatarFunction() {
    console.log('🧪 Testing generate-avatar function...');
    
    const config = getSupabaseConfig();
    if (!config) return { success: false, error: 'No config' };
    
    const supabase = createClient(config.url, config.key);
    
    try {
        // Get some sample options for the request
        const testOptions = {
            'opt-eyes': ['variant01', 'variant02'],
            'opt-hair': ['short01', 'short02'],
            'opt-skinColor': ['fdbcb4', 'ecad80']
        };

        const { data, error } = await supabase.functions.invoke('generate-avatar', {
            body: {
                description: 'A friendly doctor with short brown hair and glasses',
                seedHint: 'Doctor',
                options: testOptions
            }
        });

        if (error) {
            console.error('❌ Supabase function error:', error);
            // Try to get response text for more details
            if (error.context && error.context.text) {
                const errorText = await error.context.text();
                console.error('📄 Error response body:', errorText);
            }
            return { success: false, error: error };
        }

        console.log('✅ Generate avatar function successful!');
        console.log('📄 Response data:', data);
        return { success: true, data };

    } catch (err) {
        console.error('💥 Exception calling generate avatar function:', err);
        return { success: false, error: err.message };
    }
}

async function runFunctionTests() {
    console.log('🚀 Starting Supabase Function Tests\n');
    
    // Test Holiday Avatar Function
    const holidayResult = await testHolidayAvatarFunction();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test Generate Avatar Function
    const avatarResult = await testGenerateAvatarFunction();
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 FUNCTION TEST SUMMARY:');
    console.log('generate-holiday-avatar:', holidayResult.success ? '✅ Working' : '❌ Failed');
    console.log('generate-avatar:', avatarResult.success ? '✅ Working' : '❌ Failed');
    
    if (!holidayResult.success || !avatarResult.success) {
        console.log('\n🔍 DIAGNOSIS:');
        if (!holidayResult.success) {
            console.log('- Holiday avatar issue:', JSON.stringify(holidayResult.error, null, 2));
        }
        if (!avatarResult.success) {
            console.log('- Generate avatar issue:', JSON.stringify(avatarResult.error, null, 2));
        }
        
        console.log('\n💡 POSSIBLE CAUSES:');
        console.log('- Functions may not be deployed');
        console.log('- Environment variables (OPENAI_API_KEY) may not be set in Supabase');
        console.log('- CORS configuration may be blocking requests');
        console.log('- Authentication issues');
    }
}

runFunctionTests();