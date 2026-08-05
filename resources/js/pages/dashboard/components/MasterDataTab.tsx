import React, { useState, useEffect, useMemo } from 'react';
import { User, Layers, Building, Network, GitBranch, Briefcase, ChevronRight, BarChart3, ListTree } from 'lucide-react';
import { MetricItem } from './MetricItem';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MasterDataTabProps {
    data: any;
}

export function MasterDataTab({ data }: MasterDataTabProps) {
    const counts = data?.masterDataCounts || {
        users: 0,
        companyGroups: 0,
        companies: 0,
        departments: 0,
        divisions: 0,
        vendors: 0,
        organizationTree: [],
    };

    const treeData = counts.organizationTree || [];

    // State to toggle between Chart and List view
    const [activeView, setActiveView] = useState<'chart' | 'list'>('chart');

    // State for interactive list view (drilldown)
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [selectedRegionId, setSelectedRegionId] = useState<string>('');

    // Pre-select first items if available
    useEffect(() => {
        if (treeData.length > 0 && !selectedGroupId) {
            setSelectedGroupId(treeData[0].id);
            if (treeData[0].children && treeData[0].children.length > 0) {
                setSelectedRegionId(treeData[0].children[0].id);
            }
        }
    }, [treeData]);

    const activeGroup = treeData.find((g: any) => g.id === selectedGroupId);
    const activeRegion = activeGroup?.children?.find((r: any) => r.id === selectedRegionId);

    const handleGroupSelect = (groupId: string) => {
        setSelectedGroupId(groupId);
        const group = treeData.find((g: any) => g.id === groupId);
        if (group && group.children && group.children.length > 0) {
            setSelectedRegionId(group.children[0].id);
        } else {
            setSelectedRegionId('');
        }
    };

    const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

    // Prepare chart data: Simple Bar Chart showing total companies per Group (non-stacked)
    const chartData = useMemo(() => {
        return treeData.map((group: any) => {
            let totalCompanies = 0;
            const regionDetails: any[] = [];
            group.children?.forEach((region: any) => {
                const count = region.children ? region.children.length : 0;
                totalCompanies += count;
                regionDetails.push({ name: region.name, count });
            });
            return {
                name: group.name,
                companiesCount: totalCompanies,
                regionDetails
            };
        });
    }, [treeData]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
            {/* Master Data Grid Cards */}
            <div className="grid grid-cols-1 gap-4 select-none md:grid-cols-2 lg:grid-cols-3">
                <MetricItem 
                    label="Data Pengguna" 
                    value={counts.users} 
                    icon={User} 
                    color="text-indigo-500" 
                />
                <MetricItem 
                    label="Grup Perusahaan" 
                    value={counts.companyGroups} 
                    icon={Layers} 
                    color="text-sky-500" 
                />
                <MetricItem 
                    label="Data Perusahaan" 
                    value={counts.companies} 
                    icon={Building} 
                    color="text-emerald-500" 
                />
                <MetricItem 
                    label="Data Departemen" 
                    value={counts.departments} 
                    icon={Network} 
                    color="text-amber-500" 
                />
                <MetricItem 
                    label="Data Divisi" 
                    value={counts.divisions} 
                    icon={GitBranch} 
                    color="text-purple-500" 
                />
                <MetricItem 
                    label="Data Vendor" 
                    value={counts.vendors} 
                    icon={Briefcase} 
                    color="text-rose-500" 
                />
            </div>

            {/* Bagan Struktur Organisasi (Bar Chart) */}
            <div className="bg-white dark:bg-zinc-900/50 border border-surface-border/60 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="border-b border-surface-border/60 pb-3">
                    <h3 className="text-sm font-bold text-text-main">Bagan Struktur Organisasi</h3>
                    <p className="text-[10px] text-text-soft">Visualisasi interaktif hierarki: Grup Perusahaan &gt; Wilayah &gt; Perusahaan</p>
                </div>

                {treeData.length === 0 ? (
                    <div className="text-center py-10 text-xs text-muted-foreground">Tidak ada data struktur organisasi</div>
                ) : (
                    /* Chart View: Simple Non-stacked Bar Chart */
                    <div className="h-[420px] w-full pt-4 pb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 15, right: 40, left: 30, bottom: 110 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#888888" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                    dy={5}
                                />
                                <YAxis 
                                    stroke="#888888" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    content={({ active, payload, label }: any) => {
                                        if (active && payload && payload.length) {
                                            const item = payload[0].payload;
                                            return (
                                                <div className="rounded-xl border border-surface-border bg-white dark:bg-zinc-950 p-3 shadow-md text-xs space-y-1.5">
                                                    <p className="font-bold text-text-main">{label}</p>
                                                    <div className="space-y-1 border-t border-surface-border/40 pt-1.5">
                                                        {item.regionDetails.map((region: any, idx: number) => {
                                                            if (!region.count) return null;
                                                            return (
                                                                <div key={idx} className="flex justify-between items-center gap-6">
                                                                    <span className="text-text-soft">
                                                                        {region.name}
                                                                    </span>
                                                                    <span className="font-bold text-text-main">{region.count} Perusahaan</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="border-t border-surface-border/40 pt-1.5 flex justify-between font-bold text-text-main">
                                                        <span>Total</span>
                                                        <span>{item.companiesCount} Perusahaan</span>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar 
                                    dataKey="companiesCount" 
                                    radius={[4, 4, 0, 0]}
                                    barSize={32}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
