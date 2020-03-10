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

