import { useState } from 'react';
import Icon from '../components/Icon';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmModal, RenameModal } from '../components/Modals';

const Habits = ({ habits, setHabits, logActivity }) => {
    const [countInputs, setCountInputs] = useState({});
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [renameTarget, setRenameTarget] = useState(null);
    return (
        <div className="page-fade space-y-10 pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tighter text-text-primary">Habit Registry</h2>
                <p className="text-text-secondary text-sm mt-1">Manage, monitor and calibrate your active behavioral nodes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {habits.map(h => {
                    return (
                        <Card key={h.id} className="flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 flex gap-2">
                                <Button
                                    onClick={() => setRenameTarget({ id: h.id, name: h.name })}
                                    variant="outline"
                                    size="sm"
                                    icon="pencil"
                                    className="w-8 h-8 p-0 rounded-lg flex items-center justify-center border border-border-color bg-bg-main"
                                />
                                <Button
                                    onClick={() => setDeleteTarget(h.id)}
                                    variant="danger"
                                    size="sm"
                                    icon="trash"
                                    className="w-8 h-8 p-0 rounded-lg flex items-center justify-center border border-border-color bg-bg-main"
                                />
                            </div>
                            <div className="mb-8">
                                <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center border ${h.type === 'Good' ? 'bg-accent text-bg-main border-accent' : 'bg-bg-sidebar text-text-secondary border-border-color'}`}>
                                    <Icon name={h.type === 'Good' ? 'check-circle' : 'alert-circle'} size={18} />
                                </div>
                                <h4 className="text-xl font-bold truncate max-w-[200px] mb-1 text-text-primary">{h.name}</h4>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${h.type === 'Good' ? 'bg-accent-dim text-text-primary' : 'bg-bg-sidebar text-text-secondary'}`}>
                                        {h.type} NODE
                                    </span>
                                    <div className="h-1 w-1 rounded-full bg-border-color"></div>
                                    <span className="text-[9px] text-text-secondary uppercase font-mono tracking-tighter">
                                        Total Activity: {h.mode === 'count' ? `${(h.logs || []).reduce((s, d) => s + (d.entries || []).length, 0)} log(s) · ${h.totalLogs} ${h.unit || ''}` : h.totalLogs}
                                    </span>
                                </div>
                            </div>


                            <div className="mb-8">
                                <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-3">Recent Activity (Last 7 Days)</p>
                                <div className="grid grid-cols-7 gap-2">
                                    {Array.from({ length: 7 }).map((_, idx) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - (6 - idx));
                                        const dateStr = d.toISOString().split('T')[0];
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        const isToday = dateStr === todayStr;
                                        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
                                        const habitLogs = h.logs || [];
                                        const hasActivity = habitLogs.some(l => l.date === dateStr && (l.count || 0) > 0);

                                        const boxClass = isToday && hasActivity
                                            ? 'bg-white border-white shadow-sm dark:bg-accent dark:border-accent'
                                            : hasActivity
                                                ? h.type === 'Good'
                                                    ? 'bg-success border-success shadow-sm'
                                                    : 'bg-danger border-danger shadow-sm'
                                                : 'bg-transparent border-border-color hover:border-text-secondary';

                                        return (
                                            <div key={dateStr} className="flex flex-col items-center gap-1.5">
                                                <div className={`w-full aspect-square rounded-lg border-2 transition-all ${boxClass}`}></div>
                                                <span className="text-[8px] font-mono text-text-secondary uppercase">{dayLabel}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>


                            <div className="pt-6 border-t border-border-color flex items-center justify-between gap-2 flex-wrap">
                                {h.mode === 'count' ? (
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="0"
                                            className="w-14 h-10 rounded-xl bg-bg-main border border-border-color text-center text-sm font-mono text-text-primary px-2"
                                            value={countInputs[h.id] ?? ''}
                                            onChange={e => setCountInputs(prev => ({ ...prev, [h.id]: e.target.value }))}
                                        />
                                        <Button onClick={() => logActivity(h.id, false)} variant="outline" size="iconLg" icon="minus" className="rounded-xl w-10 h-10 p-0" />
                                        <Button onClick={() => { const n = countInputs[h.id]; if (n) { logActivity(h.id, true, n, h.unit || ''); setCountInputs(prev => ({ ...prev, [h.id]: '' })); } }} variant="primary" size="iconLg" icon="plus" className="rounded-xl w-10 h-10 p-0" />
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button onClick={() => logActivity(h.id, false)} variant="outline" size="iconLg" icon="minus" className="rounded-xl" />
                                        <Button onClick={() => logActivity(h.id, true)} variant="primary" size="iconLg" icon="plus" className="rounded-xl" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}

                <button
                    onClick={() => document.dispatchEvent(new CustomEvent('showModal'))}
                    className="glass-card border-dashed border-2 border-border-color rounded-3xl p-10 flex flex-col items-center justify-center group hover:border-text-secondary transition-all opacity-60 hover:opacity-100"
                >
                    <div className="w-12 h-12 rounded-full bg-bg-sidebar flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon name="plus" className="text-text-secondary" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">New Habit Node</p>
                </button>
            </div>

            <ConfirmModal
                open={!!deleteTarget}
                title="Delete habit"
                message="Are you sure you want to delete this habit? This cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={() => { if (deleteTarget) { setHabits(habits.filter(item => item.id !== deleteTarget)); setDeleteTarget(null); } }}
                onCancel={() => setDeleteTarget(null)}
            />
            <RenameModal
                open={!!renameTarget}
                currentName={renameTarget?.name}
                onConfirm={(newName) => { if (renameTarget?.id && newName) { setHabits(habits.map(item => item.id === renameTarget.id ? { ...item, name: newName } : item)); setRenameTarget(null); } }}
                onCancel={() => setRenameTarget(null)}
            />
        </div>
    );
};

export default Habits;
