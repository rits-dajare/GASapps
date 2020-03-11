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

  try {
    const base_url = JUDGE_API_BASE_URL;
    const slicedText = text.substr(0, Math.min(30, text.length));
    const encodedText = encodeURIComponent(slicedText);
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
  slack2SheetPost(jsonObj, score, true);

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
    postTweet(tweetText, jsonObj, twitterScore);
    slackPost("#ダジャレ", message);
  }

  const response = { text: "Force : OK" };
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
    const encodedText = encodeURIComponent(slicedText);
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
  }

  const response = { text: "Katakana : OK\n" };
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
  }

  const response = { text: "Talk : OK\n" };
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