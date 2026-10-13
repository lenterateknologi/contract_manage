import { FormTemplate, InteractiveForm } from '../components/FormRenderer/InteractiveForm';
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
        if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.backgroundColor = '#ffffff';
            document.body.style.backgroundColor = '#ffffff';
        }

        let isMounted = true;

        const checkAndSignalReady = async () => {
            try {
                // 1. Wait for document fonts to be ready
                if (typeof document !== 'undefined' && (document as any).fonts) {
                    await Promise.race([
                        (document as any).fonts.ready,
                        new Promise((r) => setTimeout(r, 3000)),
                    ]);
                }

                // 2. Wait for all <img> tags to load and decode
                if (typeof document !== 'undefined') {
                    // Small delay to allow React to paint DOM elements
                    await new Promise((r) => setTimeout(r, 150));

                    const images = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
                    if (images.length > 0) {
                        const imagePromises = images.map((img) => {
                            return new Promise<void>((resolve) => {
                                if (img.complete) {
                                    if ('decode' in img && typeof img.decode === 'function') {
                                        img.decode().then(resolve).catch(() => resolve());
                                    } else {
                                        resolve();
                                    }
                                } else {
                                    const onFinish = () => {
                                        img.removeEventListener('load', onFinish);
                                        img.removeEventListener('error', onFinish);
                                        if ('decode' in img && typeof img.decode === 'function') {
                                            img.decode().then(resolve).catch(() => resolve());
                                        } else {
                                            resolve();
                                        }
                                    };
                                    img.addEventListener('load', onFinish);
                                    img.addEventListener('error', onFinish);
                                }
                            });
                        });

                        // Max 6s timeout for all images to decode
                        await Promise.race([
                            Promise.all(imagePromises),
                            new Promise((r) => setTimeout(r, 6000)),
                        ]);
                    }
                }

                // 3. Extra 300ms buffer to ensure layout and paint have completely settled
                await new Promise((r) => setTimeout(r, 300));
            } catch (err) {
                console.error('Error waiting for assets in FormPrint:', err);
            } finally {
                if (isMounted) {
                    setReady(true);
                }
            }
        };

        checkAndSignalReady();

        // Safety fallback: if anything unexpected happens, guarantee setReady(true) within 8 seconds
        const fallbackTimer = setTimeout(() => {
            if (isMounted) {
                setReady(true);
            }
        }, 8000);

        return () => {
            isMounted = false;
            clearTimeout(fallbackTimer);
        };
    }, []);

    const marginTop = template?.letterhead_json?.margins?.top ?? 15;
    const marginBottom = template?.letterhead_json?.margins?.bottom ?? 15;
    const marginLeft = template?.letterhead_json?.margins?.left ?? 15;
    const marginRight = template?.letterhead_json?.margins?.right ?? 15;

    // Safety margin-bottom: ensure enough space at bottom of each page so content NEVER touches fixed footer
    const pageBottomMargin = Math.max(marginBottom, 18);

    return (
        <div className="w-full bg-white print:min-h-0 print:bg-white">
            <Head>
                <title>{`Print: ${template.name}`}</title>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|inter:400,500,600,700|lora:400,500,600,700|montserrat:400,500,600,700,800,900|open-sans:400,500,600,700|roboto:400,500,700|lato:400,700|playfair-display:400,700"
                    rel="stylesheet"
                />
            </Head>

            {/* Minimalist container for PDF rendering */}
            <div className="form-print-container mx-auto w-[210mm] bg-white">
                <InteractiveForm template={template} formData={formData} readOnly={true} className="w-full border-none shadow-none ring-0" />
            </div>

            {/* Audit / User Remark Footer - Fixed running footer across all pages */}
            {printedBy && (
                <div className="form-print-footer fixed bottom-0 left-0 right-0 z-50 bg-white">
                    <div
                        className="mx-auto flex items-center justify-between border-t border-slate-200/90 font-mono text-[9px] text-slate-500 bg-white"
                        style={{
                            width: '210mm',
                            paddingLeft: `${marginLeft}mm`,
                            paddingRight: `${marginRight}mm`,
                            paddingTop: '6px',
                            paddingBottom: '6px',
                        }}
                    >
                        <span>
                            Dokumen dicetak / diunduh oleh: <strong className="text-slate-700">{printedBy.name || 'System'}</strong>
                            {printedBy.id && printedBy.id !== '-' && (
                                <span>
                                    {' '}
                                    (User ID: <strong className="text-slate-700">{printedBy.id}</strong>)
                                </span>
                            )}
                        </span>
                        <span>{printedBy.timestamp || new Date().toLocaleString('id-ID')}</span>
                    </div>
                </div>
            )}

            {/* Signal for Browsershot that React has finished mounting and rendering */}
            {ready && (
                <div
                    id="pdf-render-complete"
                    style={{ width: 1, height: 1, opacity: 0, position: 'absolute', pointerEvents: 'none' }}
                    aria-hidden="true"
                />
            )}

            {/* Print-specific style to ensure no backgrounds are lost and margins are handled */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @page {
                    size: A4;
                    margin-top: ${marginTop}mm;
                    margin-bottom: ${pageBottomMargin}mm;
                    margin-left: 0;
                    margin-right: 0;
                }
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    background-color: #ffffff !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color: #0f172a !important;
                }
                /* Hide Inertia progress bar if present */
                #nprogress { display: none !important; }

                /* Running footer fixed at the bottom of every page */
                .form-print-footer {
                    position: fixed !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    width: 100% !important;
                    background: #ffffff !important;
                    background-color: #ffffff !important;
                    z-index: 9999 !important;
                    box-sizing: border-box !important;
                }

                /* Ensure paper container resets margins, borders, shadows and artificial min-height */
                .form-print-container {
                    background: #ffffff !important;
                    background-color: #ffffff !important;
                    width: 210mm !important;
                }

                .form-print-container > div,
                .form-print-container .force-light {
                    border: none !important;
                    box-shadow: none !important;
                    ring: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding-top: 0 !important;
                    padding-bottom: 0 !important;
                    min-height: 0 !important;
                    height: auto !important;
                    background: #ffffff !important;
                    background-color: #ffffff !important;
                }

                .form-print-container [data-page-number] {
                    margin-top: 0 !important;
                    margin-bottom: 0 !important;
                }

                /* Support explicit page breaks */
                .print\\:break-before-page,
                [data-page-number]:not([data-page-number="1"]) {
                    break-before: page !important;
                    page-break-before: always !important;
                    margin-top: 0 !important;
                }

                /* Allow containers (groups, grids) to fragment/break across pages naturally */
                .form-container-element,
                .form-element-container:has(.flex-wrap),
                .form-element-container:has(.grid),
                .form-element-container[data-field-type="group"],
                .form-element-container[data-field-type="grid_x"],
                .form-element-container[data-field-type="grid_y"],
                .form-container-element > div,
                .form-container-element .flex-wrap {
                    page-break-inside: auto !important;
                    break-inside: auto !important;
                }

                /* Prevent breaking in the middle of an atomic field */
                .form-atomic-element {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                /* Avoid orphaned section headers/titles */
                .form-element-container[data-field-type="static_text"],
                h1, h2, h3, h4 {
                    page-break-after: avoid;
                    break-after: avoid;
                }
            `,
                }}
            />
        </div>
    );
}

// Disable layout for print view
(FormPrint as any).layout = (page: React.ReactNode) => page;
