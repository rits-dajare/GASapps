var CONSUMER_KEY = PropertiesService.getScriptProperties().getProperty('TWITTER_API_KEY');
var CONSUMER_SECRET = PropertiesService.getScriptProperties().getProperty('TWITTER_API_SECRET_KEY');

//認証用インスタンスの生成
var twitter = TwitterWebService.getInstance(CONSUMER_KEY, CONSUMER_SECRET);

//アプリを連携認証する
function authorize() {
  twitter.authorize();
}

//認証後のコールバック
function authCallback(request) {
  return twitter.authCallback(request);
}

//認証を解除する
function reset() {
  twitter.reset();
}

// ツイートを投稿
function postTweet(tweetText) {
  try{
    var service  = twitter.getService();
    var endPointUrl = 'https://api.twitter.com/1.1/statuses/update.json';
    
    var response = service.fetch(endPointUrl, {
      method: 'post',
      payload: {
        status: tweetText
      }
    });
  } catch(e) {  
    Logger.log("Twitter投稿失敗"+ e );
    return -1;
  }
}

function makeTweetText(jsonObj, evaluateScore){
  // 投稿メッセージ生成
  const templateString = "【${time}】\nダジャレ：${joke}\n名前：${name}\n評価：${score}";
  const date = new Date(Number(jsonObj["event_time"])*1000); // Dateオブジェクト生成
  const dateString = Utilities.formatDate(date,"JST","yyyy/MM/dd HH:mm:ss");

  var star = '';
  for(var i = 0; i < 5; i++) {
    if(i < evaluateScore) {
      star += '★';
    } else {
      star += '☆';
    }
  }
  
  const message = templateString.replace("${time}", dateString)
                                .replace("${joke}", jsonObj["event"]["text"])
                                .replace("${name}", jsonObj["event"]["name"])
                                .replace("${score}", star);
  return message;
}