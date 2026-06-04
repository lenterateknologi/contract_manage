import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { Building2, Mail, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

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

export function MembersPerDivision({ users: propUsers, departments: propDepts, departmentTraffic: propTraffic }: MembersPerDivisionProps = {}) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const pageProps = usePage().props as any;
    const users = propUsers ?? pageProps.users ?? [];
    const departments = propDepts ?? pageProps.departments ?? [];
    const departmentTraffic = propTraffic ?? pageProps.metrics?.departmentTraffic ?? pageProps.departmentTraffic ?? [];

    // Group users by department_id
    const groupedUsers = users.reduce(
        (acc: Record<string, User[]>, user: User) => {
            const deptId = user.department_id || 'unassigned';
            if (!acc[deptId]) {
                acc[deptId] = [];
            }
            acc[deptId].push(user);
            return acc;
        },
        {} as Record<string, User[]>,
    );

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
        <div className="animate-in fade-in m-5 space-y-5 duration-500 select-none">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-text-main text-sm font-semibold tracking-tight uppercase">Anggota per Divisi</h2>
                    <p className="text-text-desc mt-0.5 text-xs font-semibold">
                        Daftar pengguna terdaftar dikelompokkan berdasarkan divisi/departemen mereka.
                    </p>
                </div>
                <div className="bg-surface-muted/40 border-surface-border/40 text-text-main flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                    <Users size={13} className="text-primary" />
                    <span className="text-xs font-semibold uppercase">Total {users.length} Pengguna</span>
                </div>
            </div>

            {/* Compact Grid of Division Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {sortedDeptIds.map((deptId) => {
                    const dept = deptMap.get(deptId);
                    const deptName = dept ? dept.name : 'Direksi & Staff Umum';
                    const deptCode = dept?.code ? `(${dept.code})` : '';
                    const deptMembers = groupedUsers[deptId] || [];

                    return (
                        <div
                            key={deptId}
                            className="group border-surface-border/60 bg-surface-base/40 hover:bg-surface-base/65 relative flex flex-col overflow-hidden rounded-xl border p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        >
                            {/* Department Header */}
                            <div className="border-surface-border/20 mb-3 flex items-start justify-between border-b pb-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <div className="bg-primary/10 text-primary border-primary/10 shrink-0 rounded-md border p-1.5">
                                        <Building2 size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-text-main truncate text-xs font-semibold tracking-tight uppercase" title={deptName}>
                                            {deptName}
                                        </h3>
                                        <span className="text-text-desc mt-1 block text-[10px] leading-none font-medium uppercase">
                                            {deptCode || 'Management'}
                                        </span>
                                    </div>
                                </div>
                                <span className="bg-primary/10 text-primary/80 border-primary/10 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase">
                                    {deptMembers.length}
                                </span>
                            </div>

                            {/* Members list inside division */}
                            <div className="custom-scrollbar max-h-[220px] space-y-2.5 overflow-y-auto pr-0.5">
                                {deptMembers.map((u: User) => {
                                    const customStyle = u.bg_color && u.text_color ? { backgroundColor: u.bg_color, color: u.text_color } : undefined;

                                    return (
                                        <div key={u.id} className="group/user flex items-center gap-2 py-0.5">
                                            {/* Avatar Initials */}
                                            <div
                                                style={customStyle}
                                                className={cn(
                                                    'border-surface-border/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
                                                    !customStyle && 'bg-surface-muted text-text-desc',
                                                )}
                                            >
                                                {u.initials || getInitials(u.name)}
                                            </div>

                                            {/* User Details */}
                                            <div className="min-w-0 flex-1">
                                                <span className="text-text-main group-hover/user:text-primary block truncate text-xs leading-tight font-medium transition-colors">
                                                    {u.name}
                                                </span>
                                                <div className="mt-0.5 flex items-center gap-1.5">
                                                    <span className="text-text-desc truncate text-[10px] leading-none font-semibold uppercase">
                                                        {u.role}
                                                    </span>
                                                    <span className="text-text-desc/30 text-[10px] leading-none">·</span>
                                                    <a
                                                        href={`mailto:${u.email}`}
                                                        className="text-text-desc/50 hover:text-primary shrink-0 text-[9px] leading-none transition-colors"
                                                        title={u.email}
                                                    >
                                                        <Mail size={11} />
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
