function makeCache() {
  const cache = PropertiesService.getScriptProperties();
  return {
    get: function(key) {
      return JSON.parse(cache.getProperty(key));
    },
    put: function(key, value) {
      cache.setProperty(key, JSON.stringify(value));
      return value;
    }
  };
}

function testCache() {
  const cache = makeCache();
  cache.put('used', 0);
  logging(cache.get('used'));
}
