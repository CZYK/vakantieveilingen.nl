# vakantieveilingen.nl

This is just a hobby project.

#### Bookmarklet
```javascript
javascript: (function() {
    var a = document.createElement("script");
    a.src = "//raw.githubusercontent.com/CZYK/vakantieveilingen.nl/master/bid.js?time=" + (Date.now());
    document.getElementsByTagName("head")[0].appendChild(a)
})();
```
