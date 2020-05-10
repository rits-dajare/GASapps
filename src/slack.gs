var JUDGE_API_BASE_URL = "http://abelab.dev:8080";

function slack2SheetPost(jsonObj, score, isSlash, includeSensitive, mode) {
  // スプレットシートに記述する
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('index');
  const newRow = sheet.getLastRow() + 1;

  var link="";
  if(!isSlash) {
    link = "https://dajarerits.slack.com/archives/" + jsonObj["event"]["channel"] + "/p"+ jsonObj["event"]["ts"].replace('.','');
  }

  const newData = [[
    jsonObj["event_time"], // タイムスタンプ
    jsonObj["event_id"], // イベントID
    jsonObj["event"]["user"], // ユーザーID
    jsonObj["event"]["name"], // 表示名
    jsonObj["event"]["text"], // 本文
    score, // score
    includeSensitive, // センシティブな単語が含まれているか
    "Slack", // slack or twitter
    link,
    mode,
    jsonObj["twitterId"]
  ]];
  
  sheet.getRange('A'+newRow+':K'+newRow).setValues(newData);
}

function regularExpressionJudge(jsonObj, word) {
  return jsonObj["event"]["text"].match(word);
}

function readingReplace(str, mode) {
  return str.replace(/\{([^{|}]+)\|([^{|}]+)\}/g, "$" + mode);
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

function addReaction(channel, ts, emoji){
  const token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN'); 
  var payload = {
    "token" : token,
    "channel" : channel,
    "timestamp" : ts,
    "name" : emoji
  };
  
  var options = {
    "method" : "post",
    "payload" : payload
  };

  UrlFetchApp.fetch("https://slack.com/api/reactions.add", options);
}


function accessJudgeApi(joke, base_url) {
  const apiUrl = "/joke/judge/?joke=";
  const response = UrlFetchApp.fetch(base_url + apiUrl + joke.replace(/%3A[^(%3A)]+%3A+/g, "")).getContentText();
  const resJson = JSON.parse(response);
  return resJson;
}

function accessEvaluateApi(joke, base_url) {
  const apiUrl = "/joke/evaluate/?joke=";
  const response = UrlFetchApp.fetch(base_url + apiUrl + joke.replace(/%3A[^(%3A)]+%3A+/g, "")).getContentText();
  const resJson = JSON.parse(response);
  return Number(resJson["score"]);
}

function accessKatakanaApi(joke, base_url) {
  const apiUrl = "/joke/reading/?joke=";
  const response = UrlFetchApp.fetch(base_url + apiUrl + joke.replace(/%3A[^(%3A)]+%3A+/g, "")).getContentText();
  const resJson = JSON.parse(response);
  return resJson["reading"];
}

function accessAllApi(joke, base_url) {
  const nonEmojiJoke = joke.replace(/%3A[^(%3A)]+%3A+/g, "");
  const judgeUrl = base_url + '/joke/judge/?joke=' + nonEmojiJoke;
  const evaluateUrl = base_url + '/joke/evaluate/?joke=' + nonEmojiJoke;
  const katakanaUrl = base_url + '/joke/reading/?joke=' + nonEmojiJoke;
  
  const response = UrlFetchApp.fetchAll([judgeUrl, evaluateUrl, katakanaUrl]);
  const judgeJson = JSON.parse(response[0].getContentText());
  const evaluateJson = JSON.parse(response[1].getContentText());
  const katakanaJson = JSON.parse(response[2].getContentText());
  return [judgeJson, evaluateJson, katakanaJson];
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
  var sensitiveTags = [];
  try {
    const slicedText = jsonObj["event"]["text"].substr(0, Math.min(30, jsonObj["event"]["text"].length));
    const readingReplacedText = readingReplace(slicedText, 2);
    if(readingReplacedText == "") {
      // 空文字or記号のみの時
      return;
    }
    const encodedText = encodeURIComponent(readingReplacedText);

    // ダジャレ判定APIにアクセス
    const judgeJson = accessJudgeApi(encodedText, base_url);
    const isjoke = judgeJson["is_joke"];
    const includeSensitive = judgeJson["include_sensitive"];
    sensitiveTags = judgeJson["sensitive_tags"];
    if(!isjoke) {
      addReaction(jsonObj["event"]["channel"], jsonObj["event"]["ts"], "thumbsdown");
      return;
    }

    // ダジャレ評価APIにアクセス
    score = accessEvaluateApi(encodedText, base_url);
  } catch(o_O) {
    errLogging(o_O);
    throw o_O;
  }

  // 読み方を指定してあった場合，その読み方の表記を削除({Script|スクリプト}->Script)
  jsonObj["event"]["text"] = readingReplace(jsonObj["event"]["text"], 1);

  // ユーザーの表示名を追加
  jsonObj["event"]["name"] = iD2Name(jsonObj["event"]["user"]);

  // イベントが二個出たとき，二個目は破棄して一行消す
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('index');
  const lastRow = sheet.getLastRow();
  const lastEventTime = sheet.getRange(lastRow, 1).getValue();
  const nextEventTime = jsonObj["event_time"];
  if(lastRow > 1) {
    if(parseInt(lastEventTime) >= nextEventTime) {
      return;
    }
  }
  
  const twitterScore = Math.round(score);
  const tweetText = makeTweetText(jsonObj, twitterScore);
  var TwitterURL = "";
  if(jsonObj["event"]["channel"] == "CTZKSMLCA") {
    // ダジャレチャンネル
    if(includeSensitive) {
      addReaction(jsonObj["event"]["channel"], jsonObj["event"]["ts"], "sensitive_ja");
      slackPost("#ダジャレ", "センシティブな情報が含まれているためツイートされませんでした\n項目：" + sensitiveTags.join(', '));
      jsonObj["twitterId"] = "";
    } else {
      // Twitterに投稿，gradeシートに記録
      const TwitterResponse = postTweet(tweetText, jsonObj, twitterScore);
      TwitterURL = "\nhttps://twitter.com/rits_dajare/status/" + TwitterResponse["id_str"];
      jsonObj["twitterId"] = TwitterResponse["id_str"];
      
      addGrade(jsonObj["event"]["user"], score);
      updateRanking(jsonObj["event"]["user"], jsonObj["event"]["text"], score);
      addReaction(jsonObj["event"]["channel"], jsonObj["event"]["ts"], "thumbsup");
    }
  } else if(jsonObj["event"]["channel"] == "CU8LLRTEV"){
    // bot_testチャンネル
    if(includeSensitive) {
      addReaction(jsonObj["event"]["channel"], jsonObj["event"]["ts"], "sensitive_ja");
      slackPost("#bot_test", "センシティブな情報が含まれているためツイートされませんでした\n項目：" + sensitiveTags.join(', '));
    } else {
      addReaction(jsonObj["event"]["channel"], jsonObj["event"]["ts"], "thumbsup");
    }
    jsonObj["twitterId"] = "";
  }

  // #ついったーに投稿
  slackPost("#ついったー", tweetText + TwitterURL);
  
  // スプレットシートに保存
  slack2SheetPost(jsonObj, score, false, includeSensitive, "#ダジャレ");
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
      } else if (command == "/user") {
        return slashCommandUser(e);
      }
    } catch(o_O) {
      errLogging(o_O);
      throw o_O;
    }
  }
}
