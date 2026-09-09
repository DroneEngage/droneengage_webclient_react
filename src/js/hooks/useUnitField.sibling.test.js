/**
 * TASK-13 — sibling non-rerender acceptance test.
 *
 * The whole point of retiring the coarse EE_unit* events is that two
 * sibling gadgets reading different fields of the SAME unit do NOT
 * re-render each other when only one field changes. This test renders
 * two <SiblingGadget> instances (each backed by useUnitField on a
 * different field) for the same unit, applies a field patch to only
 * one field via notifyUnitFieldChanged, and asserts the other sibling
 * did not re-render — using a render-count spy.
 *
 * This is the "Real acceptance test" from TASK-13's spec.
 */
/* eslint-disable testing-library/no-unnecessary-act */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

import { CAndruavUnitObject, AndruavUnitList } from '../js_andruavUnit.js';
import * as js_session from '../state/session.js';
import { useUnitField } from './useUnitField.js';
import { notifyUnitFieldChanged } from '../store/unitStore.js';

// A minimal gadget that records how many times it renders (via a ref)
// and reads a single field via useUnitField. The render count is exposed
// through the ref so the test can assert it without triggering renders.
function makeGadget(fieldPath, renderCounterRef) {
    function Gadget({ partyId }) {
        React.useEffect(() => {
            renderCounterRef.current++;
        });
        // eslint-disable-next-line no-unused-vars
        const value = useUnitField(partyId, fieldPath);
        return <div>{String(value)}</div>;
    }
    return Gadget;
}

function makeUnit(partyId) {
    const u = new CAndruavUnitObject();
    u.init();
    u.setPartyID(partyId);
    return u;
}

describe('TASK-13 sibling non-rerender (useUnitField)', () => {
    let list;
    let unit;
    let container;
    let root;
    const partyId = 'party-sibling-test';

    beforeEach(() => {
        unit = makeUnit(partyId);
        // Seed two distinct fields the gadgets will read.
        unit.m_Nav_Info.p_Location.alt_relative = 100;
        unit.m_Nav_Info.p_Location.ground_speed = 5;

        list = js_session.fn_getAndruavUnitList();
        if (!list) {
            list = AndruavUnitList;
            js_session.fn_setAndruavUnitList(list);
        }
        list.Add(partyId, unit);

        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        document.body.removeChild(container);
        try { list.Del(partyId); } catch (e) { /* noop */ }
    });

    test('changing one field does not re-render the sibling reading another field', () => {
        const altRenders = { current: 0 };
        const spdRenders = { current: 0 };

        const AltSpy = makeGadget('m_Nav_Info.p_Location.alt_relative', altRenders);
        const SpdSpy = makeGadget('m_Nav_Info.p_Location.ground_speed', spdRenders);

        act(() => {
            root.render(
                <React.Fragment>
                    <AltSpy partyId={partyId} />
                    <SpdSpy partyId={partyId} />
                </React.Fragment>
            );
        });

        // Both gadgets render once on mount.
        expect(altRenders.current).toBe(1);
        expect(spdRenders.current).toBe(1);

        // Patch ONLY the altitude field. The altitude gadget should
        // re-render; the speed gadget should NOT.
        act(() => {
            unit.m_Nav_Info.p_Location.alt_relative = 200;
            notifyUnitFieldChanged(partyId, 'm_Nav_Info.p_Location.alt_relative');
        });

        expect(altRenders.current).toBe(2);
        expect(spdRenders.current).toBe(1);

        // Now patch ONLY the speed field. The speed gadget re-renders;
        // the altitude gadget does not.
        act(() => {
            unit.m_Nav_Info.p_Location.ground_speed = 9;
            notifyUnitFieldChanged(partyId, 'm_Nav_Info.p_Location.ground_speed');
        });

        expect(altRenders.current).toBe(2);
        expect(spdRenders.current).toBe(2);
    });
});
