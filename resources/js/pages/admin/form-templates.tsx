import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    FileJson, 
    Plus, 
    Search, 
    MoreHorizontal, 
    Edit2, 
    Trash2, 
    Eye,
    Settings,
    Clock,
    User,
    ChevronRight,
    Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface FormTemplate {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    fields_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    templates: FormTemplate[];
}

export default function FormTemplates({ templates }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

    const filteredTemplates = templates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDelete = () => {
        if (!selectedTemplate) return;
        router.delete(route('admin.form-templates.destroy', selectedTemplate.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedTemplate(null);
            }
        });
    };

    return (
        <>
            <Head title="Form Template" />
            
            <div className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Form Template</h1>
                        <p className="text-muted-foreground text-sm">Kelola template form digital untuk input data kontrak.</p>
                    </div>
                    
                    <Button asChild className="shadow-md shadow-primary/20">
                        <a href={route('admin.form-templates.builder')} target="_blank">
                            <Plus size={18} className="mr-2" />
                            Buat Template Baru
                        </a>
                    </Button>
                </div>

                <div className="flex items-center gap-2 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Cari template..." 
                            className="pl-9 bg-muted/20 border-none ring-0 h-10"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTemplates.map(template => (
                        <Card key={template.id} className="group overflow-hidden hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col">
                            <CardHeader className="p-5 pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <FileJson size={20} />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                <MoreHorizontal size={16} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem asChild>
                                                <a href={route('admin.form-templates.builder', template.id)} target="_blank" className="flex items-center px-2 py-1.5 text-sm">
                                                    <Edit2 className="mr-2 h-4 w-4" /> Edit Builder
                                                </a>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                                                setSelectedTemplate(template);
                                                setIsDeleteModalOpen(true);
                                            }}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="text-base font-bold leading-tight line-clamp-1">{template.name}</CardTitle>
                                <CardDescription className="text-xs line-clamp-2 min-h-[32px] mt-1">
                                    {template.description || 'Tidak ada deskripsi.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-5 py-3 flex-1">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-transparent">
                                        {template.fields_count} Fields
                                    </Badge>
                                     {template.is_active ? (
                                         <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/5">Aktif</Badge>
                                     ) : (
                                         <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-muted bg-muted/30">Draft</Badge>
                                     )}
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center text-[11px] text-muted-foreground">
                                        <Clock size={12} className="mr-1.5 opacity-60" />
                                        Terakhir update: {new Date(template.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="px-5 py-4 bg-muted/30 border-t flex gap-2">
                                <Button size="sm" variant="ghost" className="flex-1 text-xs font-bold h-8 border border-transparent hover:border-primary/20 hover:bg-primary/5 group/btn" asChild>
                                    <a href={route('admin.form-templates.builder', template.id)} target="_blank">
                                        <Settings size={14} className="mr-1.5 opacity-60 group-hover/btn:opacity-100" />
                                        Edit
                                    </a>
                                </Button>
                                <Button size="sm" className="flex-1 text-xs font-bold h-8 shadow-sm" variant="outline" asChild>
                                    <a href={route('admin.form-templates.builder', template.id)} target="_blank">
                                        <Play size={14} className="mr-1.5" />
                                        Preview
                                    </a>
                                </Button>
                                {/* Removed Isi Form from here as per request */}
                            </CardFooter>
                        </Card>
                    ))}

                    {filteredTemplates.length === 0 && (
                        <Card className="col-span-full py-12 border-dashed border-2 flex flex-col items-center justify-center bg-muted/5">
                            <FileJson size={48} className="text-muted-foreground/20 mb-4" />
                            <h3 className="font-bold text-lg text-muted-foreground">Belum ada template form</h3>
                            <p className="text-muted-foreground text-sm mb-6">Mulai buat template digital pertamamu.</p>
                            <Button asChild>
                                <a href={route('admin.form-templates.builder')} target="_blank">
                                    <Plus size={18} className="mr-2" />
                                    Buat Sekarang
                                </a>
                            </Button>
                        </Card>
                    )}
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Hapus Template Form</DialogTitle>
                        <DialogDescription className="text-xs">
                             Apakah Anda yakin ingin menghapus template <strong>"{selectedTemplate?.name}"</strong>? 
                             Semua data terkait template ini akan dihapus secara permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>Batal</Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete}>Hapus Sekarang</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
