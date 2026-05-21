import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Users, Mail, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Department {
    id: string;
    name: string;
    code?: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    initials?: string;
    role: string;
    department_id: string | null;
    department_name?: string;
    bg_color?: string;
    text_color?: string;
}

interface DepartmentTraffic {
    department_id: string;
    department_name: string;
    incoming_count: number;
    outgoing_count: number;
    member_count: number;
}

interface MembersPerDivisionProps {
    users?: User[];
    departments?: Department[];
    departmentTraffic?: DepartmentTraffic[];
}

export function MembersPerDivision({
    users: propUsers,
    departments: propDepts,
    departmentTraffic: propTraffic
}: MembersPerDivisionProps = {}) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const pageProps = usePage().props as any;
    const users = propUsers ?? pageProps.users ?? [];
    const departments = propDepts ?? pageProps.departments ?? [];
    const departmentTraffic = propTraffic ?? pageProps.metrics?.departmentTraffic ?? pageProps.departmentTraffic ?? [];

    // Group users by department_id
    const groupedUsers = users.reduce((acc: Record<string, User[]>, user: User) => {
        const deptId = user.department_id || 'unassigned';
        if (!acc[deptId]) {
            acc[deptId] = [];
        }
        acc[deptId].push(user);
        return acc;
    }, {} as Record<string, User[]>);

    // Map departments for quick lookup
    const deptMap = new Map<string, Department>();
    departments.forEach((d: Department) => deptMap.set(d.id, d));

    // Sort departments so those with members appear first, and unassigned appears last
    const sortedDeptIds = Object.keys(groupedUsers).sort((a, b) => {
        if (a === 'unassigned') return 1;
        if (b === 'unassigned') return -1;
        const nameA = deptMap.get(a)?.name ?? '';
        const nameB = deptMap.get(b)?.name ?? '';
        return nameA.localeCompare(nameB);
    });

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <div className="space-y-4 m-5 select-none animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-foreground text-xs font-extrabold tracking-tight">Anggota per Divisi</h2>
                    <p className="text-muted-foreground text-[9px] font-semibold mt-0.5">
                        Daftar pengguna terdaftar dikelompokkan berdasarkan divisi/departemen mereka.
                    </p>
                </div>
                <div className="bg-muted/40 border border-border/40 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[9px] font-bold text-foreground">
                    <Users size={10} className="text-primary" />
                    <span className="text-[9px]">Total {users.length} Pengguna</span>
                </div>
            </div>

            {/* Compact Grid of Division Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {sortedDeptIds.map((deptId) => {
                    const dept = deptMap.get(deptId);
                    const deptName = dept ? dept.name : 'Direksi & Staff Umum';
                    const deptCode = dept?.code ? `(${dept.code})` : '';
                    const deptMembers = groupedUsers[deptId] || [];

                    return (
                        <div
                            key={deptId}
                            className="group border border-border/60 bg-card/40 hover:bg-card/65 relative flex flex-col overflow-hidden rounded-xl p-2 shadow-xs transition-all duration-300 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/20 hover:shadow-md hover:-translate-y-0.5"
                        >
                            {/* Department Header */}
                            <div className="flex items-start justify-between border-b border-border/20 pb-1 mb-1.5 dark:border-slate-800/30">
                                <div className="flex items-center gap-1 min-w-0">
                                    <div className="bg-primary/10 text-primary border border-primary/10 rounded-md p-0.5 shrink-0">
                                        <Building2 size={10} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-foreground truncate text-[9px] font-extrabold tracking-tight" title={deptName}>
                                            {deptName}
                                        </h3>
                                        <span className="text-muted-foreground text-[7.5px] font-semibold block leading-none mt-0.5">{deptCode || 'Management'}</span>
                                    </div>
                                </div>
                                <span className="bg-primary/10 text-primary/80 border border-primary/10 text-[6.5px] font-extrabold uppercase px-1 py-0.5 rounded-full shrink-0">
                                    {deptMembers.length}
                                </span>
                            </div>

                            {/* Members list inside division */}
                            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5 custom-scrollbar">
                                {deptMembers.map((u: User) => {
                                    const customStyle = u.bg_color && u.text_color
                                        ? { backgroundColor: u.bg_color, color: u.text_color }
                                        : undefined;

                                    return (
                                        <div key={u.id} className="flex items-center gap-1 group/user py-0">
                                            {/* Avatar Initials */}
                                            <div
                                                style={customStyle}
                                                className={cn(
                                                    "h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-extrabold shrink-0 border border-black/5 dark:border-white/5",
                                                    !customStyle && "bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {u.initials || getInitials(u.name)}
                                            </div>

                                            {/* User Details */}
                                            <div className="min-w-0 flex-1">
                                                <span className="text-foreground text-[8.5px] font-bold block truncate leading-tight group-hover/user:text-primary transition-colors">
                                                    {u.name}
                                                </span>
                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                    <span className="text-muted-foreground text-[7.5px] font-semibold truncate leading-none">
                                                        {u.role}
                                                    </span>
                                                    <span className="text-muted-foreground/30 text-[7.5px] leading-none">·</span>
                                                    <a
                                                        href={`mailto:${u.email}`}
                                                        className="text-muted-foreground/50 hover:text-primary text-[7px] transition-colors shrink-0 leading-none"
                                                        title={u.email}
                                                    >
                                                        <Mail size={7.5} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
