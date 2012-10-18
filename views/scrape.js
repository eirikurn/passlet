(function() {
  var passUrl;
  var hasProp = {}.hasOwnProperty;

  /**
   * A nifty class to handle style changes to multiple elements
   * which are undoable. Changes get performed all in one batch
   * to minimize browser reflows.
   */
  var StyleTransaction = function() {
    this.changes = [];
  };

  /**
   * Prepares a change to some styles of node. Records
   * the original style value at this point.
   */
  StyleTransaction.prototype.set = function(node, styles) {
    var k
      , original = {}
      , change = { node: node, styles: styles, original: original };
    for (k in styles) {
      if (!hasProp.call(styles, k)) continue;
      if ('object' === typeof styles[k]) {
        original[k] = styles[k].original;
        styles[k] = styles[k].value;
      } else {
        original[k] = node.style[k];
      }
    }
    this.changes.push(change);
  };

  /**
   * Commits all style changes in this transaction.
   */
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

  /**
   * Undoes all style changes in this transaction.
   */
  StyleTransaction.prototype.rollback = function() {
    var i, k, node, styles, length = this.changes.length;

    for (i = 0; i < length; i++) {
      node = this.changes[i].node;
      styles = this.changes[i].original;
      for (k in styles) {
        if (!hasProp.call(styles, k)) continue;
        node.style[k] = styles[k];
      }
    }
  };


  /**
   * A sliding effect. Inspired by Notification Center in Mountain Lion.
   * Positions an element on the specified edge of the browser window. Then
   * slides the whole page by the specified amount.
   */
  var SlidePage = function(node, opts, done) {

    var dir = opts.direction || 'left'
      , amount = opts.amount || 300
      , duration = opts.duration || 500
      , body = document.body

      // Find some directions
      , isX = dir === 'left' || dir === 'right'
      , sizeProp = isX ? 'width' : 'height'
      , otherDirs = isX ? ['top', 'bottom'] : ['left', 'right']
      , oppositeDir = dir === 'top' ? 'bottom' : dir === 'right' ? 'left' : dir === 'bottom' ? 'top' : 'right'
      , intDir = dir === 'top' || dir === 'left' ? 1 : -1
      , transitions = ['top', 'right', 'bottom', 'left'].map(function(d) { return d + ' ' + duration + 'ms ease-in-out'}).join(', ')

      // We need 3 different style batches for the slide.
      , base = new StyleTransaction()
      , toggleTransition = new StyleTransaction()
      , slide = new StyleTransaction();

    this.duration = duration;
    this.transactions = [slide, toggleTransition, base];

    // We move most of the body by sliding it relativily by specified amount.
    base.set(body, { position: 'relative' });

    // We rarely want to see an X scrollbar.
    if (isX)
      base.set(body, { overflowX: 'hidden' });

    // Some pages do some horrible things with the html element. Let's undo them.
    base.set(body.parentNode, { overflowY: 'visible'});

    // Move the node to the correct edge.
    node.style.position = 'fixed';
    node.style[sizeProp] = amount + 'px';
    node.style[dir] = (-amount) + 'px';
    node.style[otherDirs[0]] = '0';
    node.style[otherDirs[1]] = '0';
    body.appendChild(node);

    // These are the elements we want to slide
    var moveElements = [{ node: body, style: getComputedStyle(body) }].concat(this._findFixedElements(document.body, 3));

    // So let's figure out how
    moveElements.forEach(function(el) {
      var slideCss = {};

      // If it has a position in the direction we're coming from, we'll move it away.
      if (el.style[dir] !== 'auto')
        slideCss[dir] = parseInt(el.style[dir], 10) + (amount * 1) + 'px';

      // If it has a position in the opposite direction, we'll slide it the other way.
      if (el.style[oppositeDir] !== 'auto')
        slideCss[oppositeDir] = parseInt(el.style[oppositeDir], 10) + (amount * -1) + 'px';

      // If it has no positioning on our axis, it is statically positioned, so we
      // first need to find and lock it's offset to the window. Then calculate the 
      // slide.
      if (el.style[dir] === 'auto' && el.style[oppositeDir] === 'auto') {
        if (isX) {
          base.set(el.node, { left: el.node.offsetLeft + 'px' });
          slideCss.left = { value: el.node.offsetLeft + (amount * intDir) + 'px', original: el.node.offsetLeft + 'px' };
        } else {
          base.set(el.node, { top: el.node.offsetTop + 'px' });
          slideCss.top = { value: el.node.offsetTop + (amount * intDir) + 'px', original: el.node.offsetTop + 'px' };
        }
      }

      // Enable transitions for the node
      toggleTransition.set(el.node, { webkitTransition: transitions });

      // Store the slide information.
      slide.set(el.node, slideCss);
    });

    // Add our base style changes
    base.commit();

    // Force a reflow to lock in some offsets before enabling transitions.
    body.offsetWidth;

    // Enable transition for relevant nodes.
    toggleTransition.commit();

    // Start the slide.
    slide.commit();

    if (done) {
      setTimeout(done.bind(null, this), duration);
    }
  };

  /**
   * Finds elements that have position fixed. Returns them as
   * array of objects which also has the computed style of each
   * element.
   */
  SlidePage.prototype._findFixedElements = function(node, levels) {
    var i, node, style, property, original
      , children = node.children
      , length = children.length
      , results = [];

    for (i = 0; i < length; i++) {
      node = children[i];
      style = getComputedStyle(node);
      if (style.position === 'fixed') {
        results.push({node: node, style: style});
      }
      if (levels > 0)
        results = results.concat(this._findFixedElements(node, levels-1));
    }
    return results;
  };

  SlidePage.prototype.slideBack = function(done) {
    var self = this;

    self.transactions[0].rollback();
    setTimeout(function() {
      self.transactions[1].rollback();
      self.transactions[2].rollback();
      if (done) done(self);
    }, self.duration);
  };

  // Add our styles
  var createStylesheet = function(css) {
    var head = document.getElementsByTagName('head')[0]
      , style = document.createElement('style');

    style.type = 'text/css';
    if(style.styleSheet){
        style.styleSheet.cssText = css;
    }else{
        style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);
  };
  createStylesheet("<%- escapejs(scrapecss) %>");

  // Create our sidebard div
  var div = document.createElement('div');
  div.id = 'pscrape';
  div.innerHTML = "<h1>Passlet</h1><p>Parsing ticket information</p>";

  new SlidePage(div, { direction: 'left', amount: 300, duration: 500 }, function(s) {
    setTimeout(function() {
      s.slideBack();
    }, 2000);
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