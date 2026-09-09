import { useUnitField } from './useUnitField.js';

/**
 * Render-prop adapter that lets a class component consume a single reactive
 * unit field without itself becoming a function component.
 *
 * `useUnitField` is a hook and therefore cannot be called from a class
 * component. This thin wrapper calls it for the class component and passes
 * the value down via a render-prop (`children`), so the class component keeps
 * its existing lifecycle and render logic while gaining field-granular
 * re-rendering: only this wrapper (and its `children` callback) re-renders
 * when `fieldPath` changes, not the whole class component.
 *
 * Renders nothing of its own; the class component supplies how to render the
 * value through the `children(value)` callback.
 *
 * @param {object} props
 * @param {string} props.partyId - unit party id (p_unit.getPartyID())
 * @param {string} props.fieldPath - dot-path into the unit object, e.g.
 *   "m_battery.m_voltage"
 * @param {(value: *) => React.ReactNode} props.children - render-prop
 *   receiving the current value at unit[fieldPath]
 */
export function UnitFieldValue({ partyId, fieldPath, children }) {
    const value = useUnitField(partyId, fieldPath);
    return children(value);
}

export default UnitFieldValue;
