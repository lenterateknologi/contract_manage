export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5 px-1 w-full overflow-hidden group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
            <img 
                src="/images/logo.png" 
                alt="ABSAH Logo" 
                className="size-16 group-data-[collapsible=icon]:size-10 object-contain dark:brightness-0 dark:invert transition-all duration-300" 
            />
            <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                <span className="text-sidebar-foreground text-[13.5px] leading-none font-bold tracking-tight">ABSAH</span>
                <span className="text-sidebar-foreground/45 mt-1.5 text-[8.5px] leading-none font-medium">Legal Management System</span>
            </div>
        </div>
    );
}


