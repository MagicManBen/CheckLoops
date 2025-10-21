// AI RULE GENERATOR EDGE FUNCTION
// /supabase/functions/ai-rule-generator/index.ts
// Converts natural language rules into structured JSON for EMIS validation system

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define the comprehensive rule schema that AI should follow
const RULE_SCHEMA = {
  description: "Schema for EMIS validation rules",
  ruleTypes: [
    {
      type: "clinician_slot_restriction",
      description: "Restricts specific clinicians from specific slot types",
      config: {
        clinician_names: ["array of clinician names"],
        slot_types: ["array of slot type names"],
        restriction_type: "cannot_perform | must_perform_only"
      }
    },
    {
      type: "slot_duration_requirement",
      description: "Enforces minimum or maximum duration for slot types, optionally for specific clinicians",
      config: {
        slot_types: ["array of slot type names (empty array means all slot types)"],
        operator: "gte | gt | lte | lt | eq",
        value: "number in minutes",
        applies_to_all_clinicians: "true if applies to all clinicians, false if specific clinicians",
        clinician_names: ["optional array of clinician names - if specified, rule only applies to these clinicians"]
      }
    },
    {
      type: "daily_slot_count",
      description: "Requires minimum or maximum count of specific slot types per day",
      config: {
        slot_types: ["array of slot type names"],
        operator: "gte | gt | lte | lt | eq",
        count: "number of slots required",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] || "all",
        clinician_names: ["optional array - if specified, applies only to these clinicians"]
      }
    },
    {
      type: "slot_distribution",
      description: "Ensures slots are distributed across clinicians",
      config: {
        slot_types: ["array of slot type names"],
        required_clinicians: ["array of clinician names who must have at least one"],
        min_per_clinician: "minimum slots per clinician",
        period: "daily | weekly"
      }
    },
    {
      type: "time_restriction",
      description: "Restricts when certain slots can be scheduled",
      config: {
        slot_types: ["array of slot type names"],
        clinician_names: ["optional array"],
        allowed_times: {
          start_time: "HH:MM",
          end_time: "HH:MM"
        },
        days: ["optional array of days"]
      }
    },
    {
      type: "slot_sequence",
      description: "Requires specific ordering or gaps between slots",
      config: {
        primary_slot_type: "slot type name",
        requires_before: ["slot types that must come before"],
        requires_after: ["slot types that must come after"],
        min_gap_minutes: "minimum gap in minutes"
      }
    }
  ]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { rule_text, site_id, context } = await req.json()

    if (!rule_text || typeof rule_text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'rule_text is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!site_id) {
      return new Response(
        JSON.stringify({ error: 'site_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing rule: "${rule_text}" for site ${site_id}`)
    
    // Context data for better matching (optional)
    const availableClinicians = context?.available_clinicians || []
    const availableSlotTypes = context?.available_slot_types || []
    console.log(`Context: ${availableClinicians.length} clinicians, ${availableSlotTypes.length} slot types`)

    // Call OpenAI API directly (using fetch since we can't import the SDK in this context easily)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured in environment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = `You are an expert at converting natural language validation rules into structured JSON for a medical appointment scheduling system.

${availableClinicians.length > 0 ? `
=== AVAILABLE CLINICIANS IN DATABASE ===
${availableClinicians.map((c, i) => `${i + 1}. ${c}`).join('\n')}

🚨 CRITICAL: When you see any clinician name in the user's rule (like "Dr Smith", "Smith", "Dr. Smith"), you MUST match it to the EXACT name from this list above. Find the best match and use that exact spelling and format. DO NOT use the user's input verbatim - always match to the database name.
` : ''}

${availableSlotTypes.length > 0 ? `
=== AVAILABLE SLOT TYPES IN DATABASE ===
${availableSlotTypes.map((s, i) => `${i + 1}. ${s}`).join('\n')}

🚨 CRITICAL: When you see any slot type in the user's rule, you MUST match it to the EXACT name from this list above. DO NOT use the user's input verbatim - always match to the database name.
` : ''}

AVAILABLE RULE TYPES AND SCHEMAS:
${JSON.stringify(RULE_SCHEMA, null, 2)}

IMPORTANT INSTRUCTIONS:
1. Analyze the user's natural language rule carefully
2. Determine which rule type best fits the requirement
3. Extract all relevant parameters (clinician names, slot types, durations, counts, days, etc.)
4. Return ONLY valid JSON in this exact format:

{
  "rule_type": "one of the rule types from schema",
  "name": "concise name for the rule (2-6 words)",
  "description": "human-readable explanation of what the rule does",
  "severity": "error | warning | info",
  "config": {
    ... configuration object matching the rule type schema ...
  },
  "human_readable": "A clear sentence explaining the rule to end users"
}

SEVERITY GUIDELINES:
- "error": Critical rules that must never be violated (safety, compliance)
- "warning": Important rules that should be followed but may have exceptions
- "info": Suggestions or best practices

EXAMPLES:

Input: "Dr Smith cannot see wound check appointments"
Output: {
  "rule_type": "clinician_slot_restriction",
  "name": "Dr Smith Wound Check Restriction",
  "description": "Prevents Dr Smith from being assigned wound check appointments",
  "severity": "error",
  "config": {
    "clinician_names": ["Dr Smith"],
    "slot_types": ["Wound Check"],
    "restriction_type": "cannot_perform"
  },
  "human_readable": "Dr Smith is not permitted to conduct Wound Check appointments"
}

Input: "Wound checks must be at least 15 minutes long"
Output: {
  "rule_type": "slot_duration_requirement",
  "name": "Wound Check Minimum Duration",
  "description": "Ensures wound check appointments are at least 15 minutes",
  "severity": "error",
  "config": {
    "slot_types": ["Wound Check"],
    "operator": "gte",
    "value": 15,
    "applies_to_all_clinicians": true
  },
  "human_readable": "All Wound Check appointments must be at least 15 minutes in duration"
}

Input: "Dr Saeed cannot have appointments less than 60 minutes"
Note: If database has "Dr Mohammad Saeed", match "Dr Saeed" to "Dr Mohammad Saeed"
Output: {
  "rule_type": "slot_duration_requirement",
  "name": "Dr Saeed Minimum Appointment Duration",
  "description": "Ensures all of Dr Saeed's appointments are at least 60 minutes",
  "severity": "error",
  "config": {
    "slot_types": [],
    "operator": "gte",
    "value": 60,
    "applies_to_all_clinicians": false,
    "clinician_names": ["Dr Mohammad Saeed"]
  },
  "human_readable": "All appointments with Dr Mohammad Saeed must be at least 60 minutes in duration"
}

Input: "There must be at least one Duty appointment each weekday with Dr Jones, Dr Smith or Dr Brown"
Output: {
  "rule_type": "daily_slot_count",
  "name": "Daily Duty Coverage Requirement",
  "description": "Ensures at least one duty appointment is scheduled each weekday with specified clinicians",
  "severity": "error",
  "config": {
    "slot_types": ["Duty"],
    "operator": "gte",
    "count": 1,
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "clinician_names": ["Dr Jones", "Dr Smith", "Dr Brown"]
  },
  "human_readable": "Each weekday must have at least 1 Duty appointment with Dr Jones, Dr Smith, or Dr Brown"
}

BE PRECISE: Extract exact names and values. If unclear, ask for clarification in the human_readable field.
RETURN ONLY JSON: Do not include any text before or after the JSON object.`

    const userPrompt = `Convert this rule to JSON: ${rule_text}`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API request failed', 
          details: errorText 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    const aiContent = openaiData.choices?.[0]?.message?.content

    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('AI Response:', aiContent)

    // Parse the AI response
    let parsedRule
    try {
      parsedRule = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response as JSON',
          raw_response: aiContent 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate the parsed rule has required fields
    if (!parsedRule.rule_type || !parsedRule.name || !parsedRule.config) {
      return new Response(
        JSON.stringify({ 
          error: 'AI response missing required fields (rule_type, name, or config)',
          parsed_response: parsedRule 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // **FIX: Map AI rule types to database-compatible types**
    // The DB constraint only allows: daily_check, slot_duration, slot_count, custom
    const ruleTypeMapping: Record<string, string> = {
      'slot_duration_requirement': 'slot_duration',
      'daily_slot_count': 'daily_check',
      'clinician_slot_restriction': 'custom',
      'slot_distribution': 'custom',
      'time_restriction': 'custom',
      'slot_sequence': 'custom'
    }

    const dbRuleType = ruleTypeMapping[parsedRule.rule_type] || parsedRule.rule_type

    console.log(`Mapping rule_type: ${parsedRule.rule_type} → ${dbRuleType}`)

    // Return the structured rule
    return new Response(
      JSON.stringify({
        success: true,
        rule: {
          site_id: site_id,
          name: parsedRule.name,
          description: parsedRule.description || '',
          rule_type: dbRuleType, // Use mapped type
          severity: parsedRule.severity || 'warning',
          config: parsedRule.config,
          enabled: true
        },
        human_readable: parsedRule.human_readable || parsedRule.description,
        original_input: rule_text,
        ai_rule_type: parsedRule.rule_type, // Keep original for reference
        debug: {
          ai_generated_type: parsedRule.rule_type,
          db_compatible_type: dbRuleType,
          config_keys: Object.keys(parsedRule.config || {})
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Rule generation error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate rule',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
