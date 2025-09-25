// Configuration module for handling environment variables and secrets
// Used to centralize access to configuration values and API keys

export interface Config {
  supabaseUrl: string;
  supabaseServiceKey: string;
  cqcApiKey: string;
}

// Load configuration values from environment variables
export const loadConfig = (): Config => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://unveoqnlqnobufhublyw.supabase.co';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // For dev testing use placeholder, but for production it should be set as a secret
  const cqcApiKey = Deno.env.get('CQC_API_KEY');
  
  if (!supabaseServiceKey) {
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }

  if (!cqcApiKey) {
    throw new Error('Missing required environment variable: CQC_API_KEY');
  }
  
  return {
    supabaseUrl,
    supabaseServiceKey,
    cqcApiKey,
  };
};

// Validate that required secrets are set
export const validateSecrets = (): void => {
  const requiredSecrets = ['SUPABASE_SERVICE_ROLE_KEY', 'CQC_API_KEY'];
  
  const missingSecrets = requiredSecrets.filter(secret => !Deno.env.get(secret));
  
  if (missingSecrets.length > 0) {
    throw new Error(`Missing required secrets: ${missingSecrets.join(', ')}`);
  }
};

// Validate authorization headers
export const validateAuthorization = (authHeader: string | null): boolean => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  // In a production environment, you would validate the JWT token here
  // For simplicity in this example, we just check that it's not empty
  const token = authHeader.replace('Bearer ', '');
  return token.length > 0;
};

// Create headers for CQC API requests
export const createCqcApiHeaders = (apiKey: string): Headers => {
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('User-Agent', 'CheckLoops/1.0 (+info@checkloops.co.uk)');
  headers.set('Ocp-Apim-Subscription-Key', apiKey);
  
  return headers;
};