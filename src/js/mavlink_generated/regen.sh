#!/bin/sh
# Regenerate mavlink.js from the mavlink XML definitions (NextGen JS generator)
# and re-apply the local patch that makes it bundler/browser safe.
#
# Upstream emits, for the browser:
#   import("./local_modules/jspack/jspack.js").then((mod) => jspack = new mod.default())
# which is broken twice: the vendored jspack exports an *instance* (not a
# constructor, so `new mod.default()` throws into a swallowed .catch) and the
# async load races any early parsing. We replace it with a synchronous
# require("jspack") which resolves to the vendored copy through the
# ./node_modules/jspack symlink in both webpack and plain Node.
#
# Also, upstream's `require("events")`/`require("util")` (Node-only branch) make
# webpack fail the build since it resolves require() statically. They are
# routed through nodeReq() which webpack cannot statically analyse; the branch
# never runs in the browser anyway.
#
# Usage: ./regen.sh [path-to-mavlink-repo]     (default: <workspace>/mavlink)
set -e

MAVLINK_ROOT="${1:-$(cd "$(dirname "$0")/../../../.." && pwd)/mavlink}"
DIR="$(cd "$(dirname "$0")" && pwd)"

python3 "$MAVLINK_ROOT/pymavlink/tools/mavgen.py" \
    --lang=JavaScript_NextGen --wire-protocol=2.0 \
    --output="$DIR/mavlink.js" \
    "$MAVLINK_ROOT/message_definitions/v1.0/all.xml"

# keep the vendored runtime deps reachable as plain node_modules lookups
mkdir -p "$DIR/node_modules"
ln -sfn ../local_modules/jspack "$DIR/node_modules/jspack"
ln -sfn ../local_modules/long    "$DIR/node_modules/long"

python3 - "$DIR/mavlink.js" <<'PYEOF'
import sys

path = sys.argv[1]
src = open(path, encoding='utf-8').read()

old = '''// Handle jspack dependency
let jspack;
if (isNode) {
    jspack = (global && global.jspack) || require("jspack").jspack;
} else {
    import("./local_modules/jspack/jspack.js").then((mod) => {
        jspack = new mod.default()
    }).catch((e) => {
    });
}

// Handle Node.js specific modules
let events, util;
if (isNode) {
    events = require("events");
    util = require("util");
}'''
new = '''// patched by regen.sh: see comment at top of regen.sh -- synchronous vendored
// jspack in the browser; Node core modules routed through nodeReq() so webpack
// does not try to statically bundle them.
const nodeReq = (typeof module === 'object' && module.require) ? module.require.bind(module) : null;
let jspack;
let events, util;
if (isNode) {
    jspack = (global && global.jspack) || nodeReq("jspack").jspack;
} else {
    jspack = require("jspack").jspack;
}
if (isNode) {
    events = nodeReq("events");
    util = nodeReq("util");
}'''

if old not in src:
    sys.exit('PATCH FAILED: dependency block not found in ' + path)
src = src.replace(old, new, 1)

# webpack does not detect module.exports hidden inside the isNode else-branch,
# so export unconditionally (harmless: module exists under webpack anyway).
old2 = '''// Browser and Node.js compatible module exports
if (!isNode) {'''
new2 = '''// Browser and Node.js compatible module exports
// patched by regen.sh: unconditional module.exports so bundlers detect it
module.exports = {mavlink20, MAVLink20Processor};
if (!isNode) {'''
if old2 not in src:
    sys.exit('PATCH FAILED: export block not found in ' + path)
src = src.replace(old2, new2, 1)

open(path, 'w', encoding='utf-8').write(src)
print('patched dependency + export blocks in', path)
PYEOF

echo "done."
