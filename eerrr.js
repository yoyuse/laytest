const nbsp = "\u00a0";
const stdout_size = 10;
let stdin = null;
let stdout = null;
let stdhelp = null;

let codec = null;
let book = null;
let lesson = null;
let lesson_index = null;
let text = null;
let text_index = null;

const cookie_name = "eerrr";
const cookie = new Cookie(cookie_name);

let prompting = false;

let time = null;                // total time
let stall = null;               // strokes all
let stcor = null;               // strokes correct
let sterr = null;               // strokes error
let stquest = null;             // strokes question
let lstime = null;              // lesson time
let lstimebeg = null;           // lesson time begin
let lstimeend = null;           // lesson time end
let lsstall = null;             // lesson strokes all
let lsstcor = null;             // lesson strokes corrrect
let lssterr = null;             // lesson strokes error
let lsstquest = null;           // lesson strokes question
let lschweak = new Array();     // lesson chars weak
const lschtypo = new Array();   // lesson chars typo

function make_span(a, classList = []) {
    const span = document.createElement("span");
    for (const e of a) {
        const str = e.shift();
        const s = document.createElement("span");
        s.textContent = str;
        if (0 < e.length) { s.classList.add(...e); }
        span.appendChild(s);
    }
    if (0 < classList.length) { span.classList.add(...classList); }
    return span;
}

function make_help(ch, st) {
    return make_span([[ch, "ch"], [st, "stroke"]], ["help"]);
}

function show_help(str = "") {
    // clear help
    while (stdhelp.firstChild) { stdhelp.removeChild(stdhelp.firstChild); }
    //
    for (const a of codec.encode2sub(str)) {
        stdhelp.appendChild(make_help(a[0], a[1]));
    }
    //
    // empty help
    if (!stdhelp.firstChild) { stdhelp.appendChild(make_help(nbsp, nbsp)); }
}

function show_typo(a) {
    // clear help
    while (stdhelp.firstChild) { stdhelp.removeChild(stdhelp.firstChild); }
    //
    for (const elm of a) {
        stdhelp.appendChild(make_help(elm[0], elm[1]));
    }
    //
    // empty help
    if (!stdhelp.firstChild) { stdhelp.appendChild(make_help(nbsp, nbsp)); }
}

function do_input_text(str, s) {
    lstimeend = (new Date()).getTime();
    lstime += lstimeend - lstimebeg;
    //
    const r = codec.encode2sub(str);
    //
    const m = lcs.match(r, s);
    lsstall += m.stall;
    lsstcor += m.stcor;
    lssterr += m.sterr;
    lsstquest += m.stquest;
    //
    return m;
}

function do_result(res) {
    const e = new Array();
    const acorr = new Array();
    const aerr = new Array();
    const atypo = new Array();
    for (const a of res) {
        if (a[0]) {
            // correct
            e.push([a[1]]);
            acorr.push(a[1]);
        } else {
            // typo
            e.push([a[2], "err"]);
            for (const a1 of a[1]) {
                atypo.push(a1);
                aerr.push(a1[0]);
            }
        }
    }
    //
    lschweak = lschweak.filter((ch) => !acorr.includes(ch));
    aerr.forEach((ch) => {
        if (!lschweak.includes(ch)) { lschweak.push(ch); }
    });
    //
    for (const typo of atypo) { lschtypo.push(typo); }
    show_typo(atypo);
    //
    pute(make_span(e, ["usr"]));
    //
    if (0 < aerr.length) {
        const e = aerr.map((ch) => [ch, "err"]);
        e.unshift(["[まちがえた文字] "]);
        pute(make_span(e), ["message"]);
    }
}

function truncate() {
    while (stdout_size < stdout.childElementCount) {
        stdout.removeChild(stdout.firstChild);
    }
}

function pute(elm, classList = []) {
    const div = document.createElement("div");
    if (0 < classList.length) { div.classList.add(...classList); }
    div.appendChild(elm);
    //
    const span = document.createElement("span");
    span.textContent = nbsp;
    div.appendChild(span);
    //
    stdout.appendChild(div);
    truncate();
}

function puts(str = "", classList = []) {
    const div = document.createElement("div");
    div.textContent = str;
    div.textContent += nbsp;
    //
    if (0 < classList.length) { div.classList.add(...classList); }
    //
    stdout.appendChild(div);
    truncate();
}

function putm(str = "") {
    puts(str, ["message"]);
}

function clear() {
    while (stdout.firstChild) { stdout.removeChild(stdout.firstChild); }
    for (let i = 0; i < stdout_size; i++) { puts(); }
    truncate();
}

function do_reset() {
    time = 0;
    stall = 0;
    stcor = 0;
    sterr = 0;
    stquest = 0;
    lschweak.length = 0;
    lschtypo.length = 0;
}

function do_lsreset() {
    lstime = 0;
    lsstall = 0;
    lsstcor = 0;
    lssterr = 0;
    lsstquest = 0;
    lschtypo.length = 0;
}

function do_score(ms, nraw, stcor, sterr, stquest) {
    pute(make_span([["[総打鍵成績] 毎打鍵 "],
                    [Math.floor(ms / nraw), "usr"],
                    [" ミリ秒、毎分 "],
                    [Math.floor(nraw / ms * 60000), "usr"],
                    [" 打鍵"]]),
         ["message"]);
    pute(make_span([["[実打鍵成績] 毎打鍵 "],
                    [Math.floor(ms / stcor), "usr"],
                    [" ミリ秒、毎分 "],
                    [Math.floor(stcor / ms * 60000), "usr"],
                    [" 打鍵"]]),
         ["message"]);
    pute(make_span([["エラーレート "],
                    [Math.floor(sterr / stquest * 1000) / 10, "err"],
                    [" %"]]),
         ["message"]);
}

window.addEventListener("load", (event) => {
    const selectcodec = document.getElementById("selectcodec");
    const selectbook = document.getElementById("selectbook");
    const selectlesson = document.getElementById("selectlesson");
    stdout = document.getElementById("stdout");
    stdin = document.getElementById("stdin");
    stdhelp = document.getElementById("stdhelp");
    //
    cookie.read();
    //
    const cookie_codec = cookie.get("codec");
    const cookie_book = cookie.get("book");
    const cookie_lesson_index = parseInt(cookie.get(`${cookie_codec}/${cookie_book}`) ?? 0);
    //
    selectcodec.addEventListener("change", (event) => {
        const index = selectcodec.selectedIndex;
        codec = codecs[index];
        cookie.set("codec", codec.id);
        cookie.write();
        // XXX
        if (codec && book) {
            const index = parseInt(cookie.get(`${codec.id}/${book.id}`) ?? 0);
            selectlesson.selectedIndex = index;
            selectlesson.dispatchEvent(new Event("change"));
        }
    });
    //
    selectbook.addEventListener("change", (event) => {
        const index = selectbook.selectedIndex;
        book = books[index];
        cookie.set("book", book.id);
        cookie.write();
        // XXX
        /*
        if (codec && book) {
            const index = parseInt(cookie.get(`${codec.id}/${book.id}`) ?? 0);
            selectlesson.selectedIndex = index;
            selectlesson.dispatchEvent(new Event("change"));
        }
        */
    });
    //
    selectlesson.addEventListener("change", (event) => {
        const index = selectlesson.selectedIndex;
        lesson = book.lessons[index];
        lesson_index = index;
        text_index = null;
        text = null;
        //
        cookie.set(`${codec.id}/${book.id}`, index);
        cookie.write();
        //
        show_help(lesson.chars);
        clear();
        const ls = book.lessons[selectlesson.selectedIndex];
        putm();
        putm(`${ls.name}. ${ls.text[0]}`);
        putm();
        putm("リターンキーで開始");
        //
        stdin.focus();
        do_lsreset();
    });
    //
    for (const cd of codecs) {
        const option = document.createElement("option");
        option.value = cd.id;
        option.text = cd.title;
        selectcodec.appendChild(option);
        if (cd.id === cookie_codec) { option.selected = true; }
    }
    selectcodec.dispatchEvent(new Event("change"));
    //
    for (const bk of books) {
        const option = document.createElement("option");
        option.value = bk.id;
        option.text = bk.title;
        selectbook.appendChild(option);
        if (bk.id === cookie_book) { option.selected = true; }
    }
    selectbook.dispatchEvent(new Event("change"));
    //
    let i = 0;
    for (const ls of book.lessons) {
        const option = document.createElement("option");
        option.value = i; i += 1;
        option.text = `${ls.name}. ${ls.text[0]}`;
        selectlesson.appendChild(option);
    }
    //
    if (selectlesson.options[cookie_lesson_index]) {
        selectlesson.options[cookie_lesson_index].selected = true;
    }
    //
    selectlesson.dispatchEvent(new Event("change"));
    //
    stdin.addEventListener("keyup", (event) => {
        const input = stdin.value;
        if (event.key === "Enter") {
            if (text === null) {
                clear();
                show_help();
            } else {
                do_result(do_input_text(text, input).res);
                puts();
            }
            stdin.value = "";
            if (text_index === null) {
                text_index = 0;
            } else if (text_index < lesson.text.length - 1) {
                text_index += 1;
            } else {
                time += lstime;
                stall += lsstall;
                stcor += lsstcor;
                sterr += lssterr;
                stquest += lsstquest;
                do_score(lstime, lsstall, lsstcor, lssterr, lsstquest);
                //
                text_index = null;
                //
                if (0 < lschtypo.length) {
                    // - 【JavaScript】配列の重複を取り除く
                    // - https://zenn.dev/nori_maki/articles/e5ed288991017d
                    const typo = lschtypo.filter((element, index, self) => self.findIndex((e) => e[0] === element[0] && e[1] === element[1]) === index); // unique by typo char and strokes
                    show_typo(typo);
                    //
                    const e = typo.map((t) => [t[0], "err"]);
                    e.unshift(["[この課でまちがえた文字] "]);
                    pute(make_span(e), ["message"]);
                }
                //
                puts();
                putm("続けますか? 次へ(N)/もう一度(A)/前へ(P)/終了(Q)");
                prompting = true;
            }
            //
            if (text_index !== null) {
                text = lesson.text[text_index];
                if (lschweak.length === 0) {
                    puts(text);
                } else {
                    const re = new RegExp("(" + lschweak.map((ch) => RegExp.escape(ch)).join("|") + ")");
                    // > もし separator が括弧 ( ) を含む正規表現であれば、一致した結果が配列に含められます。
                    const a = text.split(re).map((s) => re.test(s) ? [s, "weak"] : [s]);
                    pute(make_span(a));
                }
                //
                lstimebeg = (new Date()).getTime();
            } else {
                text = null;
            }
        } else if (prompting && text_index === null) {
            switch (event.key.toLowerCase()) {
            case "n":
            case " ":
                lesson_index = (lesson_index + 1) % book.lessons.length;
                prompting = false;
                break;
            case "p":
                lesson_index = (lesson_index + book.lessons.length - 1) % book.lessons.length;
                prompting = false;
                break;
            case "a":
                prompting = false;
                break;
            case "q":
                // prompting = false;
                puts();
                putm();
                putm("総合成績");
                putm();
                //
                do_score(time, stall, stcor, sterr, stquest);
                //
                pute(make_span([["入力打鍵数 "],
                                [stall, "usr"],
                                [" 打鍵、所要時間 "],
                                [Math.ceil(time / 1000), "usr"],
                                [" 秒"]]),
                    ["message"]);
                puts();
                putm("おつかれさまでした");
                stdin.blur();
                //
                do_reset();
                show_help();
                break;
            default:
                break;
            }
            stdin.value = "";
            if (!prompting) {
                selectlesson.selectedIndex = lesson_index;
                selectlesson.dispatchEvent(new Event("change"));
            }
        }
    });
    //
    do_reset();
});
