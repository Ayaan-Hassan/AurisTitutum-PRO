import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Icon from './components/Icon';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Habits from './pages/Habits';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useHabitNotifications } from './hooks/useHabitNotifications';
import ToastContainer from './components/Toast';

// Image compression utility
const compressImage = (base64Str) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 128;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

const Preloader = memo(({ isLoading }) => {
  // Only render if needed to avoid DOM clutter, but keep it for exit animation
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShouldRender(false), 1000); // Wait for CSS transition
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div className={`preloader-container ${!isLoading ? 'loaded' : ''}`}>
      <div className="logo-box"><div className="logo-inner"></div></div>
      <p className="preloader-title">AurisTitutum <span>| PRO</span></p>
    </div>
  );
});

function AppContent() {
  // Use a ref to ensure preloader helps with strict mode double-invocations in dev,
  // though mostly visual check.
  const [isLoading, setIsLoading] = useState(true);

  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habitflow_pro_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [userConfig, setUserConfig] = useState(() => {
    const saved = localStorage.getItem('habitflow_pro_user');
    const defaultUser = {
      name: 'Ayaan Hassan',
      email: 'ayaan.h@habitflow.io',
      avatar: null,
      settings: { persistence: true, audit: true, devConsole: false, notificationsEnabled: true }
    };
    return saved ? { ...defaultUser, ...JSON.parse(saved) } : defaultUser;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', type: 'Good', mode: 'quick', unit: '' });
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const fileInputRef = useRef(null);

  const { user } = useAuth();
  useEffect(() => {
    if (user?.email) setUserConfig(prev => ({ ...prev, email: user.email, name: user.name || prev.name }));
  }, [user?.email, user?.name]);

  const { toasts, removeToast } = useHabitNotifications(habits, userConfig.settings);

  useEffect(() => {
    // Force a minimum load time for the aesthetic "boot" feel
    const timer = setTimeout(() => setIsLoading(false), 2500);

    const showModalListener = () => setShowAddModal(true);
    document.addEventListener('showModal', showModalListener);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('showModal', showModalListener);
    };
  }, []);

  useEffect(() => { localStorage.setItem('habitflow_pro_data', JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem('habitflow_pro_user', JSON.stringify(userConfig)); }, [userConfig]);

  const logActivity = (id, increment = true, amount = 1, unit = '') => {
    const amt = Math.max(1, Math.floor(Number(amount) || 1));
    const now = new Date();
    const todayKey = now.toISOString().split('T')[0];
    const timestamp = now.toLocaleTimeString([], { hour12: false });

    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;

      const isCountMode = h.mode === 'count';
      let updatedLogs = [...(h.logs || [])];
      let updatedTotal = h.totalLogs;

      if (increment) {
        const existingDateIdx = updatedLogs.findIndex(l => l.date === todayKey);
        if (isCountMode) {
          const value = amt;
          const entryStr = `${timestamp}|${value}|${unit || (h.unit || '')}`;
          updatedTotal += value;
          if (existingDateIdx > -1) {
            updatedLogs[existingDateIdx].count += value;
            updatedLogs[existingDateIdx].entries = [...(updatedLogs[existingDateIdx].entries || []), entryStr];
          } else {
            updatedLogs.push({ date: todayKey, count: value, entries: [entryStr] });
          }
        } else {
          updatedTotal += amt;
          const newEntries = Array(amt).fill(timestamp);
          if (existingDateIdx > -1) {
            updatedLogs[existingDateIdx].count += amt;
            updatedLogs[existingDateIdx].entries = [...(updatedLogs[existingDateIdx].entries || []), ...newEntries];
          } else {
            updatedLogs.push({ date: todayKey, count: amt, entries: newEntries });
          }
        }
      } else {
        const dateIdx = updatedLogs.findIndex(l => l.date === todayKey);
        if (isCountMode && dateIdx > -1 && updatedLogs[dateIdx].entries?.length > 0) {
          const lastEntry = updatedLogs[dateIdx].entries.pop();
          const parts = lastEntry.split('|');
          const val = parseInt(parts[1], 10) || 1;
          updatedLogs[dateIdx].count -= val;
          updatedTotal -= val;
          if (updatedLogs[dateIdx].count <= 0) updatedLogs.splice(dateIdx, 1);
        } else {
          const removeCount = Math.min(amt, updatedTotal);
          if (removeCount <= 0) return h;
          updatedTotal -= removeCount;
          if (dateIdx > -1 && updatedLogs[dateIdx].count > 0) {
            const toRemove = Math.min(removeCount, updatedLogs[dateIdx].count);
            updatedLogs[dateIdx].count -= toRemove;
            for (let i = 0; i < toRemove; i++) {
              if (updatedLogs[dateIdx].entries?.length > 0) {
                updatedLogs[dateIdx].entries.pop();
              }
            }
            if (updatedLogs[dateIdx].count === 0) updatedLogs.splice(dateIdx, 1);
          }
        }
      }
      return { ...h, logs: updatedLogs, totalLogs: updatedTotal };
    }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const compressed = await compressImage(event.target.result);
      setUserConfig(prev => ({ ...prev, avatar: compressed }));
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const DAILY_INSIGHTS = [
    { title: "Welcome to AurisTitutum!", body: "Create your first habit stream and start shaping your daily routines." },
    { title: "Ready for Action?", body: "Tap the + button whenever you complete a task. Small steps build big change." },
    { title: "You're Crushing It!", body: "With 80% positive habits, you're building an incredible foundation. Keep it up!" },
    { title: "Great Balance!", body: "You're mostly focused on positive routines. Try reducing one bad habit this week." },
    { title: "Consistency is Key", body: "Logging every day, even once, strengthens the tracking habit." },
    { title: "Momentum Builder", body: "Every logged action is a vote for the person you're becoming." },
    { title: "Stack Your Wins", body: "Chain small habits together. Morning stretch → water → log. Build the sequence." },
    { title: "Track, Don't Judge", body: "The goal is awareness. Notice patterns; adjust with kindness." },
    { title: "One Habit at a Time", body: "Focus on one change until it sticks. Then add the next." },
    { title: "Streaks Are Feedback", body: "A streak isn't pressure—it's proof you're showing up." },
    { title: "Rest Counts Too", body: "Recovery days are part of the system. Log rest if it helps." },
    { title: "Environment Shapes Behavior", body: "Make the good habit obvious and the bad one invisible." },
    { title: "Start Tiny", body: "One push-up, one page, one minute. Tiny is sustainable." },
    { title: "Identity Over Outcome", body: "You're not 'trying to read'—you're a reader. Act like one." },
    { title: "Log Before You Judge", body: "Data first. See what you actually do before changing it." },
    { title: "Good Days and Off Days", body: "Both are data. Look at the trend, not a single day." },
    { title: "Habit Stacking Works", body: "After [current habit], I will [new habit]. Attach to existing cues." },
    { title: "Reward the Process", body: "Celebrate the log, not just the outcome. Process is the habit." },
    { title: "Remove Friction", body: "Make the good habit easier and the bad one harder." },
    { title: "Design Your Day", body: "Schedule your key habits. Time blocking turns intentions into action." },
    { title: "Accountability Helps", body: "Share a streak or goal with someone. Visibility increases commitment." },
    { title: "Reflect Weekly", body: "Once a week, review your logs. What’s working? What’s not?" },
    { title: "Sleep Fuels Habits", body: "Better sleep makes every habit easier. Protect your rest." },
    { title: "Morning Anchors", body: "A consistent morning routine makes the rest of the day predictable." },
    { title: "Evening Wind-Down", body: "Log and plan the next day. Closure reduces tomorrow’s friction." },
    { title: "Cues Matter", body: "Time, place, or event can trigger a habit. Choose cues you can’t miss." },
    { title: "Craving Drives the Loop", body: "Notice what you crave. Channel it toward the habit you want." },
    { title: "Response Is the Habit", body: "The action you take after the cue is what you’re building." },
    { title: "Reward Completes the Loop", body: "Feel good after the habit. Your brain will want to repeat it." },
    { title: "Break the Loop to Break the Habit", body: "Change the cue, make the response harder, or remove the reward." },
    { title: "Replace, Don't Erase", body: "Swap a bad habit for a good one. Same cue, new response." },
    { title: "Two-Minute Rule", body: "Scale habits down to two minutes. Start small to stay consistent." },
    { title: "Don't Break the Chain", body: "One miss is a slip; two can become a slide. Get back quickly." },
    { title: "Logging Is the Meta-Habit", body: "Tracking itself is a habit. You're already building it." },
    { title: "Quantity Before Quality", body: "Early on, focus on showing up. Refine later." },
    { title: "Habits Compound", body: "1% better daily is 37x in a year. Trust the curve." },
    { title: "Identity Beats Goals", body: "Goals end; identity lasts. Become someone who does the thing." },
    { title: "Environment Over Willpower", body: "Design your space so the right choice is the easy one." },
    { title: "Track the Negative Too", body: "Awareness of bad habits is the first step to changing them." },
    { title: "Celebrate the Log", body: "Completing the log is a win. Acknowledge it." },
    { title: "One Thing at a Time", body: "Multitasking dilutes focus. One habit, full attention." },
    { title: "Routine Beats Intensity", body: "Regular moderate effort beats occasional heroics." },
    { title: "Sleep and Habits", body: "When you're rested, discipline feels easier. Prioritize sleep." },
    { title: "Stress and Slip-Ups", body: "High stress makes habits harder. Be kind when you miss." },
    { title: "Context Is Key", body: "Same habit in a new place? Re-anchor it. Context matters." },
    { title: "Visual Cues", body: "Put your running shoes by the door. Make the cue impossible to ignore." },
    { title: "Implementation Intentions", body: "When X happens, I will Y. Write it; it increases follow-through." },
    { title: "Review Your Logs", body: "Patterns show up over time. Use data to adjust." },
    { title: "Small Consistency", body: "Doing a little every day beats doing a lot sometimes." },
    { title: "Habit Contract", body: "Write what you'll do and what happens if you don’t. Sign it." },
    { title: "Social Proof", body: "Join a group or partner up. Others’ progress can motivate you." },
    { title: "Temptation Bundling", body: "Only do the fun thing while doing the habit. Pair them." },
    { title: "Track Streaks", body: "Streaks make progress visible. Protect them, but don’t fear losing them." },
    { title: "Forgiveness and Restart", body: "One bad day doesn’t define you. Restart the next day." },
    { title: "Clarity of Purpose", body: "Why does this habit matter? Write it. Revisit when motivation dips." },
    { title: "Systems Over Goals", body: "Goals are outcomes; systems are processes. Build the system." },
    { title: "Log Honestly", body: "The log is for you. Honest data leads to real change." },
    { title: "Batch Similar Habits", body: "Group related habits (e.g. all health) to create routines." },
    { title: "Reduce Choices", body: "Fewer decisions in the day leave energy for habits." },
    { title: "End of Day Review", body: "Quick nightly review: What did I log? What’s for tomorrow?" },
    { title: "Progressive Overload", body: "Increment slowly. Add a rep, a page, a minute when it feels easy." },
    { title: "Trigger Mapping", body: "List the triggers for bad habits. Then disrupt or replace them." },
    { title: "Habit Scorecard", body: "List daily habits. Mark + neutral -. Awareness without judgment." },
    { title: "Implementation Beats Intention", body: "Planning is useful, but doing is what changes you." },
    { title: "Your Future Self", body: "Every log is a gift to your future self. Keep sending them." },
  ];

  const aiInsights = useMemo(() => {
    if (habits.length === 0) return DAILY_INSIGHTS[0];
    const total = habits.reduce((a, b) => a + b.totalLogs, 0);
    if (total === 0) return DAILY_INSIGHTS[1];
    const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_INSIGHTS.length;
    return DAILY_INSIGHTS[Math.max(2, dayIndex)];
  }, [habits]);

  return (
    <>
      <Preloader isLoading={isLoading} />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout
              userConfig={userConfig}
              onAddHabit={() => setShowAddModal(true)}
              habits={habits}
            >
              <ToastContainer toasts={toasts} onClose={removeToast} />
              <Routes>
                <Route path="/" element={<Dashboard habits={habits} setHabits={setHabits} logActivity={logActivity} insights={aiInsights} />} />
                <Route path="/analytics" element={<Analytics habits={habits} selectedHabitId={selectedHabitId} setSelectedHabitId={setSelectedHabitId} />} />
                <Route path="/habits" element={<Habits habits={habits} setHabits={setHabits} logActivity={logActivity} />} />
                <Route path="/logs" element={<Logs habits={habits} setHabits={setHabits} />} />
                <Route path="/settings" element={
                  <Settings
                    userConfig={userConfig}
                    setUserConfig={setUserConfig}
                    handleAvatarUpload={handleAvatarUpload}
                    fileInputRef={fileInputRef}
                    habits={habits}
                  />
                } />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>

      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="glass-card modal-enter w-full max-w-md p-10 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-white/10 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex justify-between items-center mb-10 relative z-10">
              <div>
                <h3 className="text-2xl font-bold tracking-tighter text-text-primary uppercase">New Habit</h3>
                <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] mt-1 font-mono">Initialize behavioral protocol</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-text-secondary transition-all"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="space-y-10 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] ml-1">Habit Identifier</label>
                <input
                  className="w-full bg-bg-main/50 border border-white/10 p-5 rounded-2xl outline-none focus:border-accent text-sm text-text-primary transition-all placeholder:text-text-secondary/30 focus:bg-bg-main"
                  placeholder="Ex: Morning Meditation"
                  value={newHabit.name}
                  onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] ml-1">Behavioral Logic</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setNewHabit({ ...newHabit, type: 'Good' })}
                    className={`group py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] border transition-all flex flex-col items-center gap-2 ${newHabit.type === 'Good'
                      ? 'bg-accent text-bg-main border-accent shadow-[0_0_20px_rgba(228,228,231,0.2)]'
                      : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20 hover:bg-white/10'
                      }`}
                  >
                    <Icon name="check-circle" size={16} className={newHabit.type === 'Good' ? 'text-bg-main' : 'text-text-secondary group-hover:text-text-primary'} />
                    Constructive
                  </button>
                  <button
                    onClick={() => setNewHabit({ ...newHabit, type: 'Bad' })}
                    className={`group py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] border transition-all flex flex-col items-center gap-2 ${newHabit.type === 'Bad'
                      ? 'bg-accent text-bg-main border-accent shadow-[0_0_20px_rgba(228,228,231,0.2)]'
                      : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20 hover:bg-white/10'
                      }`}
                  >
                    <Icon name="alert-circle" size={16} className={newHabit.type === 'Bad' ? 'text-bg-main' : 'text-text-secondary group-hover:text-text-primary'} />
                    Destructive
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] ml-1">Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setNewHabit({ ...newHabit, mode: 'quick' })}
                    className={`py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] border transition-all ${newHabit.mode === 'quick' ? 'bg-accent text-bg-main border-accent' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                  >
                    Tap
                  </button>
                  <button
                    onClick={() => setNewHabit({ ...newHabit, mode: 'count' })}
                    className={`py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] border transition-all ${newHabit.mode === 'count' ? 'bg-accent text-bg-main border-accent' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                  >
                    Count
                  </button>
                </div>
                {newHabit.mode === 'count' && (
                  <input
                    type="text"
                    placeholder="Unit (e.g. reps, min)"
                    className="w-full bg-bg-main/50 border border-white/10 p-3 rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-accent"
                    value={newHabit.unit}
                    onChange={e => setNewHabit({ ...newHabit, unit: e.target.value })}
                  />
                )}
              </div>

              <button
                onClick={() => {
                  if (!newHabit.name.trim()) return;
                  setHabits([...habits, { id: Date.now().toString(), name: newHabit.name, type: newHabit.type, mode: newHabit.mode || 'quick', unit: (newHabit.mode === 'count' ? (newHabit.unit || '') : ''), totalLogs: 0, logs: [] }]);
                  setNewHabit({ name: '', type: 'Good', mode: 'quick', unit: '' });
                  setShowAddModal(false);
                }}
                disabled={!newHabit.name.trim()}
                className="w-full py-5 bg-accent text-bg-main text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-30 disabled:hover:scale-100"
              >
                Create Habit Node
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
