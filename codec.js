// - javascript - Escape regexp strings? - Stack Overflow
// - https://stackoverflow.com/questions/6828637/escape-regexp-strings
function preg_quote (str, delimiter) {
    // Quote regular expression characters plus an optional character
    //
    // version: 1107.2516
    // discuss at: http://phpjs.org/functions/preg_quote
    // +   original by: booeyOH
    // +   improved by: Ates Goral (http://magnetiq.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // *     example 1: preg_quote("$40");
    // *     returns 1: '\$40'
    // *     example 2: preg_quote("*RRRING* Hello?");
    // *     returns 2: '\*RRRING\* Hello\?'
    // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
    // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

if (RegExp.escape === undefined) {
    RegExp.escape = function(str) { return preg_quote(str); }
}

String.prototype.kanalen = function() {
    const re = /[ぁ-んヴー、。「」・　]/;
    const len = this.split('').reduce((sum, ch) => sum + (re.test(ch) ? 1 : 0),
                                      0);
    return len;
}

function Codec(id, title, rules) {
    this.id = id;
    this.title = title;
    this.rules = rules;
    //
    this.hash = new Object();
    for (const rule of this.rules) {
        this.hash[rule[0]] = rule[1];
    }
    //
    this.rules.sort((a, b) => {
        asciilen = a[0].length - b[0].length;
        //
        // kanalen = b[1].length - a[1].length;
        kanalen = b[1].kanalen() - a[1].kanalen();
        //
        relen = (b[2] ?? '').length - (a[2] ?? '').length;
        return kanalen === 0 ? asciilen === 0 ? relen : asciilen : kanalen;
    });
    //
    pattern = this.rules.map((rule) => rule[0]).
        sort((a, b) => b.length - a.length).
        map((ascii) => RegExp.escape(ascii)).join("|");
    this.pattern = new RegExp('(.*?)(' + pattern + ')(.*)', 's');
    //
    this.rules2 = new Array();
    for (const rule of this.rules) {
        /*
        // XXX: これでは RGTs で のア とかに対応できない
        const rule2 = rule.map(s => s.katakana());
        this.rules2.push(rule, rule2);
        */
        // XXX: RGTs 用
        const ascii = rule[0];
        const hiragana = rule[1];
        const katakana = hiragana.katakana();
        let cond = rule[2];
        if (cond === undefined) {
            this.rules2.push([ascii, hiragana]);
            this.rules2.push([ascii, katakana]);
        } else {
            let m;
            if ((m = cond.match(/^\(\?\!(.+)\)$/)) !== null) {
                cond = "(?!" + m[1].split("|").map(s => {
                    let mo;
                    if ((mo = s.match(/^\[(.+)\]$/)) !== null) {
                        return "[" + mo[1] + mo[1].katakana() + "]";
                    } else {
                        return s + "|" + s.katakana();
                    }
                }).join("|") + ")";
            }
            this.rules2.push([ascii, hiragana, cond]);
            this.rules2.push([ascii, katakana, cond]);
        }
    }
    //
    this.pattern2 = this.rules2.map(r => [r[0], new RegExp("^(" + RegExp.escape(r[1]) + (r[2] ?? "") + ")(.*)")]);
    this.pattern2.push([null, /^(.)(.*)/]); // sentinel
    //
    return this;
}

Codec.prototype.encodesub = function(str) {
    for (const rule of this.rules) {
        const re = new RegExp(RegExp.escape(rule[1]) + (rule[2] ?? ""), "g");
        const code = rule[0];
        //
        // str = str.replace(re, code);
        // XXX:
        // ローマ字で っっっっか → kkkkka と encode するために while を使う
        // しかし あっっっっ → axtuxtuxtuxtu となってしまう
        // ここは あっっっっ → axxxxtu となってほしいのに
        while (re.test(str)) { str = str.replace(re, code); }
        //
    }
    return str;
    // return str.replace(/　/g, ' '); // XXX
}

Codec.prototype.encode = function(str) {
    // XXX:
    // ローマ字で あっっっっ → axxxxtu と encode するために 2 回変換する
    str = this.encodesub(this.encodesub(str));
    // return str;
    return str.replace(/　/g, ' '); // XXX
}

Codec.prototype.encode2sub = function(str) {
    let s = str;
    const ret = new Array();
    // XXX: ローマ字で連続する っ をうまく処理できないと思う
    while (s) {
        for (pat of this.pattern2) {
            let m;
            if ((m = s.match(pat[1])) !== null) {
                ret.push([m[1], pat[0] ?? m[1].hankaku()]);
                s = m[2];
                break;
            }
        }
    }
    return ret;
}

Codec.prototype.decode = function(str) {
    let a;
    while ((a = this.pattern.exec(str)) !== null) {
        const head = a[1];
        const ascii = a[2];
        const tail = a[3];
        str = head + this.hash[ascii] + tail;
    }
    // return str;
    return str.replace(/ /g, '　'); // XXX
}

const codecs = new Array();
