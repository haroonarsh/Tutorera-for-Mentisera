// Escapes HTML special characters to prevent injection when interpolating
// user-supplied strings into email templates (or any other HTML output).
export const escapeHtml = (input: unknown): string => {
    if (input === null || input === undefined) return "";
    const str = String(input);
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};