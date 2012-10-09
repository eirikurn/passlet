(function() {
  var passUrl;
  var hasProp = {}.hasOwnProperty;

  var StyleTransaction = function() {
    this.changes = [];
  };
  StyleTransaction.prototype.set = function(node, styles) {
    var k
      , original = {}
      , change = { node: node, styles: styles, original: original };
    for (k in styles) {
      if (!hasProp.call(styles, k)) continue;
      original[k] = node.style[k];
    }
    this.changes.push(change);
  };
  StyleTransaction.prototype.commit = function() {
    var i, k, node, styles, length = this.changes.length;

    for (i = 0; i < length; i++) {
      node = this.changes[i].node;
      styles = this.changes[i].styles;
      for (k in styles) {
        if (!hasProp.call(styles, k)) continue;
        node.style[k] = styles[k];
      }
    }
  };

  var findFixedElements = function(node, levels) {
    var i, node, style, property, original
      , children = node.children
      , length = children.length
      , results = [];

    for (i = 0; i < length; i++) {
      node = children[i];
      style = getComputedStyle(node);
      if (style.position === 'fixed') {
        property = style.left !== 'auto' || style.right === 'auto' ? 'left' : 'right';
        original = parseInt(style[property], 10);
        if (isNaN(original))
          original = property === 'left' ? node.offsetLeft : node.offsetRight;
        results.push([node, property, original]);
      }
      if (levels > 0)
        results = results.concat(findFixedElements(node, levels-1));
    }
    return results;
  };

  var slidePage = function(node, direction, amount) {
    var isX = direction === 'left' || direction === 'right';
    var sizeProp = isX ? 'width' : 'height';
    var otherDirs = isX ? ['top', 'bottom'] : ['left', 'right'];
    var body = document.body;

    node.style.position = 'fixed';
    node.style[sizeProp] = amount + 'px';
    node.style[direction] = (-amount) + 'px';
    node.style[otherDirs[0]] = '0';
    node.style[otherDirs[1]] = '0';

    body.appendChild(node);

    var base = new StyleTransaction();

    base.set(body, { position: 'relative' });

    // We rarely want to see an X scrollbar.
    if (isX)
      base.set(body, { overflowX: 'hidden' });

    // Some pages do some horrible things with the html element. We need to undo them.
    base.set(body.parentNode, { overflowY: 'visible'});

    base.commit();
  };

  var div = document.createElement('div');
  div.style.background = 'url("http://localhost:3000/images/bm/background.jpg") repeat-y';
  div.style.color = '#fff';
  div.style.boxShadow = '0 0 30px #000 inset';
  div.style.boxSizing = 'border-box';
  div.style.padding = '30px';
  div.style.textAlign = 'left';
  div.innerHTML = "<h1>Passlet</h1><p>Parsing ticket information</p>";

  slidePage(div, 'left', 300);

  var moveElements = [[document.body, 'left', 0]].concat(findFixedElements(document.body, 3));

  moveElements.forEach(function(node) {
    node[0].style.webkitTransition = node[1] + ' 0.5s ease-in-out';
    node[0].style[node[1]] = node[2] + (300 * (node[1] === 'right' ? -1 : 1)) + 'px';
  });


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
  //alert('Sorry, this website is not supported.');
<% } else { %>
  passUrl = "<%- env.PASSLET_BASE_URL %>/pass/<%- user.bookmarklet %>";


<% } %>

})();