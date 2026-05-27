export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5 px-1">
            <img 
                src="/images/logo.png" 
                alt="ABSAH Logo" 
                className="size-16 object-contain dark:brightness-0 dark:invert" 
            />
            <div className="flex flex-col">
                <span className="text-sidebar-foreground text-[13.5px] leading-none font-bold tracking-tight">ABSAH</span>
                <span className="text-sidebar-foreground/45 mt-1.5 text-[8.5px] leading-none font-medium">Legal Management System</span>
            </div>
        </div>
    );
}


