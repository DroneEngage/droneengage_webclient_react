/**
 * Dependency-free ANSI / VT100 escape parser for the telnet terminal.
 *
 * Converts a raw pty stream (SGR colors, OSC title sequences, bracketed
 * paste mode, carriage-return line overwrites, ...) into an array of
 * React <span> elements so the output of a real shell (bash prompt
 * colors, `ls` colors, ...) is rendered with colors instead of showing
 * the raw escape codes.
 *
 * Kept self-contained (no xterm.js / anser / ansi-to-html dependency) to
 * stay consistent with the rest of the telnet gadget.
 *
 * @auth: Devin / DroneEngage
 */

import React from 'react';

const ESC = '\x1b';
const BEL = '\x07';

// Standard xterm-ish palette (Tango-ish).
const COLORS = [
    '#000000', // 0 black
    '#cc0000', // 1 red
    '#4e9a06', // 2 green
    '#c4a000', // 3 yellow
    '#3465a4', // 4 blue
    '#75507b', // 5 magenta
    '#06989a', // 6 cyan
    '#d3d7cf', // 7 white (light gray)
];

const BRIGHT_COLORS = [
    '#555753', // 0  bright black (dark gray)
    '#ef2929', // 1  bright red
    '#8ae234', // 2  bright green
    '#fce94f', // 3  bright yellow
    '#729fcf', // 4  bright blue
    '#ad7fa8', // 5  bright magenta
    '#34e2e2', // 6  bright cyan
    '#eeeeec', // 7  bright white
];

// Default terminal fg/bg (matches the bg-black / text-light <pre>).
const DEFAULT_FG = '#f8f9fa';
const DEFAULT_BG = '#000000';

/**
 * Convert a 256-color index to a CSS color string.
 */
function color256(n) {
    if (n < 8) return COLORS[n];
    if (n < 16) return BRIGHT_COLORS[n - 8];
    if (n >= 232) {
        const v = 8 + (n - 232) * 10;
        return `rgb(${v},${v},${v})`;
    }
    // 16-231: 6x6x6 color cube.
    n -= 16;
    const r = Math.floor(n / 36) % 6;
    const g = Math.floor(n / 6) % 6;
    const b = n % 6;
    const conv = (v) => (v === 0 ? 0 : 55 + v * 40);
    return `rgb(${conv(r)},${conv(g)},${conv(b)})`;
}

/**
 * Pass 1: resolve carriage-return line overwrites and strip every
 * control sequence that is NOT an SGR (`CSI ... m`) sequence.
 *
 * - `ESC ] ... BEL / ST`  (OSC, e.g. window title)  -> stripped
 * - `ESC [ ? 2004 h/l`    (bracketed paste mode)    -> stripped
 * - `ESC [ ... <other>`   (cursor movement, erase)  -> stripped
 * - `ESC [ ... m`         (SGR color/style)         -> KEPT
 * - `\r\n`               -> standard line ending (content preserved)
 * - `\r` (not `\r\n`)     -> truncate current line back to its start
 *   so prompt redraws / progress bars overwrite instead of appending.
 *
 * Returns a string containing only printable chars, `\n`, and SGR
 * escape sequences.
 */
function cleanAnsi(text) {
    let out = '';
    let lineStart = 0; // index in `out` where the current line begins
    let i = 0;
    const n = text.length;

    while (i < n) {
        const ch = text[i];

        if (ch === ESC) {
            const next = text[i + 1];

            if (next === ']') {
                // OSC: skip until BEL or ST (ESC \).
                let j = i + 2;
                while (j < n && text[j] !== BEL) {
                    if (text[j] === ESC && text[j + 1] === '\\') { j++; break; }
                    j++;
                }
                i = j + 1;
                continue;
            } else if (next === '[') {
                // CSI: parameters are bytes < 0x40, final byte in 0x40..0x7e.
                let j = i + 2;
                while (j < n && text.charCodeAt(j) < 0x40) j++;
                if (j < n) {
                    if (text[j] === 'm') {
                        // Keep SGR sequences (color/style).
                        out += text.slice(i, j + 1);
                    }
                    // All other CSI (cursor move, erase, paste mode, ...) dropped.
                    i = j + 1;
                    continue;
                }
                // Incomplete sequence at end of buffer: drop it.
                i = n;
                continue;
            } else {
                // Other ESC sequences (single-char): drop ESC + next.
                i += 2;
                continue;
            }
        } else if (ch === '\r') {
            if (text[i + 1] === '\n') {
                // \r\n is a standard line ending — do NOT erase the line
                // content; just skip the \r and let \n handle the newline.
                i++;
                continue;
            }
            // Standalone \r: cursor to start of line for overwrite
            // (prompt redraws, progress bars, ...). Truncate the current
            // line so subsequent chars overwrite instead of appending.
            out = out.slice(0, lineStart);
            i++;
            continue;
        } else if (ch === '\n') {
            out += '\n';
            lineStart = out.length;
            i++;
            continue;
        } else if (ch === BEL) {
            // Stray BEL (OSC already handled): drop.
            i++;
            continue;
        } else {
            out += ch;
            i++;
        }
    }
    return out;
}

/**
 * Apply one SGR parameter list to the running style state object.
 */
function applySgr(params, state) {
    const parts = params === '' ? ['0'] : params.split(';');
    let k = 0;
    while (k < parts.length) {
        const raw = parts[k];
        const code = raw === '' ? 0 : parseInt(raw, 10);

        if (Number.isNaN(code)) { k++; continue; }

        if (code === 0) {
            state.fg = null; state.bg = null; state.bold = false;
            state.dim = false; state.italic = false; state.underline = false;
            state.reverse = false;
        } else if (code === 1) state.bold = true;
        else if (code === 2) state.dim = true;
        else if (code === 3) state.italic = true;
        else if (code === 4) state.underline = true;
        else if (code === 7) state.reverse = true;
        else if (code === 22) { state.bold = false; state.dim = false; }
        else if (code === 23) state.italic = false;
        else if (code === 24) state.underline = false;
        else if (code === 27) state.reverse = false;
        else if (code >= 30 && code <= 37) state.fg = COLORS[code - 30];
        else if (code === 38) {
            if (parts[k + 1] === '5') {
                state.fg = color256(parseInt(parts[k + 2], 10));
                k += 2;
            } else if (parts[k + 1] === '2') {
                state.fg = `rgb(${parts[k + 2]},${parts[k + 3]},${parts[k + 4]})`;
                k += 4;
            }
        } else if (code === 39) state.fg = null;
        else if (code >= 40 && code <= 47) state.bg = COLORS[code - 40];
        else if (code === 48) {
            if (parts[k + 1] === '5') {
                state.bg = color256(parseInt(parts[k + 2], 10));
                k += 2;
            } else if (parts[k + 1] === '2') {
                state.bg = `rgb(${parts[k + 2]},${parts[k + 3]},${parts[k + 4]})`;
                k += 4;
            }
        } else if (code === 49) state.bg = null;
        else if (code >= 90 && code <= 97) state.fg = BRIGHT_COLORS[code - 90];
        else if (code >= 100 && code <= 107) state.bg = BRIGHT_COLORS[code - 100];
        // Unknown codes ignored.

        k++;
    }
}

/**
 * Build an inline CSS style object from a run's style state, honoring
 * reverse-video by swapping fg/bg (with terminal defaults filled in).
 */
function buildStyle(state) {
    const style = {};
    let fg = state.fg;
    let bg = state.bg;

    if (state.reverse) {
        const swapFg = bg || DEFAULT_BG;
        const swapBg = fg || DEFAULT_FG;
        fg = swapFg;
        bg = swapBg;
    }

    if (fg) style.color = fg;
    if (bg) style.background = bg;
    if (state.bold) style.fontWeight = 'bold';
    if (state.dim) style.opacity = '0.5';
    if (state.italic) style.fontStyle = 'italic';
    if (state.underline) style.textDecoration = 'underline';
    return style;
}

/**
 * Convert a raw pty string into an array of React <span> elements
 * (plus bare text) ready to be rendered inside the terminal <pre>.
 */
export function ansiToReact(text) {
    if (!text) return null;

    const cleaned = cleanAnsi(text);

    const state = {
        fg: null, bg: null, bold: false, dim: false,
        italic: false, underline: false, reverse: false,
    };

    const spans = [];
    let buf = '';
    let key = 0;

    const flush = () => {
        if (buf.length > 0) {
            const style = buildStyle(state);
            const hasStyle = Object.keys(style).length > 0;
            if (hasStyle) {
                spans.push(<span key={key++} style={style}>{buf}</span>);
            } else {
                spans.push(<span key={key++}>{buf}</span>);
            }
            buf = '';
        }
    };

    let i = 0;
    const n = cleaned.length;
    while (i < n) {
        const ch = cleaned[i];
        if (ch === ESC && cleaned[i + 1] === '[') {
            // SGR sequence (cleanAnsi kept only `CSI ... m`).
            let j = i + 2;
            while (j < n && cleaned.charCodeAt(j) < 0x40) j++;
            const params = cleaned.slice(i + 2, j);
            flush();
            applySgr(params, state);
            i = j + 1;
            continue;
        }
        buf += ch;
        i++;
    }
    flush();

    return spans;
}
