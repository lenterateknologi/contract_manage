export default function AppLogo() {
    return (
        <div className="flex w-full items-center gap-2.5 overflow-hidden px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
            <img
                src="/images/logo.png"
                alt="ABSAH Logo"
                className="size-16 object-contain transition-all duration-300 group-data-[collapsible=icon]:size-10 dark:brightness-0 dark:invert"
            />
            <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                <span className="text-sidebar-foreground text-[13.5px] leading-none font-bold tracking-tight">ABSAH</span>
                <span className="text-sidebar-foreground/45 mt-1.5 text-[8.5px] leading-none font-medium">Legal Management System</span>
            </div>
        </div>
    );
}
