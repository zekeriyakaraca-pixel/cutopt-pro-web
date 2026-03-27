import json

def sanitize_text(text):
    if not isinstance(text, str):
        return text
    mapping = {
        'ü': 'u', 'ı': 'i', 'ş': 's', 'ğ': 'g', 'ö': 'o', 'ç': 'c',
        'Ü': 'U', 'İ': 'I', 'Ş': 'S', 'Ğ': 'G', 'Ö': 'O', 'Ç': 'C',
        'Гј': 'u', 'Д±': 'i', '┼Ю': 'S', 'Г–': 'O', 'Г§': 'c', 'Гњ': 'U', 'Еџ': 's',
        'Г': 'G', 'Д': 'D', '??': '?', 'Haz????r': 'Hazir', 'S??r??m??n??z': 'Surumunuz'
    }
    for k, v in mapping.items():
        text = text.replace(k, v)
    return text

def deep_repair(obj):
    if isinstance(obj, str):
        return sanitize_text(obj)
    if isinstance(obj, dict):
        return {sanitize_text(k): deep_repair(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [deep_repair(v) for v in obj]
    return obj

# 1. Load files
with open('workflow.json', 'r', encoding='utf-8') as f:
    wf1 = json.load(f)
with open('workflow_check.json', 'r', encoding='utf-8') as f:
    wf2 = json.load(f)

# 2. Extract labeling nodes
labeling_node_names = ["Etiketleri Listele", "Etiket ID Bul", "Demo Talebi Etiketle"]
labeling_nodes = [node for node in wf2['nodes'] if sanitize_text(node['name']) in labeling_node_names]

# 3. Combine nodes
all_nodes = wf1['nodes'] + labeling_nodes

# 4. Deep Repair Logic
for node in all_nodes:
    node_name_clean = sanitize_text(node['name'])
    # Fix Lead Puanlama
    if node_name_clean == "Lead Puanlama":
        node['type'] = "n8n-nodes-base.code"
        node['typeVersion'] = 2
        if 'functionCode' in node['parameters']:
            code = node['parameters'].pop('functionCode')
            node['parameters']['jsCode'] = code
            node['parameters']['mode'] = 'runOnceForEachItem'
    # Fix Etiket ID Bul
    if node_name_clean == "Etiket ID Bul":
        node['type'] = "n8n-nodes-base.code"
        node['typeVersion'] = 2
        node['parameters']['jsCode'] = """
const targetNames = ['DEMO TALEPLERİ', 'DEMO TALEPLERI'];
const targetId = 'Label_7227687291741294476';
for (const item of $input.all()) {
  const name = (item.json.name || "").toUpperCase();
  const idValue = item.json.id || "";
  if (targetNames.includes(name) || idValue === targetId || name.includes("DEMO TALEPLER")) {
    return [item.json];
  }
}
const found = $input.all().map(i => i.json.name).join(', ');
throw new Error(`Label 'DEMO TALEPLERİ' not found. Found: ${found}`);
"""
        node['parameters']['mode'] = 'runOnceForAllItems'
    # Fix Slack Bildirimi
    if node_name_clean == "Slack Bildirimi":
        node['credentials'] = { "slackApi": { "id": "Slack-Sumbul" } }
        node['parameters']['channel'] = "C0AP9JR85A6" # all-cutopro ID
        node['parameters']['text'] = ":rocket: *Yeni Yuksek Puanli Lead!* :rocket:\\n\\n*Ad Soyad:* {{$node[\\\"Demo Talebi Webhook\\\"].json[\\\"name\\\"]}}\\n*E-posta:* {{$node[\\\"Demo Talebi Webhook\\\"].json[\\\"email\\\"]}}\\n*Sirket:* {{$node[\\\"Demo Talebi Webhook\\\"].json[\\\"company\\\"]}}\\n*Telefon:* {{$node[\\\"Demo Talebi Webhook\\\"].json[\\\"phone\\\"]}}\\n\\n*Puan:* {{$node[\\\"Lead Puanlama\\\"].json[\\\"score\\\"]}}"
    # Fix Slack Bildirimi
    if node_name_clean == "Slack Bildirimi":
        node['credentials'] = { "slackApi": { "id": "Slack-Sumbul" } }
        node['parameters']['channel'] = "C0AP9JR85A6" # all-cutopro ID
        node['parameters']['text'] = ":rocket: *Yeni Yuksek Puanli Lead!* :rocket:\n\n*Ad Soyad:* {{$node[\"Demo Talebi Webhook\"].json[\"name\"]}}\n*E-posta:* {{$node[\"Demo Talebi Webhook\"].json[\"email\"]}}\n*Sirket:* {{$node[\"Demo Talebi Webhook\"].json[\"company\"]}}\n*Telefon:* {{$node[\"Demo Talebi Webhook\"].json[\"phone\"]}}\n\n*Puan:* {{$node[\"Lead Puanlama\"].json[\"score\"]}}"

# 5. Build connections
connections = wf1['connections']
def add_conn(conns, from_node, to_node):
    from_node = sanitize_text(from_node)
    to_node = sanitize_text(to_node)
    if from_node not in conns: conns[from_node] = {"main": [[]]}
    exists = any(edge['node'] == to_node for path in conns[from_node]['main'] for edge in path)
    if not exists: conns[from_node]['main'][0].append({"node": to_node, "type": "main", "index": 0})

main_targets = ["Email Bildirimi Gonder", "Otomatik Yanit", "Google Sheets Kaydet", "Milestone Kontrolu", "Lead Puanlama"]
for t in main_targets: add_conn(connections, "Demo Talebi Webhook", t)
add_conn(connections, "Otomatik Yanit", "Wait 3 Gun")
add_conn(connections, "Wait 3 Gun", "Takip E-postasi 1")
add_conn(connections, "Takip E-postasi 1", "Wait 4 Gun")
add_conn(connections, "Wait 4 Gun", "Takip E-postasi 2")
add_conn(connections, "Milestone Kontrolu", "Milestone Bildirimi")
add_conn(connections, "Lead Puanlama", "Yuksek Puanli Lead Kontrolu")
add_conn(connections, "Yuksek Puanli Lead Kontrolu", "Slack Bildirimi")
add_conn(connections, "Email Bildirimi Gonder", "Etiketleri Listele")
add_conn(connections, "Etiketleri Listele", "Etiket ID Bul")
add_conn(connections, "Etiket ID Bul", "Demo Talebi Etiketle")

# 6. Deep Sanitize
final_wf_data = deep_repair({
    "name": wf1.get("name", "CutOpt PRO - Demo Talep Bildirimi"),
    "nodes": all_nodes,
    "connections": connections,
    "settings": { "executionOrder": "v1" }
})

# 7. Position cleanup
for node in final_wf_data['nodes']:
    name = node['name']
    if name == "Etiketleri Listele": node['position'] = [380, -200]
    if name == "Etiket ID Bul": node['position'] = [580, -200]
    if name == "Demo Talebi Etiketle": node['position'] = [780, -200]

# 8. Save
with open('workflow_repaired.json', 'w', encoding='utf-8') as f:
    json.dump(final_wf_data, f, ensure_ascii=False, indent=4)
print("Repair complete: workflow_repaired.json updated with labeling fix.")
