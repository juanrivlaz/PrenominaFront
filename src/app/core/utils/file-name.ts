export function sanitizeForFileName(value: string): string {
    return (value || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

export function buildReportFileName(
    base: string,
    parts: { tenant?: string; period?: number | string; year?: number | string },
    extension: string
): string {
    const segments = [base];
    if (parts.tenant) segments.push(sanitizeForFileName(parts.tenant));
    if (parts.period !== undefined && parts.period !== null) segments.push(`p${parts.period}`);
    if (parts.year !== undefined && parts.year !== null) segments.push(String(parts.year));
    return `${segments.join('_')}.${extension}`;
}
