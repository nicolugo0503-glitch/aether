// Read leads from a public Google Sheet (CSV export)
// Sheet must be shared as "Anyone with the link can view"

export interface Lead {
  name: string;
  email: string;
  company?: string;
  [key: string]: string | undefined;
}

export async function readSheetLeads(sheetUrl: string): Promise<Lead[]> {
  // Extract sheet ID from URL
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error("Invalid Google Sheets URL");

  const sheetId = match[1];
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error("Could not read sheet. Make sure it is shared as 'Anyone with the link can view'.");

  const csv = await res.text();

  // RFC 4180-compliant CSV parser that handles quoted fields with commas and newlines
  function parseCSV(raw: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    let i = 0;
    const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    while (i < text.length) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          // peek ahead for escaped quote
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false;
        } else {
          field += ch;
        }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ",") { row.push(field.trim()); field = ""; }
        else if (ch === "\n") { row.push(field.trim()); rows.push(row); row = []; field = ""; }
        else { field += ch; }
      }
      i++;
    }
    // last field/row
    if (field || row.length) { row.push(field.trim()); rows.push(row); }
    return rows;
  }

  const rows = parseCSV(csv);
  if (rows.length < 2) throw new Error("Sheet has no data rows");

  const headers = rows[0].map((h) => h.toLowerCase().replace(/"/g, ""));
  const leads: Lead[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const lead: Lead = { name: "", email: "" };
    headers.forEach((h, idx) => {
      lead[h] = values[idx] || "";
    });
    if (lead.email && lead.email.includes("@")) {
      leads.push(lead);
    }
  }

  return leads;
}
