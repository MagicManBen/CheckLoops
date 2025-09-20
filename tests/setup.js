// Test setup file
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';
import '@testing-library/jest-dom';

// Enable request interception before tests
beforeAll(() => server.listen());

// Reset any runtime request handlers between tests
afterEach(() => server.resetHandlers());

// Clean up after tests
afterAll(() => server.close());