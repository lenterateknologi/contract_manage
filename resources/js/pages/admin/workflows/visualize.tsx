import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { WorkflowVisualizer } from '@/components/admin/WorkflowVisualizer';
import { Button } from '@/components/ui/base/Button';
import { cn } from '@/lib/utils';
import { 
    Maximize2, 
    X, 
    RefreshCw, 
    LayoutGrid, 
    List, 
    Shield, 
    GitBranch, 
    Users, 
    Upload, 
    CheckCircle2,
    ArrowRightLeft
} from 'lucide-react';

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
            case 'APPROVAL': return Shield;
            case 'REVIEW': return GitBranch;
            case 'SELECTION': return Users;
            case 'UPLOAD': return Upload;
            case 'CLOSING': return CheckCircle2;
            default: return Shield;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
            <Head title="Workflow Board - Fullscreen" />

            {/* Header */}
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <GitBranch size={20} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-widest uppercase text-slate-900 dark:text-white leading-none">
                            Workflow Board
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                            Interactive Oversight Management
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('visual')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                                viewMode === 'visual' 
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" 
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                        >
                            <LayoutGrid size={12} />
                            Visual
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                                viewMode === 'table' 
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" 
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                        >
                            <List size={12} />
                            Table
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                    <Button variant="ghost" size="sm" onClick={loadSteps} className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                        <RefreshCw size={16} className="text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.close()} className="h-9 w-9 p-0 rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30">
                        <X size={16} />
                    </Button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-hidden relative">
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
                        className="h-full border-none rounded-none" 
                    />
                ) : (
                    <div className="h-full overflow-auto p-8">
                        <div className="max-w-6xl mx-auto space-y-4">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Step</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Target Rejection</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {steps.length > 0 ? steps.map((step, idx) => {
                                            const Icon = getIcon(step.step_type);
                                            return (
                                                <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-500">
                                                            {idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-primary/5 rounded-lg text-primary">
                                                                <Icon size={14} />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">
                                                                {step.step_type}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 italic">
                                                            "{step.description || 'No description provided'}"
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {step.reject_target !== undefined && step.reject_target !== null ? (
                                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-rose-500 bg-rose-500/5 px-3 py-1.5 rounded-full w-fit">
                                                                <ArrowRightLeft size={12} />
                                                                {step.reject_target === 0 ? 'KEMBALI KE AWAL' : `KEMBALI KE TAHAP ${step.reject_target}`}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-300 uppercase italic">Not defined</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 opacity-20">
                                                        <LayoutGrid size={48} />
                                                        <span className="text-xs font-black uppercase tracking-widest">No Steps Configured</span>
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
                <div className="absolute bottom-6 right-8 px-5 py-2.5 bg-slate-900/90 backdrop-blur-xl text-white rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-3 shadow-2xl border border-white/10 pointer-events-none z-50">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Visualization Mode
                </div>
            </main>
        </div>
    );
}

Visualize.layout = (page: React.ReactNode) => <>{page}</>;
