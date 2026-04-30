export interface AdvancedFilterRule {
    id: string;
    field: string;
    operator: string;
    value: any;
}

export interface AdvancedFilters {
    conjunction: 'AND' | 'OR';
    match_type: 'partial' | 'exact';
    rules: AdvancedFilterRule[];
}
