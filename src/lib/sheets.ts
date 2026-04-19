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
  const lines = csv.trim().split("\n");
  if (lines.length < 2) throw new Error("Sheet has no data rows");

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const leads: Lead[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
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
