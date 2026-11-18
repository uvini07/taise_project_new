// Pix "copia e cola" estático (padrão BR Code do Banco Central) a partir da
// chave da fotógrafa, com valor e identificador. Não depende de banco nenhum.
const f = (id, v) => `${id}${String(v.length).padStart(2, "0")}${v}`;
const clean = (s, max) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 .-]/g, "").trim().slice(0, max).toUpperCase();

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i += 1) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j += 1) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

export function pixPayload({ key, name, city, amountCents, txid }) {
  const gui = f("00", "br.gov.bcb.pix") + f("01", String(key).trim());
  const tx = String(txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const body = f("00", "01")
    + f("26", gui)
    + f("52", "0000")
    + f("53", "986")
    + (amountCents ? f("54", (amountCents / 100).toFixed(2)) : "")
    + f("58", "BR")
    + f("59", clean(name, 25) || "RECEBEDOR")
    + f("60", clean(city, 15) || "BRASIL")
    + f("62", f("05", tx))
    + "6304";
  return body + crc16(body);
}
