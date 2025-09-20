// Global Achievement System with Animations and Effects
// This file handles all achievement unlocking, notifications, and display

(function() {
  'use strict';

  const SPARKLE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

  // Achievement System Class
  class AchievementSystem {
    constructor() {
      this.supabase = null;
      this.user = null;
      this.kioskUserId = null;
      this.unlockedAchievements = new Set();
      this.recentUnlocks = new Map(); // Track recent unlocks for sparkle effect
      this.initialized = false;
    }

    async init(supabase, user) {
      if (this.initialized) return;
      
      this.supabase = supabase;
      this.user = user;
      
      // Get kiosk_user_id from profile
      await this.loadKioskUserId();
      
      // Load existing achievements
      await this.loadAchievements();
      
      // Add notification container to page if not exists
      this.setupNotificationContainer();
      
      // Add styles for animations
      this.injectStyles();
      
      this.initialized = true;
    }

    async loadKioskUserId() {
      if (!this.user?.id) return;
      
      const { data: profile } = await this.supabase
        .from('master_users')
        .select('kiosk_auth_auth_user_id')
        .eq('auth_user_id', this.user.id)
        .maybeSingle();
      
      this.kioskUserId = profile?.kiosk_user_id;
      console.log('[AchievementSystem] Loaded kiosk_user_id:', this.kioskUserId);
    }

    async loadAchievements() {
      if (!this.kioskUserId) return;
      
      const { data: achievements } = await this.supabase
        .from('user_achievements')
        .select('*')
        .eq('kiosk_user_id', this.kioskUserId);
      
      if (achievements) {
        achievements.forEach(a => {
          if (a.status === 'unlocked') {
            this.unlockedAchievements.add(a.achievement_key);
            
            // Check if recently unlocked (within 10 minutes)
            const unlockTime = new Date(a.unlocked_at).getTime();
            const now = Date.now();
            if (now - unlockTime < SPARKLE_DURATION) {
              this.recentUnlocks.set(a.achievement_key, unlockTime);
            }
          }
        });
      }
      
      console.log('[AchievementSystem] Loaded achievements:', this.unlockedAchievements.size);
    }

    async checkAndUnlock(achievementKey, metadata = {}) {
      if (!this.kioskUserId) {
        console.warn('[AchievementSystem] No kiosk_user_id, cannot unlock achievement');
        return false;
      }
      
      // Check if already unlocked
      if (this.unlockedAchievements.has(achievementKey)) {
        console.log('[AchievementSystem] Achievement already unlocked:', achievementKey);
        return false;
      }
      
      try {
        // Unlock the achievement
        const { data, error } = await this.supabase
          .from('user_achievements')
          .upsert({
            kiosk_user_id: this.kioskUserId,
            achievement_key: achievementKey,
            status: 'unlocked',
            progress_percent: 100,
            unlocked_at: new Date().toISOString(),
            metadata: metadata
          }, {
            onConflict: 'kiosk_user_id,achievement_key'
          })
          .select();
        
        if (error) {
          console.error('[AchievementSystem] Failed to unlock:', error);
          return false;
        }
        
        // Get achievement details
        const { data: achievementData } = await this.supabase
          .from('achievements')
          .select('*')
          .eq('key', achievementKey)
          .single();
        
        // Mark as unlocked
        this.unlockedAchievements.add(achievementKey);
        this.recentUnlocks.set(achievementKey, Date.now());
        
        // Show unlock notification
        this.showUnlockNotification(achievementData);
        
        // Update any achievement displays on the page
        this.updateAchievementDisplays();
        
        console.log('[AchievementSystem] Achievement unlocked:', achievementKey);
        return true;
        
      } catch (err) {
        console.error('[AchievementSystem] Error unlocking achievement:', err);
        return false;
      }
    }

    showUnlockNotification(achievement) {
      const container = document.getElementById('achievement-notifications');
      if (!container) return;
      
      // Create notification element
      const notification = document.createElement('div');
      notification.className = 'achievement-notification';
      notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-content">
          <div class="achievement-title">Achievement Unlocked!</div>
          <div class="achievement-name">${achievement?.name || 'New Achievement'}</div>
          <div class="achievement-desc">${achievement?.description || ''}</div>
        </div>
        <div class="achievement-sparkles"></div>
      `;
      
      // Add sparkles
      this.addSparkles(notification.querySelector('.achievement-sparkles'));
      
      // Add to container
      container.appendChild(notification);
      
      // Trigger animation
      setTimeout(() => notification.classList.add('show'), 10);
      
      // Play sound effect (optional)
      this.playUnlockSound();
      
      // Remove after animation
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
      }, 5000);
    }

    addSparkles(container) {
      for (let i = 0; i < 20; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.animationDelay = Math.random() * 2 + 's';
        sparkle.style.animationDuration = (2 + Math.random() * 2) + 's';
        container.appendChild(sparkle);
      }
    }

    playUnlockSound() {
      try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (e) {
        // Audio not supported or blocked
      }
    }

    updateAchievementDisplays() {
      // Update any achievement badges on the page
      const badges = document.querySelectorAll('.achievement-badge');
      badges.forEach(badge => {
        const key = badge.dataset.achievementKey;
        if (this.unlockedAchievements.has(key)) {
          badge.classList.add('unlocked');
          
          // Add sparkle if recently unlocked
          if (this.recentUnlocks.has(key)) {
            badge.classList.add('sparkle-effect');
          }
        }
      });
      
      // Update achievement count displays
      const countElements = document.querySelectorAll('.achievement-count');
      countElements.forEach(el => {
        el.textContent = this.unlockedAchievements.size;
      });
    }

    setupNotificationContainer() {
      if (!document.getElementById('achievement-notifications')) {
        const container = document.createElement('div');
        container.id = 'achievement-notifications';
        container.className = 'achievement-notifications-container';
        document.body.appendChild(container);
      }
    }

    injectStyles() {
      if (document.getElementById('achievement-system-styles')) return;
      
      const styles = document.createElement('style');
      styles.id = 'achievement-system-styles';
      styles.textContent = `
        /* Achievement Notification Container */
        .achievement-notifications-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          pointer-events: none;
        }
        
        /* Achievement Notification */
        .achievement-notification {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          margin-bottom: 10px;
          min-width: 320px;
          transform: translateX(400px);
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          pointer-events: auto;
          overflow: hidden;
        }
        
        .achievement-notification.show {
          transform: translateX(0);
          opacity: 1;
        }
        
        .achievement-notification::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(255,255,255,0.1),
            transparent
          );
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .achievement-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 48px;
          animation: bounce 1s ease-in-out;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-50%) scale(1.2); }
        }
        
        .achievement-content {
          margin-left: 80px;
        }
        
        .achievement-title {
          font-size: 12px;
          text-transform: uppercase;
          opacity: 0.9;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        
        .achievement-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .achievement-desc {
          font-size: 14px;
          opacity: 0.9;
        }
        
        /* Sparkles */
        .achievement-sparkles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          animation: sparkle-fall linear infinite;
        }
        
        @keyframes sparkle-fall {
          0% {
            transform: translateY(-100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) scale(1);
            opacity: 0;
          }
        }
        
        /* Sparkle effect for achievement badges */
        .achievement-badge.sparkle-effect {
          position: relative;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .achievement-badge.sparkle-effect::after {
          content: '✨';
          position: absolute;
          top: -5px;
          right: -5px;
          font-size: 16px;
          animation: sparkle-rotate 3s linear infinite;
        }
        
        @keyframes sparkle-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Achievement mini badge for home page */
        .achievement-mini-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
          transition: transform 0.2s;
        }
        
        .achievement-mini-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
        }
        
        .achievement-mini-badge .icon {
          font-size: 16px;
        }
      `;
      document.head.appendChild(styles);
    }

    // Get achievement summary for display
    async getAchievementSummary() {
      const { data: allAchievements } = await this.supabase
        .from('achievements')
        .select('*');
      
      const total = allAchievements?.length || 0;
      const unlocked = this.unlockedAchievements.size;
      
      return {
        total,
        unlocked,
        percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
        recent: Array.from(this.recentUnlocks.keys()).slice(0, 3)
      };
    }
  }

  // Create global instance
  window.AchievementSystem = new AchievementSystem();
  
  // Auto-check achievements on certain events
  document.addEventListener('quiz-completed', async (e) => {
    if (window.AchievementSystem.initialized) {
      await window.AchievementSystem.checkAndUnlock('first_practice_quiz', {
        quiz_id: e.detail?.quiz_id,
        score: e.detail?.score
      });
    }
  });
  
  document.addEventListener('training-uploaded', async (e) => {
    if (window.AchievementSystem.initialized) {
      await window.AchievementSystem.checkAndUnlock('first_training_upload', {
        training_id: e.detail?.training_id,
        type: e.detail?.type
      });
    }
  });
  
  document.addEventListener('onboarding-completed', async (e) => {
    if (window.AchievementSystem.initialized) {
      await window.AchievementSystem.checkAndUnlock('onboarding_completion', {
        completed_at: new Date().toISOString()
      });
    }
  });
})();
