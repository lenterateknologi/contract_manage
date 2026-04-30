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
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Digital Signature Field
            </div>
        );
    }
    return displayVal;
};

export const getTypographyStyle = (field: any, scale = 1, isLabel = false) => {
    const options = field.options || {};
    return {
        fontSize: options.font_size ? `${options.font_size * scale}px` : `${11 * scale}px`,
        fontWeight: isLabel ? options.font_weight_label || options.font_weight || 'bold' : options.font_weight || 'bold',
        fontFamily: options.font_family || "'Inter', sans-serif",
        fontStyle: options.font_style || undefined,
        textTransform: options.text_transform || undefined,
        textDecoration: options.text_decoration || undefined,
        textAlign: (options.text_align || options.alignment || undefined) as any,
    };
};

export const getPaddingStyle = (field: any) => {
    const isLayout = ['group', 'grid_x', 'grid_y', 'grid_view'].includes(field.type);
    
    // For non-layout fields, we often want to force 0 padding to keep the UI clean
    // unless the user really explicitly set it (but even then, for H1 we usually want 0)
    const isContent = ['static_text', 'image', 'f1_header', 'page_break'].includes(field.type);

    const paddingTop = (isContent) ? 0 : (field.options?.padding_top ?? field.options?.padding_y ?? (isLayout ? field.options?.padding_all : 0) ?? 0);
    const paddingBottom = (isContent) ? 0 : (field.options?.padding_bottom ?? field.options?.padding_y ?? (isLayout ? field.options?.padding_all : 0) ?? 0);
    const paddingLeft = (isContent) ? 0 : (field.options?.padding_left ?? field.options?.padding_x ?? (isLayout ? field.options?.padding_all : 0) ?? 0);
    const paddingRight = (isContent) ? 0 : (field.options?.padding_right ?? field.options?.padding_x ?? (isLayout ? field.options?.padding_all : 0) ?? 0);

    return {
        paddingTop: `${paddingTop}mm`,
        paddingBottom: `${paddingBottom}mm`,
        paddingLeft: `${paddingLeft}mm`,
        paddingRight: `${paddingRight}mm`,
    };
};
