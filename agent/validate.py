"""Validate generated agent/tool/test configs against the ElevenLabs OpenAPI spec, and flag unknown keys."""
import json, sys, glob
from jsonschema import Draft202012Validator

spec = json.load(open(sys.argv[1]))
schemas = spec["components"]["schemas"]
import re as _re
_missing = set(_re.findall(r'#/components/schemas/([^"]+)"', json.dumps(spec))) - set(schemas)
for _m in _missing: schemas[_m] = {}  # dangling refs in the published spec: accept anything there
if _missing: print(f"(spec has {len(_missing)} dangling refs, stubbed: {', '.join(sorted(_missing))[:300]})")
ROOT = {"components": {"schemas": schemas}}

def ref(name): return {"$ref": f"#/components/schemas/{name}", **ROOT}

def resolve(s):
    while isinstance(s, dict) and "$ref" in s:
        s = schemas[s["$ref"].split("/")[-1]]
    return s

def ok(value, s):
    try:
        Draft202012Validator({**s, **ROOT}).validate(value); return True
    except Exception:
        return False

def unknown_keys(value, s, path, out):
    s = resolve(s)
    if not isinstance(s, dict): return
    for k in ("anyOf", "oneOf"):
        if k in s:
            branches = [b for b in s[k] if resolve(b).get("type") != "null"]
            match = [b for b in branches if ok(value, b)] or branches
            # pick the branch whose properties best cover the value
            if isinstance(value, dict):
                match.sort(key=lambda b: -len(set(value) & set(resolve(b).get("properties", {}))))
            if match: unknown_keys(value, match[0], path, out)
            return
    if isinstance(value, dict) and "properties" in s:
        props = s["properties"]
        for key, v in value.items():
            if key not in props:
                out.append(f"{path}.{key}  (unknown; known: {', '.join(list(props)[:12])}…)")
            else:
                unknown_keys(v, props[key], f"{path}.{key}", out)
    elif isinstance(value, dict) and isinstance(s.get("additionalProperties"), dict):
        for key, v in value.items(): unknown_keys(v, s["additionalProperties"], f"{path}.{key}", out)
    elif isinstance(value, list) and "items" in s:
        for i, v in enumerate(value): unknown_keys(v, s["items"], f"{path}[{i}]", out)

def check(label, value, schema_name):
    s = ref(schema_name)
    errors = sorted(Draft202012Validator(s).iter_errors(value), key=lambda e: list(e.path))
    unknown = []
    unknown_keys(value, s, label, unknown)
    status = "OK " if not errors and not unknown else "BAD"
    print(f"{status} {label}")
    for e in errors[:8]: print(f"     schema: {'/'.join(map(str, e.path))}: {e.message[:160]}")
    for u in unknown[:12]: print(f"     {u}")
    return not errors and not unknown

project = sys.argv[2]
good = True
for f in sorted(glob.glob(f"{project}/tool_configs/*.json")):
    good &= check(f.split("/")[-1], {"tool_config": json.load(open(f))}, "ToolRequestModel")
for f in sorted(glob.glob(f"{project}/agent_configs/*.json")):
    good &= check(f.split("/")[-1], json.load(open(f)), "Body_Create_Agent_v1_convai_agents_create_post")
for f in sorted(glob.glob(f"{project}/test_configs/*.json")):
    t = json.load(open(f))
    kind = {"tool": "CreateToolCallUnitTestRequest", "simulation": "CreateSimulationTestRequest"}.get(t.get("type"), "CreateResponseUnitTestRequest")
    good &= check(f.split("/")[-1], t, kind)
sys.exit(0 if good else 1)
