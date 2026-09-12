/**
 * Loads help markdown files from public/help/<lang>/<topic>.md.
 * Falls back to the 'en' folder when the active language has no
 * translated page. Returns the raw markdown; conversion to HTML is
 * done by js_markdownLite.
 */

import { fn_markdownToHtml, fn_extractTitle } from './js_markdownLite.js';

async function fn_fetchMd(p_path) {
    try {
        const v_res = await fetch(p_path);
        if (v_res.ok !== true) return null;
        const v_text = await v_res.text();
        // A missing file under some static hosts returns index.html;
        // treat HTML payloads as a miss.
        if (v_text.trimStart().startsWith('<')) return null;
        return v_text;
    } catch (e) {
        return null;
    }
}

/**
 * Load a help topic's markdown for a language, then convert to HTML.
 * @param {string} p_mdFile - markdown file name (no extension)
 * @param {string} p_lang - active language code (e.g. 'en', 'ar')
 * @returns {Promise<{title: string|null, html: string}|null>} null if not found
 */
export async function fn_loadHelpTopic(p_mdFile, p_lang) {
    let v_md = null;
    if (p_lang && p_lang !== 'en') {
        v_md = await fn_fetchMd(`help/${p_lang}/${p_mdFile}.md`);
    }
    if (v_md === null) {
        v_md = await fn_fetchMd(`help/en/${p_mdFile}.md`);
    }
    if (v_md === null) return null;

    return {
        title: fn_extractTitle(v_md),
        html: fn_markdownToHtml(v_md),
    };
}
