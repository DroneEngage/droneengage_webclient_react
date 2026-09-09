/**
 * js_modelHitTester.js — screen-space hit testing for Mapbox GL 3D models.
 *
 * Mapbox's model-layer hit-testing is broken for GeoJSON-backed model layers
 * (mapbox-gl-js#13598), so click/hover on glTF models can't be detected via
 * queryRenderedFeatures.  This module provides an alternative: it maintains
 * a registry of "hit targets" (each with a screen-space center + radius),
 * listens to mousemove on the map, and fires the target's callbacks when
 * the cursor is inside its circular hit area.  When two targets overlap,
 * the one nearest to its center wins.
 *
 * The module is intentionally generic — it knows nothing about units, ADSB,
 * or glTF models.  Callers register targets with:
 *   { getScreenCenter, getScreenRadius, onClick, onMouseEnter, onMouseLeave }
 * and enable/disable the listener as needed.  Click dispatch is handled by
 * the caller via consumeClick(e), which returns true if a target was hit
 * (so the caller can skip its background click handler).
 */

/**
 * @typedef {Object} HitTarget
 * @property {() => {x: number, y: number} | null} getScreenCenter
 *           Returns the target's screen center in pixel coordinates relative
 *           to the map canvas, or null if the target is not currently
 *           on-screen (e.g. its DOM element was removed).
 * @property {() => number} getScreenRadius
 *           Returns the target's hit radius in pixels.
 * @property {() => void} [onClick]
 *           Called when the user clicks inside the target's hit area.
 * @property {() => void} [onMouseEnter]
 *           Called when the cursor enters the target's hit area.
 * @property {() => void} [onMouseLeave]
 *           Called when the cursor leaves the target's hit area.
 */

export class ModelHitTester {
    /**
     * @param {mapboxgl.Map} map
     */
    constructor(map) {
        this._map = map;
        this._targets = new Map();   // id -> HitTarget
        this._enabled = false;
        this._hoveredId = null;
        this._moveHandler = null;
    }

    /**
     * Registers (or replaces) a hit target.
     * @param {string} id unique target id
     * @param {HitTarget} target
     */
    addTarget(id, target) {
        this._targets.set(id, target);
    }

    /**
     * Removes a hit target. Fires onMouseLeave if the cursor was hovering it.
     * @param {string} id
     */
    removeTarget(id) {
        if (this._hoveredId === id) {
            this._targets.get(id)?.onMouseLeave?.();
            this._hoveredId = null;
            this._restoreCursor();
        }
        this._targets.delete(id);
    }

    /**
     * Removes all hit targets.
     */
    clear() {
        if (this._hoveredId !== null) {
            this._targets.get(this._hoveredId)?.onMouseLeave?.();
            this._hoveredId = null;
            this._restoreCursor();
        }
        this._targets.clear();
    }

    /**
     * Enables or disables hit testing.  When enabled, a mousemove listener
     * is attached to the map to track cursor position and fire
     * onMouseEnter/onMouseLeave + update the canvas cursor.  When disabled,
     * the listener is removed and any active hover state is cleared.
     *
     * Click dispatch is NOT handled here — the caller must call
     * consumeClick(e) from its own map click handler.
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        if (enabled === this._enabled) return;
        this._enabled = enabled;
        if (enabled) {
            this._moveHandler = (e) => this._onMouseMove(e);
            this._map.on('mousemove', this._moveHandler);
        } else {
            if (this._moveHandler) {
                this._map.off('mousemove', this._moveHandler);
                this._moveHandler = null;
            }
            if (this._hoveredId !== null) {
                this._targets.get(this._hoveredId)?.onMouseLeave?.();
                this._hoveredId = null;
            }
            this._restoreCursor();
        }
    }

    /**
     * Called from the caller's map click handler.  If the click point is
     * inside a target's hit area, fires that target's onClick and returns
     * true so the caller can skip its background click handler.  When
     * multiple targets overlap, the one nearest to its center wins.
     * @param {{point: {x: number, y: number}}} e Mapbox MapMouseEvent
     * @returns {boolean} true if a target consumed the click
     */
    consumeClick(e) {
        if (!this._enabled) return false;
        const hit = this._hitTest(e.point.x, e.point.y, this._hoveredId);
        if (!hit) return false;
        hit.target.onClick?.();
        return true;
    }

    /**
     * Finds the target whose circular hit area contains the given screen
     * point.  When multiple targets overlap, the one whose center is
     * nearest to the point wins — except that the currently-hovered target
     * is kept as long as the cursor is still inside its hit area (sticky
     * hover).
     *
     * The sticky rule matters when two models are drawn on top of each
     * other (e.g. a drone and a coincident ADS-B aircraft, or two swarm
     * units at the same spot).  The nearest-center tiebreaker uses a strict
     * `<`, so sub-pixel jitter in the two markers' getBoundingClientRect()
     * is enough to oscillate the winner between them on every mousemove.
     * Each oscillation fires onMouseLeave + onMouseEnter, and because the
     * hover popup opens on a 200ms timer but closes immediately on leave,
     * the popup flickers open/close.  Sticking to the hovered target until
     * the cursor actually leaves its hit area removes the oscillation.
     * @param {number} x pixel x relative to canvas
     * @param {number} y pixel y relative to canvas
     * @param {string} [preferId] id of the currently-hovered target; if the
     *   cursor is still inside it, it wins over a nearer overlapping target.
     * @returns {{id: string, target: HitTarget} | null}
     * @private
     */
    _hitTest(x, y, preferId = null) {
        let best = null;
        let bestDist2 = Infinity;
        let preferred = null;
        for (const [id, target] of this._targets) {
            const center = target.getScreenCenter();
            if (!center) continue;
            const radius = target.getScreenRadius();
            if (!radius || radius <= 0) continue;
            const dx = x - center.x;
            const dy = y - center.y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 > radius * radius) continue;     // cursor outside this target
            // Cursor is inside this target's hit area.
            if (id === preferId) {
                preferred = { id, target };            // sticky: keep current hover
            }
            if (dist2 < bestDist2) {
                best = { id, target };
                bestDist2 = dist2;
            }
        }
        return preferred || best;
    }

    /**
     * mousemove handler: updates the canvas cursor and fires
     * onMouseEnter/onMouseLeave on hover transitions.
     * @param {{point: {x: number, y: number}}} e
     * @private
     */
    _onMouseMove(e) {
        if (!this._enabled) return;
        const hit = this._hitTest(e.point.x, e.point.y, this._hoveredId);

        // Update cursor — only write when state changes to avoid
        // triggering a style recalc on every mousemove tick.
        const canvas = this._map.getCanvas();
        const wantPointer = !!hit;
        const hasPointer = (this._hoveredId !== null);
        if (wantPointer !== hasPointer) {
            canvas.style.cursor = wantPointer ? 'pointer' : '';
        }

        // Handle hover enter/leave transitions.
        const hitId = hit?.id ?? null;
        if (hitId !== this._hoveredId) {
            if (this._hoveredId !== null) {
                this._targets.get(this._hoveredId)?.onMouseLeave?.();
            }
            this._hoveredId = hitId;
            if (hit) {
                hit.target.onMouseEnter?.();
            }
        }
    }

    /**
     * Restores the canvas cursor to its default (empty string lets
     * Mapbox manage it).
     * @private
     */
    _restoreCursor() {
        this._map.getCanvas().style.cursor = '';
    }
}
