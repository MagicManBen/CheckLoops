/**
 * Avatar Variant Analyzer
 * 
 * This script generates avatar images for each DiceBear variant and uses OpenAI's Vision API
 * to analyze and create accurate, human-friendly labels for avatar customization options.
 * 
 * Usage: node analyze_avatar_variants.js [feature_type] [start_variant] [end_variant]
 * Example: node analyze_avatar_variants.js eyes 1 10
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';
const BASE_SEED = 'analysis-seed-2024'; // Consistent seed for all analysis
const AVATAR_BASE_URL = 'https://api.dicebear.com/7.x/adventurer/png';

// Feature definitions matching the staff-welcome.html structure
const FEATURES = {
  eyes: { 
    count: 26, 
    description: 'eye expressions and styles',
    existing_labels: {}
  },
  mouth: { 
    count: 30, 
    description: 'mouth expressions and shapes',
    existing_labels: {}
  },
  eyebrows: { 
    count: 15, 
    description: 'eyebrow shapes and positions',
    existing_labels: {}
  },
  hair: {
    patterns: [
      { prefix: 'short', count: 19, description: 'short hairstyles' },
      { prefix: 'long', count: 26, description: 'long hairstyles' }
    ]
  }
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function generateAvatarUrl(feature, variant, additionalParams = {}) {
  const params = new URLSearchParams({
    seed: BASE_SEED,
    size: 200,
    ...additionalParams
  });
  
  params.set(feature, variant);
  
  return `${AVATAR_BASE_URL}?${params.toString()}`;
}

function generateHairVariant(prefix, number) {
  return `${prefix}${pad2(number)}`;
}

async function analyzeAvatarWithOpenAI(avatarUrl, feature, variant, usedLabels = []) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.log(`⚠️  OpenAI API key not set. Would analyze: ${feature} ${variant}`);
    return `${feature.charAt(0).toUpperCase() + feature.slice(1)}: Style ${variant.replace('variant', '').replace(/^0+/, '')}`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using cheapest vision-capable model
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this avatar image and describe the ${feature} feature. Focus specifically on the ${FEATURES[feature]?.description || feature} and provide a short, user-friendly descriptor (2-4 words max). 

IMPORTANT: Your descriptor must be UNIQUE and different from these already used labels:
${usedLabels.length > 0 ? usedLabels.join(', ') : 'None yet'}

Examples of good descriptors:
- For eyes: "Wide", "Sleepy", "Alert", "Squinting", "Bright", "Focused", "Gentle", "Sharp", "Soft", "Dreamy", "Intense", "Relaxed"
- For mouth: "Smile", "Grin", "Neutral", "Open", "Smirk", "Subtle", "Full", "Thin", "Curved", "Slight", "Broad", "Small"
- For eyebrows: "Raised", "Furrowed", "Arched", "Straight", "Angled", "Thick", "Thin", "Natural", "Sharp", "Soft", "High", "Low"
- For hair: Be specific about the style characteristics you see

Be creative and specific to make each label distinct. Avoid generic terms like "Normal" or "Standard".

Respond with just the descriptor in format: "${feature.charAt(0).toUpperCase() + feature.slice(1)}: [descriptor]"`
              },
              {
                type: 'image_url',
                image_url: {
                  url: avatarUrl
                }
              }
            ]
          }
        ],
        max_tokens: 20
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || `${feature}: Style ${variant.replace('variant', '').replace(/^0+/, '')}`;

  } catch (error) {
    console.error(`❌ Error analyzing ${feature} ${variant}:`, error.message);
    return `${feature.charAt(0).toUpperCase() + feature.slice(1)}: Style ${variant.replace('variant', '').replace(/^0+/, '')}`;
  }
}

async function analyzeFeatureVariants(feature, startVariant = 1, endVariant = null) {
  const featureConfig = FEATURES[feature];
  if (!featureConfig) {
    console.error(`❌ Unknown feature: ${feature}`);
    console.log(`Available features: ${Object.keys(FEATURES).join(', ')}`);
    return;
  }

  console.log(`🔍 Analyzing ${feature} variants...`);
  
  let results = {};
  let usedLabels = [];
  
  // Handle hair differently since it has prefixes
  if (feature === 'hair') {
    for (const pattern of featureConfig.patterns) {
      const maxCount = endVariant || pattern.count;
      const start = Math.max(startVariant, 1);
      
      console.log(`\n📋 Analyzing ${pattern.prefix} hair styles ${start}-${maxCount}...`);
      
      for (let i = start; i <= maxCount; i++) {
        const variant = generateHairVariant(pattern.prefix, i);
        const url = generateAvatarUrl('hair', variant);
        
        console.log(`🔄 Analyzing ${variant}... (${url})`);
        
        const label = await analyzeAvatarWithOpenAI(url, 'hair', variant, usedLabels);
        results[variant] = label;
        
        // Extract just the descriptor part and add to used labels
        const descriptor = label.replace(/^[^:]+:\s*/, '');
        usedLabels.push(descriptor);
        
        console.log(`✅ ${variant}: ${label}`);
        
        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } else {
    // Handle standard variant01, variant02, etc.
    const maxCount = endVariant || featureConfig.count;
    const start = Math.max(startVariant, 1);
    const existingLabels = featureConfig.existing_labels || {};
    
    console.log(`\n📋 Analyzing ${feature} variants ${start}-${maxCount}...`);
    
    for (let i = start; i <= maxCount; i++) {
      const variant = `variant${pad2(i)}`;
      
      // Skip if we already have a verified label
      if (existingLabels[variant]) {
        console.log(`⏭️  Skipping ${variant} - already has verified label: ${existingLabels[variant]}`);
        results[variant] = existingLabels[variant];
        const descriptor = existingLabels[variant].replace(/^[^:]+:\s*/, '');
        usedLabels.push(descriptor);
        continue;
      }
      
      const url = generateAvatarUrl(feature, variant);
      
      console.log(`🔄 Analyzing ${variant}... (${url})`);
      
      const label = await analyzeAvatarWithOpenAI(url, feature, variant, usedLabels);
      results[variant] = label;
      
      // Extract just the descriptor part and add to used labels
      const descriptor = label.replace(/^[^:]+:\s*/, '');
      usedLabels.push(descriptor);
      
      console.log(`✅ ${variant}: ${label}`);
      
      // Small delay to respect API rate limits  
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

async function saveResults(feature, results) {
  const outputDir = './avatar_analysis';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const outputFile = path.join(outputDir, `${feature}_labels.json`);
  
  // Load existing results if they exist
  let existingResults = {};
  if (fs.existsSync(outputFile)) {
    try {
      existingResults = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    } catch (error) {
      console.warn(`⚠️  Could not load existing results: ${error.message}`);
    }
  }
  
  // Merge results
  const mergedResults = { ...existingResults, ...results };
  
  fs.writeFileSync(outputFile, JSON.stringify(mergedResults, null, 2));
  console.log(`💾 Results saved to ${outputFile}`);
  
  // Also generate JavaScript code that can be copied into staff-welcome.html
  const jsCode = `const ${feature}Labels = ${JSON.stringify(mergedResults, null, 2)};`;
  const jsFile = path.join(outputDir, `${feature}_labels.js`);
  fs.writeFileSync(jsFile, jsCode);
  console.log(`📋 JavaScript code saved to ${jsFile}`);
}

async function generateComparisonHTML(feature) {
  const featureConfig = FEATURES[feature];
  if (!featureConfig) return;
  
  let html = `<!DOCTYPE html>
<html>
<head>
    <title>${feature.charAt(0).toUpperCase() + feature.slice(1)} Variants Comparison</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .variant { border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; }
        .avatar { width: 150px; height: 150px; border-radius: 8px; }
        .label { margin-top: 10px; font-weight: bold; }
        .variant-id { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>${feature.charAt(0).toUpperCase() + feature.slice(1)} Variants</h1>
    <div class="grid">
`;

  if (feature === 'hair') {
    for (const pattern of featureConfig.patterns) {
      for (let i = 1; i <= pattern.count; i++) {
        const variant = generateHairVariant(pattern.prefix, i);
        const url = generateAvatarUrl('hair', variant);
        html += `
        <div class="variant">
            <img src="${url}" alt="${variant}" class="avatar">
            <div class="variant-id">${variant}</div>
            <div class="label">[To be analyzed]</div>
        </div>`;
      }
    }
  } else {
    for (let i = 1; i <= featureConfig.count; i++) {
      const variant = `variant${pad2(i)}`;
      const url = generateAvatarUrl(feature, variant);
      html += `
      <div class="variant">
          <img src="${url}" alt="${variant}" class="avatar">
          <div class="variant-id">${variant}</div>
          <div class="label">[To be analyzed]</div>
      </div>`;
    }
  }

  html += `
    </div>
</body>
</html>`;

  const outputDir = './avatar_analysis';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const htmlFile = path.join(outputDir, `${feature}_comparison.html`);
  fs.writeFileSync(htmlFile, html);
  console.log(`🌐 Comparison HTML saved to ${htmlFile}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const feature = args[0];
  const startVariant = parseInt(args[1]) || 1;
  const endVariant = parseInt(args[2]) || null;
  
  if (!feature) {
    console.log(`
🎨 Avatar Variant Analyzer

Usage: node analyze_avatar_variants.js [feature] [start_variant] [end_variant]

Available features: ${Object.keys(FEATURES).join(', ')}

Examples:
  node analyze_avatar_variants.js eyes          # Analyze all eye variants
  node analyze_avatar_variants.js mouth 6 10   # Analyze mouth variants 6-10
  node analyze_avatar_variants.js hair 1 5     # Analyze hair variants 1-5

Set OPENAI_API_KEY environment variable to enable AI analysis.
Without it, the script will generate comparison HTML files for manual review.
`);
    return;
  }

  console.log(`🚀 Starting avatar variant analysis...`);
  console.log(`📊 Feature: ${feature}`);
  console.log(`🔢 Range: ${startVariant} to ${endVariant || 'end'}`);
  console.log(`🔑 OpenAI API Key: ${OPENAI_API_KEY === 'your-openai-api-key-here' ? '❌ Not set' : '✅ Set'}`);
  
  // Generate comparison HTML first
  await generateComparisonHTML(feature);
  
  // Analyze variants
  const results = await analyzeFeatureVariants(feature, startVariant, endVariant);
  
  if (results && Object.keys(results).length > 0) {
    await saveResults(feature, results);
    
    console.log(`\n✅ Analysis complete!`);
    console.log(`📁 Results saved in ./avatar_analysis/`);
    console.log(`\n📋 Summary of analyzed variants:`);
    Object.entries(results).forEach(([variant, label]) => {
      console.log(`  ${variant}: ${label}`);
    });
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeFeatureVariants, generateAvatarUrl, FEATURES };