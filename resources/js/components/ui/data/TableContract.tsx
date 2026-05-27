import * as React from 'react';
import { DataTable, DataTableProps, Column } from './DataTable';

export function TableContract<T extends Record<string, any>>(props: DataTableProps<T>) {
    return <DataTable {...props} />;
}

export type { DataTableProps as TableContractProps, Column };
