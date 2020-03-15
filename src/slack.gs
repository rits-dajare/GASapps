var JUDGE_API_BASE_URL = "http://abelab.dev:8080";

function slack2SheetPost(jsonObj, score, isSlash, includeSensitive, mode) {
  // スプレットシートに記述する
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('index');
  const newRow = sheet.getLastRow() + 1;

  sheet.getRange(newRow, 1).setValue(jsonObj["event_time"]); // タイムスタンプ
  sheet.getRange(newRow, 2).setValue(jsonObj["event_id"]); // イベントID
  sheet.getRange(newRow, 3).setValue(jsonObj["event"]["user"]); // ユーザーID
  sheet.getRange(newRow, 4).setValue(jsonObj["event"]["name"]); // 表示名
  sheet.getRange(newRow, 5).setValue(jsonObj["event"]["text"]); // 本文
  sheet.getRange(newRow, 6).setValue(score); // score
  sheet.getRange(newRow, 7).setValue(includeSensitive); // センシティブな単語が含まれているか
  sheet.getRange(newRow, 8).setValue("Slack"); // slack or twitter
  if(!isSlash) {
    const link = "https://dajarerits.slack.com/archives/" + jsonObj["event"]["channel"] + "/p";
    sheet.getRange(newRow, 9).setValue(link + jsonObj["event"]["ts"].replace('.','')); // link
  }
  sheet.getRange(newRow, 10).setValue(mode); // 備考
}

function regularExpressionJudge(jsonObj, word) {
  return jsonObj["event"]["text"].match(word);
}

function slackValidation(e) {
  const jsonObj = JSON.parse(e.postData.getDataAsString());

  // observerの投稿は弾く
  if(jsonObj["event"]["user"] == "UUJQJ0YQG") {
    return false;
  }

  // slackのchannelに参加した時のイベントを取り除く
  // この場合「<userid>~~~」という文字列がtextに入る
  const JoinWord = new RegExp("^<@" + jsonObj["event"]["user"] + ">.*");
  if(regularExpressionJudge(jsonObj, JoinWord)) {
    return false;
  }

  // slackのリアクションイベントは弾く
  // この場合「: ~~~~ :」という文字列がtextに入る
  const reactionwWord = new RegExp("^:.*:$");
  if(regularExpressionJudge(jsonObj, reactionwWord)) {
    return false;
  }

  // ダジャレ,bottestチャンネル以外からのアクセスは弾く
  if(jsonObj["event"]["channel"] != "CTZKSMLCA" && jsonObj["event"]["channel"] != "CU8LLRTEV") {
    return false;
  }

  return jsonObj;
}

function slackPost(channel, message) {
  // Slackの特定のチャンネルに投稿
  const token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');  
  const slackApp = SlackApp.create(token); //SlackApp インスタンスの取得
  const options = {
    channelId: channel, // チャンネル名
    userName: "obserber", // 投稿するbotの名前
    // 投稿するメッセージ
    message: message,
  };

  // 投稿
  slackApp.postMessage(options.channelId, options.message, {username: options.userName});
}

function accessJudgeApi(joke, base_url) {
  const apiUrl = "/joke/judge/?joke=";
  const response = UrlFetchApp.fetch(base_url + apiUrl + joke).getContentText();
  const resJson = JSON.parse(response);
  return resJson;
}

function accessEvaluateApi(joke, base_url) {
  const apiUrl = "/joke/evaluate/?joke=";
  const response = UrlFetchApp.fetch(base_url + apiUrl + joke).getContentText();
  const resJson = JSON.parse(response);
  return Number(resJson["score"]);
}

function accessKatakanaApi(joke, base_url) {
  const apiUrl = "/joke/reading/?joke=";
  const response = UrlFetchApp.fetch(base_url + apiUrl + joke).getContentText();
  const resJson = JSON.parse(response);
  return resJson["reading"];
}

function iD2Name(id) {
  const token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');  
  const slackApp = SlackApp.create(token); //SlackApp インスタンスの取得
  const userinfo = slackApp.usersInfo(id);

  return userinfo["user"]["profile"]["display_name"] || userinfo["user"]["profile"]["real_name"];
}

function dajare(jsonObj) {

  const base_url = JUDGE_API_BASE_URL;
  var score = -1;
  try {
    const slicedText = jsonObj["event"]["text"].substr(0, Math.min(30, jsonObj["event"]["text"].length));
    const encodedText = encodeURIComponent(slicedText);

    // ダジャレ判定APIにアクセス
    const judgeJson = accessJudgeApi(encodedText, base_url);
    const isjoke = judgeJson["is_joke"];
    const includeSensitive = judgeJson["include_sensitive"];
    if(!isjoke) {
      return;
    }

    // ダジャレ評価APIにアクセス
    score = accessEvaluateApi(encodedText, base_url);
  } catch(o_O) {
    errLogging(o_O);
    throw o_O;
  }
  
  // ユーザーの表示名を追加
  jsonObj["event"]["name"] = iD2Name(jsonObj["event"]["user"]);

  // スプレットシートに保存
  slack2SheetPost(jsonObj, score, false, includeSensitive, "#ダジャレ");

  
  // イベントが二個出たとき，二個目は破棄して一行消す
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('index');
  const lastRow = sheet.getLastRow();
  const lastEventTime = sheet.getRange(lastRow, 1).getValue();
  if(lastRow > 1) {
    const beforeLastEventTime = sheet.getRange(lastRow - 1, 1).getValue();
    if(parseInt(lastEventTime) <= parseInt(beforeLastEventTime)) {
      sheet.deleteRows(lastRow, 1);
      return;
    }
  }
  
  const twitterScore = Math.round(score);
  const tweetText = makeTweetText(jsonObj, twitterScore);
  var TwitterURL = "";

  if(jsonObj["event"]["channel"] == "CTZKSMLCA") {
    // ダジャレチャンネル
    if(includeSensitive) {
      slackPost("#ダジャレ", "センシティブな情報が含まれているためツイートされませんでした");
    } else {
      // Twitterに投稿，gradeシートに記録
      const response = postTweet(tweetText, jsonObj, twitterScore);
      TwitterURL = "\nhttps://twitter.com/rits_dajare/status/" + response["id_str"];
      addGrade(jsonObj["event"]["user"], score);
      updateRanking(jsonObj["event"]["user"], jsonObj["event"]["text"], score)
    }
  } else if(jsonObj["event"]["channel"] == "CU8LLRTEV"){
    // bot_testチャンネル
    if(includeSensitive) {
      slackPost("#bot_test", "センシティブな情報が含まれているためツイートされませんでした");
    }
  }

  // #ついったーに投稿
  slackPost("#ついったー", tweetText + TwitterURL);
  
}

function doPost(e){
  try {
    // 通常のダジャレ
    var jsonObj = slackValidation(e);
    if(jsonObj != false) {
      dajare(jsonObj);
    }
  } catch(_) {
    try{
      // スラッシュコマンド
      const command = e.parameter.command;
      if(command == "/force") {
        return slashCommandForce(e);
      } else if (command == "/katakana") {
        return slashCommandKatakana(e);
      } else if (command == "/katakana_hide") {
        return slashCommandKatakana_hide(e);
      } else if (command == "/talk") {
        return slashCommandTalk(e);
      } else if (command == "/list") {
        return slashCommandList(e);
      } else if (command == "/info") {
        return slashCommandInfo(e);
      } else if (command == "/grade") {
        return slashCommandGrade(e);
      } else if (command == "/grade_with_tweet") {
        return slashCommandGradeWithTweet(e);
      }
    } catch(o_O) {
      errLogging(o_O);
      throw o_O;
    }
  }
}
