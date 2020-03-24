/**
 * @name 
 *  CAP-Automated-Exlcusion
 *
 * @overview
 *  Lo script permette di ottimizzare le Campagne riducendo la Spesa su una lista di CAP definiti dall'utente.
 *
 *  Nello specifico lo script esegue due diverse azioni:
 *  - Se il CAP E' presente tra le location Predefinite da Google (qui: developers.google.com/adwords/api/docs/appendix/geo/geotargets-2020-03-03.csv)
 *    tale location verra' totalmente esclusa.
 *  - Se il CAP NON E' presente tra le location predefinite da Google, verra' applicato un Bid Adjustment del -90%
 *    su un'approssimazione dell'area del CAP individuata.
 *
 * @author 
 *  BoosterBox Tech Team [tech-team@boosterboxdigital.com]
 *
 * @version 
 *  1.0
 *
 * @changelog
 *  - version 1.0
 *  - Released initial version.
**/
//////////////////////////////////////////////////////////////////////////////

// ***SETTINGS***


// Crea una copia di questo Spreadsheet e aggiungi i CAP che vuoi escludere:
// https://docs.google.com/spreadsheets/d/1V9zOcI_lhnYjX4JFlo14UtS32Q_vrQBw8yFU0YzsDog/copy
var SPREADSHEET_URL = 'INSERISCI IL LINK DELLO SPREADSHEET';
var SHEET_NAME = 'EXCLUSION_LIST';

// Inserisci la tua email
var EMAIL = 'INSERISCI LA TUA EMAIL';
var LABEL_DESCRIPTION = 'Campaigns with excluded locations';
var LABEL_BG_COLOR = '#8E4A06';

// Definisci la Label con cui indicare le Camapagne cui verranno aggiunte le Locations in Esclusione
var LABEL_NAME = 'EXCLUDED_COVID19';


function main() {
  // Create labelObj
  var labelObj = {
    name: LABEL_NAME,
    description: LABEL_DESCRIPTION,
    backgroundColor: LABEL_BG_COLOR
  };
  
  // Create mailObj
  var mailObj = {
    email: EMAIL,
    cntPlaceIdAdd: 0,
    cntCoordinateAdd: 0,
    placeIdProblems: [],
    coordinateProblems: [],
    unknownProblems: []
  }
  
  // Logger header
  var loggerHeader = ['campaignId', 'placeId', 'proximityId'];
  // Get data from SpreadSheet
  var settingSpreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  var settingSheet = settingSpreadsheet.getSheetByName(SHEET_NAME);
  var exclusionList = settingSheet.getDataRange().getValues();
  var loggerSheet = settingSpreadsheet.getSheetByName('LOGGER');
  var loggerList = loggerSheet.getDataRange().getValues();
  
  var placeToRemove = {};
  var proximitiesToReomve = {};
  // Create label if does not exist
  if (AdsApp.labels().withCondition("Name = '" + labelObj.name + "'").get().totalNumEntities() == 0){
    Logger.log("Create NewLabel\n\tname: %s\n\tdescription: %s\n\tbackgroundColor: %s", labelObj.name, labelObj.description, labelObj.backgroundColor);
    AdsApp.createLabel(labelObj.name, labelObj.description, labelObj.backgroundColor);
    labelIterator = AdsApp.labels().withCondition("Name = '" + labelObj.name + "'").get();
    return
  }
  // Get CampaignIterator & ShoppingCampaignsIterator
  var campaignIterator = AdsApp.campaigns().withCondition("LabelNames CONTAINS_ANY ['" + labelObj.name + "']").get();
  var shoppingIterator = AdsApp.shoppingCampaigns().withCondition("LabelNames CONTAINS_ANY ['" + labelObj.name + "']").get()
  var campaigns = [];
  // Get campaigns & ShoppingCampaigns
  Logger.log("Campaigns:")
  while (campaignIterator.hasNext()){
    var campaignTmp = campaignIterator.next();
    placeToRemove[campaignTmp.getId().toString()] = [];
    proximitiesToReomve[campaignTmp.getId().toString()] = [];
    campaigns.push(campaignTmp);
    Logger.log("\tname: %s", campaignTmp.getName());
  }
  while (shoppingIterator.hasNext()){
    var campaignTmp = shoppingIterator.next();
    placeToRemove[campaignTmp.getId().toString()] = [];
    proximitiesToReomve[campaignTmp.getId().toString()] = [];
    campaigns.push(campaignTmp);
    Logger.log("\tname: %s", campaignTmp.getName());
  }
  // Get old placements and proximities added
  for (var i = 1; i < loggerList.length; i++){
    var loggerRow = loggerList[i];
    if (loggerRow[1] != ''){
      placeToRemove[loggerRow[0].toString()].push(loggerRow[1]);
    } else if (loggerRow[2] != ''){
      proximitiesToReomve[loggerRow[0].toString()].push([loggerRow[0], loggerRow[2]]);
    }
  }
  // remove old placements and proximities
  if (!AdsApp.getExecutionInfo().isPreview()){
    removeNegativePlacements(placeToRemove, campaigns);
    removeNegativeProximities(proximitiesToReomve, campaigns);
    // clear logger
    loggerSheet.clearContents();
    loggerSheet.appendRow(loggerHeader);
  }
  
  // Apply NegativePlace id or bid modifier Location
  var str_error_tmp = '';
  for (var i = 1; i < exclusionList.length; i++) {
    var locationRow = exclusionList[i]
    if (locationRow[0] != '') {
      // PlaceId or Proximity
      if (locationRow[2] != ''){
        for (var j = 0; j < campaigns.length; j++){
          var response = campaigns[j].excludeLocation(locationRow[2]);
          if (response.isSuccessful() == false){
            str_error_tmp = "CampaignName: " + campaigns[j].getName() + " | CAP: " + locationRow[0] + " | PlaceId problem: " + locationRow[2].toFixed(0);
            Logger.log(str_error_tmp);
            mailObj.placeIdProblems.push([campaigns[j].getName(), locationRow[0], locationRow[2].toFixed(0), response.getErrors()]);
          } else {
            if (!AdsApp.getExecutionInfo().isPreview()){
              loggerSheet.appendRow([campaigns[j].getId(), response.getResult().getId(), '']);
            }
            mailObj.cntPlaceIdAdd++; 
          }
        }
      } else if (locationRow[3] != '' && locationRow[4] != '' && locationRow[5] != ''){
        for (var k = 0; k < campaigns.length; k++){
          var response = campaigns[k].addProximity({
            latitude: locationRow[3], 
            longitude: locationRow[4], 
            radius: locationRow[5], 
            radiusUnits:'KILOMETERS',
            bidModifier: 0.1});
          if (response.isSuccessful() == false){
            str_error_tmp = "CampaignName: " + campaigns[k].getName() + " | CAP: " + locationRow[0] +" | lat: " + locationRow[3] + "; lon: " + locationRow[4] + "; radius: " + locationRow[5] + " km";
            Logger.log(str_error_tmp);
            mailObj.coordinateProblems.push([campaigns[k].getName(), locationRow[0], locationRow[3], locationRow[4], locationRow[5], response.getErrors()]);
          } else {
            if (!AdsApp.getExecutionInfo().isPreview()){
              loggerSheet.appendRow([campaigns[k].getId(), '', response.getResult().getId()]);
            }
            mailObj.cntCoordinateAdd++;
          }
        }
      } else {
        str_error_tmp = "CAP: %s\t| Unknown", locationRow[0]
        Logger.log(str_error_tmp);
        mailObj.unknownProblems.push([locationRow[0]]);
      }
    }
  }
  // Log summary
  Logger.log("########")
  Logger.log("Summary:\n\tPlaceId added: %s\n\tProximity added: %s\n\tPlaceId errors: %s\n\tProximity errors: %s\n\tUnknown errors: %s",
            mailObj.cntPlaceIdAdd.toFixed(0), mailObj.cntCoordinateAdd.toFixed(0), mailObj.placeIdProblems.length, mailObj.coordinateProblems.length, mailObj.unknownProblems.length)
  Logger.log("########")
  emailSender(mailObj)
}

function removeNegativePlacements(negativePlacementList, campaigns){
  for (i = 0; i < campaigns.length; i++){
    var campaignId = campaigns[i].getId().toString();
    var locations = campaigns[i].targeting().excludedLocations().get();
    while (locations.hasNext()){
      var location = locations.next();
      if (negativePlacementList[campaignId].indexOf(location.getId()) != -1){
        location.remove();
      }
    }
  }
}

function removeNegativeProximities(negativeProximitiesList, campaigns){
  for (i = 0; i < campaigns.length; i++){
    var campaignId = campaigns[i].getId().toString();
    var locations = campaigns[i].targeting().targetedProximities().withIds(negativeProximitiesList[campaignId]).get();
    while (locations.hasNext()){
      locations.next().remove();
    }
  }
}

function emailSender(mailData){
  Logger.log(mailData)
  if (mailData.email == ''){
    return;
  } else {
    var emailText = UrlFetchApp.fetch('https://raw.githubusercontent.com/boosterbox/CAP-Automated-Exlcusion/master/template.html');
    emailText += '<table><tr><td><h2>Summary</h2></td></tr></table><table class="table-data">';
    emailText += '<tr><td>PlaceId added</td><td>' + mailData.cntPlaceIdAdd.toFixed(0) + '</td></tr>';
    emailText += '<tr><td>Proximity added</td><td>' + mailData.cntCoordinateAdd.toFixed(0) + '</td></tr>';
    emailText += '<tr><td>PlaceId errors</td><td>' + mailData.placeIdProblems.length + '</td></tr>';
    emailText += '<tr><td>Proximity errors</td><td>' + mailData.coordinateProblems.length + '</td></tr>';
    emailText += '<tr><td>Unknown errors: 0</td><td>' + mailData.unknownProblems.length + '</td></tr></table>'
    
    if (mailData.placeIdProblems.length > 0){
      emailText += '<hr><table><tr><td><h2>[Not added items] PlaceId</h2></td></tr></table><table class="table-data">';
      emailText += '<tr><th>CampaignName</th><th>CAP</th><th>PlaceId</th><th>Errors</th></tr>'
      for (var i=0; i < mailData.placeIdProblems.length; i++){
        emailText += '<tr>'
        for (var j=0; j< mailData.placeIdProblems[i].length; j++){
          emailText += '<td>' + mailData.placeIdProblems[i][j] + '</td>';
        }
        emailText += '</tr>'
      }
      emailText += '</table>'
    }
    if (mailData.coordinateProblems.length > 0){
      emailText += '<hr><table><tr><td><h2>[Not added items] Proximity</h2></td></tr></table><table class="table-data">';
      emailText += '<tr><th>CampaignName</th><th>CAP</th><th>Latitude</th><th>Longitude</th><th>Radius</th><th>Errors</th></tr>'
      for (var i=0; i < mailData.coordinateProblems.length; i++){
        emailText += '<tr>'
        for (var j=0; j< mailData.coordinateProblems[i].length; j++){
          emailText += '<td>' + mailData.coordinateProblems[i][j] + '</td>';
        }
        emailText += '</tr>'
      }
      emailText += '</table>'
    }
    if (mailData.unknownProblems.length > 0){
      emailText += '<hr><table><tr><td><h2>[Not added items] Unknown Probles</h2></td></tr></table><table class="table-data">';
      emailText += '<tr><th>CAP</th></tr>'
      for (var i=0; i < mailData.unknownProblems.length; i++){
        emailText += '<tr>'
        for (var j=0; j< mailData.unknownProblems[i].length; j++){
          emailText += '<td>' + mailData.unknownProblems[i][j] + '</td>';
        }
        emailText += '</tr>'
      }
      emailText += '</table>'
    }
    emailText += '</td></tr></table></div></td><td>&nbsp;</td></tr></table></body></html>';
    Logger.log(emailText);
    if (!AdsApp.getExecutionInfo().isPreview()) {
      Logger.log("Send mail to: %s", mailData.email)
      MailApp.sendEmail({
        to: mailData.email,
        subject: "GAdsScript-COVID19 @BoosterBox",
        htmlBody: emailText
      })
    }
  }
}
