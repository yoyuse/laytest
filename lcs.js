// LCS

// MAXI : max Japanese chars
// MAXJ : max strokes
// MAXM : max matched Japanese chars

function LCS() {
    this.MAXI = 80;
    this.MAXJ = 160;
    this.MAXM = 80;
    // XXX ???

    // match table
    this.mt = new Array(this.MAXJ + 1);
    for (let j = 0; j <= this.MAXJ; j++) {
        this.mt[j] = new Array(this.MAXI + 1);
        for (let i = 0; i <= this.MAXI; i++) {
            this.mt[j][i] = new Object(); // {m:0, j:null, i:null};
        }
    }

    // match data
    this.md = new Array(this.MAXM + 1);
    for (let n = 0; n <= this.MAXM; n++) {
        this.md[n] = new Object();  // {len:0, j:null, i:null};
    }

    this.res = null;
    // [ [true, 'の', 'kd'], [false, [['が', ';s'], ['、', 'jd']], 'js;d'] ]

    this.stall = null;
    this.sterr = null;
    this.stcor = null;
    ///<errorrate>
    this.stquest = null;

    return this;
}

// do match
// - r : [['の', 'kd'], ['、', 'jd'], ['が', ';s'], ...]
// - s : 'kdjs;d...' (user input)
LCS.prototype.match = function(r, s) {
    const sa = s.split('');
    this.stall = s.length;
    ///<errorrate>
    this.stquest = 0;

    const ra_j = new Array();
    const ra   = new Array();
    for (let i = 0; i < r.length; i++) {
        ra_j.push(r[i][0]);
        ra.push(r[i][1]);
        ///<errorrate>
        this.stquest += r[i][1].length;
    }

    const maxj = Math.min(sa.length, this.MAXJ);
    const maxi = Math.min(ra.length, this.MAXI);

    // init match table
    for (let j = 0; j <= maxj; j++) {
        for (let i = 0; i <= maxi; i++) {
            this.mt[j][i].m = 0;
        }
    }

    // make match table
    let m;
    for (let j = 0; j < maxj; j++) {
        for (let i = 0; i < maxi; i++) {
            const relm = ra[i], len = relm.length;

            if (((j + len) <= maxj) && (relm == s.substr(j, len))) {
                // matched
                for (let dj = 0; dj < len; dj++) {
                    this.mt[j + dj + 1][i + 1].m =
                        Math.max(this.mt[j + dj + 1][i + 1].m,
                                 Math.max(this.mt[j + dj + 1][i].m,
                                          this.mt[j + dj][i + 1].m));
                }
                m = this.mt[j][i].m + len;
                if (this.mt[j + len][i + 1].m < m) {
                    this.mt[j + len][i + 1].m = m;
                    this.mt[j + len][i + 1].j = j;
                    this.mt[j + len][i + 1].i = i;
                }

            } else {
                // NOT matched
                this.mt[j + 1][i + 1].m =
                    Math.max(this.mt[j + 1][i + 1].m,
                             Math.max(this.mt[j + 1][i].m,
                                      this.mt[j][i + 1].m));
            }
        } // i
    } // j

    // go backward and make match data
    let nmatch = 0, i, j;
    this.md[nmatch].j = maxj;
    this.md[nmatch].i = maxi;
    this.md[nmatch].len = 0;
    for (nmatch = 1, j = maxj, i = maxi, m = this.mt[j][i].m;
         0 < m;
         nmatch += 1) {
        while (0 < i && this.mt[j][i - 1].m == m) { i -= 1; }
        while (0 < j && this.mt[j - 1][i].m == m) { j -= 1; }
        const prevj = this.mt[j][i].j;
        const previ = this.mt[j][i].i;
        this.md[nmatch].j = prevj;
        this.md[nmatch].i = previ;
        this.md[nmatch].len = ra[previ].length;
        j = prevj; i = previ;
        m = this.mt[j][i].m;
    }

    // result
    this.res = new Array();
    this.typo = new Array();
    this.sterr = 0;
    this.stcor = 0;
    this.err = '';

    j = 0, i = 0;
    for (let n = nmatch - 1; 0 <= n; n--) {
        const len = this.md[n].len;
        const nextj = this.md[n].j;
        const nexti = this.md[n].i;

        const erri = [];
        let errj = '';
        let errp = false;

        if (i < nexti) {
            errp = true;
            while (i < nexti) {
                erri.push([ra_j[i], ra[i]]);
                this.sterr += ra[i].length;
                i++;
            }
        }
        i++;

        if (j < nextj) {
            errp = true;
            while (j < nextj) {
                errj += sa[j];
                this.sterr += 1;
                j++;
            }
        }

        if (errp) {
            this.res.push([false, erri, errj]);
        }

        if (0 < len) {
            this.res.push([true, ra_j[nexti], ra[nexti]]);
            this.stcor += ra[nexti].length;
        }
        j += len;
    }

    return this;
    // {res:res, stall:stall, sterr:sterr, stcor:stcor}
}

const lcs = new LCS();
