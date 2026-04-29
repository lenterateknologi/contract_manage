export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5 px-1">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <svg
                    viewBox="0 0 62 65"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5 fill-current"
                >
                    <path d="M61.8548 14.6253L61.2606 14.7744L52.5359 11.4051V0H24.3642V10.2789L13.7844 14.3664L0 19.6105V28.2573L0.00539305 28.2573L0 28.2594L13.7844 23.003V32.7441L24.3642 28.6679V38.9324L26.6806 39.8272L26.6806 24.3642L52.5359 14.3664V24.0841L61.2606 20.7161L61.8548 20.8653V14.6253Z" />
                    <path d="M61.8548 44.3747L61.2606 44.2256L52.5359 47.5949V59H24.3642V48.7211L13.7844 44.6336L0 39.3895V30.7427L0.00539305 30.7427L0 30.7406L13.7844 35.997V26.2559L24.3642 30.3321V20.0676L26.6806 19.1728V34.6358L52.5359 44.6336V34.9159L61.2606 38.2839L61.8548 38.1347V44.3747Z" />
                </svg>
            </div>
            <div className="flex flex-col">
                <span className="text-[13.5px] font-bold leading-none tracking-tight text-sidebar-foreground">
                    Contract
                </span>
                <span className="text-[10px] font-medium leading-none tracking-[0.05em] text-sidebar-foreground/40 mt-0.5">
                    Management
                </span>
            </div>
        </div>
    );
}
