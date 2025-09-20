// Achievement client for CheckLoop staff portal
// Provides a consistent way to load, unlock, and display achievements

const DEFAULT_ACHIEVEMENTS = [
  {
    key: 'onboarding_completion',
    name: 'Onboarding Complete',
    description: 'Wrap up your onboarding tasks and join the team.',
    icon: 'trophy',
    points: 50,
    metadata: { category: 'milestone' }
  },
  {
    key: 'first_practice_quiz',
    name: 'Practice Makes Perfect',
    description: 'Finish your first practice quiz session.',
    icon: 'star',
    points: 25,
    metadata: { category: 'learning' }
  },
  {
    key: 'first_training_upload',
    name: 'Training Champion',
    description: 'Log the first record in your training tracker.',
    icon: 'certificate',
    points: 25,
    metadata: { category: 'learning' }
  },
  {
    key: 'quiz_complete',
    name: 'Quiz Master',
    description: 'Submit a mandatory quiz on time.',
    icon: 'medal',
    points: 40,
    metadata: { category: 'compliance' }
  },
  {
    key: 'quiz_perfect',
    name: 'Perfect Score',
    description: 'Score 100% on any quiz attempt.',
    icon: 'sparkles',
    points: 60,
    metadata: { category: 'excellence' }
  },
  {
    key: 'practice_pro',
    name: 'Practice Pro',
    description: 'Complete five practice quizzes to sharpen your skills.',
    icon: 'target',
    points: 40,
    metadata: { category: 'learning' }
  },
  {
    key: 'quiz_hat_trick',
    name: 'Quiz Hat Trick',
    description: 'Submit three required weekly quizzes.',
    icon: 'medal',
    points: 80,
    metadata: { category: 'compliance' }
  },
  {
    key: 'training_triple',
    name: 'Learning Legend',
    description: 'Log three separate training records.',
    icon: 'books',
    points: 60,
    metadata: { category: 'learning' }
  },
  {
    key: 'compliance_star',
    name: 'Compliance Star',
    description: 'Reach 90% training compliance or higher.',
    icon: 'star',
    points: 100,
    metadata: { category: 'compliance' }
  },
  {
    key: 'scan_sprinter',
    name: 'Scan Sprinter',
    description: 'Complete ten equipment scans in a single week.',
    icon: 'scanner',
    points: 50,
    metadata: { category: 'operations' }
  }
];

function ensureObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
}

let toastStylesInjected = false;
function ensureToastStyles() {
  if (toastStylesInjected) return;
  toastStylesInjected = true;
  const style = document.createElement('style');
  style.id = 'achievement-toast-styles';
  style.textContent = `
    .achievement-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }
    .achievement-toast {
      min-width: 260px;
      max-width: 320px;
      background: linear-gradient(135deg, #6366f1, #22d3ee);
      color: #fff;
      border-radius: 14px;
      padding: 16px 18px 16px 60px;
      box-shadow: 0 18px 45px rgba(79, 70, 229, 0.25);
      position: relative;
      opacity: 0;
      transform: translateX(40px);
      transition: opacity 0.35s ease, transform 0.35s ease;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      pointer-events: auto;
      overflow: hidden;
    }
    .achievement-toast.show {
      opacity: 1;
      transform: translateX(0);
    }
    .achievement-toast::before {
      content: '🏆';
      position: absolute;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 28px;
    }
    .achievement-toast-title {
      text-transform: uppercase;
      font-size: 13px;
      letter-spacing: 1.1px;
      font-weight: 700;
      opacity: 0.9;
    }
    .achievement-toast-name {
      font-size: 18px;
      font-weight: 700;
      margin-top: 2px;
    }
    .achievement-toast-desc {
      font-size: 13px;
      margin-top: 4px;
      opacity: 0.85;
    }
  `;
  document.head.appendChild(style);
}

function ensureToastContainer() {
  let container = document.getElementById('achievement-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'achievement-toast-container';
    container.className = 'achievement-toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function normalizeDefinition(row) {
  if (!row) return null;
  return {
    key: row.key,
    name: row.name || row.key,
    description: row.description || '',
    icon: row.icon || 'trophy',
    points: Number.isFinite(row.points) ? row.points : 0,
    metadata: ensureObject(row.metadata || row.meta)
  };
}

class AchievementClient {
  constructor({ supabase, session, profile, userId, kioskUserId, showToasts = true }) {
    this.supabase = supabase;
    this.session = session || null;
    this.profile = profile || null;
    this.userId = userId || session?.user?.id || null;
    this.kioskUserId = kioskUserId || profile?.kiosk_user_id || null;
    this.siteId = profile?.site_id || session?.user?.raw_user_meta_data?.site_id || null;
    this.showToasts = showToasts;

    this.definitionList = [];
    this.definitionMap = new Map();
    this.statusList = [];
    this.statusMap = new Map();
    this.unlockListeners = [];

    this.definitionsPromise = null;
    this.statusPromise = null;
  }

  async init() {
    await Promise.all([
      this.loadDefinitions(),
      this.loadIdentifiers(),
    ]);
    await this.loadStatuses();
    return this;
  }

  async loadIdentifiers() {
    if (this.kioskUserId || !this.userId || !this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from('master_users')
        .select('kiosk_user_id, site_id')
        .eq('auth_user_id', this.userId)
        .maybeSingle();
      if (!error && data) {
        if (!this.kioskUserId && data.kiosk_user_id != null) {
          this.kioskUserId = data.kiosk_user_id;
        }
        if (!this.siteId && data.site_id != null) {
          this.siteId = data.site_id;
        }
      }
    } catch (err) {
      console.warn('[AchievementClient] Failed to resolve kiosk_user_id', err);
    }
  }

  async loadDefinitions(force = false) {
    if (!force && this.definitionList.length) return this.definitionList;
    if (this.definitionsPromise && !force) return this.definitionsPromise;

    this.definitionsPromise = (async () => {
      if (!this.supabase) {
        return DEFAULT_ACHIEVEMENTS.map(normalizeDefinition);
      }
      try {
        const { data, error } = await this.supabase
          .from('achievements')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        const defaults = DEFAULT_ACHIEVEMENTS.map(normalizeDefinition);
        const supabaseRows = Array.isArray(data) ? data.map(normalizeDefinition) : [];

        const merged = new Map();
        defaults.forEach(def => merged.set(def.key, def));
        supabaseRows.forEach(def => { if (def?.key) merged.set(def.key, def); });

        const rows = Array.from(merged.values());
        this.definitionList = rows;
        this.definitionMap = merged;
        return rows;
      } catch (err) {
        console.warn('[AchievementClient] Falling back to defaults:', err?.message || err);
        const rows = DEFAULT_ACHIEVEMENTS.map(normalizeDefinition);
        this.definitionList = rows;
        this.definitionMap = new Map(rows.map(row => [row.key, row]));
        return rows;
      }
    })();

    return this.definitionsPromise;
  }

  async loadStatuses(force = false) {
    if (!force && this.statusList.length) return this.statusList;
    if (this.statusPromise && !force) return this.statusPromise;

    this.statusPromise = (async () => {
      if (!this.supabase || (!this.userId && this.kioskUserId == null)) {
        this.statusList = [];
        this.statusMap = new Map();
        return [];
      }

      try {
        let query = this.supabase
          .from('user_achievements')
          .select('id, achievement_key, status, progress_percent, unlocked_at, metadata, kiosk_user_id, user_id')
          .order('unlocked_at', { ascending: true, nullsFirst: true });

        if (this.userId && this.kioskUserId != null) {
          query = query.or(`user_id.eq.${this.userId},kiosk_user_id.eq.${this.kioskUserId}`);
        } else if (this.userId) {
          query = query.eq('user_id', this.userId);
        } else {
          query = query.eq('kiosk_user_id', this.kioskUserId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const rows = Array.isArray(data) ? data : [];
        this.statusList = rows;
        this.statusMap = new Map(rows.map(row => [row.achievement_key, row]));
        return rows;
      } catch (err) {
        console.warn('[AchievementClient] Failed to load user achievements:', err?.message || err);
        this.statusList = [];
        this.statusMap = new Map();
        return [];
      }
    })();

    return this.statusPromise;
  }

  getAll() {
    if (!this.definitionList.length) {
      this.definitionList = DEFAULT_ACHIEVEMENTS.map(normalizeDefinition);
      this.definitionMap = new Map(this.definitionList.map(row => [row.key, row]));
    }

    return this.definitionList.map(def => {
      const status = this.statusMap.get(def.key) || null;
      return {
        ...def,
        status: status?.status || 'locked',
        progress_percent: status?.progress_percent ?? (status?.status === 'unlocked' ? 100 : 0),
        unlocked_at: status?.unlocked_at || null,
        userAchievement: status || null
      };
    });
  }

  getUnlocked() {
    return this.getAll().filter(item => item.status === 'unlocked');
  }

  getSummary() {
    const list = this.getAll();
    const total = list.length;
    const unlocked = list.filter(item => item.status === 'unlocked').length;
    return {
      total,
      unlocked,
      percentage: total ? Math.round((unlocked / total) * 100) : 0
    };
  }

  isUnlocked(key) {
    return (this.statusMap.get(key)?.status || 'locked') === 'unlocked';
  }

  async refresh({ forceDefinitions = false } = {}) {
    if (forceDefinitions) {
      this.definitionList = [];
      this.definitionMap.clear();
      this.definitionsPromise = null;
      await this.loadDefinitions(true);
    }
    this.statusList = [];
    this.statusMap.clear();
    this.statusPromise = null;
    await this.loadStatuses(true);
    return this.getAll();
  }

  onUnlock(listener) {
    if (typeof listener === 'function') {
      this.unlockListeners.push(listener);
    }
  }

  async ensureUnlocked(key, {
    condition = true,
    metadata = {},
    progress = 100,
    notify = this.showToasts,
    refresh = true
  } = {}) {
    if (!condition) return false;
    if (this.isUnlocked(key)) return false;
    if (!this.supabase) return false;

    const payload = {
      achievement_key: key,
      status: 'unlocked',
      progress_percent: progress,
      unlocked_at: new Date().toISOString(),
      metadata: ensureObject(metadata)
    };
    if (this.kioskUserId != null) payload.kiosk_user_id = this.kioskUserId;
    if (this.userId) payload.user_id = this.userId;

    const conflictTargets = [];
    if (this.kioskUserId != null) conflictTargets.push('kiosk_user_id,achievement_key');
    if (this.userId) conflictTargets.push('user_id,achievement_key');
    if (!conflictTargets.length) conflictTargets.push('achievement_key');

    let finalRow = null;
    let lastError = null;

    for (const target of conflictTargets) {
      try {
        const { data, error } = await this.supabase
          .from('user_achievements')
          .upsert(payload, { onConflict: target })
          .select();

        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        finalRow = row || payload;
        break;
      } catch (err) {
        lastError = err;
        const message = err?.message || '';
        const conflictMissing = message.includes('there is no unique or exclusion constraint');
        const nullConstraint = message.includes('null value');
        if (!conflictMissing && !nullConstraint) {
          break;
        }
      }
    }

    if (!finalRow && lastError) {
      console.error('[AchievementClient] Failed to unlock achievement', key, lastError);
      return false;
    }

    if (refresh) {
      await this.refresh();
    } else {
      this.statusMap.set(key, finalRow);
      this.statusList.push(finalRow);
    }

    const definition = this.definitionMap.get(key) || normalizeDefinition(DEFAULT_ACHIEVEMENTS.find(a => a.key === key));
    this.notifyUnlock({ row: finalRow, definition, notify });
    return true;
  }

  notifyUnlock({ row, definition, notify }) {
    if (notify) {
      this.renderToast(definition);
    }
    this.unlockListeners.forEach(listener => {
      try {
        listener({ definition, row });
      } catch (err) {
        console.warn('[AchievementClient] unlock listener failed', err);
      }
    });
  }

  renderToast(definition) {
    if (!this.showToasts) return;
    ensureToastStyles();
    const container = ensureToastContainer();

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="achievement-toast-title">Achievement unlocked</div>
      <div class="achievement-toast-name">${definition?.name || 'New achievement'}</div>
      <div class="achievement-toast-desc">${definition?.description || ''}</div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }
}

export async function createAchievementClient(options) {
  const client = new AchievementClient(options || {});
  await client.init();
  return client;
}

export { DEFAULT_ACHIEVEMENTS };
