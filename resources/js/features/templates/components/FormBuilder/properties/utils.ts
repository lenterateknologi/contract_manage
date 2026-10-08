export const parseNumber = (val: string, fallback: number = 0): number | '' => {
    if (val === '') return '';
    const parsed = parseInt(val);
    return isNaN(parsed) ? fallback : parsed;
};

export const parseNumberOrUndefined = (val: string): number | undefined => {
    if (val === '') return undefined;
    const parsed = parseInt(val);
    return isNaN(parsed) ? undefined : parsed;
};

export const parseMargin = (val: string, fallback = 15): number | '' => {
    if (val === '') return '';
    const parsed = parseInt(val);
    return isNaN(parsed) ? fallback : parsed;
};
