/**
 * Tiny markdown-to-HTML converter for the help popup system.
 * Intentionally dependency-free — covers only the subset used by
 * public/help/<lang>/<topic>.md files: headings, bold, italic,
 * inline code, unordered lists, links, and paragraphs.
 *
 * HTML in the source is escaped first, so help files cannot inject
 * markup/script into the dialog's dangerouslySetInnerHTML.
 */

function fn_escapeHtml(p_text) {
    return p_text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fn_inline(p_text) {
    let v_out = p_text;
    v_out = v_out.replace(/`([^`]+)`/g, '<code>$1</code>');
    v_out = v_out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    v_out = v_out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    v_out = v_out.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return v_out;
}

/**
 * Convert a markdown string to HTML.
 * @param {string} p_md
 * @returns {string} HTML safe to inject via dangerouslySetInnerHTML
 */
export function fn_markdownToHtml(p_md) {
    if (p_md === null || p_md === undefined) return '';

    const v_lines = String(p_md).replace(/\r\n/g, '\n').split('\n');
    const v_html = [];
    let v_listOpen = false;
    let v_para = [];

    const fn_flushPara = () => {
        if (v_para.length === 0) return;
        v_html.push('<p>' + fn_inline(v_para.join(' ')) + '</p>');
        v_para = [];
    };
    const fn_closeList = () => {
        if (v_listOpen === true) {
            v_html.push('</ul>');
            v_listOpen = false;
        }
    };

    for (let i = 0; i < v_lines.length; i++) {
        const v_raw = v_lines[i];
        const v_line = v_raw.trim();

        if (v_line === '') {
            fn_flushPara();
            fn_closeList();
            continue;
        }

        const v_heading = v_line.match(/^(#{1,6})\s+(.*)$/);
        if (v_heading) {
            fn_flushPara();
            fn_closeList();
            const v_level = v_heading[1].length;
            v_html.push(`<h${v_level}>${fn_inline(fn_escapeHtml(v_heading[2]))}</h${v_level}>`);
            continue;
        }

        const v_item = v_line.match(/^[-*]\s+(.*)$/);
        if (v_item) {
            fn_flushPara();
            if (v_listOpen === false) {
                v_html.push('<ul>');
                v_listOpen = true;
            }
            v_html.push('<li>' + fn_inline(fn_escapeHtml(v_item[1])) + '</li>');
            continue;
        }

        v_para.push(fn_escapeHtml(v_line));
    }

    fn_flushPara();
    fn_closeList();
    return v_html.join('\n');
}

/**
 * Extract the first `# heading` from markdown for use as a dialog title.
 * @param {string} p_md
 * @returns {string|null}
 */
export function fn_extractTitle(p_md) {
    if (p_md === null || p_md === undefined) return null;
    const v_match = String(p_md).match(/^#\s+(.*)$/m);
    return v_match ? v_match[1].trim() : null;
}
