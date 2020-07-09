function getJokes(filter) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('index');
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange("A2:K" + sheet.getLastRow()).getValues();
  
  var responseData = [];

  for(var r = 0; r < lastRow - 1; r++) {
    if(filter) {
      if(data[r][6]){
        continue;
      }
    }
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
      "mode":data[r][9],
      "twitterId":data[r][10]
    });
  }

  return responseData;
}

function extract(array, num){
  for(var i = array.length - 1; i > 0; i--){
    var r = Math.floor(Math.random() * (i + 1));
    [array[i], array[r]] = [array[r], array[i]]
  }
  return array.slice(0, num);
}

function doGet(e) {

  var json;
  try {
    if('reset' in e.parameter) {
      const cache = makeCache();
      cache.put('used', e.parameter.reset > 0); // GASを未使用中にする
      json = JSON.stringify();
    } else {
      const jokeData = getJokes(true);
      const randNum = ('randNum' in e.parameter) ? Number(e.parameter.randNum) : jokeData.length;
      const extractedJokeData = extract(jokeData, randNum);
      json = JSON.stringify({
        "status": "OK",
        "error": "",
        "total": extractedJokeData.length,
        "jokes": extractedJokeData,
      });
      logging('API Connected');
    }
  } catch(err) {
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
URL = "https://script.google.com/macros/s/AKfycbx2h8jWePcUxszENqm4EqO7gk1bMDqGQKOUSPfQkDKtdwfoxAM/exec?randNum=3";
{
  “jokes”: [
    {“timeStamp”: DateTime, “joke”: String, “eventID”: String},
  ],
  “total”: Integer,
  “error”: String,
  “status”: String,
}
*/

//function test() {
//  var arr = [1,2,3,4,5];
//  arr=extract(arr,3);
//  logging(arr);
//}