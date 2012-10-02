(function() {
  var passUrl;

  function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
      // XHR for Chrome/Safari/Firefox.
      xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
      // XDomainRequest for IE.
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      // CORS not supported.
      xhr = null;
    }
    return xhr;
  }

  var createPass = function(data) {
    var xhr = createCORSRequest('POST', passUrl);

    if (!xhr) {
      alert("Browser doesn't support this bookmarklet. (CORS)");
      return;
    }

    xhr.onload = function() {
      alert(xhr.responseText);
    };

    xhr.onerror = function() {
      alert("Could not create passlet.");
    }

    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  };

<% if (!user) { %>
  alert('Could not authenticate with passlet service.');
<% } else if (!provider) { %>
  alert('Sorry, this website is not supported.');
<% } else { %>
  passUrl = "<%- env.PASSLET_BASE_URL %>/pass/<%- user.bookmarklet %>";

<%- indent(provider.scraper, 2) %>
<% } %>

})();