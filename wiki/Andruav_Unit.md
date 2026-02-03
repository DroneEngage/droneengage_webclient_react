`CAndruavUnitObject` is a class representing a drone or ground control unit in the Andruav system.  
It encapsulates telemetry, status, permissions, and communication state for a single remote unit.

---

### Definition

`CAndruavUnitObject` is the core data model for a connected vehicle or GCS (Ground Control Station) in the Andruav web client. Each instance holds real-time state such as flight mode, GPS, power, video capabilities, and module versions. It acts as a container for subsystem objects like GPS, telemetry, and P2P communication.

Instances are stored in a global list (`AndruavUnitList`) and are identified by a unique `partyID`. The class uses private fields (via `#`) for critical identifiers like `#m_partyID`, `#m_version`, and `#m_isDE` (Drone Engage flag).

```typescript
1124:1313:./src/js/js_andruavUnit.js
export class CAndruavUnitObject {
  #m_partyID;
  #m_version;
  #m_isDE;

  constructor() {
    this.m_index = 0;
    this.m_defined = false;
    this.m_IsMe = false;           // true if this is the local GCS
    this.m_IsGCS = true;           // true if unit is a GCS
    this.#m_isDE = false;          // Drone Engage firmware?
    this.Description = "";
    this.m_unitName = "unknown";
    this.m_groupName = null;
    this.m_VehicleType = VEHICLE_UNKNOWN;
    this.m_flightMode = CONST_FLIGHT_CONTROL_UNKNOWN;
    this.m_isArmed = false;
    this.m_isFlying = false;
    this.m_telemetry_protocol = js_andruavMessages.CONST_No_Telemetry;

    this.init(); // initializes subsystems

    Object.seal(this); // prevents adding new properties
  }

  init() {
    this.m_modules = new C_Modules(this);
    this.m_Messages = new C_Messages(this);
    this.m_Power = new C_Power(this);
    this.m_GPS_Info1 = new C_GPS(this);
    this.m_Telemetry = new C_Telemetry(this);
    this.m_P2P = new C_P2P(this);
    // ... plus 15+ other subsystems ...
  }

  fn_setIsDE(p_isDE) {
    this.#m_isDE = p_isDE;
    // updates module version info based on DE vs standard Andruav
    this.m_module_version_info = js_siteConfig.CONST_MODULE_VERSIONS[p_isDE ? 'de' : 'andruav'] ?? null;
  }

  fn_setVersion(p_version) {
    this.#m_version = p_version;
    // compares version with expected version from config
    // emits EE_OldModule event if version mismatch
  }

  fn_canCamera() {
    return this.m_Permissions[10] === "C";
  }

  fn_canVideo() {
    return this.m_Permissions[8] === "V";
  }

  fn_disconnect() {
    if (!this.m_IsMe) return;
    // todo: apply shutdown updates
  }
}
```

- **Purpose**: Central state container for a remote unit (drone, GCS, etc.)
- **Private fields**: `#m_partyID`, `#m_version`, `#m_isDE` — not directly accessible
- **Subsystems**: Initializes 20+ module instances (GPS, power, video, etc.) in `init()`
- **Sealing**: `Object.seal(this)` prevents accidental property additions
- **Version handling**: Compares firmware version with expected version and emits `EE_OldModule` if outdated
- **Permissions**: Uses a string-based permission mask (`m_Permissions`) to control access to camera/video

---

### Example Usages

Instances of `CAndruavUnitObject` are created dynamically when the system receives messages from unknown units. They are stored in a global list managed by `CAndruavUnitList`.

A common usage pattern is in `js_andruav_ws.js`, where a new unit is created when the system connects to the server or receives a message from a new sender.

```typescript
173:183:./src/js/server_comm/js_andruav_ws.js
const v_unit = new js_andruavUnit.CAndruavUnitObject();
v_unit.m_IsMe = true;
v_unit.m_IsGCS = true;
v_unit.m_unitName = this.unitID;
v_unit.setPartyID(this.partyID);
v_unit.m_groupName = this.m_groupName;
v_unit.m_VehicleType = js_andruavUnit.CONST_VEHICLE_GCS;
this.m_andruavUnit = v_unit;
```

Another example is in message parsing, where a unit is created if it doesn't already exist:

```typescript
237:248:./src/js/server_comm/js_andruav_parser.js
let p_unit = js_globals.m_andruavUnitList.fn_getUnit(msg.senderName);
if (!p_unit) {
    p_unit = new js_andruavUnit.CAndruavUnitObject();
    p_unit.setPartyID(msg.senderName);
    js_globals.m_andruavUnitList.Add(p_unit.getPartyID(), p_unit);
    // Request unit ID if allowed
    if (p_unit.m_Messages.fn_sendMessageAllowed(js_andruavMessages.CONST_TYPE_AndruavMessage_ID)) {
        js_andruav_facade.AndruavClientFacade.API_requestID(msg.senderName);
    }
}
```

- **Main creation points**: `js_andruav_ws.js`, `js_andruav_parser.js`
- **Storage**: All units are stored in `js_globals.m_andruavUnitList`, a singleton instance of `CAndruavUnitList`
- **Widespread use**: Referenced in telemetry, video, P2P, and swarm logic — central to the entire system

---

### Notes

- `CAndruavUnitObject` is sealed via `Object.seal(this)` — this prevents runtime property injection and ensures data integrity.
- The `fn_setVersion()` method triggers a global event (`EE_OldModule`) if the unit’s version is outdated, which can affect UI warnings or feature availability.
- Despite being called a "unit", it can represent not just drones but also GCSs, relays, or other networked participants.

---

### See Also

- `CAndruavUnitList`: The global container for all `CAndruavUnitObject` instances; provides lookup and sorting methods.
- `AndruavUnitList`: Exported singleton instance of `CAndruavUnitList`, used throughout the codebase to access units.
- `C_Modules`: Subsystem class that manages module health and version comparison, used within each `CAndruavUnitObject`.
- `js_andruavMessages.CONST_TYPE_AndruavMessage_ID`: Message type used to request unit identity, often sent after creating a new `CAndruavUnitObject`.