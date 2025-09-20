import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';

export const handlers = [
  // Mock profiles table query - should fail
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json(
      {
        message: 'relation "public.profiles" does not exist',
        code: '42P01'
      },
      { status: 404 }
    );
  }),

  // Mock master_users table query - should succeed
  http.get(`${SUPABASE_URL}/rest/v1/master_users`, () => {
    return HttpResponse.json([
      {
        id: 1,
        auth_user_id: '123e4567-e89b-12d3-a456-426614174000',
        kiosk_user_id: 100,  // correct column name
        email: 'test@example.com',
        full_name: 'Test User',
        site_id: 1,
        role: 'admin'
      }
    ]);
  }),

  // Mock complaints table
  http.get(`${SUPABASE_URL}/rest/v1/complaints`, () => {
    return HttpResponse.json([
      {
        id: 1,
        site_id: 1,
        datetime: '2024-01-01',
        patient_initials: 'JD',
        category: 'Service',
        status: 'pending'
      }
    ]);
  }),

  // Mock training_records table
  http.get(`${SUPABASE_URL}/rest/v1/training_records`, () => {
    return HttpResponse.json([
      {
        id: 1,
        staff_id: 1,
        user_id: '123e4567-e89b-12d3-a456-426614174000', // UUID reference
        training_type_id: 1,
        site_id: 1,
        completion_date: '2024-01-01'
      }
    ]);
  }),

  // Mock RPC call that might reference profiles
  http.post(`${SUPABASE_URL}/rest/v1/rpc/transfer_fuzzy_match_to_request`, () => {
    return HttpResponse.json(
      {
        message: 'relation "profiles" does not exist',
        code: '42P01'
      },
      { status: 500 }
    );
  }),

  // Mock holiday requests table
  http.get(`${SUPABASE_URL}/rest/v1/4_holiday_requests`, () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        site_id: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        status: 'pending'
      }
    ]);
  }),

  // Mock auth session
  http.get(`${SUPABASE_URL}/auth/v1/session`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com'
      }
    });
  })
];