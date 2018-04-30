# vakantieveilingen.nl

This is just a hobby project.

#### Bookmarklet
```javascript
javascript: (function() {
    var a = document.createElement("script");
    a.src = "//rawgithub.com/CZYK/vakantieveilingen.nl/master/bid.js";
    document.getElementsByTagName("head")[0].appendChild(a)
})();
```