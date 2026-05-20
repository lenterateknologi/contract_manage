export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-full w-full flex-col">
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-700">{children}</section>
        </div>
    );
}
