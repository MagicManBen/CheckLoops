#!/usr/bin/env node
/**
 * Script to add sample project management tasks to CheckLoop
 * Run this with proper authentication
 */

// Sample tasks that would typically need amendments in a project management system
const SAMPLE_TASKS = [
  {
    type: 'bug',
    title: 'Fix navigation menu collapse issue',
    description: `Element: .sidebar-toggle
Text: Navigation menu doesn't properly collapse on mobile devices
Notes: The hamburger menu icon is not responsive and causes layout issues on small screens`,
    status: 'open',
    page: 'navigation',
    element_selector: '.sidebar-toggle'
  },
  {
    type: 'feature',
    title: 'Add search functionality to user table',
    description: `Element: #users-table
Text: Users need ability to search through user records
Notes: Implement client-side filtering with search box above the table`,
    status: 'open',
    page: 'users',
    element_selector: '#users-table'
  },
  {
    type: 'bug',
    title: 'Table column width inconsistency',
    description: `Element: .table-wrap table
Text: Column widths are not consistent across different views
Notes: Need to standardize column width CSS classes for better alignment`,
    status: 'open',
    page: 'project-management',
    element_selector: '.table-wrap table'
  },
  {
    type: 'feature',
    title: 'Add bulk actions for task management',
    description: `Element: #project-tasks-tbody
Text: Need ability to select multiple tasks and perform bulk operations
Notes: Add checkboxes and bulk action bar with delete, status change options`,
    status: 'open',
    page: 'project-management',
    element_selector: '#project-tasks-tbody'
  },
  {
    type: 'bug',
    title: 'Modal form validation improvements',
    description: `Element: #crud-modal
Text: Form validation messages are not clearly visible
Notes: Error messages need better styling and positioning`,
    status: 'open',
    page: 'general',
    element_selector: '#crud-modal'
  },
  {
    type: 'feature',
    title: 'Implement task priority levels',
    description: `Element: .pir-status-chip
Text: Tasks need priority indicators (High, Medium, Low)
Notes: Add priority field to database and update UI with color-coded badges`,
    status: 'open',
    page: 'project-management',
    element_selector: '.pir-status-chip'
  },
  {
    type: 'bug',
    title: 'Date picker calendar positioning',
    description: `Element: .datepicker-wrapper
Text: Calendar popup appears off-screen on small devices
Notes: Calendar component needs responsive positioning logic`,
    status: 'open',
    page: 'general',
    element_selector: '.datepicker-wrapper'
  },
  {
    type: 'feature',
    title: 'Add task assignment functionality',
    description: `Element: .user-profile
Text: Tasks should be assignable to specific team members
Notes: Add assignee field and user selector dropdown`,
    status: 'open',
    page: 'project-management',
    element_selector: '.user-profile'
  }
];

console.log('Sample project management tasks to add:');
console.log('=====================================');

SAMPLE_TASKS.forEach((task, index) => {
  console.log(`${index + 1}. [${task.type.toUpperCase()}] ${task.title}`);
  console.log(`   Status: ${task.status}`);
  console.log(`   Page: ${task.page}`);
  console.log(`   Description: ${task.description.split('\\n')[0]}`);
  console.log('');
});

console.log('\\nTo add these tasks to your Supabase database, you can:');
console.log('1. Use the Supabase dashboard at https://supabase.com');
console.log('2. Navigate to Table Editor > project_issues');
console.log('3. Click "Insert" and add each task manually');
console.log('4. Or use the Supabase CLI with proper authentication');

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SAMPLE_TASKS;
}
