import json

with open("src/data/expanded-artworks.json", "r") as f:
    existing = json.load(f)

with open("/tmp/masp_records.json", "r") as f:
    masp_new = json.load(f)

# Index existing by id
existing_map = {item["id"]: item for item in existing}

updated_count = 0
added_count = 0

for item in masp_new:
    iid = item["id"]
    if iid in existing_map:
        # Update existing
        existing_map[iid].update(item)
        updated_count += 1
    else:
        existing_map[iid] = item
        added_count += 1

merged = list(existing_map.values())

# Reassign vector_index across all artworks
for idx, art in enumerate(merged):
    if "semantic" not in art:
        art["semantic"] = {}
    art["semantic"]["vector_index"] = idx

with open("src/data/expanded-artworks.json", "w") as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

print(f"Merged successfully: added {added_count}, updated {updated_count}, total artworks: {len(merged)}")
