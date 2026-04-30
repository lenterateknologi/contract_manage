export function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40">
            {children}
        </h3>
    );
}
