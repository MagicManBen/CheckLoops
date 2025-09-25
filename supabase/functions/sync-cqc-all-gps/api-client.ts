// API client for communicating with CQC endpoints
// Handles pagination, retries, and error handling

// Define constants
const CQC_BASE_URL = 'https://api.cqc.org.uk/public/v1';
const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 500; // ms

// Types
export interface CqcLocation {
  locationId: string;
  providerId: string;
  name: string;
  [key: string]: any;
}

export interface CqcProvider {
  providerId: string;
  name: string;
  [key: string]: any;
}

export interface CqcReport {
  reportLinkId: string;
  title: string;
  [key: string]: any;
}

export interface CqcChange {
  id: string;
  [key: string]: any;
}

// API client with retry logic
export class CqcApiClient {
  private apiKey: string;
  private retryAttempts = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Reset retry counter
  public resetRetryCounter(): void {
    this.retryAttempts = 0;
  }

  // Get retry attempts count
  public getRetryAttempts(): number {
    return this.retryAttempts;
  }

  // Make HTTP request with retry logic
  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    headers.set('User-Agent', 'CheckLoops/1.0 (+info@checkloops.co.uk)');
    headers.set('Ocp-Apim-Subscription-Key', this.apiKey);

    const requestOptions: RequestInit = {
      ...options,
      headers
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff with jitter
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1) * (0.5 + Math.random());
          await new Promise(resolve => setTimeout(resolve, delay));
          this.retryAttempts++;
        }
        
        const response = await fetch(`${CQC_BASE_URL}${url}`, requestOptions);
        
        // Rate limiting or server errors should be retried
        if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
          if (attempt < MAX_RETRIES) {
            lastError = new Error(`Request failed with status ${response.status}, retrying...`);
            continue;
          }
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt >= MAX_RETRIES) {
          break;
        }
      }
    }
    
    throw lastError || new Error(`Request to ${url} failed after ${MAX_RETRIES} retries`);
  }

  // Fetch all GP practice locations with pagination
  async fetchAllGpLocations(): Promise<CqcLocation[]> {
    let nextPageUrl = '/locations?inspectionCategoryName=GP%20Practices&perPage=500';
    let allLocations: CqcLocation[] = [];
    let pageCount = 0;
    
    while (nextPageUrl) {
      pageCount++;
      const response = await this.makeRequest(nextPageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      allLocations = allLocations.concat(data.locations || []);
      
      // Check if there's a next page
      nextPageUrl = data.nextPageUri ? data.nextPageUri.replace(CQC_BASE_URL, '') : null;
    }
    
    return allLocations;
  }

  // Fetch a single GP practice location by ID
  async fetchLocationById(locationId: string): Promise<CqcLocation> {
    const response = await this.makeRequest(`/locations/${locationId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch location ${locationId}: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Fetch provider details by ID
  async fetchProviderById(providerId: string): Promise<CqcProvider> {
    const response = await this.makeRequest(`/providers/${providerId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch provider ${providerId}: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Fetch report details by reportLinkId
  async fetchReportById(reportLinkId: string): Promise<CqcReport> {
    const response = await this.makeRequest(`/reports/${reportLinkId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch report ${reportLinkId}: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Fetch changed locations between timestamps
  async fetchLocationChanges(startTimestamp: string, endTimestamp?: string): Promise<CqcChange[]> {
    let url = `/changes/location?startTimestamp=${encodeURIComponent(startTimestamp)}`;
    
    if (endTimestamp) {
      url += `&endTimestamp=${encodeURIComponent(endTimestamp)}`;
    }
    
    const response = await this.makeRequest(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch location changes: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.changes || [];
  }

  // Fetch changed providers between timestamps
  async fetchProviderChanges(startTimestamp: string, endTimestamp?: string): Promise<CqcChange[]> {
    let url = `/changes/provider?startTimestamp=${encodeURIComponent(startTimestamp)}`;
    
    if (endTimestamp) {
      url += `&endTimestamp=${encodeURIComponent(endTimestamp)}`;
    }
    
    const response = await this.makeRequest(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch provider changes: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.changes || [];
  }

  // Fetch inspection areas reference data
  async fetchInspectionAreas(): Promise<any> {
    const response = await this.makeRequest('/inspectionareas');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inspection areas: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
}