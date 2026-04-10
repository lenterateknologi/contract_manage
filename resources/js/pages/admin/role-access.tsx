import { Head, useForm, router } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';

interface Props {
    role: {
        id: string;
        name: string;
        description: string;
    };
    modules: Array<{
        id: string;
        code: string;
        title: string;
        module_group: {
            title: string;
        };
        access?: {
            can_read: boolean;
            can_create: boolean;
            can_update: boolean;
            can_delete: boolean;
        };
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/roles',
    },
    {
        title: 'Role Access',
        href: '#',
    },
];

export default function RoleAccess({ role, modules }: Props) {
    const form = useForm({
        accesses: modules.map(module => ({
            module_id: module.id,
            can_read: module.access?.can_read || false,
            can_create: module.access?.can_create || false,
            can_update: module.access?.can_update || false,
            can_delete: module.access?.can_delete || false,
        })),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/admin/roles/${role.id}/access`, {
            onSuccess: () => {
                router.visit('/admin/roles');
            },
        });
    };

    const updateAccess = (moduleId: string, permission: string, checked: boolean) => {
        form.setData('accesses', form.data.accesses.map(access =>
            access.module_id === moduleId
                ? { ...access, [permission]: checked }
                : access
        ));
    };

    const groupedModules = modules.reduce((acc, module) => {
        const group = module.module_group?.title || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(module);
        return acc;
    }, {} as Record<string, typeof modules>);

    return (
        <>
            <Head title={`Access Management - ${role.name}`} />

            <div className="flex h-full flex-col flex-1">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.visit('/admin/roles')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold">Access Management</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage permissions for role: <span className="font-medium">{role.name}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="space-y-6">
                        {Object.entries(groupedModules).map(([groupName, groupModules]) => (
                            <Card key={groupName}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{groupName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {groupModules.map((module) => (
                                            <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{module.title}</h4>
                                                    <p className="text-sm text-muted-foreground">{module.code}</p>
                                                </div>
                                                <div className="flex items-center gap-6">



                                                    
                                                    <label className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={form.data.accesses.find(a => a.module_id === module.id)?.can_read || false}
                                                            onCheckedChange={(checked) => updateAccess(module.id, 'can_read', checked as boolean)}
                                                        />
                                                        <span className="text-sm">Read</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={form.data.accesses.find(a => a.module_id === module.id)?.can_create || false}
                                                            onCheckedChange={(checked) => updateAccess(module.id, 'can_create', checked as boolean)}
                                                        />
                                                        <span className="text-sm">Create</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={form.data.accesses.find(a => a.module_id === module.id)?.can_update || false}
                                                            onCheckedChange={(checked) => updateAccess(module.id, 'can_update', checked as boolean)}
                                                        />
                                                        <span className="text-sm">Update</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={form.data.accesses.find(a => a.module_id === module.id)?.can_delete || false}
                                                            onCheckedChange={(checked) => updateAccess(module.id, 'can_delete', checked as boolean)}
                                                        />
                                                        <span className="text-sm">Delete</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Save Button at Bottom */}
                        <div className="flex justify-end pt-6 border-t">
                            <Button onClick={handleSubmit} disabled={form.processing} size="lg">
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}