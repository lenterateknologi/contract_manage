import { WorkflowVisualizer } from '@/components/admin/WorkflowVisualizer';
import { Button } from '@/components/ui/base/Button';
import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { ArrowRightLeft, CheckCircle2, GitBranch, LayoutGrid, List, RefreshCw, Shield, Upload, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Props {
    breadcrumbs: any[];
}

export default function Visualize({ breadcrumbs }: Props) {
    const [steps, setSteps] = useState<any[]>([]);
    const [companyGroups, setCompanyGroups] = useState<any[]>([]);
    const [regions, setRegions] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

    const loadSteps = () => {
        try {
            const saved = localStorage.getItem('workflow_preview_steps');
            if (saved) {
                setSteps(JSON.parse(saved));
            }

            const savedGroups = localStorage.getItem('workflow_master_groups');
            if (savedGroups) setCompanyGroups(JSON.parse(savedGroups));

            const savedRegions = localStorage.getItem('workflow_master_regions');
            if (savedRegions) setRegions(JSON.parse(savedRegions));

            const savedCompanies = localStorage.getItem('workflow_master_companies');
            if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
        } catch (e) {
            console.error('Failed to load data from localStorage', e);
        }
    };

    useEffect(() => {
        loadSteps();
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'workflow_preview_steps') loadSteps();
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const getIcon = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'APPROVAL':
                return Shield;
            case 'REVIEW':
                return GitBranch;
            case 'SELECTION':
                return Users;
            case 'UPLOAD':
                return Upload;
            case 'CLOSING':
                return CheckCircle2;
            default:
                return Shield;
        }
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-slate-50 font-sans dark:bg-slate-950">
            <Head title="Workflow Board - Fullscreen" />

            {/* Header */}
            <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-xl p-2">
                        <GitBranch size={20} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-sm leading-none font-black text-slate-900 uppercase dark:text-white">Workflow Board</h1>
                        <p className="mt-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">Interactive Oversight Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                        <button
                            onClick={() => setViewMode('visual')}
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-4 py-1.5 text-[10px] font-black uppercase transition-all',
                                viewMode === 'visual'
                                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
                            )}
                        >
                            <LayoutGrid size={12} />
                            Visual
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-4 py-1.5 text-[10px] font-black uppercase transition-all',
                                viewMode === 'table'
                                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
                            )}
                        >
                            <List size={12} />
                            Table
                        </button>
                    </div>

                    <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-800" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadSteps}
                        className="h-9 w-9 rounded-xl p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <RefreshCw size={16} className="text-slate-500" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.close()}
                        className="h-9 w-9 rounded-xl p-0 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                    >
                        <X size={16} />
                    </Button>
                </div>
            </header>

            {/* Content Area */}
            <main className="relative flex-1 overflow-hidden">
                {viewMode === 'visual' ? (
                    <WorkflowVisualizer
                        steps={steps}
                        companyGroups={companyGroups}
                        regions={regions}
                        companies={companies}
                        onChange={(newSteps) => {
                            setSteps(newSteps);
                            localStorage.setItem('workflow_preview_steps', JSON.stringify(newSteps));
                        }}
                        className="h-full rounded-none border-none"
                    />
                ) : (
                    <div className="h-full overflow-auto p-8">
                        <div className="mx-auto max-w-6xl space-y-4">
                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Step</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Type</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Target Rejection</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {steps.length > 0 ? (
                                            steps.map((step, idx) => {
                                                const Icon = getIcon(step.step_type);
                                                return (
                                                    <tr key={idx} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                                        <td className="px-6 py-4">
                                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-500 dark:bg-slate-800">
                                                                {idx + 1}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-primary/5 text-primary rounded-lg p-2">
                                                                    <Icon size={14} />
                                                                </div>
                                                                <span className="text-[10px] font-black tracking-tight text-slate-700 uppercase dark:text-slate-300">
                                                                    {step.step_type}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-bold text-slate-600 italic dark:text-slate-400">
                                                                "{step.description || 'No description provided'}"
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {step.reject_target !== undefined && step.reject_target !== null ? (
                                                                <div className="flex w-fit items-center gap-2 rounded-full bg-rose-500/5 px-3 py-1.5 text-[10px] font-black text-rose-500 uppercase">
                                                                    <ArrowRightLeft size={12} />
                                                                    {step.reject_target === 0
                                                                        ? 'KEMBALI KE AWAL'
                                                                        : `KEMBALI KE TAHAP ${step.reject_target}`}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-300 uppercase italic">
                                                                    Not defined
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 opacity-20">
                                                        <LayoutGrid size={48} />
                                                        <span className="text-xs font-black uppercase">No Steps Configured</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Indicator */}
                <div className="pointer-events-none absolute right-8 bottom-6 z-50 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 px-5 py-2.5 text-[10px] font-black tracking-[0.2em] text-white uppercase shadow-2xl backdrop-blur-xl">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Live Visualization Mode
                </div>
            </main>
        </div>
    );
}

Visualize.layout = (page: React.ReactNode) => <>{page}</>;
