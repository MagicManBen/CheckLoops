// Quick script to verify notes saving path against the live Supabase project
// Usage: node scripts/test-save-notes.mjs
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'

const email = process.env.TEST_USER
const password = process.env.TEST_PASS

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
  if (!email || !password) {
    console.error('Please set TEST_USER and TEST_PASS in your environment (.env)')
    process.exit(1)
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    console.error('Sign-in failed:', signInError)
    process.exit(1)
  }
  console.log('Signed in as', signInData.user?.email)

  // Fetch one PIR document for site 2
  const { data: docs, error: fetchErr } = await supabase
    .from('pir_documents')
    .select('*')
    .eq('site_id', 2)
    .limit(1)
  if (fetchErr) {
    console.error('Fetch failed:', fetchErr)
    process.exit(1)
  }
  if (!docs?.length) {
    console.error('No pir_documents rows for site 2')
    process.exit(1)
  }
  const doc = docs[0]
  console.log('Testing on doc id:', doc.id, 'title:', doc.title)

  const testNotes = `CLI test note at ${new Date().toISOString()}`

  // Attempt the same save-flow as the UI fallback
  let res = await supabase
    .from('pir_documents')
    .update({ notes: testNotes })
    .eq('id', doc.id)
    .eq('site_id', 2)
    .select()
    .single()

  if (res.error) {
    const msg = (res.error.message || '').toLowerCase()
    const missing = msg.includes('column') && msg.includes('does not exist') && msg.includes('notes')
    console.log('Direct column update error (expected if no column):', res.error.message)
    if (!missing) {
      process.exit(1)
    }
    const newData = { ...(doc.data || {}), notes: testNotes }
    res = await supabase
      .from('pir_documents')
      .update({ data: newData })
      .eq('id', doc.id)
      .eq('site_id', 2)
      .select()
      .single()
    if (res.error) {
      console.error('JSON notes fallback failed:', res.error)
      process.exit(1)
    }
    console.log('Saved notes into data.notes OK')
  } else {
    console.log('Saved notes into dedicated notes column OK')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
