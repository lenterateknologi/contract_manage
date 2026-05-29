export const renderDiff = (oldText: string = '', newText: string = '', type: 'removed' | 'added' | 'modified') => {
    const cleanOld = oldText === '—' || !oldText ? '' : String(oldText);
    const cleanNew = newText === '—' || !newText ? '' : String(newText);

    if (type === 'removed') {
        return <span className="bg-rose-50/50 text-rose-900 italic line-through decoration-rose-400 decoration-2">{cleanOld || '—'}</span>;
    }
    if (type === 'added') {
        return (
            <span className="rounded bg-emerald-100/50 px-1 font-bold text-emerald-950 underline decoration-emerald-300 underline-offset-2">
                {cleanNew}
            </span>
        );
    }

    return (
        <span className="inline-flex flex-wrap items-center gap-x-2">
            <span className="text-[0.85em] text-rose-950/40 line-through decoration-rose-300 decoration-1">{cleanOld || '—'}</span>
            <span className="rounded bg-emerald-100/50 px-1 font-bold text-emerald-950 underline decoration-emerald-300 underline-offset-2">
                {cleanNew}
            </span>
        </span>
    );
};

export const renderValue = (val: any, field: any, diffStatus?: string, comparisonValue?: any) => {
    if (val === null || val === undefined || val === '') return '—';

    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        try {
            const date = new Date(val);
            if (!isNaN(date.getTime())) {
                const hasTime = val.includes(':') || val.includes('T');
                return date.toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
                });
            }
        } catch (e) {}
    }

    let displayVal = val;
    const vType = field.options?.value_type;
    if (vType === 'select' || vType === 'searchable_select') {
        const item = (field.options?.items || []).find((i: any) => i.value === val);
        if (item) displayVal = item.label;
    }

    if (diffStatus) {
        return renderDiff(comparisonValue, val, diffStatus as any);
    }

    if (field.type === 'signature') {
        return (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center text-[10px] font-bold text-slate-400 uppercase">
                Digital Signature Field
            </div>
        );
    }
    return displayVal;
};

export const getTypographyStyle = (field: any, scale = 1, isLabel = false) => {
    const options = field.options || {};
    return {
        fontSize: options.font_size ? `${options.font_size * scale}px` : `${12 * scale}px`,
        fontWeight: isLabel ? options.font_weight_label || options.font_weight || 'normal' : options.font_weight || 'normal',
        fontFamily: options.font_family || "'Times New Roman', serif",
        fontStyle: options.font_style || undefined,
        textTransform: options.text_transform || undefined,
        textDecoration: options.text_decoration || undefined,
        textAlign: (options.text_align || options.alignment || undefined) as any,
        color: options.color || undefined,
    };
};

export const getPaddingStyle = (field: any) => {
    const isLayout = ['group', 'grid_x', 'grid_y', 'grid_view'].includes(field.type);
    const options = field.options || {};

    const getVal = (v: any, fallback = 0) => {
        if (v === undefined || v === null || v === '') return fallback;
        const num = Number(v);
        return isNaN(num) ? fallback : num;
    };

    // Prioritize individual sides, then axis (x/y), then all sides, then default
    const paddingTop = getVal(options.padding_top, getVal(options.padding_y, isLayout ? getVal(options.padding_all, 0) : 0));
    const paddingBottom = getVal(options.padding_bottom, getVal(options.padding_y, isLayout ? getVal(options.padding_all, 0) : 0));
    const paddingLeft = getVal(options.padding_left, getVal(options.padding_x, isLayout ? getVal(options.padding_all, 0) : 0));
    const paddingRight = getVal(options.padding_right, getVal(options.padding_x, isLayout ? getVal(options.padding_all, 0) : 0));

    return {
        paddingTop: `${paddingTop}mm`,
        paddingBottom: `${paddingBottom}mm`,
        paddingLeft: `${paddingLeft}mm`,
        paddingRight: `${paddingRight}mm`,
    };
};

export const getMarginStyle = (field: any) => {
    const options = field.options || {};

    const getVal = (v: any, fallback: number) => {
        if (v === undefined || v === null || v === '') return fallback;
        const num = Number(v);
        return isNaN(num) ? fallback : num;
    };

    // Default margin-bottom to 2mm if not specified to prevent elements from touching
    const defaultMB = 2;

    const marginTop = getVal(options.margin_top, getVal(options.margin_y, getVal(options.margin_all, 0)));
    const marginBottom = getVal(options.margin_bottom, getVal(options.margin_y, getVal(options.margin_all, defaultMB)));
    const marginLeft = getVal(options.margin_left, getVal(options.margin_x, getVal(options.margin_all, 0)));
    const marginRight = getVal(options.margin_right, getVal(options.margin_x, getVal(options.margin_all, 0)));

    return {
        marginTop: `${marginTop}mm`,
        marginBottom: `${marginBottom}mm`,
        marginLeft: `${marginLeft}mm`,
        marginRight: `${marginRight}mm`,
    };
};

