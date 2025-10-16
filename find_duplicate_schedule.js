import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findSchedules() {
  try {
    console.log('Searching for schedules with Item: "Cupboard with Sink Unit" and Check Type: "Stock Levels"...\n');
    
    // First, find the item ID
    const { data: items, error: itemError } = await supabase
      .from('items')
      .select('id, item_name, room_id')
      .ilike('item_name', '%Cupboard with Sink Unit%');
    
    if (itemError) {
      console.error('Error finding items:', itemError);
      return;
    }
    
    console.log('Found items:', items);
    console.log('');
    
    // Find the check type ID
    const { data: checkTypes, error: checkTypeError } = await supabase
      .from('check_types')
      .select('id, name')
      .ilike('name', '%Stock Levels%');
    
    if (checkTypeError) {
      console.error('Error finding check types:', checkTypeError);
      return;
    }
    
    console.log('Found check types:', checkTypes);
    console.log('');
    
    // Find all schedules for these combinations
    if (items && items.length > 0 && checkTypes && checkTypes.length > 0) {
      const { data: schedules, error: scheduleError } = await supabase
        .from('item_allowed_types')
        .select('*')
        .in('item_id', items.map(i => i.id))
        .in('check_type_id', checkTypes.map(ct => ct.id));
      
      if (scheduleError) {
        console.error('Error finding schedules:', scheduleError);
        return;
      }
      
      console.log('Found schedules:');
      schedules?.forEach(schedule => {
        const item = items.find(i => i.id === schedule.item_id);
        const checkType = checkTypes.find(ct => ct.id === schedule.check_type_id);
        
        console.log(`
  Schedule ID: ${schedule.id}
  Item: ${item?.item_name} (ID: ${schedule.item_id})
  Check Type: ${checkType?.name} (ID: ${schedule.check_type_id})
  Frequency: ${schedule.frequency}
  Required: ${schedule.required}
  Active: ${schedule.active}
  Scheduled Day: ${schedule.scheduled_day || 'N/A'}
        `);
      });
      
      if (schedules && schedules.length > 0) {
        console.log('\n💡 To delete this schedule, run:');
        console.log(`DELETE FROM item_allowed_types WHERE id = ${schedules[0].id};`);
        console.log('\nOr to update it, you can edit it in the admin dashboard.');
      }
    } else {
      console.log('Could not find matching items or check types');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

findSchedules();
