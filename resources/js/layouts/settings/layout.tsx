export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-full max-h-screen w-full flex-1 flex-col overflow-y-auto custom-scrollbar">
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 w-full flex-1">{children}</section>
        </div>
    );
}
