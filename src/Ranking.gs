function updateRanking(slackId, joke, score) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ranking');
  var rankingData = sheet.getRange("A2:L2").getValues();
  var ischanged = false;
  for(var i = 2; i < 12; i += 3) {
    if(rankingData[0][i] < score) {
      rankingData[0][i - 2] = slackId;
      rankingData[0][i - 1] = joke;
      rankingData[0][i] = score;
      ischanged = true;
    }
  }
  if(ischanged) {
    sheet.getRange('A2:L2').setValues(rankingData);
    return true;
  } else {
    return false;
  }
}

function postWeeklyRanking() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ranking');
  var rankingData = sheet.getRange("A2:C2").getValues();
  const templateString = "【RDC 今週のベストダジャレ】\nダジャレ：${joke}\n名前：${name}\n評価：${stars}(${score}点)";
  var star = '';
  for(var i = 0; i < 5; i++) {
    if(i < Math.round(Number(rankingData[0][2]))) {
      star += '★';
    } else {
      star += '☆';
    }
  }
  const message = templateString.replace("${joke}", rankingData[0][1])
                                .replace("${name}", iD2Name(rankingData[0][0]))
                                .replace("${stars}", star)
                                .replace("${score}", Math.round(Number(rankingData[0][2]) * 10) / 10);
  
  sheet.getRange("A2:C2").setValues([['','','']]);
  postTweet(message);
}
