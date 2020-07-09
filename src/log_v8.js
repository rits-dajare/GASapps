//function errLogging(e){
//  var log    = ssCache.getCache("errLog");
//  var eMsg   = getTimestamp() + "[ERROR]" + e;
//  if(e.stack)   eMsg += "\n　" + e.stack;
//  var newLog =  eMsg +"\n" + log;
//  ssCache.setCache("errLog", newLog.substr(0,25000));
//  postErrMsgToSlack(eMsg);
//  //return newLog;
//}
//
//function logging(message){
//  var log        = ssCache.getCache("log");
//  var newLog     = getTimestamp() + message +"\n" + log;
//  ssCache.setCache("log", newLog.substr(0,25000));
//  //return newLog;
//}
//
//function getTimestamp(){
//  return ("[" + Utilities.formatDate((new Date()), "JST", "yy/MM/dd HH:mm:ss") + "]");
//}
//
//const ssCache = {
//  getCache: function(id) {
//    let cacheSht = this.openCacheSht();
//    let rowLen   = cacheSht.getLastRow();
//    if(rowLen === 0) return null;
//    let caches   = cacheSht.getRange(1, 1, rowLen, 2).getValues();
//    let row      = this.getRowFromArray(caches, id);
//    if(row === null) return null;
//    return caches[row][1];
//  },
//  setCache: function(id, value) {
//    let cacheSht = this.openCacheSht();
//    let rowLen   = cacheSht.getLastRow();
//    let caches, row;
//    if(rowLen > 0){
//      caches   = cacheSht.getRange(1, 1, rowLen, 2).getValues();
//      row      = this.getRowFromArray(caches, id);
//      if(row === null) row = rowLen;
//    }else{
//      row = 0;
//    }
//    cacheSht.getRange(row+1, 1, 1, 2).setValues([[id,value]]);
//    return 0;
//  },
//  getRowFromArray: function(array, id) {
//    let len = array.length;
//    for(var i = 0; i < len; i++){
//      if(array[i][0] === id){
//        return i;
//      }
//    }
//    return null;
//  },
//  openCacheSht: function(name) {
//    try{
//      const ss = SpreadsheetApp.getActiveSpreadsheet();
//      const sss = ss.getSheetByName("cacheSht");
//      return sss;
//    }catch(e){
//      Logger.log("シートを開けませんでした"+ e );
//      return -1;
//    }
//  },
//}
//
//function postErrMsgToSlack(eMsg) {
//  const token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
//  const slackApp = SlackApp.create(token); //SlackApp インスタンスの取得
//  const channel = "#bot_status"
//  const options = {
//    channelId: channel, // チャンネル名
//    userName: "obserber", // 投稿するbotの名前
//    message: eMsg,
//  };
//  Logger.log(slackApp.postMessage(options.channelId, options.message, {username: options.userName}));
//}
