import { FormTemplate, InteractiveForm } from '@/pages/form-builder/components/renderer/InteractiveForm';
import { Head } from '@inertiajs/react';
import React from 'react';

interface Props {
    template: FormTemplate;
    formData: Record<string, any>;
    printedBy?: {
        name?: string;
        id?: string;
        email?: string;
        timestamp?: string;
    };
}

export default function FormPrint({ template, formData, printedBy }: Props) {
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
        <div className="min-h-screen bg-white flex flex-col justify-between">
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

            {/* Audit / User Remark Footer */}
            {printedBy && (
                <div className="form-print-footer mx-auto w-[210mm] px-6 py-3 text-[9px] text-slate-400 flex items-center justify-between border-t border-slate-200/80 font-mono">
                    <span>
                        Dokumen dicetak / diunduh oleh: <strong className="text-slate-600">{printedBy.name || 'System'}</strong>
                        {printedBy.id && printedBy.id !== '-' && <span> (User ID: <strong className="text-slate-600">{printedBy.id}</strong>)</span>}
                    </span>
                    <span>{printedBy.timestamp || new Date().toLocaleString('id-ID')}</span>
                </div>
            )}

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
