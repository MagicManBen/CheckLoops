# 🔧 Multi-Environment Testing Guide

## 📋 Setup Checklist

### ✅ **1. Supabase URL Configuration**
Go to: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/auth/url-configuration

Add ALL these redirect URLs:
```
https://magicmanben.github.io/CheckLoops/**
http://127.0.0.1:5500/**
http://localhost:5500/**
http://127.0.0.1:5501/**
http://127.0.0.1:5502/**
```

### ✅ **2. Database Constraints**
Run `fix_profile_constraints.sql` in Supabase SQL Editor to fix profile creation errors.

## 🌍 **Environment Detection**

The system now automatically detects your environment:

- **Local Development**: `127.0.0.1` or `localhost` 
- **Production**: `magicmanben.github.io`

## 🧪 **Testing Both Environments**

### **Local Development Testing:**
1. Start VS Code Live Server (port 5500)
2. Open `http://127.0.0.1:5500/index.html`
3. Send invite - email will redirect to `http://127.0.0.1:5500/simple-set-password.html`
4. Console shows: `🌍 Environment: local`

### **Production Testing:**
1. Visit `https://magicmanben.github.io/CheckLoops/index.html`
2. Send invite - email will redirect to `https://magicmanben.github.io/CheckLoops/simple-set-password.html`
3. Console shows: `🌍 Environment: production`

## 🔍 **Debug Information**

Both environments show helpful debug info in the console:
```
🌍 Environment: local/production
🔗 Base URL: http://127.0.0.1:5500 / https://magicmanben.github.io/CheckLoops
🔑 Password Redirect: [appropriate URL for environment]
```

## ⚡ **Key Benefits**

- **No code changes needed** when switching between environments
- **Same Supabase project** works for both local and production
- **Automatic redirect URLs** based on where you're testing
- **Easy debugging** with environment detection

## 🚨 **If Something Doesn't Work**

1. Check browser console for environment detection
2. Verify Supabase redirect URLs are configured
3. Make sure `config.js` is loading (check Network tab)
4. Run database constraint fix if profile creation fails
