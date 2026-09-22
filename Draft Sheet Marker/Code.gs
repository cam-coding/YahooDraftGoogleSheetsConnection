// Adjust these to match your DraftSheet layout.
const DRAFT_CONFIG = {
  sheetName: "DraftSheet",
  nameColumn: 1,   // column with player names (A = 1)
  takenColumn: 3,  // checkbox column marking a player taken (C = 3)
  headerRow: 1,
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Draft")
    .addItem("Search players", "showDraftSidebar")
    .addItem("Set up checkboxes", "setupTakenCheckboxes")
    .addToUi();
}

function showDraftSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("Sidebar").setTitle("Mark player taken");
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * One-time (or re-runnable) setup: turns the taken column into real
 * checkboxes so you can also click them directly in the sheet.
 */
function setupTakenCheckboxes() {
  const sheet = getDraftSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= DRAFT_CONFIG.headerRow) return;
  sheet
    .getRange(DRAFT_CONFIG.headerRow + 1, DRAFT_CONFIG.takenColumn, lastRow - DRAFT_CONFIG.headerRow, 1)
    .insertCheckboxes();
}

function getDraftSheet_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(DRAFT_CONFIG.sheetName);
  if (!sheet) throw new Error(`Sheet "${DRAFT_CONFIG.sheetName}" not found`);
  return sheet;
}

/**
 * Returns undrafted players whose name contains `query` (case-insensitive),
 * for the sidebar's type-ahead list. Empty query returns the first 25
 * undrafted players alphabetically.
 */
function searchUndraftedPlayers(query) {
  const sheet = getDraftSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= DRAFT_CONFIG.headerRow) return [];

  const numRows = lastRow - DRAFT_CONFIG.headerRow;
  const names = sheet
    .getRange(DRAFT_CONFIG.headerRow + 1, DRAFT_CONFIG.nameColumn, numRows, 1)
    .getValues();
  const taken = sheet
    .getRange(DRAFT_CONFIG.headerRow + 1, DRAFT_CONFIG.takenColumn, numRows, 1)
    .getValues();

  const needle = query.trim().toLowerCase();
  const results = [];
  for (let i = 0; i < numRows; i++) {
    const name = names[i][0];
    if (!name || taken[i][0] === true) continue;
    if (needle && !String(name).toLowerCase().includes(needle)) continue;
    results.push({ row: DRAFT_CONFIG.headerRow + 1 + i, name: name });
  }
  results.sort((a, b) => a.name.localeCompare(b.name));
  return results.slice(0, 25);
}

/**
 * Checks the taken box for the given row and selects it, so you can see it happen.
 */
function markPlayerTaken(row) {
  const sheet = getDraftSheet_();
  sheet.getRange(row, DRAFT_CONFIG.takenColumn).setValue(true);
  sheet.setActiveSelection(sheet.getRange(row, DRAFT_CONFIG.nameColumn));
}
