(function() {
  var doc = document
    , scriptElement = doc.createElement('script')
    , body = doc.body
    , location = doc.location;
  try {
    if (!body)
      throw(0);
    scriptElement.setAttribute('src', '<%- baseUrl %>/bm/<%- bookmarkletId %>?d=' + encodeURIComponent(location.host));
    body.appendChild(scriptElement);
  } catch (e) {
    alert('Please wait until the page has loaded.');
  }
})();
void(0)