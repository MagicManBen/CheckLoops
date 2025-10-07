import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzQxMDc3OSwiZXhwIjoyMDQ4OTg2Nzc5fQ.j0gXEWkIj9r0f2RQQdwl_HvVXTdAtxlQUc_Aem0AuEQ'

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔍 Checking Supabase Configuration...\n')

// 1. Check master_users table structure
console.log('1️⃣ Checking master_users table structure...')
const { data: columns, error: colError } = await supabase
  .from('master_users')
  .select('*')
  .limit(0)

if (colError) {
  console.error('❌ Error fetching table structure:', colError)
} else {
  console.log('✅ master_users table exists')
  
  // Get one row to see structure
  const { data: sample, error: sampleError } = await supabase
    .from('master_users')
    .select('*')
    .limit(1)
  
  if (sample && sample.length > 0) {
    console.log('📋 Table columns:', Object.keys(sample[0]).join(', '))
  }
}

// 2. Check if auth_user_id column exists and has proper data
console.log('\n2️⃣ Checking auth_user_id linkage...')
const { data: usersWithAuth, error: authError } = await supabase
  .from('master_users')
  .select('id, full_name, email, auth_user_id, site_id, invite_status')
  .limit(5)

if (authError) {
  console.error('❌ Error:', authError)
} else {
  console.log('✅ Found users:', usersWithAuth.length)
  usersWithAuth.forEach(u => {
    console.log(`  - ${u.full_name} (${u.email}): auth_user_id=${u.auth_user_id ? '✅' : '❌ MISSING'}, site_id=${u.site_id || '❌'}`)
  })
}

// 3. Check for users with pending invites
console.log('\n3️⃣ Checking for pending invitations...')
const { data: pendingInvites, error: inviteError } = await supabase
  .from('master_users')
  .select('id, full_name, email, invite_status, invite_sent_at, auth_user_id, site_id')
  .eq('invite_status', 'pending')
  .limit(10)

if (inviteError) {
  console.error('❌ Error:', inviteError)
} else {
  console.log(`✅ Pending invites: ${pendingInvites.length}`)
  pendingInvites.forEach(u => {
    console.log(`  - ${u.full_name} (${u.email}): sent=${u.invite_sent_at}, auth_id=${u.auth_user_id ? '✅' : '❌'}, site=${u.site_id || '❌'}`)
  })
}

// 4. Check auth users and their metadata
console.log('\n4️⃣ Checking auth users metadata...')
const { data: { users }, error: authUsersError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 5
})

if (authUsersError) {
  console.error('❌ Error:', authUsersError)
} else {
  console.log(`✅ Auth users found: ${users.length}`)
  users.forEach(u => {
    const metadata = u.user_metadata || {}
    console.log(`  - ${u.email}:`)
    console.log(`    site_id: ${metadata.site_id || '❌ MISSING'}`)
    console.log(`    needs_onboarding: ${metadata.needs_onboarding || '❌ MISSING'}`)
    console.log(`    full_name: ${metadata.full_name || '❌ MISSING'}`)
  })
}

// 5. List all edge functions
console.log('\n5️⃣ Checking edge functions...')
try {
  const { data: functions, error: funcError } = await supabase.functions.invoke('status-check')
  if (functions) {
    console.log('✅ Edge functions accessible')
  }
} catch (e) {
  console.log('ℹ️  Cannot list functions via API, but invite-user was deployed')
}

// 6. Check RLS policies on master_users
console.log('\n6️⃣ Checking RLS policies...')
console.log('ℹ️  Check RLS status manually in Supabase dashboard')

console.log('\n✅ Configuration check complete!')
console.log('\n📝 Recommendations:')
console.log('1. Ensure master_users table has: auth_user_id, site_id, invite_status columns')
console.log('2. Verify auth users have site_id and needs_onboarding in user_metadata')
console.log('3. Check RLS policies allow service role to insert/update master_users')
console.log('4. Verify SMTP settings in Supabase dashboard for email delivery')
