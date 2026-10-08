import { router } from '@inertiajs/react';
import { Briefcase, Building, ChevronRight, FolderClosed, GitBranch, Layers, Network, User, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MetricItem } from './MetricItem';

interface MasterDataTabProps {
    data: any;
}

export function MasterDataTab({ data }: MasterDataTabProps) {
    const counts = data?.masterDataCounts || {
        users: 0,
        companyGroups: 0,
        organizationGroups: 0,
        companies: 0,
        departments: 0,
        divisions: 0,
        vendors: 0,
        organizationTree: [],
        groupBreakdown: [],
    };

    const treeData = counts.organizationTree || [];

    // State for interactive list view (drilldown)
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');

    // Pre-select first items if available
    useEffect(() => {
        if (treeData.length > 0 && !selectedGroupId) {
            setSelectedGroupId(treeData[0].id);
        }
    }, [treeData, selectedGroupId]);

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
                regionDetails,
            };
        });
    }, [treeData]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
            {/* Master Data Grid Cards (Global / Scoped) */}
            <div className="grid grid-cols-1 gap-4 select-none sm:grid-cols-2 lg:grid-cols-4">
                <MetricItem
                    label="Data Pengguna"
                    value={counts.users}
                    icon={User}
                    color="text-indigo-500"
                    onClick={() => router.visit('/admin/core/users')}
                />
                <MetricItem
                    label="Grup Perusahaan"
                    value={counts.companyGroups}
                    icon={Layers}
                    color="text-sky-500"
                    onClick={() => router.visit('/admin/core/company-groups')}
                />
                <MetricItem
                    label="Master Group Organisasi"
                    value={counts.organizationGroups || 0}
                    icon={FolderClosed}
                    color="text-teal-500"
                    onClick={() => router.visit('/admin/core/organization-groups')}
                />
                <MetricItem
                    label="Data Perusahaan"
                    value={counts.companies}
                    icon={Building}
                    color="text-emerald-500"
                    onClick={() => router.visit('/admin/core/companies')}
                />
                <MetricItem
                    label="Data Departemen"
                    value={counts.departments}
                    icon={Network}
                    color="text-amber-500"
                    onClick={() => router.visit('/admin/core/departments')}
                />
                <MetricItem
                    label="Data Divisi"
                    value={counts.divisions}
                    icon={GitBranch}
                    color="text-purple-500"
                    onClick={() => router.visit('/admin/core/divisions')}
                />
                <MetricItem
                    label="Data Vendor"
                    value={counts.vendors}
                    icon={Briefcase}
                    color="text-rose-500"
                    onClick={() => router.visit('/admin/vendors')}
                />
            </div>

            {/* Distribusi Pengguna per Organization Group (Bar Chart X: Org Group, Y: Total Person) */}
            {counts.groupBreakdown && counts.groupBreakdown.length > 0 && (
                <div className="border-surface-border/60 box-border space-y-4 overflow-hidden rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-900/50">
                    <div className="border-surface-border/60 flex flex-col justify-between gap-2 border-b pb-3 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="text-text-main flex items-center gap-2 text-sm font-bold">
                                <FolderClosed size={16} className="text-teal-500" /> Distribusi Pengguna per Organization Group
                            </h3>
                            <p className="text-text-soft text-[10px]">
                                Perbandingan total personil (user) aktif pada setiap Organization Group (klik bar untuk filter Master Pengguna)
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.visit('/admin/core/organization-groups')}
                            className="flex cursor-pointer items-center gap-1.5 self-start rounded-lg border border-teal-500/20 bg-teal-500/10 px-2.5 py-1 text-[11px] font-medium text-teal-600 transition-colors hover:bg-teal-500/20 sm:self-auto dark:text-teal-400"
                        >
                            <span>Buka Master Group Organisasi</span>
                            <ChevronRight size={13} />
                        </button>
                    </div>

                    <div className="scrollbar-thumb-surface-border w-full max-w-full scrollbar-thin overflow-x-auto pt-1 pb-3">
                        <div
                            className="h-[290px]"
                            style={{ width: `${Math.max(700, counts.groupBreakdown.filter((g: any) => (g.users || 0) > 0).length * 48)}px` }}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={counts.groupBreakdown.filter((g: any) => (g.users || 0) > 0)}
                                    margin={{ top: 15, right: 20, left: 10, bottom: 80 }}
                                    onClick={(entry) => {
                                        const payload = (entry as { activePayload?: Array<{ payload?: { id?: string | number } }> })
                                            ?.activePayload?.[0]?.payload;
                                        if (payload?.id) {
                                            router.visit(`/admin/core/users?organization_group_id%5B0%5D=${encodeURIComponent(String(payload.id))}`);
                                        }
                                    }}
                                    className="cursor-pointer"
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        dy={6}
                                        tickFormatter={(val) => (val.length > 20 ? val.substring(0, 18) + '...' : val)}
                                    />
                                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                                const row = payload[0].payload;
                                                return (
                                                    <div className="border-surface-border space-y-1 rounded-xl border bg-white p-3 text-xs shadow-md dark:bg-zinc-950">
                                                        <p className="text-text-main font-bold">{row.name}</p>
                                                        {row.code && <p className="text-text-soft font-mono text-[10px]">Kode: {row.code}</p>}
                                                        <div className="border-surface-border/50 space-y-0.5 border-t pt-1.5">
                                                            <p className="flex justify-between gap-4 font-bold text-teal-600 dark:text-teal-400">
                                                                <span>Total Personil:</span>
                                                                <span>{row.users || 0} Orang</span>
                                                            </p>
                                                            <p className="text-text-soft flex justify-between gap-4 text-[10px]">
                                                                <span>Departemen Terhubung:</span>
                                                                <span>{row.departments || 0}</span>
                                                            </p>
                                                        </div>
                                                        <p className="border-surface-border/40 border-t pt-1 text-[9px] font-semibold text-teal-600 dark:text-teal-400">
                                                            Klik bar untuk lihat {row.users || 0} pengguna di Master Pengguna
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="users"
                                        fill="#0d9488"
                                        radius={[4, 4, 0, 0]}
                                        barSize={24}
                                        className="cursor-pointer transition-opacity hover:opacity-80"
                                        onClick={(data: any) => {
                                            if (data?.id) {
                                                router.visit(`/admin/core/users?organization_group_id%5B0%5D=${encodeURIComponent(data.id)}`);
                                            }
                                        }}
                                    >
                                        {counts.groupBreakdown
                                            .filter((g: any) => (g.users || 0) > 0)
                                            .map((entry: any, index: number) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    className="cursor-pointer hover:brightness-110"
                                                    onClick={() => {
                                                        if (entry?.id) {
                                                            router.visit(
                                                                `/admin/core/users?organization_group_id%5B0%5D=${encodeURIComponent(entry.id)}`,
                                                            );
                                                        }
                                                    }}
                                                />
                                            ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid 50/50 (2 Kolom Sejajar) untuk Visualisasi Distribusi Pengguna Group & Perusahaan */}
            <div className="grid grid-cols-1 gap-6">
                {/* Distribusi Pengguna per Group (50%) */}
                <div className="border-surface-border/60 box-border w-full min-w-0 space-y-4 overflow-hidden rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-900/50">
                    <div className="border-surface-border/60 flex items-center justify-between border-b pb-3">
                        <div>
                            <h3 className="text-text-main flex items-center gap-2 text-sm font-bold">
                                <Users size={16} className="text-indigo-500" /> Distribusi Pengguna per Group
                            </h3>
                            <p className="text-text-soft text-[10px]">
                                Jumlah total pengguna aktif berdasarkan Grup Perusahaan (klik bar untuk filter)
                            </p>
                        </div>
                    </div>

                    {!counts.usersByGroup || counts.usersByGroup.length === 0 ? (
                        <div className="text-muted-foreground py-10 text-center text-xs">Tidak ada data pengguna per group</div>
                    ) : (
                        <div className="h-[280px] w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={counts.usersByGroup}
                                    margin={{ top: 15, right: 20, left: 10, bottom: 45 }}
                                    onClick={(entry) => {
                                        const payload = (entry as { activePayload?: Array<{ payload?: { group_id?: string | number } }> })
                                            ?.activePayload?.[0]?.payload;
                                        if (payload?.group_id) {
                                            router.visit(`/admin/core/users?company_group_id%5B0%5D=${encodeURIComponent(String(payload.group_id))}`);
                                        } else {
                                            router.visit('/admin/core/users');
                                        }
                                    }}
                                    className="cursor-pointer"
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                    />
                                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        content={({ active, payload, label }: any) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="border-surface-border space-y-1 rounded-xl border bg-white p-2.5 text-xs shadow-md dark:bg-zinc-950">
                                                        <p className="text-text-main font-bold">{label}</p>
                                                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                                                            {payload[0].value} Pengguna
                                                        </p>
                                                        <p className="border-surface-border/40 border-t pt-1 text-[9px] font-medium text-indigo-500">
                                                            Klik untuk filter pengguna di grup ini &rarr;
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="user_count"
                                        fill="#6366f1"
                                        radius={[4, 4, 0, 0]}
                                        barSize={44}
                                        className="cursor-pointer transition-opacity hover:opacity-80"
                                        onClick={(data: any) => {
                                            if (data?.group_id) {
                                                router.visit(`/admin/core/users?company_group_id%5B0%5D=${encodeURIComponent(data.group_id)}`);
                                            }
                                        }}
                                    >
                                        {counts.usersByGroup.map((entry: any, index: number) => (
                                            <Cell
                                                key={`group-cell-${index}`}
                                                className="cursor-pointer hover:brightness-110"
                                                onClick={() => {
                                                    if (entry?.group_id) {
                                                        router.visit(
                                                            `/admin/core/users?company_group_id%5B0%5D=${encodeURIComponent(entry.group_id)}`,
                                                        );
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Distribusi Pengguna per Perusahaan (50% Sejajar dengan Sub-Card Horizontal Scroll) */}
                <div className="border-surface-border/60 box-border w-full min-w-0 space-y-4 overflow-hidden rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-900/50">
                    <div className="border-surface-border/60 flex items-center justify-between border-b pb-3">
                        <div>
                            <h3 className="text-text-main flex items-center gap-2 text-sm font-bold">
                                <Building size={16} className="text-emerald-500" /> Distribusi Pengguna per Perusahaan
                            </h3>
                            <p className="text-text-soft text-[10px]">
                                Jumlah pengguna aktif per perusahaan (klik bar untuk filter pengguna perusahaan terkait)
                            </p>
                        </div>
                    </div>

                    {!counts.usersByCompany || counts.usersByCompany.length === 0 ? (
                        <div className="text-muted-foreground py-10 text-center text-xs">Tidak ada data pengguna per perusahaan</div>
                    ) : (
                        <div className="scrollbar-thumb-surface-border w-full max-w-full scrollbar-thin overflow-x-auto pt-1 pb-3">
                            <div className="h-[280px]" style={{ width: `${Math.max(600, (counts.usersByCompany?.length || 0) * 55)}px` }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={counts.usersByCompany}
                                        margin={{ top: 15, right: 20, left: 10, bottom: 75 }}
                                        onClick={(entry) => {
                                            const payload = (entry as { activePayload?: Array<{ payload?: { company_id?: string | number } }> })
                                                ?.activePayload?.[0]?.payload;
                                            if (payload?.company_id) {
                                                router.visit(`/admin/core/users?company_id%5B0%5D=${encodeURIComponent(String(payload.company_id))}`);
                                            }
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis
                                            dataKey="company_name"
                                            stroke="#888888"
                                            fontSize={9}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={0}
                                            angle={-45}
                                            textAnchor="end"
                                            dy={5}
                                            tickFormatter={(val) => (val.length > 18 ? val.substring(0, 16) + '...' : val)}
                                        />
                                        <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            content={({ active, payload }: any) => {
                                                if (active && payload && payload.length) {
                                                    const row = payload[0].payload;
                                                    return (
                                                        <div className="border-surface-border space-y-0.5 rounded-xl border bg-white p-2.5 text-xs shadow-md dark:bg-zinc-950">
                                                            <p className="text-text-main font-bold">{row.company_name}</p>
                                                            <p className="text-text-soft text-[10px]">Group: {row.group_name}</p>
                                                            <p className="pt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                                                {row.user_count} Pengguna
                                                            </p>
                                                            <p className="border-surface-border/40 border-t pt-1 text-[9px] font-medium text-emerald-500">
                                                                Klik untuk filter pengguna di perusahaan ini &rarr;
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="user_count"
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                            barSize={26}
                                            className="cursor-pointer transition-opacity hover:opacity-80"
                                            onClick={(data: any) => {
                                                if (data?.company_id) {
                                                    router.visit(`/admin/core/users?company_id%5B0%5D=${encodeURIComponent(data.company_id)}`);
                                                }
                                            }}
                                        >
                                            {counts.usersByCompany.map((entry: any, index: number) => (
                                                <Cell
                                                    key={`comp-cell-${index}`}
                                                    className="cursor-pointer hover:brightness-110"
                                                    onClick={() => {
                                                        if (entry?.company_id) {
                                                            router.visit(
                                                                `/admin/core/users?company_id%5B0%5D=${encodeURIComponent(entry.company_id)}`,
                                                            );
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bagan Struktur Organisasi (Bar Chart) */}
            <div className="border-surface-border/60 space-y-4 rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-900/50">
                <div className="border-surface-border/60 border-b pb-3">
                    <h3 className="text-text-main text-sm font-bold">Bagan Struktur Organisasi</h3>
                    <p className="text-text-soft text-[10px]">Visualisasi interaktif hierarki: Grup Perusahaan &gt; Wilayah &gt; Perusahaan</p>
                </div>

                {treeData.length === 0 ? (
                    <div className="text-muted-foreground py-10 text-center text-xs">Tidak ada data struktur organisasi</div>
                ) : (
                    /* Chart View: Simple Non-stacked Bar Chart */
                    <div className="h-[360px] w-full pt-4 pb-2">
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
                                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    content={({ active, payload, label }: any) => {
                                        if (active && payload && payload.length) {
                                            const item = payload[0].payload;
                                            return (
                                                <div className="border-surface-border space-y-1.5 rounded-xl border bg-white p-3 text-xs shadow-md dark:bg-zinc-950">
                                                    <p className="text-text-main font-bold">{label}</p>
                                                    <div className="border-surface-border/40 space-y-1 border-t pt-1.5">
                                                        {item.regionDetails.map((region: any, idx: number) => {
                                                            if (!region.count) return null;
                                                            return (
                                                                <div key={idx} className="flex items-center justify-between gap-6">
                                                                    <span className="text-text-soft">{region.name}</span>
                                                                    <span className="text-text-main font-bold">{region.count} Perusahaan</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="border-surface-border/40 text-text-main flex justify-between border-t pt-1.5 font-bold">
                                                        <span>Total</span>
                                                        <span>{item.companiesCount} Perusahaan</span>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="companiesCount" radius={[4, 4, 0, 0]} barSize={32}>
                                    {chartData.map((entry: any, index: number) => (
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
