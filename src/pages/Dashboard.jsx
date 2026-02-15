import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmModal, RenameModal } from '../components/Modals';

const Dashboard = ({ habits, setHabits, logActivity, insights }) => {
  const [countInputs, setCountInputs] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const flattenedLogs = useMemo(() => {
    const all = [];
    (habits || []).forEach(h => {
      (h.logs || []).forEach(day => {
        (day.entries || []).forEach(entry => {
          const isCount = typeof entry === 'string' && entry.includes('|');
          const [time, value, unit] = isCount ? entry.split('|') : [entry, null, null];
          all.push({ habit: h.name, type: h.type, date: day.date, time, value, unit });
        });
      });
    });
    return all.sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`));
  }, [habits]);

  const removeHabit = (id) => setDeleteTarget(id);
  const renameHabit = (id, currentName) => setRenameTarget({ id, name: currentName });

  const totalLogEvents = (list) => (list || []).reduce((sum, h) => sum + (h.logs || []).reduce((s, d) => s + (d.entries || []).length, 0), 0);
  const totalActivity = totalLogEvents(habits);
  const constructiveLogs = totalLogEvents((habits || []).filter(h => h.type === 'Good'));
  const destructiveLogs = totalLogEvents((habits || []).filter(h => h.type === 'Bad'));

  const habitListHeight = Math.min(Math.max(habits.length, 2) * 52 + 24, 400);

  const loggedDates = useMemo(() => {
    const set = new Set();
    (habits || []).forEach(h => (h.logs || []).forEach(d => set.add(d.date)));
    return set;
  }, [habits]);

  const calendarDays = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startPad = first.getDay();
    const days = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d).toISOString().split('T')[0]);
    return days;
  }, [calendarMonth]);

  return (
    <div className="page-fade space-y-6 pb-20">
      <Card className="ai-glow flex items-center gap-6 overflow-hidden relative hover:translate-y-0 hover:shadow-none hover:border-border-color border-l-4 border-l-accent">
        <div className="w-12 h-12 rounded-xl bg-accent-dim flex items-center justify-center border border-border-color shrink-0">
          <Icon name="brain" className="text-text-primary" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary mb-1">Daily insight</h4>
          <h3 className="text-sm font-bold text-text-primary mb-0.5">{insights.title}</h3>
          <p className="text-xs text-text-secondary max-w-2xl">{insights.body}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-row items-center gap-3 hover:translate-y-0">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Icon name="activity" size={18} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest">Total activity</p>
            <h3 className="text-xl font-mono font-bold text-text-primary">{totalActivity}</h3>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-3 hover:translate-y-0">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <Icon name="zap" size={18} className="text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest">Active habits</p>
            <h3 className="text-xl font-mono font-bold text-text-primary">{habits.length}</h3>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-3 hover:translate-y-0">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-success">+</span>
          </div>
          <div className="min-w-0">
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest">Constructive logs</p>
            <h3 className="text-xl font-mono font-bold text-success">{constructiveLogs}</h3>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-3 hover:translate-y-0">
          <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-danger">−</span>
          </div>
          <div className="min-w-0">
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest">Destructive logs</p>
            <h3 className="text-xl font-mono font-bold text-danger">{destructiveLogs}</h3>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <Card className="lg:col-span-2 flex flex-col hover:translate-y-0 hover:shadow-none hover:border-border-color">
          <div className="flex justify-between items-center mb-3 shrink-0">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">Habit Registry</h4>
            <Link to="/habits" className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary">Manage →</Link>
          </div>
          <div
            className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-0"
            style={{ height: habitListHeight }}
          >
            {habits.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-accent-dim border border-border-color rounded-xl group transition-all hover:border-text-secondary">
                <div className="flex items-center gap-3">
                  <Button onClick={() => removeHabit(h.id)} size="sm" variant="danger" icon="trash" className="opacity-0 group-hover:opacity-100 transition-all p-0 w-6 h-6 border-none bg-transparent hover:bg-danger/10" />
                  <Button onClick={() => renameHabit(h.id, h.name)} size="sm" variant="outline" icon="pencil" className="opacity-0 group-hover:opacity-100 transition-all p-0 w-6 h-6 border-none bg-transparent hover:bg-accent-dim" />
                  <div>
                    <div className="text-sm font-bold text-text-primary">{h.name}</div>
                    <div className="text-[10px] text-text-secondary uppercase font-mono">
                    {h.mode === 'count'
                      ? `${(h.logs || []).reduce((s, d) => s + (d.entries || []).length, 0)} log(s) · ${h.totalLogs} ${h.unit || 'total'}`
                      : `${h.totalLogs} logs`}
                  </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {(h.mode === 'count') ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        placeholder="0"
                        className="w-12 h-8 rounded-lg bg-bg-main border border-border-color text-center text-xs font-mono text-text-primary px-1"
                        value={countInputs[h.id] ?? ''}
                        onChange={e => setCountInputs(prev => ({ ...prev, [h.id]: e.target.value }))}
                      />
                      <Button onClick={() => logActivity(h.id, false)} size="sm" variant="outline" icon="minus" className="bg-bg-main rounded-lg w-8 h-8 p-0" />
                      <Button onClick={() => { const n = countInputs[h.id]; if (n) { logActivity(h.id, true, n, h.unit || ''); setCountInputs(prev => ({ ...prev, [h.id]: '' })); } }} size="sm" variant="primary" icon="plus" className="rounded-lg w-8 h-8 p-0" />
                    </>
                  ) : (
                    <>
                      <Button onClick={() => logActivity(h.id, false)} size="sm" variant="outline" icon="minus" className="bg-bg-main rounded-lg w-8 h-8 p-0" />
                      <Button onClick={() => logActivity(h.id, true)} size="sm" variant="primary" icon="plus" className="rounded-lg w-8 h-8 p-0" />
                    </>
                  )}
                </div>
              </div>
            ))}
            {habits.length === 0 && (
              <div className="flex flex-col items-center justify-center text-text-secondary text-xs italic py-12">
                No habits yet. Create a new stream to begin.
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col hover:translate-y-0 hover:shadow-none hover:border-border-color">
          <div className="flex justify-between items-center mb-3 shrink-0">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">Recent Logs</h4>
            <Link to="/logs" className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary">All logs →</Link>
          </div>
          <div
            className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-0"
            style={{ height: habitListHeight }}
          >
            {flattenedLogs.slice(0, 50).map((log, i) => (
              <div key={i} className="flex gap-3 items-start border-l-2 border-border-color pl-3 py-1.5 hover:border-text-secondary transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-text-primary truncate">{log.habit}</div>
                  <div className="text-[9px] font-mono text-text-secondary">{log.time} · {log.date}{log.value != null ? ` · ${log.value} ${log.unit || ''}` : ''}</div>
                </div>
              </div>
            ))}
            {flattenedLogs.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-12 text-[10px] uppercase text-text-secondary tracking-widest">
                No logs yet. Log activity above.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 hover:translate-y-0 hover:shadow-none hover:border-border-color">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary">Activity calendar</h4>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))} className="w-8 h-8 rounded-lg border border-border-color flex items-center justify-center text-text-secondary hover:text-text-primary text-sm font-bold">←</button>
            <span className="text-sm font-bold text-text-primary min-w-[140px] text-center">
              {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))} className="w-8 h-8 rounded-lg border border-border-color flex items-center justify-center text-text-secondary hover:text-text-primary text-sm font-bold">→</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-[9px] font-bold text-text-secondary uppercase text-center py-1">{d}</div>
          ))}
          {calendarDays.map((dateStr, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-mono ${dateStr
                ? loggedDates.has(dateStr)
                  ? 'bg-white text-bg-main border border-white shadow-sm'
                  : 'bg-bg-main/50 border border-border-color text-text-secondary'
                : 'invisible'}`}
            >
              {dateStr ? new Date(dateStr + 'T12:00:00').getDate() : ''}
            </div>
          ))}
        </div>
      </Card>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete stream"
        message="Are you sure you want to delete this stream? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { if (deleteTarget) { setHabits(prev => prev.filter(h => h.id !== deleteTarget)); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)}
      />
      <RenameModal
        open={!!renameTarget}
        currentName={renameTarget?.name}
        onConfirm={(newName) => { if (renameTarget?.id && newName) { setHabits(prev => prev.map(h => h.id === renameTarget.id ? { ...h, name: newName } : h)); setRenameTarget(null); } }}
        onCancel={() => setRenameTarget(null)}
      />
    </div>
  );
};

export default Dashboard;
