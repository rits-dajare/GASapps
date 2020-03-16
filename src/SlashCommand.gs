function slashCommandValidation(e) {
  const channel = e.parameter.channel_id;
  // ダジャレ,bottestチャンネル以外からのアクセスは弾く
  if(channel != "CTZKSMLCA" && channel != "CU8LLRTEV") {
    return false;
  }
  return true;
}

function slashCommandForce(e) {
  // forceコマンドの処理
  if(!slashCommandValidation(e)) {
    return;
  }

  const present = new Date();
  var score = -1;
  const text = e.parameter.text;
  var response;

  try {
    const base_url = JUDGE_API_BASE_URL;
    const slicedText = text.substr(0, Math.min(30, text.length));
    const removeSymbolText = removeSymbols(slicedText);
    if(removeSymbolText == "") {
      // 空文字or記号のみの時
      response = { text: "Force : NG\n文字を入力してください"};
      return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
    }
    const encodedText = encodeURIComponent(removeSymbolText);
    // ダジャレ評価APIにアクセス
    score = accessEvaluateApi(encodedText, base_url);
  } catch(o_O) {
    errLogging(o_O);
    throw o_O;
  }

  const jsonObj = {
    "event_time":present.getTime()/1000,
    "event_id":e.parameter.trigger_id,
    "event":{
      "user":e.parameter.user_id,
      "name":iD2Name(e.parameter.user_id),
      "text":text,
      "channel":e.parameter.channel_id
    },
    "score":score,
    "ts":e.parameter.response_url
  };

  // スプレットシートに保存
  slack2SheetPost(jsonObj, score, true, "None", "force");

  // #ついったーに投稿
  const twitterScore = Math.round(score);
  const tweetText = makeTweetText(jsonObj, twitterScore);
  slackPost("#ついったー", tweetText);
  
  const templateString = "コマンド：${command}\nダジャレ：${joke}\n名前：${name}";
  const message = templateString.replace("${command}", e.parameter.command)
                                .replace("${joke}", text)
                                .replace("${name}", iD2Name(e.parameter.user_id));

  // Twitter，#ダジャレに投稿
  if(jsonObj["event"]["channel"] == "CTZKSMLCA") {
    postTweet(tweetText);
    slackPost("#ダジャレ", message);
    return ContentService.createTextOutput();
  }

  response = { text: "Force : OK" + tweetText};
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function slashCommandKatakana(e) {
  // katakanaコマンドの処理
  if(!slashCommandValidation(e)) {
    return;
  }

  const text = e.parameter.text;

  try {
    const base_url = JUDGE_API_BASE_URL;
    const slicedText = text.substr(0, Math.min(30, text.length));
    const removeSymbolText = removeSymbols(slicedText);
    if(removeSymbolText == "") {
      // 空文字or記号のみの時
      return ContentService.createTextOutput(JSON.stringify({ text: "Katakana : NG\n文字を入力してください"})).setMimeType(ContentService.MimeType.JSON);
    }
    const encodedText = encodeURIComponent(removeSymbolText);
    // カタカナ変換APIにアクセス
    const reading = accessKatakanaApi(encodedText, base_url);
  } catch(o_O) {
    errLogging(o_O);
    throw o_O;
  }
  
  const templateString = "コマンド：${command}\nダジャレ：${joke}\n読み：${reading}\n名前：${name}";
  const message = templateString.replace("${command}", e.parameter.command)
                                .replace("${joke}", text)
                                .replace("${reading}", reading)
                                .replace("${name}", iD2Name(e.parameter.user_id));

  // #ダジャレに投稿
  if(e.parameter.channel_id == "CTZKSMLCA") {
    slackPost("#ダジャレ", message);
    return ContentService.createTextOutput();
  }

  const response = { text: "Katakana : OK" + message};
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function slashCommandKatakana_hide(e) {
  // katakanaコマンドの処理
  if(!slashCommandValidation(e)) {
    return;
  }

  const text = e.parameter.text;

  try {
    const base_url = JUDGE_API_BASE_URL;
    const slicedText = text.substr(0, Math.min(30, text.length));
    const removeSymbolText = removeSymbols(slicedText);
    if(removeSymbolText == "") {
      // 空文字or記号のみの時
      return ContentService.createTextOutput(JSON.stringify({ text: "Katakana_hide : NG\n文字を入力してください"})).setMimeType(ContentService.MimeType.JSON);
    }
    const encodedText = encodeURIComponent(removeSymbolText);
    // カタカナ変換APIにアクセス
    const reading = accessKatakanaApi(encodedText, base_url);
  } catch(o_O) {
    errLogging(o_O);
    throw o_O;
  }
  
  const templateString = "コマンド：${command}\nダジャレ：${joke}\n読み：${reading}";
  const message = templateString.replace("${command}", e.parameter.command)
                                .replace("${joke}", text)
                                .replace("${reading}", reading);

  const response = { text: "Katakana_hide : OK" + message};
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function slashCommandTalk(e) {
  // talkコマンドの処理
  if(!slashCommandValidation(e)) {
    return;
  }

  const templateString = "コマンド：${command}\nテキスト：${text}\n名前：${name}";
  const message = templateString.replace("${command}", e.parameter.command)
                                .replace("${text}", e.parameter.text)
                                .replace("${name}", iD2Name(e.parameter.user_id));
  
  // #ダジャレに投稿
  if(e.parameter.channel_id == "CTZKSMLCA") {
    slackPost("#ダジャレ", message);
    return ContentService.createTextOutput();
  }

  const response = { text: "Talk : OK\n" + message};
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function slashCommandList(e) {
  // talkコマンドの処理
  if(!slashCommandValidation(e)) {
    return;
  }

  const response = { text: "https://github.com/rits-dajare/GASapps/wiki/Slack-Slash-Commands" };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function slashCommandInfo(e) {
  // infoコマンドの処理
  if(!slashCommandValidation(e)) {
    return;
  }
  
  const text = e.parameter.text;
  
  try {
    const base_url = JUDGE_API_BASE_URL;
    const slicedText = text.substr(0, Math.min(30, text.length));
    const removeSymbolText = removeSymbols(slicedText);
    if(removeSymbolText == "") {
      // 空文字or記号のみの時
      return ContentService.createTextOutput(JSON.stringify({ text: "Info : NG\n文字を入力してください"})).setMimeType(ContentService.MimeType.JSON);
    }
    const encodedText = encodeURIComponent(removeSymbolText);
    // カタカナ変換APIにアクセス
    const katakana = accessKatakanaApi(encodedText, base_url);
    // ダジャレ判定APIにアクセス
    const judgeJson = accessJudgeApi(encodedText, base_url);
    const isJoke = judgeJson["is_joke"];
    const includeSensitive = judgeJson["include_sensitive"];
    // ダジャレ評価APIにアクセス
    const evaluate = accessEvaluateApi(encodedText, base_url);
  } catch(o_O) {
    errLogging(o_O);
    throw o_O;
  }
  
  const templateString = "ダジャレ：${joke}\n片仮名：${katakana}\nis_joke：${is_joke}\nevaluate：${evaluate}\ninclude_sensitive：${include_sensitive}\n";
  const message = templateString.replace("${joke}", text)
                                .replace("${katakana}", katakana)
                                .replace("${is_joke}", isJoke)
                                .replace("${evaluate}", evaluate)
                                .replace("${include_sensitive}", includeSensitive);


  const response = { text: message };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function slashCommandGrade(e, isTweet) {
  // userコマンドの処理
  if(!slashCommandValidation(e)) {
    return;
  }

  const userId = e.parameter.user_id;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('grade');
  const lastRow = sheet.getLastRow() + 1;
  var response;
  if(lastRow == 1) {
    response = { text: "データがありません" };
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  }

  const gradeData = sheet.getRange("A2:G" + lastRow).getValues();
  var userRow = -1;
  for(var i = 0; i < lastRow - 2; i++) {
    if(gradeData[i][0] == userId) {
      userRow = i;
      break;
    }
  }
  if(userRow == -1) {
    slackPost("#ダジャレ", iD2Name(userId) + "さんはデータがありません");
    return ContentService.createTextOutput();
  }
  const templateString = "${name}さんのダジャレ成績\n週間ダジャレ数：${weekly}\n週間GPA：${wGPA}\n月間ダジャレ数：${monthly}\n月間GPA：${mGPA}\n半期間ダジャレ数：${halfPeriod}\n半期間GPA：${hGPA}";
  const message = templateString.replace("${name}", iD2Name(userId))
                                .replace("${weekly}", gradeData[userRow][1])
                                .replace("${wGPA}", Math.round(gradeData[userRow][2]/gradeData[userRow][1] * 10) / 10)
                                .replace("${monthly}", gradeData[userRow][3])
                                .replace("${mGPA}", Math.round(gradeData[userRow][4]/gradeData[userRow][3] * 10) / 10)
                                .replace("${halfPeriod}", gradeData[userRow][5])
                                .replace("${hGPA}", Math.round(gradeData[userRow][6]/gradeData[userRow][5] * 10) / 10);

  // #ダジャレに投稿
  if(e.parameter.channel_id == "CTZKSMLCA") {
    slackPost("#ダジャレ", message);
    if(isTweet){
      postTweet(message);
    }
    return ContentService.createTextOutput();
  }

  response = { text: "Grade : OK\n" + message };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function slashCommandGradeWithTweet(e) {
  return slashCommandGrade(e, true);
}

function slashCommandUser(e) {
  const response = { text: "SlackId : "+ e.parameter.user_id + "\n" };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}







