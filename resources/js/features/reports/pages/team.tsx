import { Head } from '@inertiajs/react';
import React from 'react';
import { TeamReportsView } from '../components/Team/TeamReportsView';

export default function TeamReportsPage() {
    return (
        <>
            <Head title="Laporan Rekapitulasi Tim" />
            <TeamReportsView />
        </>
    );
}
