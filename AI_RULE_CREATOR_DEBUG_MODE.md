# 🔧 AI Rule Creator - DEBUG MODE

## Overview

The interface has been redesigned as a comprehensive debugging and development tool. This is **not** production-ready - it's designed for testing, troubleshooting, and understanding exactly what's happening at each step.

## 🎯 Debug Features

### 1. **Real-Time Console Logging**
- Every action is logged with timestamps
- Color-coded by severity (info, success, error, warning)
- Auto-scrolls to show latest entries
- Logs to both UI and browser console

### 2. **Connection Status Monitor**
- Real-time connection status indicator
- Shows Supabase connection health
- Displays authentication state
- Connection metadata display

### 3. **Session Metrics**
- Total requests sent
- Success/failure counts
- Average response time tracking
- Live metrics updating

### 4. **Detailed Request/Response Inspection**
Tabbed interface showing:
- **REQUEST PAYLOAD**: Exact JSON sent to edge function
- **AI RESPONSE**: Raw response from OpenAI
- **PARSED RULE**: Structured rule object
- **METADATA**: Token usage, model info, timing
- **SAVED RULES**: Database records with full config

### 5. **Technical Details Exposed**
- Model used: `gpt-4o`
- Temperature: `0.1`
- Max tokens: `1000`
- Response times in milliseconds
- Timestamp for every operation
- Full error stack traces

### 6. **Quick Test Buttons**
Pre-filled examples you can click:
- Test 1: "Dr Smith cannot see wound checks"
- Test 2: "Dr Saeed cannot have appointments less than 60 minutes"
- Test 3: "There must be 2 emergency slots each day"

### 7. **Enhanced Rule Display**
For each saved rule:
- Full JSON config visible
- Rule ID and timestamps
- Enable/disable toggle
- Severity badges
- Rule type information

## 🎨 Visual Design

### Dark Theme (GitHub-inspired)
- Background: `#0d1117` (dark gray)
- Cards: `#161b22` (slightly lighter)
- Borders: `#30363d` (subtle)
- Text: `#c9d1d9` (light gray)
- Accents: `#58a6ff` (blue)
- Success: `#238636` (green)
- Error: `#da3633` (red)

### Monospace Font
- Uses `Courier New` for technical feel
- Better for reading JSON
- Code-like appearance

### Status Indicators
- 🟢 Green dot: System OK
- 🔴 Red dot: Error state
- 🟡 Yellow dot: Warning/Processing

## 📊 What You Can See

### Before Request
```
Connection status
Site selection
Input text
Configuration details
```

### During Request
```
"PROCESSING REQUEST..." status
Spinner on button
Console log: "Sending request..."
Real-time timing
```

### After Response
```
Response time (ms)
Full JSON response
Parsed rule structure
Metadata (model, tokens, etc.)
Success/error logging
Updated metrics
```

## 🔍 Debugging Workflow

1. **Open the page** - See initialization logs
2. **Check connection** - Verify Supabase is connected
3. **Select site** - Logs site selection
4. **Enter rule** - Type or click example
5. **Generate** - Watch real-time logs
6. **Inspect tabs**:
   - REQUEST: See exactly what was sent
   - RESPONSE: See raw AI output
   - PARSED: See structured data
   - METADATA: See performance metrics
7. **Save or iterate** - Test different inputs

## 🐛 Common Issues to Debug

### Issue: No response from AI
**Check:**
- Request Payload tab - Was request sent correctly?
- Console logs - Any error messages?
- Connection status - Is Supabase connected?
- Metadata tab - Any OpenAI errors?

### Issue: Wrong rule interpretation
**Check:**
- AI Response tab - What did GPT-4 actually return?
- Parsed Rule tab - How was it structured?
- Input text - Was it clear and specific?

### Issue: Can't save to database
**Check:**
- Console logs - What's the error?
- Parsed Rule tab - Is the structure correct?
- Site selection - Is a site selected?
- Browser console - Any RLS policy errors?

## 🎯 Testing Checklist

- [ ] Connection status shows "CONNECTED"
- [ ] Sites load in dropdown
- [ ] Console logs appear
- [ ] Test button 1 works
- [ ] Test button 2 works
- [ ] Request payload displays
- [ ] AI response displays
- [ ] Parsed rule displays
- [ ] Metadata shows timing
- [ ] Save button works
- [ ] Rules list refreshes
- [ ] Toggle switches work
- [ ] Metrics update correctly

## 💡 Tips for Debugging

1. **Clear console regularly** - Click "CLEAR CONSOLE" to start fresh
2. **Check all tabs** - Don't just look at one view
3. **Copy JSON** - You can select and copy from any JSON viewer
4. **Watch metrics** - Slow responses? Check avg time
5. **Read logs carefully** - Timestamps help trace issues
6. **Test incrementally** - Try simple rules first
7. **Compare payloads** - Successful vs failed requests

## 🔧 Configuration Displayed

The debug mode exposes all config:
```javascript
SUPABASE_URL: 'https://unveoqnlqnobufhublyw.supabase.co'
EDGE_FUNCTION: 'ai-rule-generator'
AI_MODEL: 'gpt-4o'
AI_TEMPERATURE: 0.1
AI_MAX_TOKENS: 1000
```

## 📝 Example Console Output

```
[14:32:15.123] [INFO] 🚀 Initializing AI Rule Generator Debug Mode
[14:32:15.456] [INFO] Testing Supabase connection...
[14:32:15.789] [SUCCESS] ✅ Supabase connection established
[14:32:16.012] [INFO] Loading sites from database...
[14:32:16.234] [SUCCESS] ✅ Loaded 3 sites
[14:32:16.456] [SUCCESS] ✅ System ready
[14:32:30.123] [INFO] 📤 Sending request to Edge Function
[14:32:30.234] [INFO] Request Payload: {"rule_text":"Dr Saeed...","site_id":2}
[14:32:32.456] [SUCCESS] ✅ Response received in 2222ms
[14:32:32.567] [SUCCESS] ✅ Rule generated successfully
```

## 🚀 Next Steps

Once debugging is complete and the system works reliably:

1. **Identify issues** - Use debug mode to find problems
2. **Fix edge function** - Update based on findings
3. **Test thoroughly** - Verify all rule types work
4. **Document** - Note any quirks or limitations
5. **Design production UI** - Build beautiful interface
6. **Keep debug mode** - Always useful for troubleshooting

## ⚠️ Important Notes

- **This is NOT production-ready** - It's for debugging
- **Exposes technical details** - Don't share publicly
- **Performance tracking** - Helps identify slow requests
- **Error visibility** - All errors are logged and displayed
- **No input validation** - Assumes developer knows what they're doing

---

**Mode:** DEBUG  
**Purpose:** Testing & Development  
**Target User:** Developers  
**Status:** Ready for debugging 🔧
