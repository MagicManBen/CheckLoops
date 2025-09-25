// Fix for holiday approval system
document.addEventListener('DOMContentLoaded', function() {
  // Add a fix button at the bottom of the page for administrators
  const fixButton = document.createElement('button');
  fixButton.id = 'fix-holiday-approval-column';
  fixButton.className = 'btn secondary';
  fixButton.style.position = 'fixed';
  fixButton.style.bottom = '20px';
  fixButton.style.right = '20px';
  fixButton.style.zIndex = '1000';
  fixButton.style.fontSize = '12px';
  fixButton.style.padding = '8px 12px';
  fixButton.style.opacity = '0.7';
  fixButton.style.display = 'none'; // Start hidden until we check if needed
  fixButton.textContent = '🔧 Fix Holiday Approval System';
  
  fixButton.addEventListener('click', async function() {
    if (confirm('This will attempt to add the holiday_approved column to the master_users table. Continue?')) {
      try {
        fixButton.disabled = true;
        fixButton.textContent = '⏳ Fixing...';
        
        // Execute the SQL to add the column if not exists
        const { error } = await window.supabase.rpc('add_holiday_approved_column');
        
        if (error) {
          console.error('Error fixing holiday approval column:', error);
          alert('Error: ' + error.message);
          fixButton.textContent = '❌ Fix Failed';
          setTimeout(() => {
            fixButton.textContent = '🔧 Fix Holiday Approval System';
            fixButton.disabled = false;
          }, 2000);
          return;
        }
        
        // Success!
        fixButton.textContent = '✅ Fixed!';
        setTimeout(() => {
          fixButton.style.display = 'none';
          location.reload(); // Reload the page to apply changes
        }, 2000);
        
      } catch (err) {
        console.error('Error executing fix:', err);
        alert('An error occurred while fixing the holiday approval system.');
        fixButton.textContent = '❌ Fix Failed';
        setTimeout(() => {
          fixButton.textContent = '🔧 Fix Holiday Approval System';
          fixButton.disabled = false;
        }, 2000);
      }
    }
  });
  
  document.body.appendChild(fixButton);
  
  // Check if the fix is needed
  checkIfFixNeeded();
  
  async function checkIfFixNeeded() {
    try {
      const { data, error } = await window.supabase.rpc('check_holiday_approved_column_exists');
      
      if (error) {
        console.error('Error checking holiday_approved column:', error);
        // If we got an error, it likely means our RPC function doesn't exist yet
        // Show the button to let user create it
        fixButton.style.display = 'block';
        return;
      }
      
      const columnExists = data?.exists || false;
      
      if (!columnExists) {
        console.log('holiday_approved column does not exist, showing fix button');
        fixButton.style.display = 'block';
      } else {
        console.log('holiday_approved column exists, no fix needed');
      }
    } catch (err) {
      console.error('Error checking if fix is needed:', err);
      // Show the button in case of any error
      fixButton.style.display = 'block';
    }
  }
});