import { FormTemplate, InteractiveForm } from '@/components/form-renderer/InteractiveForm';
import { Head } from '@inertiajs/react';
import React from 'react';

interface Props {
    template: FormTemplate;
    formData: Record<string, any>;
}

export default function FormPrint({ template, formData }: Props) {
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
        // Ensure fonts are loaded and give a small buffer for layout calculation
        if (typeof document !== 'undefined' && (document as any).fonts) {
            (document as any).fonts.ready.then(() => {
                setTimeout(() => setReady(true), 1000);
            });
        } else {
            setTimeout(() => setReady(true), 1500);
        }
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Head>
                <title>{`Print: ${template.name}`}</title>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|inter:400,500,600,700|lora:400,500,600,700|montserrat:400,500,600,700,800,900|open-sans:400,500,600,700|roboto:400,500,700|lato:400,700|playfair-display:400,700"
                    rel="stylesheet"
                />
            </Head>

            {/* Minimalist container for PDF rendering */}
            <div className="form-print-container mx-auto w-[210mm]">
                <InteractiveForm template={template} formData={formData} readOnly={true} className="w-full border-none shadow-none ring-0" />
            </div>

            {/* Signal for Browsershot that React has finished mounting and rendering */}
            {ready && <div id="pdf-render-complete" style={{ display: 'none' }} aria-hidden="true" />}

            {/* Print-specific style to ensure no backgrounds are lost and margins are handled */}

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @page {
                    size: A4;
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                }
                /* Hide Interia progress bar if present */
                #nprogress { display: none !important; }
                
                /* Ensure InteractiveForm padding is respected as the paper margin */
                .form-print-container > div {
                    border: none !important;
                    box-shadow: none !important;
                    ring: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                }

                /* Prevent breaking in the middle of an atomic field, but allow breaking inside containers */
                .form-element-container {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                
                /* Allow containers (groups, grids) to span multiple pages if needed */
                .form-element-container:has(> .flex-wrap),
                .form-element-container:has(> .grid) {
                    page-break-inside: auto;
                    break-inside: auto;
                }
            `,
                }}
            />
        </div>
    );
}

// Disable layout for print view
(FormPrint as any).layout = (page: React.ReactNode) => page;
