// - パンくずリストを生成するJavaScript - Haroperi.log
// - https://haroperi.hatenadiary.org/entry/20120625/1340602943

// usage:
// <div id="breadcrumb"></div>
// <script src="breadcrumb.js"></script>

const breadcrumb_data = {
    "laytest": {
        "name": "less is better",
        "laytest.html": { "name": "laytest" },
        "eerrr.html": { "name": "eerrr" },
    },
};

function make_breadcrumb() {
    let url = window.location.origin;
    const arr = window.location.pathname.substring(1).split("/");
    const obj = document.getElementById("breadcrumb");
    while (obj.firstChild) { obj.removeChild(obj.firstChild); }
    for (let i = 0, current_node = breadcrumb_data;
         i < arr.length && (current_node = current_node[arr[i]]);
         i++) {
        if (!current_node["name"]) { continue; }
        if (0 < i) {
            const span = document.createElement("span");
            span.classList.add("path-separator");
            span.textContent = " > ";
            obj.appendChild(span);
        }
        url += "/" + arr[i];
        const span = document.createElement("span");
        span.classList.add("path-component");
        if (i == arr.length - 1) {
            span.textContent = current_node["name"];
        } else {
            const a = document.createElement("a");
            a.textContent = current_node["name"];
            a.href = url;
            span.appendChild(a);
        }
        obj.appendChild(span);
    }
}
window.addEventListener("load", (event) => { make_breadcrumb(); });
