import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'corixa';

let defaultAppLayout: ((page: React.ReactNode) => React.ReactNode) | null = null;

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : import.meta.env.VITE_APP_META_TITLE || appName),
    resolve: async (name) => {
        const pages = import.meta.glob('./features/**/pages/**/*.tsx');

        const ALIAS_MAP: Record<string, string> = {
            'settings/profile': './features/profile/pages/profile.tsx',
            'settings/password': './features/profile/pages/profile.tsx',
            'profile': './features/profile/pages/profile.tsx',
            'roles/Config': './features/admin/pages/roles/Config.tsx',
            'Master/OrganizationTree': './features/members/pages/OrganizationTree.tsx',
            'Core/ResourceIndex': './features/core/pages/ResourceIndex.tsx',
            'Core/ResourceForm': './features/core/pages/ResourceForm.tsx',
            'Core/VendorDocument': './features/core/pages/VendorDocument.tsx',
            'contract-templates/Index': './features/templates/pages/Index.tsx',
            'templates/Index': './features/templates/pages/Index.tsx',
            'form-management/Templates': './features/templates/pages/FormTemplates.tsx',
            'form-management/Print': './features/templates/pages/FormPrint.tsx',
            'form-builder/Index': './features/templates/pages/FormBuilder.tsx',
            'admin/Backups/Index': './features/admin/pages/Backups/Index.tsx',
            'admin/on-behalf-authorities/Index': './features/admin/pages/on-behalf-authorities/Index.tsx',
            'errors/Error': './features/errors/pages/Error.tsx',
            'Error': './features/errors/pages/Error.tsx',
        };

        let pageResolver = ALIAS_MAP[name] ? pages[ALIAS_MAP[name]] : undefined;
        if (!pageResolver) {
            const parts = name.split('/');
            const feature = parts[0];
            const subpage = parts.slice(1).join('/');
            const featureCapitalized = feature.charAt(0).toUpperCase() + feature.slice(1);
            const featureLower = feature.toLowerCase();

            pageResolver =
                pages[`./features/${feature}/pages/${subpage}.tsx`] ||
                pages[`./features/${featureCapitalized}/pages/${subpage}.tsx`] ||
                pages[`./features/${featureLower}/pages/${subpage}.tsx`] ||
                pages[`./features/${feature}/pages/Index.tsx`] ||
                pages[`./features/${featureCapitalized}/pages/Index.tsx`] ||
                pages[`./features/${featureLower}/pages/Index.tsx`];
        }

        if (!pageResolver) {
            throw new Error(`Page not found: ${name}`);
        }

        const page = (await (typeof pageResolver === 'function' ? pageResolver() : pageResolver)) as any;
        if (page.default.layout === undefined && !name.startsWith('auth/') && !name.startsWith('errors/') && name !== 'Error' && name !== 'welcome') {
            if (!defaultAppLayout) {
                const AppLayout = (await import('./layouts/app-layout')).default;
                defaultAppLayout = (page: React.ReactNode) => <AppLayout children={page} />;
            }
            page.default.layout = defaultAppLayout;
        }
        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);

        // Smoothly dismiss initial preloader once React mounts
        const preloader = document.getElementById('initial-preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => preloader.remove(), 250);
        }
    },
    progress: {
        /* ponytail: use dynamic primary color (soft white in dark mode) */
        color: 'var(--primary)',
        showSpinner: false,
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Register Service Worker for PWA installation (Ultra-lightweight)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // silent catch
        });
    });
}
