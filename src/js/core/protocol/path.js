/**
 * TASK-02 — small, pure dot-path getter/setter used by runtime.fn_applyPatches.
 *
 * Paths use the same dot notation useUnitField / notifyUnitFieldChanged
 * consume (e.g. "m_Nav_Info.p_Location.lat"). Intermediate objects are
 * created on write only when the parent is undefined/null AND createMissing
 * is true — runtime always passes createMissing=true so a patch can populate
 * a fresh sub-object. Reading a missing path returns undefined (never throws).
 */

/**
 * Read a dot-path from an object. Returns undefined for missing paths.
 * @param {object} obj
 * @param {string} path
 * @returns {*}
 */
export function fn_getByPath(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
        if (cur === null || cur === undefined) return undefined;
        cur = cur[parts[i]];
    }
    return cur;
}

/**
 * Write a value to a dot-path on an object.
 * @param {object} obj
 * @param {string} path
 * @param {*} value
 * @param {boolean} [createMissing=true] - create intermediate objects when absent.
 */
export function fn_setByPath(obj, path, value, createMissing = true) {
    if (!obj || !path) return;
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (cur[key] === null || cur[key] === undefined) {
            if (!createMissing) return;
            cur[key] = {};
        }
        cur = cur[key];
    }
    cur[parts[parts.length - 1]] = value;
}
