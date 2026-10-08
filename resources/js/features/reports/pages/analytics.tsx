import { Head } from '@inertiajs/react';
import React from 'react';
import { AnalyticsView } from '../components/Analytics/AnalyticsView';

export default function AnalyticsPage() {
    return (
        <>
            <Head title="Laporan Analitik Kontrak" />
            <AnalyticsView />
        </>
    );
}
