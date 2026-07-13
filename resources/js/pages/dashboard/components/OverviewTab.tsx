import { Activity, Clock, FileText, ShieldCheck, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { MetricItem } from './MetricItem';

interface OverviewTabProps {
    data: any;
    onNavigate: (view: string, params?: any) => void;
}

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const flattenNodes = (nodes: any[], level = 0): any[] => {
    let result: any[] = [];
    for (const node of nodes) {
        result.push({ 
            ...node, 
            level, 
        });
        if (node.children && node.children.length > 0) {
            result = result.concat(flattenNodes(node.children, level + 1));
        }
    }
    return result;
};

const TreeRechartsBar = ({ data }: { data: any[] }) => {
    const [activeTab, setActiveTab] = useState<string>('all');

    const allNodes = flattenNodes(data).map(node => ({
        ...node,
        displayName: (node.level > 0 && activeTab === 'all') 
            ? `${' '.repeat(node.level * 4)} ↳ ${node.label || node.name}` 
            : (node.label || node.name) 
    }));

    const maxLevel = Math.max(...allNodes.map(n => n.level), 0);
    
    // 1. Data for level-specific tabs (Single Bar)
    const visibleNodes = allNodes.filter(n => n.level <= parseInt(activeTab));

    // 2. Data for 'all' tab (Stacked Bar)
    const stackedData: any[] = [];
    const allSegmentKeys = new Set<string>();
    
    for (const root of data) {
        const item: any = { displayName: root.label || root.name };
        if (root.children && root.children.length > 0) {
            let childSum = 0;
            for (const child of root.children) {
                const childName = child.label || child.name;
                item[childName] = child.count;
                childSum += child.count;
                allSegmentKeys.add(childName);
            }
            if (root.count > childSum) {
                const diffName = `Lainnya (${root.label || root.name})`;
                item[diffName] = root.count - childSum;
                allSegmentKeys.add(diffName);
            }
        } else {
            const selfName = root.label || root.name;
            item[selfName] = root.count;
            allSegmentKeys.add(selfName);
        }
        stackedData.push(item);
    }
    const segmentKeys = Array.from(allSegmentKeys);
    const STACK_COLORS = ['#4f46e5', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#64748b', '#ec4899', '#14b8a6', '#f97316'];

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-end gap-2 mb-2">
                <button 
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors ${activeTab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-soft hover:bg-surface-muted/80'}`}
                    onClick={() => setActiveTab('all')}
                >
                    Semua
                </button>
                {Array.from({ length: maxLevel + 1 }).map((_, i) => (
                    <button 
                        key={i}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors ${activeTab === i.toString() ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-text-soft hover:bg-surface-muted/80'}`}
                        onClick={() => setActiveTab(i.toString())}
                    >
                        Level {i + 1}
                    </button>
                ))}
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeTab === 'all' ? stackedData : visibleNodes} margin={{ top: 10, right: 10, left: 40, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                            dataKey="displayName"
                            stroke="#64748b"
                            tickLine={false}
                            axisLine={false}
                            fontSize={10}
                            fontWeight={500}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            tickFormatter={(val) => (val.length > 35 ? val.substring(0, 32) + '...' : val)}
                        />
                        <YAxis fontSize={10} fontWeight={500} stroke="#64748b" tickLine={false} axisLine={false} />
                        <Tooltip
                            cursor={{ fill: 'rgba(79,70,229,0.03)' }}
                            content={({ active, payload }: any) => {
                                if (active && payload && payload.length) {
                                    if (activeTab === 'all') {
                                        const validPayload = payload.filter((p: any) => p.value > 0);
                                        return (
                                            <div className="dark:bg-surface-base/90 border-surface-border/40 flex flex-col gap-2 rounded-lg border bg-white/90 p-3 shadow-xl backdrop-blur-sm">
                                                <p className="text-text-main text-[11px] font-bold uppercase border-b border-surface-border/50 pb-2 mb-1">
                                                    {payload[0].payload.displayName}
                                                </p>
                                                {validPayload.map((p: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between gap-4">
                                                        <span className="text-text-soft text-[10px] font-semibold" style={{ color: p.color }}>{p.name}</span>
                                                        <span className="text-text-main text-[11px] font-bold">{p.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="dark:bg-surface-base/90 border-surface-border/40 flex flex-col gap-1 rounded-lg border bg-white/90 p-3 shadow-xl backdrop-blur-sm">
                                            <p className="text-text-soft text-[10px] leading-none font-semibold uppercase">
                                                {payload[0].payload.label || payload[0].payload.name}
                                            </p>
                                            <p className="text-primary text-xs leading-none font-bold">{payload[0].value}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        {activeTab === 'all' ? (
                            segmentKeys.map((key, i) => (
                                <Bar key={key} dataKey={key} fill={STACK_COLORS[i % STACK_COLORS.length]} radius={[4, 4, 0, 0]} />
                            ))
                        ) : (
                            <Bar 
                                dataKey="count" 
                                radius={[6, 6, 0, 0]} 
                                barSize={32}
                            >
                                {visibleNodes.map((entry: any) => (
                                    <Cell
                                        key={`cell-${entry.id}`}
                                        fill={entry.level === 0 ? '#4f46e5' : (entry.level === 1 ? '#8b5cf6' : '#0ea5e9')}
                                        className="opacity-90 transition-all hover:opacity-100"
                                    />
                                ))}
                            </Bar>
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export function OverviewTab({ data, onNavigate }: OverviewTabProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const m = data?.summary || {
        total: 0,
        in_process: 0,
        active: 0,
        expiring_soon: 0,
    };

    const contractTypeData = data?.contractTypeDistribution || [];
    const allContractNodes = flattenNodes(contractTypeData);
    
    const pieChartData = Object.values(
        allContractNodes
            .filter(n => n.level === 2)
            .map(item => ({
                name: (item.label || item.name).trim(),
                value: item.count,
            }))
            .filter(item => item.value > 0)
            .reduce((acc: any, curr: any) => {
                if (!acc[curr.name]) {
                    acc[curr.name] = { name: curr.name, value: 0 };
                }
                acc[curr.name].value += curr.value;
                return acc;
            }, {})
    ) as { name: string; value: number }[];

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6'];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
            {/* 4 KPI Metric Rows */}
            <div className="grid grid-cols-1 gap-6 select-none md:grid-cols-2 lg:grid-cols-4">
                <MetricItem label="Total Kontrak" value={m.total} icon={FileText} color="text-primary" onClick={() => onNavigate('contracts')} />
                <MetricItem
                    label="Perlu Persetujuan"
                    value={m.in_process}
                    icon={Clock}
                    color="text-amber-500"
                    onClick={() => onNavigate('pending')}
                />
                <MetricItem
                    label="Kontrak Aktif"
                    value={m.active}
                    icon={ShieldCheck}
                    color="text-emerald-500"
                    onClick={() => onNavigate('contracts', { status: 'approved' })}
                />
                <MetricItem
                    label="Segera Berakhir"
                    value={m.expiring_soon}
                    icon={Activity}
                    color="text-rose-500"
                    onClick={() => onNavigate('expiry')}
                    isAlert
                />
            </div>

            {/* Visual Analytics Sections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Distribution Pie */}
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-surface-base border border-surface-border/60 rounded-lg group flex h-full flex-col transition-all overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-primary px-6 py-4 bg-primary text-primary-foreground">
                            <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase">Proporsi Dokumen</h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="space-y-1 pb-6">
                                <p className="text-text-soft text-[10px] font-medium uppercase">Berdasarkan Klasifikasi Level 3</p>
                            </div>

                        <div className="relative h-[300px] w-full">
                            {isMounted && pieChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart style={{ outline: 'none' }}>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieChartData.map((entry: any, index: number) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    className="cursor-pointer opacity-80 transition-opacity hover:opacity-100"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                border: 'none',
                                                borderRadius: '16px',
                                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                                                padding: '12px',
                                            }}
                                            itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-20">
                                    <Activity size={40} strokeWidth={1} />
                                    <p className="text-[10px] font-medium tracking-widest uppercase">Data Kosong</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {pieChartData.map((entry: any, index: number) => (
                                <div
                                    key={index}
                                    className="bg-surface-muted/30 border-surface-border/40 flex items-center gap-2.5 rounded-lg border px-3 py-2"
                                >
                                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="text-text-desc truncate text-[9px] font-medium uppercase">{entry.name}</span>
                                        <span className="text-text-main text-xs leading-none font-medium">{entry.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </div>
                    </div>
                </div>

                {/* Distribution Bar */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-surface-base border border-surface-border/60 rounded-lg group flex h-full flex-col transition-all overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-primary px-6 py-4 bg-primary text-primary-foreground">
                            <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase">Analisis Klasifikasi</h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="space-y-1 pb-6">
                                <p className="text-text-soft text-[10px] font-medium uppercase">Volume Per Kategori Kontrak</p>
                            </div>

                        <div className="h-[400px] w-full">
                            {isMounted && contractTypeData.length > 0 ? (
                                <TreeRechartsBar data={contractTypeData} />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-4 opacity-20">
                                    <Activity size={48} strokeWidth={1} />
                                    <p className="text-xs font-medium tracking-[0.2em] uppercase">Analisis tidak tersedia</p>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
