function laytest(codec, text) {
    const codec_id = codec.id;
    const codec_title = codec.title;
    const str = text.str;
    const encoded = codec.encode(str.hiragana()).replace(/[^ -~\n]/g, '〓');
    const decoded = codec.decode(encoded);
    const encode_count = encoded.remove_whites().count_chars();
    const shifts_count = encoded.count_shifts();
    const total_count = encode_count + shifts_count;
    //
    if (jisx4063_count === null) { jisx4063_count = total_count; }
    const text_count = str.remove_whites().count_chars();
    const hit_per_char = total_count / text_count;
    const reduced = 100 * (1 - total_count / jisx4063_count);
    const codec_check = decoded === str ? 'OK' : 'NG';
    return {
        codec_id: codec_id,
        codec_title: codec_title,
        encoded: encoded,
        encode_count: encode_count,
        shifts_count: shifts_count,
        total_count: total_count,
        hit_per_char: hit_per_char,
        reduced: reduced,
        codec_check: codec_check
    };
}

let jisx4063_count = null;

const cell_data = [
    ['方式', 'codec_title'],
    ['打鍵数', 'encode_count'],
    ['シフト', 'shifts_count'],
    ['総打数', 'total_count'],
    ['打/字', 'hit_per_char'],
    ['省力率', 'reduced'],
    ['検証', 'codec_check'],
];

function make_table(text, parent = document.body) {
    jisx4063_count = null;
    const table = document.createElement('table');
    const caption = document.createElement('caption');
    let span = document.createElement('span');
    span.textContent = "打鍵数 ";
    caption.appendChild(span);
    span = document.createElement('span');
    span.textContent = `${text.title} (${text.str.remove_whites().count_chars()} 文字)`;
    caption.appendChild(span);
    table.appendChild(caption);
    //
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    //
    const tr = document.createElement('tr');
    for (let j = 0; j < cell_data.length; j++) {
        const th = document.createElement('th');
        th.textContent = cell_data[j][0];
        tr.appendChild(th);
    }
    thead.appendChild(tr);
    table.appendChild(thead);
    //
    const laytestData = new Object();
    let laytest_data = null;
    for (let i = 0; i < codec.length; i++) {
        const tr = document.createElement('tr');
        laytest_data = laytest(codec[i], text);
        //
        const codecId = laytest_data['codec_id'];
        tr.dataset.codecId = codecId;
        laytestData[codecId] = laytest_data;
        tr.dataset.codecCheck = laytest_data['codec_check'];
        //
        tr.addEventListener("click", (event) => {
            const codecId = tr.dataset.codecId;
            let infoText = text.title;
            infoText += ` / ${laytestData[codecId]['codec_title']}`;
            infoText += ` (${laytestData[codecId]['total_count']} 打鍵)`;
            spanenc.textContent = infoText;
            textenc.value = laytestData[codecId]['encoded'];
            //
            showdesc(codecId);
        });
        for (let j = 0; j < cell_data.length; j++) {
            const td = document.createElement('td');
            const key = cell_data[j][1];
            let s = laytest_data[key];
            // - JavaScriptで小数点第n位までで四捨五入する方法
            // - https://zenn.dev/katoaki/articles/d9646053e3ff2f
            if (key === 'hit_per_char') { s = s.toFixed(2); }
            if (key === 'reduced') { s = s.toFixed(1) + '%'; }
            td.textContent = s;
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    parent.appendChild(table);
}

function showdesc(id) {
    const d = desc[id];
    if (!d) {
        hidedesc();
        return;
    }
    const title = d.title;
    divdesc.innerHTML = d.html;
    imgfig.alt = title;
    imgfig.title = title;
    imgfig.src = 'desc/' + d.fig;
}

function hidedesc() {
    divdesc.innerHTML = "";
    imgfig.alt = "QWERTY";
    imgfig.title = "QWERTY";
    imgfig.src = 'desc/' + 'kb-hhkb.svg';
}

function countchars() {
    spancounter.textContent = `${textsrc.value.remove_whites().length} 文字`;
}

function setbutton() {
    buttontest.disabled = textsrc.value.remove_whites() === "";
    buttonclear.disabled = textsrc.readOnly ||
        textsrc.value === "" && clearedtext === "";
}

let clearedtext = '';

window.addEventListener("load", (event) => {
    const selecttext = document.getElementById("selecttext");
    for (let t of text) {
        const option = document.createElement('option');
        option.value = t.id;
        option.text = t.title;
        selecttext.appendChild(option);
    }
    const option = document.createElement('option');
    option.value = "usertext";
    option.text = "ユーザー入力";
    selecttext.appendChild(option);
    //
    const textsrc = document.getElementById("textsrc");
    const spancounter = document.getElementById("spancounter");
    const divtable = document.getElementById("divtable");
    const buttonclear = document.getElementById("buttonclear");
    const buttontest = document.getElementById("buttontest");
    const spanenc = document.getElementById("spanenc");
    const textenc = document.getElementById("textenc");
    const divfig = document.getElementById("divfig");
    const divdesc = document.getElementById('divdesc');
    const imgfig = document.getElementById('imgfig');
    //
    buttontest.addEventListener("click", (event) => {
        const parent = divtable;
        // - [JavaScript]複数の子要素を削除する。 #dom - Qiita
        // - https://qiita.com/kiwaki/items/5995a38e6577dee12767
        // parent.innerHTML = '';
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
        //
        const index = selecttext.selectedIndex;
        if (index < text.length) {
            make_table(text[index], parent);
        } else {
            const str = textsrc.value;
            const t = new Text("usertext", "ユーザー入力", str);
            make_table(t, parent);
        }
        //
        spanenc.textContent = "";
        textenc.value = "";
        //
        hidedesc();
    });
    //
    buttonclear.addEventListener("click", (event) => {
        if (textsrc.value.remove_whites() !== "") {
            clearedtext = textsrc.value;
            textsrc.value = "";
            buttonclear.value = "復元";
        } else {
            textsrc.value = clearedtext;
            buttonclear.value = "消去";
        }
        setbutton();
        textsrc.focus();
        countchars();
    });
    //
    textsrc.addEventListener("input", (event) => {
        setbutton();
        buttonclear.value = textsrc.value === "" ? "復元" : "消去";
        countchars();
    });
    // - [Ctrl] + [Enter] to submit forms
    // - https://gist.github.com/KacperKozak/9736160
    textsrc.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            buttontest.click();
        }
    });

    selecttext.addEventListener("change", (event) => {
        const index = selecttext.selectedIndex;
        if (index < text.length) {
            textsrc.value = text[index].str;
            textsrc.readOnly = true;
            buttonclear.value = "消去";
        } else {
            textsrc.value = "";
            textsrc.readOnly = false;
            buttonclear.value = "復元";
            textsrc.focus();
        }
        setbutton();
        countchars();
    });

    // XXX: nfg-giovanni
    for (let option of selecttext.children) {
        if (option.value === "nfg-giovanni") {
            selecttext.selectedIndex = option.index;
            // - EventTarget: dispatchEvent() メソッド - Web API | MDN
            // - https://developer.mozilla.org/ja/docs/Web/API/EventTarget/dispatchEvent
            selecttext.dispatchEvent(new Event("change"));
        }
    }
    const s = textsrc.value;
    if (s && s.remove_whites() !== "") { buttontest.click(); }
});
