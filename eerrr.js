const nbsp = "\u00a0";
const divout_size = 10;

let current_codec = null;
let current_book = null;
let current_lesson = null;
let current_lesson_index = null;
let current_text = null;
let current_text_index = null;

const cookie_name = "eerrr";
const cookie = new Cookie(cookie_name);

let isprompt = false;

const lesson_typo = new Array();

let time = null;
let stall = null;
let stcor = null;
let sterr = null;
let stquest = null;
let lstime = null;
let lstimebeg = null;
let lstimeend = null;
let lsstall = null;
let lsstcor = null;
let lssterr = null;
let lsstquest = null;
let lschweak = new Array();

function make_help(s, code) {
    const spans = document.createElement("span");
    spans.classList.add("ch");
    spans.textContent = s;
    const spancode = document.createElement("span");
    spancode.classList.add("stroke");
    spancode.textContent = code;
    const span = document.createElement("span");
    span.classList.add("help");
    span.appendChild(spans);
    span.appendChild(spancode);
    return span;
}

function show_help(str = "") {  // XXX
    while (divhelp.firstChild) { divhelp.removeChild(divhelp.firstChild); }
    //
    const codec = current_codec;
    for (const a of codec.encode2sub(str)) {
        divhelp.appendChild(make_help(a[0], a[1]));
    }
    //
    // XXX
    if (!divhelp.firstChild) {
        divhelp.appendChild(make_help(" ", " "));
    }
}

function show_typo(a) {
    while (divhelp.firstChild) { divhelp.removeChild(divhelp.firstChild); }
    //
    for (const elm of a) {
        divhelp.appendChild(make_help(elm[0], elm[1]));
    }
    //
    // XXX
    if (!divhelp.firstChild) {
        divhelp.appendChild(make_help(" ", " "));
    }
}

function do_input_text(str, s) {
    lstimeend = (new Date()).getTime();
    lstime += lstimeend - lstimebeg;
    //
    const codec = current_codec;
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
    for (let i = 0; i < res.length; i++) {
        const a = res[i];
        if (a[0]) {
            e.push([a[1]]);
            // correct
            acorr.push(a[1]);
        } else {
            // typo
            e.push([a[2], "err"]);
            for (let j = 0; j < a[1].length; j++) {
                atypo.push(a[1][j]);
                aerr.push(a[1][j][0]);
            }
        }
    }
    //
    lschweak = lschweak.filter((ch) => !acorr.includes(ch));
    aerr.map((ch) => {
        if (!lschweak.includes(ch)) { lschweak.push(ch); }
    });
    //
    for (const typo of atypo) { lesson_typo.push(typo); }
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
    while (divout_size < divout.childElementCount) {
        divout.removeChild(divout.firstChild);
    }
}

function pute(elm, klass = []) {
    const div = document.createElement("div");
    //
    if (0 < klass.length) { div.classList.add(...klass); }
    //
    div.appendChild(elm);
    //
    const span = document.createElement("span");
    span.textContent = nbsp;
    div.appendChild(span);
    //
    divout.appendChild(div);
    //
    truncate();
}

function puts(str = "", klass = []) {
    const div = document.createElement("div");
    div.textContent = str;
    //
    div.textContent += nbsp;
    //
    if (0 < klass.length) { div.classList.add(...klass); }
    //
    divout.appendChild(div);
    //
    truncate();
}

function putm(str = "") {
    puts(str, ["message"]);
}

function clear() {
    while (divout.firstChild) { divout.removeChild(divout.firstChild); }
    //
    for (let i = 0; i < divout_size; i++) { puts(); }
    //
    truncate();
}

function do_reset() {
    time = 0;
    stall = 0;
    stcor = 0;
    sterr = 0;
    stquest = 0;
    //
    lesson_typo.length = 0;
    //
    lschweak.length = 0;
}

function do_lsreset() {
    lstime = 0;
    lsstall = 0;
    lsstcor = 0;
    lssterr = 0;
    lsstquest = 0;
    //
    lesson_typo.length = 0;
}

function make_span(a, klass = []) {
    const span = document.createElement("span");
    for (const e of a) {
        const str = e.shift();
        const s = document.createElement("span");
        s.textContent = str;
        if (0 < e.length) { s.classList.add(...e); }
        span.appendChild(s);
    }
    if (0 < klass.length) { span.classList.add(...klass); }
    return span;
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
    const textout = document.getElementById("textout");
    const textin = document.getElementById("textin");
    const divhelp = document.getElementById("divhelp");
    //
    cookie.read();
    //
    const cookie_codec = cookie.get("codec");
    const cookie_book = cookie.get("book");
    let cookie_lesson_index = cookie.get(`${cookie_codec}/${cookie_book}`);
    cookie_lesson_index = parseInt(cookie_lesson_index ?? 0);
    //
    selectcodec.addEventListener("change", (event) => {
        const index = selectcodec.selectedIndex;
        current_codec = codec[index];
        cookie.set("codec", current_codec.id);
        cookie.write();
        // XXX
        if (current_codec && current_book) {
            let index = cookie.get(`${current_codec.id}/${current_book.id}`);
            index = parseInt(index ?? 0);
            selectlesson.selectedIndex = index;
            selectlesson.dispatchEvent(new Event("change"));
        }
    });
    //
    selectbook.addEventListener("change", (event) => {
        const index = selectbook.selectedIndex;
        current_book = book[index];
        cookie.set("book", current_book.id);
        cookie.write();
        // XXX
        /*
        if (current_codec && current_book) {
            let index = cookie.get(`${current_codec.id}/${current_book.id}`);
            index = parseInt(index ?? 0);
            selectlesson.selectedIndex = index;
            selectlesson.dispatchEvent(new Event("change"));
        }
        */
    });
    //
    selectlesson.addEventListener("change", (event) => {
        const index = selectlesson.selectedIndex;
        current_lesson = current_book.lesson[index];
        current_lesson_index = index;
        current_text_index = null;
        current_text = null;
        //
        cookie.set(`${current_codec.id}/${current_book.id}`, index);
        cookie.write();
        //
        show_help(current_lesson.chars);
        //
        clear();
        const ls = current_book.lesson[selectlesson.selectedIndex];
        putm();
        putm(`${ls.name}. ${ls.text[0]}`);
        putm();
        // putm("Hit Return to start lesson");
        putm("リターンキーで開始");
        //
        textin.focus();
        //
        do_lsreset();
    });
    //
    for (const cd of codec) {
        const option = document.createElement("option");
        option.value = cd.id;
        option.text = cd.title;
        selectcodec.appendChild(option);
        if (cd.id === cookie_codec) { option.selected = true; }
    }
    selectcodec.dispatchEvent(new Event("change"));
    //
    for (const bk of book) {
        const option = document.createElement("option");
        option.value = bk.id;
        option.text = bk.title;
        selectbook.appendChild(option);
        if (bk.id === cookie_book) { option.selected = true; }
    }
    selectbook.dispatchEvent(new Event("change"));
    //
    let i = 0;
    for (const ls of current_book.lesson) {
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
    textin.addEventListener("keyup", (event) => {
        const input = textin.value;
        if (event.key === "Enter") {
            if (current_text === null) {
                clear();
                //
                show_help();    // XXX
            } else {
                do_result(do_input_text(current_text, input).res);
                puts();
            }
            textin.value = "";
            if (current_text_index === null) {
                current_text_index = 0;
                //
                // lesson_typo.length = 0;
                // do_reset();
            } else if (current_text_index < current_lesson.text.length - 1) {
                current_text_index += 1;
            } else {
                time += lstime;
                stall += lsstall;
                stcor += lsstcor;
                sterr += lssterr;
                stquest += lsstquest;
                do_score(lstime, lsstall, lsstcor, lssterr, lsstquest);
                //
                current_text_index = null;
                //
                if (0 < lesson_typo.length) {
                    // - 【JavaScript】配列の重複を取り除く
                    // - https://zenn.dev/nori_maki/articles/e5ed288991017d
                    const typo = lesson_typo.filter((element, index, self) => self.findIndex((e) => e[0] === element[0] && e[1] === element[1]) === index); // unique by typo char and strokes
                    show_typo(typo);
                    //
                    const e = typo.map((t) => [t[0], "err"]);
                    e.unshift(["[この課でまちがえた文字] "]);
                    pute(make_span(e), ["message"]);
                }
                //
                puts();
                // putm("Next/Again/Previous/Quit");
                putm("続けますか? 次へ(N)/もう一度(A)/前へ(P)/終了(Q)");
                isprompt = true;
            }
            //
            if (current_text_index !== null) {
                current_text = current_lesson.text[current_text_index];
                if (lschweak.length === 0) {
                    puts(current_text);
                } else {
                    const re = new RegExp("(" + lschweak.map((ch) => RegExp.escape(ch)).join("|") + ")");
                    // > もし separator が括弧 ( ) を含む正規表現であれば、一致した結果が配列に含められます。
                    const a = current_text.split(re).map((s) => re.test(s) ? [s, "weak"] : [s]);
                    pute(make_span(a));
                }
                //
                lstimebeg = (new Date()).getTime();
            } else {
                current_text = null;
            }
        } else if (isprompt && current_text_index === null) {
            const key = event.key.toLowerCase();
            if (key === "n" || key === " ") {
                current_lesson_index = (current_lesson_index + 1) % current_book.lesson.length;
                isprompt = false;
            } else if (key === "p") {
                current_lesson_index = (current_lesson_index + current_book.lesson.length - 1) % current_book.lesson.length;
                isprompt = false;
            } else if (key === "a") {
                // NOP
                isprompt = false;
            } else if (key === "q") {
                // isprompt = false;
                //
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
                //
                puts();
                // putm("Bye");
                putm("おつかれさまでした");
                textin.blur();
                //
                // lesson_typo.length = 0;
                do_reset();
            }
            textin.value = "";
            if (!isprompt) {
                selectlesson.selectedIndex = current_lesson_index;
                selectlesson.dispatchEvent(new Event("change"));
            }
        }
    });
    // textin.focus();
    //
    do_reset();
});
