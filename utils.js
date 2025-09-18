// - ひらがなをカタカナに一括変換する方法 - JavaScript TIPSふぁくとりー
// - https://www.nishishi.com/javascript-tips/regexp-katakana-hiragana.html
String.prototype.hiragana = function() {
    return this.replace(/[ァ-ン]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0x60);
    });
}

//
String.prototype.katakana = function() {
    return this.replace(/[ぁ-ん]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + 0x60);
    });
}
//

// - 【JavaScript】全角／半角変換メモ #初心者 - Qiita
// - https://qiita.com/ozackiee/items/0a78eeb6397c3e29d552
String.prototype.hankaku = function() {
    // ～ は 〜(WAVE DASH) ではなくて ～(FULLWIDTH TILDE)
    return this.replace(/[！-～]/g, function(s) { // ～: FULLWIDTH TILDE
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}

String.prototype.remove_whites = function() {
    return this.replace(/[　 \n]/g, '');
}

String.prototype.count_chars = function() {
    return this.length;
}

String.prototype.count_shifts = function() {
    return this.replace(/[^!@#$%^&*()_+|~{}:"A-Z<>?]/g, '').length;
}
