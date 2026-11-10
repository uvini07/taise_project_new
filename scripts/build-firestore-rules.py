#!/usr/bin/env python3
"""Copia as regras do estúdio da Taíse (entre @@BODY_START@@ e @@BODY_END@@)
para dentro de match /studios/{studio}, trocando os caminhos para
studios/{studio}/... e o "admin" pelo dono do estúdio.

Rode depois de editar o bloco original:  python3 scripts/build-firestore-rules.py
"""
import re, pathlib

p = pathlib.Path(__file__).resolve().parent.parent / "firestore.rules"
s = p.read_text()
body = s.split("// @@BODY_START@@", 1)[1].split("\n", 1)[1].split("    // @@BODY_END@@", 1)[0]

PATHS = ["pkgPath", "lotPath", "lockPath", "apptPath", "campPath", "vipRegPath", "vipMemberPath", "vipStatsPath", "metaPackagesPath"]
LOCAL = re.findall(r"^\s*function (\w+)\(", body, re.M)
for name in ["isAdmin"] + PATHS + LOCAL:
    body = re.sub(rf"\b{name}\(", f"{name}S(", body)

paths = "\n".join(
    f"      function {n}S(id) {{ return /databases/$(database)/documents/studios/$(studio)/{c}/$(id); }}"
    for n, c in [("pkgPath", "packages"), ("lotPath", "packageLots"), ("lockPath", "slotLocks"), ("apptPath", "appointments"),
                 ("campPath", "vipCampaigns"), ("vipRegPath", "vipRegistrations"), ("vipMemberPath", "vipMembers"), ("vipStatsPath", "vipCampaignStats")]
)
block = f"""    match /studios/{{studio}} {{
      // Dono do estúdio, dentro do teste de 30 dias ou com o plano ativo.
      function isAdminS() {{
        let st = get(/databases/$(database)/documents/studios/$(studio)).data;
        return isPlatformAdmin() || (signedIn() && st.ownerUid == request.auth.uid
          && (st.status == 'active' || request.time < st.createdAt + duration.value(30, 'd')));
      }}
{paths}
      function metaPackagesPathS() {{ return /databases/$(database)/documents/studios/$(studio)/meta/packages; }}

""" + "\n".join(("  " + l) if l.strip() else l for l in body.rstrip().split("\n")) + "\n    }\n"

head, rest = re.split(r"    // @@STUDIOS_BEGIN@@[^\n]*\n", s, maxsplit=1)
_, tail = rest.split("    // @@STUDIOS_END@@", 1)
p.write_text(head + "    // @@STUDIOS_BEGIN@@ (gerado; não edite à mão)\n" + block + "    // @@STUDIOS_END@@" + tail)
print("firestore.rules atualizado")
