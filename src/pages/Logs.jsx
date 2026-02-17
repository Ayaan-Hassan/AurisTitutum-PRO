import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/Modals';

const Logs = ({ habits, setHabits }) => {
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const flattenedLogs = useMemo(() => {
        const all = [];
        (habits || []).forEach(h => {
            (h.logs || []).forEach(day => {
                (day.entries || []).forEach(entry => {
                    const isCount = typeof entry === 'string' && entry.includes('|');
                    const [time, value, unit] = isCount ? entry.split('|') : [entry, null, null];
                    all.push({
                        habit: h.name,
                        habitId: h.id,
                        type: h.type,
                        date: day.date,
                        time,
                        value: value != null ? value : null,
                        unit: unit || null
                    });
                });
            });
        });
        return all.sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`));
    }, [habits]);

    const exportToCSV = () => {
        const headers = ['Habit Name', 'Date', 'Time', 'Type', 'Value', 'Unit'];
        const rows = flattenedLogs.map(log => [
            log.habit,
            log.date,
            log.time,
            log.type,
            log.value ?? '',
            log.unit ?? ''
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `auristitutum_logs_${today}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr + 'T12:00:00');
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="page-fade space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tighter text-text-primary">Logs</h2>
                    <p className="text-text-secondary text-xs mt-1">All activity entries across habits with full details.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={exportToCSV}
                        variant="outline"
                        icon="download"
                        className="bg-bg-main shrink-0"
                    >
                        Export CSV
                    </Button>
                    <Button
                        onClick={() => setClearConfirmOpen(true)}
                        variant="outline"
                        className="bg-bg-main shrink-0 border-danger/50 text-danger hover:bg-danger/10"
                    >
                        Clear logs
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden hover:translate-y-0 hover:shadow-none hover:border-border-color">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-color">
                                <th className="text-[10px] font-black uppercase tracking-widest text-text-secondary py-4 px-4">Habit</th>
                                <th className="text-[10px] font-black uppercase tracking-widest text-text-secondary py-4 px-4">Type</th>
                                <th className="text-[10px] font-black uppercase tracking-widest text-text-secondary py-4 px-4">Date</th>
                                <th className="text-[10px] font-black uppercase tracking-widest text-text-secondary py-4 px-4">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flattenedLogs.map((log, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-border-color/50 hover:bg-accent-dim/50 transition-colors"
                                >
                                    <td className="py-3 px-4 text-sm font-medium text-text-primary">{log.habit}</td>
                                    <td className="py-3 px-4">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${log.type === 'Good' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs font-mono text-text-secondary">{formatDate(log.date)}</td>
                                    <td className="py-3 px-4 text-xs font-mono text-text-secondary">{log.time}{log.value != null ? ` · ${log.value} ${log.unit || ''}` : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {flattenedLogs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Icon name="file-text" size={40} className="text-text-secondary opacity-50 mb-4" />
                        <p className="text-sm text-text-secondary uppercase tracking-widest">No logs yet</p>
                        <p className="text-xs text-text-secondary mt-1">Log activity from the dashboard or habit cards to see entries here.</p>
                    </div>
                )}
            </Card>

            <ConfirmModal
                open={clearConfirmOpen}
                title="Clear all logs"
                message="Clear all logs from all habits? This cannot be undone."
                confirmLabel="Clear all"
                variant="danger"
                onConfirm={() => { setHabits(prev => prev.map(h => ({ ...h, logs: [], totalLogs: 0 }))); setClearConfirmOpen(false); }}
                onCancel={() => setClearConfirmOpen(false)}
            />
        </div>
    );
};

export default Logs;
