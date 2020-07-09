var CONSUMER_KEY = PropertiesService.getScriptProperties().getProperty(
  "TWITTER_API_KEY"
);
var CONSUMER_SECRET = PropertiesService.getScriptProperties().getProperty(
  "TWITTER_API_SECRET_KEY"
);

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
  try {
    const service = twitter.getService();
    const endPointUrl = "https://api.twitter.com/1.1/statuses/update.json";

    var response = service.fetch(endPointUrl, {
      method: "post",
      payload: {
        status: tweetText,
      },
    });
    return JSON.parse(response);
  } catch (e) {
    return -1;
  }
}

// ツイート文テンプレートを取得
function fetchTemplateString(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "personalData"
  );
  const users = sheet.getRange("A2:E" + sheet.getLastRow()).getValues();
  for (var i = 0; i < users.length; i++) {
    if (users[i][0] == userId) {
      return users[i][4];
    }
  }
  const defaultString =
    "【${time}】\nダジャレ：${joke}\n名前：${name}\n評価：${score}";
  return defaultString;
}

// 投稿メッセージ生成
function makeTweetText(jsonObj, evaluateScore) {
  const date = new Date(Number(jsonObj["event_time"]) * 1000); // Dateオブジェクト生成
  const dateString = Utilities.formatDate(date, "JST", "yyyy/MM/dd HH:mm:ss");
  const dajareText = replaceEmoji(jsonObj["event"]["text"]);
  var templateString = fetchTemplateString(jsonObj["event"]["user"]);

  var star = "";
  for (var i = 0; i < 5; i++) {
    if (i < evaluateScore) {
      star += "★";
    } else {
      star += "☆";
    }
  }

  const message = templateString
    .replace("${time}", dateString)
    .replace("${joke}", dajareText)
    .replace("${name}", jsonObj["event"]["name"])
    .replace("${score}", star);
  return message;
}

if (!String.fromCodePoint)
  (function (stringFromCharCode) {
    var fromCodePoint = function (_) {
      var codeUnits = [],
        codeLen = 0,
        result = "";
      for (var index = 0, len = arguments.length; index !== len; ++index) {
        var codePoint = +arguments[index];
        // correctly handles all cases including `NaN`, `-Infinity`, `+Infinity`
        // The surrounding `!(...)` is required to correctly handle `NaN` cases
        // The (codePoint>>>0) === codePoint clause handles decimals and negatives
        if (!(codePoint < 0x10ffff && codePoint >>> 0 === codePoint))
          throw RangeError("Invalid code point: " + codePoint);
        if (codePoint <= 0xffff) {
          // BMP code point
          codeLen = codeUnits.push(codePoint);
        } else {
          // Astral code point; split in surrogate halves
          // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          codePoint -= 0x10000;
          codeLen = codeUnits.push(
            (codePoint >> 10) + 0xd800, // highSurrogate
            (codePoint % 0x400) + 0xdc00 // lowSurrogate
          );
        }
        if (codeLen >= 0x3fff) {
          result += stringFromCharCode.apply(null, codeUnits);
          codeUnits.length = 0;
        }
      }
      return result + stringFromCharCode.apply(null, codeUnits);
    };
    try {
      // IE 8 only supports `Object.defineProperty` on DOM elements
      Object.defineProperty(String, "fromCodePoint", {
        value: fromCodePoint,
        configurable: true,
        writable: true,
      });
    } catch (e) {
      String.fromCodePoint = fromCodePoint;
    }
  })(String.fromCharCode);

function replaceEmoji(dajareText) {
  const emojiURL = "https://unpkg.com/emoji-datasource@5.0.1/emoji.json";
  const emojiList = JSON.parse(UrlFetchApp.fetch(emojiURL).getContentText());

  return dajareText.replace(/:([^:]+):/g, function (_, emojiName) {
    for (var i = 0; i < emojiList.length; i++) {
      if (emojiList[i].short_names.indexOf(emojiName) !== -1) {
        var result = "";
        emojiList[i].unified.split("-").forEach(function (code) {
          result += String.fromCodePoint(parseInt(code, 16));
        });
        return result;
      }
    }
    return emojiName;
  });
}
