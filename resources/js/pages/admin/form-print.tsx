import React from 'react';
import { Head } from '@inertiajs/react';
import { InteractiveForm, FormTemplate } from '@/components/form-renderer/InteractiveForm';

interface Props {
    template: FormTemplate;
    formData: Record<string, any>;
}

export default function FormPrint({ template, formData }: Props) {
    return (
        <div className="bg-white min-h-screen">
            <Head>
                <title>{`Print: ${template.name}`}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet" />
            </Head>
            
            {/* Minimalist container for PDF rendering */}
            <div className="mx-auto w-[210mm]">
                <InteractiveForm 
                    template={template}
                    formData={formData}
                    readOnly={true}
                    className="border-none shadow-none ring-0 w-full"
                />
            </div>

            {/* Signal for Browsershot that React has finished mounting and rendering */}
            <div id="pdf-render-complete" style={{ display: 'none' }} aria-hidden="true" />

            {/* Print-specific style to ensure no backgrounds are lost and margins are handled */}

            <style dangerouslySetInnerHTML={{ __html: `
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
            `}} />
        </div>
    );
}

// Disable layout for print view
(FormPrint as any).layout = (page: React.ReactNode) => page;
