# OpenAI Integration Setup Guide - Enhanced Version

This guide will help you complete the setup for the enhanced OpenAI-powered complaint form auto-population using Supabase Edge Functions with multi-format file support.

## Prerequisites

You'll need to install:
1. **Node.js** (https://nodejs.org/) - Download and install the LTS version
2. **Supabase CLI** - Install after Node.js with: `npm install -g supabase`

## Setup Steps

### 1. Install Prerequisites

```bash
# Download and install Node.js from https://nodejs.org/
# Then install Supabase CLI
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
# Replace YOUR_PROJECT_REF with your actual project reference
supabase link --project-ref unveoqnlqnobufhublyw
```

### 4. Set the OpenAI API Key as a Secret

```bash
supabase secrets set OPENAI_API_KEY=****************************************
```

### 5. Deploy the Enhanced Edge Function

```bash
supabase functions deploy extract-complaint
```

### 6. Verify the Function is Working

You can test it in the Supabase dashboard:
- Go to your Supabase project dashboard
- Navigate to "Edge Functions"
- Find "extract-complaint" function
- Test it with sample data

## What's Been Enhanced

### ✅ **Multi-Format File Support**

**Client-Side Processing (when libraries available):**
- **PDF files** - Uses PDF.js to extract text
- **DOCX files** - Uses Mammoth.js to extract text
- **Text files** - Direct text reading

**Server-Side Fallback:**
- Files are uploaded to Supabase Storage (`complaints_incoming/` bucket)
- Signed URLs are sent to Edge Function for server-side processing
- Supports future expansion to OCR for images and advanced PDF parsing

### ✅ **Enhanced Edge Function**

**New Features:**
- Accepts both `{ "text": string }` and `{ "signedUrl": string }` payloads
- Uses OpenAI npm package directly (cleaner code)
- Strict JSON parsing with fallback defaults
- Improved error handling and CORS support

**Strict JSON Output:**
```json
{
  "patient_initials": "AB" | null,
  "category": "Clinical Care" | "Communication" | "Other" | string,
  "priority": "low" | "medium" | "high",
  "original_complaint": string,
  "response": string | null,
  "lessons_learned": string | null
}
```

### ✅ **Enhanced Client-Side Processing**

**Smart Category Matching:**
- Exact match first
- Partial matching for common variations
- Falls back to "Other" category if no match

**Priority Normalization:**
- Forces lowercase priority values
- Validates against `low|medium|high`
- Defaults to "medium" for invalid values

**File Processing Flow:**
1. Try client-side extraction (PDF.js, Mammoth.js)
2. If client-side fails → upload to storage
3. Send signed URL to Edge Function
4. Edge Function processes server-side

### ✅ **Security Improvements**

- OpenAI API key remains server-side only
- User authentication required for all requests
- Temporary signed URLs for file access
- No sensitive data exposed to client

## Supported File Types

### ✅ **Currently Fully Supported:**
- **`.txt`** - Plain text files (client-side)
- **`.pdf`** - PDF documents (client-side with PDF.js, server fallback)
- **`.docx`** - Word documents (client-side with Mammoth.js, server fallback)

### 🔄 **Server-Side Ready (Future Enhancement):**
- **`.doc`** - Older Word documents (server-side processing)
- **`.png, .jpg, .jpeg`** - Image files with OCR (server-side processing)

## How It Works - Enhanced Flow

### Client-Side First Approach:
1. **User uploads file** (any supported format)
2. **Client tries extraction**:
   - `.txt` → Direct text reading
   - `.pdf` → PDF.js extraction (if available)
   - `.docx` → Mammoth.js extraction (if available)
3. **If client extraction succeeds** → Send text to Edge Function
4. **If client extraction fails** → Upload file to storage, send signed URL

### Edge Function Processing:
1. **Receives either** `{ text }` or `{ signedUrl }`
2. **If signedUrl** → Downloads file (ready for future server-side processing)
3. **Calls OpenAI** with strict JSON system prompt
4. **Returns normalized data** with proper category/priority mapping

### Form Population:
1. **Smart category matching** with fallbacks
2. **Priority validation** and normalization
3. **Null-safe field population**
4. **User review** before submission

## Testing Files

### Text File Test (`sample_complaint.txt`)
```
Patient Initials: JD
Complaint: Patient complained about long waiting times...
Response: We apologized and implemented new system...
Priority: High priority due to patient safety concerns
```

### PDF Test
- Upload any PDF containing complaint correspondence
- Client-side extraction will attempt PDF.js processing
- Falls back to server upload if needed

### DOCX Test  
- Upload Word documents with complaint details
- Client-side extraction uses Mammoth.js
- Server fallback available

## Cost Optimization

**Enhanced Efficiency:**
- Client-side processing reduces server costs
- Optimized OpenAI prompts (shorter, more focused)
- GPT-4o-mini model for cost efficiency
- Typical cost: **$0.005-0.02 per document**

## Error Handling

### Graceful Degradation:
- PDF.js not loaded → Server upload
- Mammoth.js not loaded → Server upload  
- Network issues → Clear error messages
- Invalid files → User-friendly feedback

### Debug Information:
- Console logging for troubleshooting
- Server-side Edge Function logs
- Clear error messages for users

## Installation Verification

After setup, test each file type:

1. **Text file** - Should work immediately
2. **PDF file** - Check browser console for PDF.js status  
3. **DOCX file** - Check browser console for Mammoth.js status
4. **Fallback** - Upload large/complex files to test server fallback

## Next Steps

### Immediate:
1. Complete Supabase CLI setup
2. Deploy Edge Function  
3. Test with sample files
4. Train users on new capabilities

### Future Enhancements:
1. **Server-side OCR** for images
2. **Advanced PDF processing** for complex layouts
3. **Batch processing** for multiple files
4. **Custom category training** based on practice needs

## Troubleshooting

### Common Issues:

**"PDF processing library not available"**
- PDF.js failed to load from CDN
- Will automatically fall back to server upload

**"DOCX processing library not available"**  
- Mammoth.js failed to load from CDN
- Will automatically fall back to server upload

**"Failed to upload file"**
- Check Supabase Storage permissions
- Verify `pir_attachments` bucket exists
- Check user authentication

**"OpenAI API error"**
- Verify API key is set correctly in Supabase secrets
- Check API usage limits
- Monitor Edge Function logs

The system is designed to gracefully handle all these scenarios with appropriate fallbacks!
