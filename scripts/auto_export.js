#!/usr/bin/env node
/*
 Auto-export script that runs every 10 minutes
 - Runs continuously while terminal window is open
 - Stops when you close terminal or press Ctrl+C
 - Shows a countdown timer between exports
*/

import { spawn } from 'child_process'
import path from 'path'

const INTERVAL_MINUTES = 10
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000

let isRunning = true
let countdown = INTERVAL_MINUTES * 60

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping auto-export...')
  isRunning = false
  process.exit(0)
})

// Handle terminal close
process.on('SIGTERM', () => {
  console.log('\n🛑 Terminal closing, stopping auto-export...')
  isRunning = false
  process.exit(0)
})

function runExport() {
  return new Promise((resolve) => {
    console.log('\n🔄 Running Supabase export...')
    
    const child = spawn('npm', ['run', 'export:supabase:pretty'], {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Export completed successfully!')
      } else {
        console.log(`❌ Export failed with code ${code}`)
      }
      resolve()
    })
  })
}

function updateCountdown() {
  if (!isRunning) return
  
  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  
  // Clear the line and show countdown
  process.stdout.write(`\r⏱️  Next export in: ${minutes}:${seconds.toString().padStart(2, '0')}`)
  
  countdown--
  
  if (countdown < 0) {
    countdown = INTERVAL_MINUTES * 60
    process.stdout.write('\r' + ' '.repeat(50) + '\r') // Clear the line
    runExport().then(() => {
      if (isRunning) {
        console.log(`\n⏰ Next export will run in ${INTERVAL_MINUTES} minutes...`)
      }
    })
  }
}

async function start() {
  console.log('🚀 Starting Supabase Auto-Export')
  console.log(`📋 Will export every ${INTERVAL_MINUTES} minutes`)
  console.log('⚠️  Keep this terminal window open to continue')
  console.log('🛑 Press Ctrl+C to stop\n')
  
  // Run export immediately first time
  await runExport()
  
  if (!isRunning) return
  
  console.log(`\n⏰ Next export will run in ${INTERVAL_MINUTES} minutes...`)
  
  // Start countdown timer
  setInterval(updateCountdown, 1000)
}

start()