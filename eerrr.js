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
    /*
    let code = codec.encode(str.hiragana().hankaku()); // XXX
    let m;
    while ((m = codec.pattern.exec(code)) !== null) {
        if (m[1] !== "") { divhelp.appendChild(make_help(m[1], m[1])); }
        divhelp.appendChild(make_help(codec.hash[m[2]], m[2]));
        code = m[3];
    }
    */
    for (let a of codec.encode2sub(str)) {
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
    for (let elm of a) {
        divhelp.appendChild(make_help(elm[0], elm[1]));
    }
    //
    // XXX
    if (!divhelp.firstChild) {
        divhelp.appendChild(make_help(" ", " "));
    }
}

function do_input_text(str, s) {
    const codec = current_codec;
    /*
    let code = codec.encode(str.hiragana().hankaku()); // XXX
    const r = new Array();
    let m;
    while ((m = codec.pattern.exec(code)) !== null) {
        let ch, st;
        if (m[1] !== "") { ch = m[1]; st = m[1]; }
        ch = codec.hash[m[2]]; st = m[2];
        code = m[3];
        r.push([ch, st]);
    }
    */
    const r = codec.encode2sub(str);
    //
    return lcs.match(r, s);
}

function do_result(res) {
    // let s = "";
    // let t = "";
    const span = document.createElement("span");
    span.classList.add("usr");
    // const acorr = new Array();
    const aerr = new Array();
    const atypo = new Array();
    for (let i = 0; i < res.length; i++) {
        const a = res[i];
        if (a[0]) {
            // correct
            // s += a[1];
            const s = document.createElement("span");
            s.textContent = a[1];
            span.appendChild(s);
            // acorr.push(a[1]);
        } else {
            // typo
            // s += a[2];
            const s = document.createElement("span");
            s.classList.add("err");
            s.textContent = a[2];
            span.appendChild(s);
            for (let j = 0; j < a[1].length; j++) {
                // t += a[1][j][0];
                // atypo.push([a[1][j][0], a[1][j][1]]);
                atypo.push(a[1][j]);
                // atypo.push(a[1][j][1]);
                aerr.push(a[1][j][0]);
            }
        }
    }
    //
    for (let typo of atypo) { lesson_typo.push(typo); }
    // divout.textContent += s;
    // show_help(t);
    show_typo(atypo);
    //
    // return s;
    // divout.appendChild(span);
    pute(span);
    // console.log(span);
    // console.log(span.innerHTML);
    // divout.innerHTML += span.innerHTML;
    // return span;
    if (0 < aerr.length) {
        const serr = aerr.map((ch) => {
            const s = document.createElement("span");
            s.classList.add("err");
            s.textContent = ch;
            return s;
        });
        const message = document.createElement("span");
        // message.textContent = "Typo ";
        message.textContent = "まちがえた文字 ";
        for (let s of serr) { message.appendChild(s); }
        pute(message, ["message"]);
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
    div.classList.add(...klass);
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
    div.classList.add(...klass);
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
        putm("Return キーで開始");
        //
        textin.focus();
    });
    //
    for (let cd of codec) {
        const option = document.createElement("option");
        option.value = cd.id;
        option.text = cd.title;
        selectcodec.appendChild(option);
        if (cd.id === cookie_codec) { option.selected = true; }
    }
    selectcodec.dispatchEvent(new Event("change"));
    //
    for (let bk of book) {
        const option = document.createElement("option");
        option.value = bk.id;
        option.text = bk.title;
        selectbook.appendChild(option);
        if (bk.id === cookie_book) { option.selected = true; }
    }
    selectbook.dispatchEvent(new Event("change"));
    //
    for (let ls of current_book.lesson) {
        const option = document.createElement("option");
        option.value = ls.id;
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
                lesson_typo.length = 0;
            } else if (current_text_index < current_lesson.text.length - 1) {
                current_text_index += 1;
            } else {
                current_text_index = null;
                // puts();
                //
                if (0 < lesson_typo.length) {
                    // - 【JavaScript】配列の重複を取り除く
                    // - https://zenn.dev/nori_maki/articles/e5ed288991017d
                    // const typo = lesson_typo.filter((element, index, self) => self.findIndex((e) => e[0] === element[0]) === index); // unique by typo char
                    const typo = lesson_typo.filter((element, index, self) => self.findIndex((e) => e[0] === element[0] && e[1] === element[1]) === index); // unique by typo char and strokes
                    show_typo(typo);
                    //
                    const serr = typo.map((t) => {
                        const s = document.createElement("span");
                        s.classList.add("err");
                        s.textContent = t[0];
                        return s;
                    });
                    const message = document.createElement("span");
                    // message.textContent = "Lesson typo ";
                    message.textContent = "この課でまちがえた文字 ";
                    for (let s of serr) { message.appendChild(s); }
                    pute(message, ["message"]);
                }
                //
                // putm("Next/Again/Previous/Quit");
                putm("続けますか? - 次へ(N)/もう一度(A)/前へ(P)/終了(Q)");
                isprompt = true;
            }
            //
            if (current_text_index !== null) {
                current_text = current_lesson.text[current_text_index];
                puts(current_text);
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
                // putm("Bye");
                putm("おつかれさまでした");
                textin.blur();
                //
                lesson_typo.length = 0;
            }
            textin.value = "";
            if (!isprompt) {
                selectlesson.selectedIndex = current_lesson_index;
                selectlesson.dispatchEvent(new Event("change"));
            }
        }
    });
    // textin.focus();
});
