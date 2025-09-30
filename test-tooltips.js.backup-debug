/**
 * Direct script to initialize tooltips immediately for testing
 * Run this in the browser console to apply tooltips without waiting
 */

// Sample test data to use if database isn't connected
const TEST_USERS = [
  { userId: '1', nickname: 'Ben Howard', avatarUrl: null },
  { userId: '2', nickname: 'John Smith', avatarUrl: null },
  { userId: '3', nickname: 'Emma Johnson', avatarUrl: null }
];

// Add test tooltips to all hearts
function addTestTooltips() {
  console.log('Adding test tooltips to hearts...');
  
  const hearts = document.querySelectorAll('.activity-heart');
  console.log(`Found ${hearts.length} hearts`);
  
  hearts.forEach((heart, index) => {
    // Remove existing tooltips
    const existingTooltip = heart.querySelector('.heart-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    // Generate random number of likes (1-3)
    const numLikes = Math.floor(Math.random() * 3) + 1;
    const users = TEST_USERS.slice(0, numLikes);
    
    // Create tooltip with test users
    const tooltip = document.createElement('div');
    tooltip.className = 'heart-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      right: 25px;
      top: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      padding: 8px;
      width: max-content;
      max-width: 220px;
      display: none;
      z-index: 100;
      border: 1px solid #e2e8f0;
      pointer-events: auto;
    `;
    
    // Add arrow
    tooltip.innerHTML = `
      <div style="font-weight: 600; font-size: 12px; margin-bottom: 6px; color: #475569;">
        ${users.length === 1 ? '1 person liked this' : `${users.length} people liked this`}
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${users.map(user => `
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: #0b4fb3; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">
              ${user.nickname.charAt(0)}
            </div>
            <div style="font-size: 12px; color: #1e293b;">${user.nickname}</div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add tooltip to heart
    heart.appendChild(tooltip);
    
    // Make the heart show cursor pointer
    heart.style.cursor = 'pointer';
    
    // Add event listeners
    heart.addEventListener('mouseover', () => {
      tooltip.style.display = 'block';
    });
    
    heart.addEventListener('mouseout', () => {
      tooltip.style.display = 'none';
    });
    
    console.log(`Added tooltip to heart ${index + 1}`);
  });
  
  return `Added tooltips to ${hearts.length} hearts`;
}

// Execute the function to add test tooltips
addTestTooltips();