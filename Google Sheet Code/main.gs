// the following are examples and should be replaced with real values
const CONFIG = {
  CLIENT_ID: "N34aCYpVlf2iXnDscAq5J9K5G7S0Y6an4ktFXBWoKLD0x6GiFpSJqeY9gRsHYG9uVBXjM2SPl6gKQprR",       // Yahoo client ID
  CLIENT_SECRET: "8FF835BAB8587BBC0F840269E5F0CCEF041BB83F",   // Yahoo client secret
  teamCount: 12,       // Number of teams in your league (not, no quotes here)
  leagueId: "1234",     // ID of you Yahoo league
}

let Logger = BetterLog.useSpreadsheet(SpreadsheetApp.getActive().getId());

/**
 * Adds the Yahoo menu when the sheet is opened
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Yahoo")
    .addItem("Authorize", "showSidebar")
    .addItem("Initialize league data", "initializeLeagueData")
    .addSeparator()
    .addItem("Start draft polling", "createDraftTimeTriggers")
    .addItem("Stop draft polling", "deleteDraftTimeTriggers")
    .addToUi();
}

/**
 * Initializes the League data
 */
function initializeLeagueData() {
  console.log("Initializing..")
  getLeagueData();
  getTeams();
  getPlayerData();
  //getDraftResults();
}

function getService() {
  return OAuth2.createService('Yahoo')
  // Set the endpoint URLs.
  .setAuthorizationBaseUrl('https://api.login.yahoo.com/oauth2/request_auth')
  .setTokenUrl('https://api.login.yahoo.com/oauth2/get_token')

  // Set the client ID and secret.
  .setClientId(CONFIG.CLIENT_ID)
  .setClientSecret(CONFIG.CLIENT_SECRET)

  // Set the name of the callback function that should be invoked to complete
  // the OAuth flow.
  .setCallbackFunction('authCallback')

  // Set the property store where authorized tokens should be persisted.
  .setPropertyStore(PropertiesService.getUserProperties());
}

/**
* Handles the OAuth callback.
*/
function authCallback(request) {
  let service = getService();
  let authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}

/**
* Reset the authorization state, so that it can be re-tested.
*/
function reset() {
  getService().reset();
}
/*****
 * Open Sidebar and add authorization link
 ****/
function showSidebar() {
  let service = getService();
  let authorizationUrl = service.getAuthorizationUrl();
  let template = HtmlService.createTemplate(
      '<a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>. ' +
      'Reopen the sidebar when the authorization is complete.');
  template.authorizationUrl = authorizationUrl;
  let page = template.evaluate();
  SpreadsheetApp.getUi().showSidebar(page)
}

/*
* Gets the year ID (game_key) from Yahoo and sets it to a script property
* This yearID changes every year
*/
function setGameKey() {
  let service = getService();
  let url = "https://fantasysports.yahooapis.com/fantasy/v2/game/nhl";
  
  try {
    let response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + service.getAccessToken()
      }
    });
    
    let json = xmlToJson(response.getContentText());
    let gameKey = json.fantasy_content.game.game_key.Text;
    Logger.log(JSON.stringify(json.fantasy_content));

    let scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('yearId', gameKey);
    
    console.log(`GameKey is ${gameKey}`);
    return gameKey;
  } catch(e) {
    Logger.log(e);
  }
}

/*
* Returns the year ID (game_key), fetching it from Yahoo and saving it to a
* script property if it isn't stored yet
*/
function getYearId() {
  try {
    let gameKey;
    let scriptProperties = PropertiesService.getScriptProperties();
    gameKey = scriptProperties.getProperty('yearId');

    if (!gameKey) {
      gameKey = setGameKey();
    } else {
      console.log(`GameKey is ${gameKey}`);
    }
    
    return gameKey;
  } catch(e) {
    Logger.log(e);
  }
}

