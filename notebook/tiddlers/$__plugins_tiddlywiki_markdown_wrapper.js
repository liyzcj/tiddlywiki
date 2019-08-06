/*\
title: $:/plugins/tiddlywiki/markdown/wrapper.js
type: application/javascript
module-type: parser

Wraps up the markdown-it parser for use in TiddlyWiki5

\*/
(function () {

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    //options
    try {
        var options = JSON.parse($tw.wiki.getTiddlerText("$:/config/Markdown", "{}"));
    } catch (__) {
        var options = {};
    }

    //highlight
    try {
        var hljs = require("$:/plugins/tiddlywiki/highlight/highlight.js");
        var HighLighter = function (str, lang) {
            try {
                if (lang && hljs.getLanguage(lang)) {
                   / * return hljs.highlight(lang, str).value; */
                   return '<pre class="hljs"><code>' + hljs.highlight(lang, str, true).value + '</code></pre>';
                } else {
                   // return hljs.highlightAuto(str).value;
                   return '<pre class="hljs"><code>' + hljs.highlightAuto(str).value + '</code></pre>';
                }
            } catch (__) {
                // return '';
                return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
            }
        }
        options.highlight = HighLighter;
    } catch (__) {
    }

    var markdown = require("$:/plugins/tiddlywiki/markdown/markdown-it.js")(options)

    //katex
    try {
        markdown = markdown.use(require('$:/plugins/tiddlywiki/markdown/markdown-it-katex.js'))
    } catch (__) {
    }

    var MarkdownParser = function (type, text, options) {
	    this.tree = [{type : "raw", html : markdown.render(text)}];
    };

    exports["text/x-markdown"] = MarkdownParser;

})();
