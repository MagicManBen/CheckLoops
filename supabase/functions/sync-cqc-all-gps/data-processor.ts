// Data processor for transforming CQC API data into database records
// Handles normalization and merging of data from different endpoints

import { CqcLocation, CqcProvider, CqcReport } from './api-client.ts';

// Define the output record structure
export interface CqcGpRecord {
  location_id: string;
  location_name: string;
  address_line_1?: string;
  address_line_2?: string;
  town_city?: string;
  county?: string;
  region?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  provider_id?: string;
  overall_rating?: string;
  last_inspection_date?: string;
  registration_date?: string;
  closure_date?: string;
  location_source: any;
  provider_source: any;
  ratings: any;
  regulated_activities: any;
  contacts: any;
  inspection_areas: any;
  reports: any[];
  last_seen_at: string;
}

export class DataProcessor {
  // Process a location and its related data into a unified record
  processLocation(
    location: CqcLocation, 
    provider: CqcProvider | null, 
    reports: CqcReport[]
  ): CqcGpRecord {
    // Extract address components
    const address = location.postalAddressElements || {};
    const geoLocation = location.geoLocation || {};
    
    // Extract top-level scalars
    const record: CqcGpRecord = {
      location_id: location.locationId,
      location_name: location.name || location.locationName || '',
      address_line_1: address.addressLine1 || '',
      address_line_2: address.addressLine2 || '',
      town_city: address.town || '',
      county: address.county || '',
      region: address.region || location.region || '',
      postcode: address.postalCode || '',
      latitude: geoLocation.latitude ? parseFloat(geoLocation.latitude) : null,
      longitude: geoLocation.longitude ? parseFloat(geoLocation.longitude) : null,
      provider_id: location.providerId || '',
      overall_rating: this.extractOverallRating(location),
      last_inspection_date: this.extractLastInspectionDate(location),
      registration_date: location.registrationDate || null,
      closure_date: location.deregistrationDate || null,
      
      // Store complete source data
      location_source: location,
      provider_source: provider || null,
      
      // Extract nested structures
      ratings: this.extractRatings(location, provider),
      regulated_activities: location.regulatedActivities || [],
      contacts: location.contacts || [],
      inspection_areas: location.inspectionAreas || [],
      reports: reports || [],
      
      // Book-keeping
      last_seen_at: new Date().toISOString()
    };
    
    return record;
  }
  
  // Extract overall rating from location or provider
  private extractOverallRating(location: CqcLocation): string {
    if (location.currentRatings && 
        Array.isArray(location.currentRatings) && 
        location.currentRatings.length > 0) {
      
      // Look for the overall rating
      const overallRating = location.currentRatings.find(
        (rating: any) => rating.key === 'overall' || rating.key === 'Overall'
      );
      
      if (overallRating) {
        return overallRating.rating || '';
      }
    }
    
    return '';
  }
  
  // Extract last inspection date
  private extractLastInspectionDate(location: CqcLocation): string | null {
    if (location.inspectionAreas && Array.isArray(location.inspectionAreas)) {
      // Get the most recent inspection date
      const dates = location.inspectionAreas
        .map((area: any) => area.inspectionDate)
        .filter((date: string) => date)
        .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
        
      if (dates.length > 0) {
        return dates[0];
      }
    }
    
    if (location.lastInspectionDate) {
      return location.lastInspectionDate;
    }
    
    return null;
  }
  
  // Extract and combine ratings from location and provider
  private extractRatings(location: CqcLocation, provider: CqcProvider | null): any {
    const ratings = {
      current: location.currentRatings || [],
      historic: location.historicRatings || []
    };
    
    // If provider has ratings and location doesn't, use provider ratings
    if (provider && 
        (!ratings.current || ratings.current.length === 0) && 
        provider.currentRatings && 
        provider.currentRatings.length > 0) {
      ratings.current = provider.currentRatings;
    }
    
    // Add provider historic ratings if available
    if (provider && provider.historicRatings && provider.historicRatings.length > 0) {
      // Check if location already has historic ratings
      if (!ratings.historic || ratings.historic.length === 0) {
        ratings.historic = provider.historicRatings;
      } else {
        // Otherwise add provider ratings that don't exist in location ratings
        const existingDates = new Set(
          ratings.historic.map((r: any) => r.reportDate || r.date)
        );
        
        const newRatings = provider.historicRatings.filter(
          (r: any) => !existingDates.has(r.reportDate || r.date)
        );
        
        ratings.historic = [...ratings.historic, ...newRatings];
      }
    }
    
    return ratings;
  }
}