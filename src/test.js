//function accessJudgeApi(joke, base_url) {
//  const apiUrl = "/joke/judge/?joke=";
//  const response = UrlFetchApp.fetch(base_url + apiUrl + joke).getContentText();
//  const resJson = JSON.parse(response);
//  return resJson;
//}
//
//function accessEvaluateApi(joke, base_url) {
//  const apiUrl = "/joke/evaluate/?joke=";
//  const response = UrlFetchApp.fetch(base_url + apiUrl + joke).getContentText();
//  const resJson = JSON.parse(response);
//  return Number(resJson["score"]);
//}
function main() {
  const joke = "チンコがガチンコ";
  var request1 = 'http://abelab.dev:8080/joke/judge/?joke=' + joke;
  var request2 = 'http://abelab.dev:8080/joke/evaluate/?joke=' + joke;
  var response = UrlFetchApp.fetchAll([request1, request2]);
  var json1 = JSON.parse(response[0].getContentText());
  var json2 = JSON.parse(response[1].getContentText());
  logging(json1["sensitive_tags"]);
  logging(json2["score"]);
}


function arr2string(){
//  const arr = ['etti', 'scetch', 'one', 'touch'];
  const arr = [];
  const str = arr.join(',');
  logging(str)
}



/*
thumbsup
thumbsdown
*/
