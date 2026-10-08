export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="custom-scrollbar flex h-full max-h-screen w-full flex-1 flex-col overflow-y-auto">
            <section className="animate-in fade-in slide-in-from-bottom-2 w-full flex-1 duration-700">{children}</section>
        </div>
    );
}
