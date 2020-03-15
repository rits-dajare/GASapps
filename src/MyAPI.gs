function getJokes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('index');
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange("A2:J" + sheet.getLastRow()).getValues();
  
  var responseData = [];

  for(var r = 0; r < lastRow - 1; r++) {
    responseData.push({
      "timeStamp":data[r][0],
      "eventId":data[r][1],
      "userId":data[r][2],
      "displayName":data[r][3],
      "joke":data[r][4],
      "score":data[r][5],
      "includeSensitive":data[r][6],
      "SlackorTwitter":data[r][7],
      "link":data[r][8],
      "mode":data[r][9]
    });
  }

  return responseData;
}

function doGet(e) {
  
  var json;
  try{
    const jokeData = getJokes();
    json = JSON.stringify({
      "status": "OK",
      "error": "",
      "total": jokeData.length,
      "jokes": jokeData,
    });
  } catch(err){
    errLogging(err);
    json = JSON.stringify({
      "status": "NG",
      "error": err,
      "total": -1,
      "jokes": []
    });
  }
  return ContentService.createTextOutput()
                       .setMimeType(ContentService.MimeType.JSON)
                       .setContent(json);
}
/*
URL = "https://script.google.com/macros/s/AKfycbx2h8jWePcUxszENqm4EqO7gk1bMDqGQKOUSPfQkDKtdwfoxAM/exec?user=AAA";
{
  “jokes”: [
    {“timeStamp”: DateTime, “joke”: String, “eventID”: String},
  ],
  “total”: Integer,
  “error”: String,
  “status”: String,
}
json=JSON.stringify({"status":"NG", "error":"Please specify a username"});
*/