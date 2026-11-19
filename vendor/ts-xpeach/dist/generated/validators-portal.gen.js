/** 构建时Ajv2020分域standalone独立产物；无运行时编译器。 */
var mt = (r, s) => () => { try {
    return s || r((s = { exports: {} }).exports, s), s.exports;
}
catch (v) {
    throw s = 0, v;
} };
var Kt = mt($r => {
    "use strict";
    Object.defineProperty($r, "__esModule", { value: !0 });
    $r.formatNames = $r.fastFormats = $r.fullFormats = void 0;
    function Ir(r, s) { return { validate: r, compare: s }; }
    $r.fullFormats = { date: Ir(zt, qt), time: Ir(bt(!0), jt), "date-time": Ir(Ot(!0), Nt), "iso-time": Ir(bt(), Vt), "iso-date-time": Ir(Ot(), Ct), duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/, uri: hs, "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i, "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i, url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu, email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i, ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/, ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i, regex: ws, uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i, "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/, "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i, "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/, byte: _s, int32: { type: "number", validate: ks }, int64: { type: "number", validate: gs }, float: { type: "number", validate: St }, double: { type: "number", validate: St }, password: !0, binary: !0 };
    $r.fastFormats = { ...$r.fullFormats, date: Ir(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, qt), time: Ir(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, jt), "date-time": Ir(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, Nt), "iso-time": Ir(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, Vt), "iso-date-time": Ir(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, Ct), uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i, "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i, email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i };
    $r.formatNames = Object.keys($r.fullFormats);
    function fs(r) { return r % 4 === 0 && (r % 100 !== 0 || r % 400 === 0); }
    var ys = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, us = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function zt(r) { let s = ys.exec(r); if (!s)
        return !1; let v = +s[1], P = +s[2], y = +s[3]; return P >= 1 && P <= 12 && y >= 1 && y <= (P === 2 && fs(v) ? 29 : us[P]); }
    function qt(r, s) { if (r && s)
        return r > s ? 1 : r < s ? -1 : 0; }
    var gt = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function bt(r) { return function (v) { let P = gt.exec(v); if (!P)
        return !1; let y = +P[1], c = +P[2], i = +P[3], e = P[4], n = P[5] === "-" ? -1 : 1, a = +(P[6] || 0), p = +(P[7] || 0); if (a > 23 || p > 59 || r && !e)
        return !1; if (y <= 23 && c <= 59 && i < 60)
        return !0; let d = c - p * n, t = y - a * n - (d < 0 ? 1 : 0); return (t === 23 || t === -1) && (d === 59 || d === -1) && i < 61; }; }
    function jt(r, s) { if (!(r && s))
        return; let v = new Date("2020-01-01T" + r).valueOf(), P = new Date("2020-01-01T" + s).valueOf(); if (v && P)
        return v - P; }
    function Vt(r, s) { if (!(r && s))
        return; let v = gt.exec(r), P = gt.exec(s); if (v && P)
        return r = v[1] + v[2] + v[3], s = P[1] + P[2] + P[3], r > s ? 1 : r < s ? -1 : 0; }
    var wt = /t|\s/i;
    function Ot(r) { let s = bt(r); return function (P) { let y = P.split(wt); return y.length === 2 && zt(y[0]) && s(y[1]); }; }
    function Nt(r, s) { if (!(r && s))
        return; let v = new Date(r).valueOf(), P = new Date(s).valueOf(); if (v && P)
        return v - P; }
    function Ct(r, s) { if (!(r && s))
        return; let [v, P] = r.split(wt), [y, c] = s.split(wt), i = qt(v, y); if (i !== void 0)
        return i || jt(P, c); }
    var cs = /\/|:/, ms = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function hs(r) { return cs.test(r) && ms.test(r); }
    var Lt = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function _s(r) { return Lt.lastIndex = 0, Lt.test(r); }
    var Ps = -(2 ** 31), vs = 2 ** 31 - 1;
    function ks(r) { return Number.isInteger(r) && r <= vs && r >= Ps; }
    function gs(r) { return Number.isInteger(r); }
    function St() { return !0; }
    var bs = /[^\\]\\Z/;
    function ws(r) { if (bs.test(r))
        return !1; try {
        return new RegExp(r), !0;
    }
    catch {
        return !1;
    } }
});
var Ft = mt(At => {
    "use strict";
    Object.defineProperty(At, "__esModule", { value: !0 });
    function Rt(r) { let s = r.length, v = 0, P = 0, y; for (; P < s;)
        v++, y = r.charCodeAt(P++), y >= 55296 && y <= 56319 && P < s && (y = r.charCodeAt(P), (y & 64512) === 56320 && P++); return v; }
    At.default = Rt;
    Rt.code = 'require("ajv/dist/runtime/ucs2length").default';
});
var Zt = mt((hi, Tt) => {
    "use strict";
    Tt.exports = function r(s, v) { if (s === v)
        return !0; if (s && v && typeof s == "object" && typeof v == "object") {
        if (s.constructor !== v.constructor)
            return !1;
        var P, y, c;
        if (Array.isArray(s)) {
            if (P = s.length, P != v.length)
                return !1;
            for (y = P; y-- !== 0;)
                if (!r(s[y], v[y]))
                    return !1;
            return !0;
        }
        if (s.constructor === RegExp)
            return s.source === v.source && s.flags === v.flags;
        if (s.valueOf !== Object.prototype.valueOf)
            return s.valueOf() === v.valueOf();
        if (s.toString !== Object.prototype.toString)
            return s.toString() === v.toString();
        if (c = Object.keys(s), P = c.length, P !== Object.keys(v).length)
            return !1;
        for (y = P; y-- !== 0;)
            if (!Object.prototype.hasOwnProperty.call(v, c[y]))
                return !1;
        for (y = P; y-- !== 0;) {
            var i = c[y];
            if (!r(s[i], v[i]))
                return !1;
        }
        return !0;
    } return s !== s && v !== v; };
});
var Xt = mt(Dt => {
    "use strict";
    Object.defineProperty(Dt, "__esModule", { value: !0 });
    var Mt = Zt();
    Mt.code = 'require("ajv/dist/runtime/equal").default';
    Dt.default = Mt;
});
var It = { ...Kt().fullFormats, uint64: { type: "number", validate: Number.isInteger }, uint32: { type: "number", validate: Number.isInteger } }, xr = xe;
function xe(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = xe.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return xe.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return xe.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return xe.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return xe.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return xe.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return xe.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return xe.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return xe.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return xe.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return xe.errors = i, e === 0; }
xe.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var qs = Ge;
function Me(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Me.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.provider === void 0 && (a = "provider"))
            return Me.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        {
            let p = e;
            for (let d in r)
                if (d !== "provider") {
                    return Me.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: d } }], !1;
                    break;
                }
            if (p === e && r.provider !== void 0 && typeof r.provider != "string")
                return Me.errors = [{ instancePath: s + "/provider", schemaPath: "#/properties/provider/type", keyword: "type", params: { type: "string" } }], !1;
        }
    }
    else
        return Me.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Me.errors = i, e === 0; }
Me.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function Ge(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ge.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return Ge.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return Ge.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = e;
                    Me(r.pathParams, { instancePath: s + "/pathParams", parentData: r, parentDataProperty: "pathParams", rootData: y, dynamicAnchors: c }) || (i = i === null ? Me.errors : i.concat(Me.errors), e = i.length);
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return Ge.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return Ge.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return Ge.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return Ge.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return Ge.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ge.errors = i, e === 0; }
Ge.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var js = I, As = { type: "object", additionalProperties: !1, required: ["user_id", "record_id", "quota_granted", "journal_id", "wallet", "entitlements", "idempotent_replay"], properties: { user_id: { type: "string" }, record_id: { type: "string" }, quota_granted: { $ref: "#/components/schemas/PosQuota" }, journal_id: { type: "string" }, wallet: { type: "object", additionalProperties: !1, required: ["status", "quota", "journal_id"], properties: { status: { type: "string", const: "credited" }, quota: { $ref: "#/components/schemas/PosQuota" }, journal_id: { type: "string" } } }, entitlements: { $ref: "#/components/schemas/CdkClosureEntitlements" }, idempotent_replay: { type: "boolean" }, code_id: { type: "string" }, code: { type: "string" }, name: { type: "string" }, site_code: { type: "string" }, peach_granted: { type: "string" }, credited_quota: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, repaid_overdraft_quota: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, added_available_quota: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, inviter_rebate_quota: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, grant_group: { anyOf: [{ type: "string" }, { type: "null" }] }, grant_title: { anyOf: [{ type: "string" }, { type: "null" }] }, entitlement_grant_id: { anyOf: [{ type: "string" }, { type: "null" }] }, inviter_user_id: { anyOf: [{ type: "string" }, { type: "null" }] }, rebate_journal_id: { anyOf: [{ type: "string" }, { type: "null" }] }, used_count: { type: "integer", minimum: 0 }, max_uses: { type: "integer", minimum: 0 }, epoch: { type: "integer", minimum: 0 }, replayed: { type: "boolean" } } }, es = Object.prototype.hasOwnProperty;
var Ds = new RegExp("^[1-9][0-9]{0,18}$", "u"), xs = new RegExp("^(?!-0$)(?:(?:[0-9]{1,18}|9223372036854775807|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6])|-(?:[0-9]{1,18}|9223372036854775808|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-7]))$", "u");
function Xe(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Xe.evaluated; n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0); let a = e; if (e === a)
    if (typeof r == "string") {
        if (!Ds.test(r))
            return Xe.errors = [{ instancePath: s, schemaPath: "#/allOf/0/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]{0,18}$" } }], !1;
    }
    else
        return Xe.errors = [{ instancePath: s, schemaPath: "#/allOf/0/type", keyword: "type", params: { type: "string" } }], !1; var p = a === e; if (p) {
    let d = e;
    if (e === d)
        if (typeof r == "string") {
            if (!xs.test(r))
                return Xe.errors = [{ instancePath: s, schemaPath: "#/allOf/1/pattern", keyword: "pattern", params: { pattern: "^(?!-0$)(?:(?:[0-9]{1,18}|9223372036854775807|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6])|-(?:[0-9]{1,18}|9223372036854775808|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-7]))$" } }], !1;
        }
        else
            return Xe.errors = [{ instancePath: s, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "string" } }], !1;
    var p = d === e;
} return Xe.errors = i, e === 0; }
Xe.evaluated = { dynamicProps: !1, dynamicItems: !1 };
var ot = new RegExp("^[1-9][0-9]*$", "u");
function z(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = z.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.value === void 0 && (p = "value") || r.version === void 0 && (p = "version") || r.record_id === void 0 && (p = "record_id") || r.status === void 0 && (p = "status"))
            return z.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "value" || t === "version" || t === "record_id" || t === "status")) {
                    return z.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.value !== void 0) {
                    let t = e;
                    if (typeof r.value != "string")
                        return z.errors = [{ instancePath: s + "/value", schemaPath: "#/properties/value/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.version !== void 0) {
                        let t = r.version, o = e;
                        if (e === o)
                            if (typeof t == "string") {
                                if (!ot.test(t))
                                    return z.errors = [{ instancePath: s + "/version", schemaPath: "#/properties/version/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]*$" } }], !1;
                            }
                            else
                                return z.errors = [{ instancePath: s + "/version", schemaPath: "#/properties/version/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.record_id !== void 0) {
                            let t = e;
                            if (typeof r.record_id != "string")
                                return z.errors = [{ instancePath: s + "/record_id", schemaPath: "#/properties/record_id/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.status !== void 0) {
                                let t = r.status, o = e;
                                if (typeof t != "string")
                                    return z.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                if (t !== "delivered")
                                    return z.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/const", keyword: "const", params: { allowedValue: "delivered" } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return z.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return z.errors = i, e === 0; }
z.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ht = { type: "object", additionalProperties: !1, required: ["id", "target_key", "kind", "status", "error_code"], properties: { id: { type: "string" }, target_key: { type: "string" }, kind: { type: "string", enum: ["group", "title"] }, status: { type: "string", enum: ["queued", "delivering", "dispatch_unknown", "observed", "blocked", "failed", "superseded"] }, error_code: { anyOf: [{ type: "string" }, { type: "null" }] } } };
function H(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = H.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.id === void 0 && (d = "id") || r.target_key === void 0 && (d = "target_key") || r.kind === void 0 && (d = "kind") || r.status === void 0 && (d = "status") || r.error_code === void 0 && (d = "error_code"))
            return H.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = e;
            for (let o in r)
                if (!(o === "id" || o === "target_key" || o === "kind" || o === "status" || o === "error_code")) {
                    return H.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (t === e) {
                if (r.id !== void 0) {
                    let o = e;
                    if (typeof r.id != "string")
                        return H.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.target_key !== void 0) {
                        let o = e;
                        if (typeof r.target_key != "string")
                            return H.errors = [{ instancePath: s + "/target_key", schemaPath: "#/properties/target_key/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.kind !== void 0) {
                            let o = r.kind, l = e;
                            if (typeof o != "string")
                                return H.errors = [{ instancePath: s + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" } }], !1;
                            if (!(o === "group" || o === "title"))
                                return H.errors = [{ instancePath: s + "/kind", schemaPath: "#/properties/kind/enum", keyword: "enum", params: { allowedValues: Ht.properties.kind.enum } }], !1;
                            var a = l === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.status !== void 0) {
                                let o = r.status, l = e;
                                if (typeof o != "string")
                                    return H.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                if (!(o === "queued" || o === "delivering" || o === "dispatch_unknown" || o === "observed" || o === "blocked" || o === "failed" || o === "superseded"))
                                    return H.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: Ht.properties.status.enum } }], !1;
                                var a = l === e;
                            }
                            else
                                var a = !0;
                            if (a)
                                if (r.error_code !== void 0) {
                                    let o = r.error_code, l = e, f = e, m = !1, _ = e;
                                    if (typeof o != "string") {
                                        let b = { instancePath: s + "/error_code", schemaPath: "#/properties/error_code/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                        i === null ? i = [b] : i.push(b), e++;
                                    }
                                    var p = _ === e;
                                    m = m || p;
                                    let u = e;
                                    if (o !== null) {
                                        let b = { instancePath: s + "/error_code", schemaPath: "#/properties/error_code/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                        i === null ? i = [b] : i.push(b), e++;
                                    }
                                    var p = u === e;
                                    if (m = m || p, m)
                                        e = f, i !== null && (f ? i.length = f : i = null);
                                    else {
                                        let b = { instancePath: s + "/error_code", schemaPath: "#/properties/error_code/anyOf", keyword: "anyOf", params: {} };
                                        return i === null ? i = [b] : i.push(b), e++, H.errors = i, !1;
                                    }
                                    var a = l === e;
                                }
                                else
                                    var a = !0;
                        }
                    }
                }
            }
        }
    }
    else
        return H.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return H.errors = i, e === 0; }
H.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function Ce(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ce.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let o;
        if (r.user_id === void 0 && (o = "user_id") || r.group === void 0 && (o = "group") || r.title === void 0 && (o = "title") || r.remote_effects === void 0 && (o = "remote_effects"))
            return Ce.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: o } }], !1;
        {
            let l = e;
            for (let f in r)
                if (!(f === "user_id" || f === "group" || f === "title" || f === "remote_effects")) {
                    return Ce.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                    break;
                }
            if (l === e) {
                if (r.user_id !== void 0) {
                    let f = e;
                    if (typeof r.user_id != "string")
                        return Ce.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = f === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.group !== void 0) {
                        let f = r.group, m = e, _ = e, u = !1, k = e;
                        z(f, { instancePath: s + "/group", parentData: r, parentDataProperty: "group", rootData: y, dynamicAnchors: c }) || (i = i === null ? z.errors : i.concat(z.errors), e = i.length);
                        var p = k === e;
                        u = u || p;
                        let b = e;
                        if (f !== null) {
                            let w = { instancePath: s + "/group", schemaPath: "#/properties/group/anyOf/1/type", keyword: "type", params: { type: "null" } };
                            i === null ? i = [w] : i.push(w), e++;
                        }
                        var p = b === e;
                        if (u = u || p, u)
                            e = _, i !== null && (_ ? i.length = _ : i = null);
                        else {
                            let w = { instancePath: s + "/group", schemaPath: "#/properties/group/anyOf", keyword: "anyOf", params: {} };
                            return i === null ? i = [w] : i.push(w), e++, Ce.errors = i, !1;
                        }
                        var a = m === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.title !== void 0) {
                            let f = r.title, m = e, _ = e, u = !1, k = e;
                            z(f, { instancePath: s + "/title", parentData: r, parentDataProperty: "title", rootData: y, dynamicAnchors: c }) || (i = i === null ? z.errors : i.concat(z.errors), e = i.length);
                            var d = k === e;
                            u = u || d;
                            let b = e;
                            if (f !== null) {
                                let w = { instancePath: s + "/title", schemaPath: "#/properties/title/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                i === null ? i = [w] : i.push(w), e++;
                            }
                            var d = b === e;
                            if (u = u || d, u)
                                e = _, i !== null && (_ ? i.length = _ : i = null);
                            else {
                                let w = { instancePath: s + "/title", schemaPath: "#/properties/title/anyOf", keyword: "anyOf", params: {} };
                                return i === null ? i = [w] : i.push(w), e++, Ce.errors = i, !1;
                            }
                            var a = m === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.remote_effects !== void 0) {
                                let f = r.remote_effects, m = e;
                                if (e === m)
                                    if (Array.isArray(f)) {
                                        var t = !0;
                                        let u = f.length;
                                        for (let k = 0; k < u; k++) {
                                            let b = e;
                                            H(f[k], { instancePath: s + "/remote_effects/" + k, parentData: f, parentDataProperty: k, rootData: y, dynamicAnchors: c }) || (i = i === null ? H.errors : i.concat(H.errors), e = i.length);
                                            var t = b === e;
                                            if (!t)
                                                break;
                                        }
                                    }
                                    else
                                        return Ce.errors = [{ instancePath: s + "/remote_effects", schemaPath: "#/properties/remote_effects/type", keyword: "type", params: { type: "array" } }], !1;
                                var a = m === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return Ce.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ce.errors = i, e === 0; }
Ce.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ht = new RegExp("^(0|[1-9][0-9]*)$", "u");
function I(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = I.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let m;
        if (r.user_id === void 0 && (m = "user_id") || r.record_id === void 0 && (m = "record_id") || r.quota_granted === void 0 && (m = "quota_granted") || r.journal_id === void 0 && (m = "journal_id") || r.wallet === void 0 && (m = "wallet") || r.entitlements === void 0 && (m = "entitlements") || r.idempotent_replay === void 0 && (m = "idempotent_replay"))
            return I.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: m } }], !1;
        {
            let _ = e;
            for (let u in r)
                if (!es.call(As.properties, u)) {
                    return I.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: u } }], !1;
                    break;
                }
            if (_ === e) {
                if (r.user_id !== void 0) {
                    let u = e;
                    if (typeof r.user_id != "string")
                        return I.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = u === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.record_id !== void 0) {
                        let u = e;
                        if (typeof r.record_id != "string")
                            return I.errors = [{ instancePath: s + "/record_id", schemaPath: "#/properties/record_id/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = u === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.quota_granted !== void 0) {
                            let u = e;
                            Xe(r.quota_granted, { instancePath: s + "/quota_granted", parentData: r, parentDataProperty: "quota_granted", rootData: y, dynamicAnchors: c }) || (i = i === null ? Xe.errors : i.concat(Xe.errors), e = i.length);
                            var a = u === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.journal_id !== void 0) {
                                let u = e;
                                if (typeof r.journal_id != "string")
                                    return I.errors = [{ instancePath: s + "/journal_id", schemaPath: "#/properties/journal_id/type", keyword: "type", params: { type: "string" } }], !1;
                                var a = u === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.wallet !== void 0) {
                                    let u = r.wallet, k = e;
                                    if (e === k)
                                        if (u && typeof u == "object" && !Array.isArray(u)) {
                                            let g;
                                            if (u.status === void 0 && (g = "status") || u.quota === void 0 && (g = "quota") || u.journal_id === void 0 && (g = "journal_id"))
                                                return I.errors = [{ instancePath: s + "/wallet", schemaPath: "#/properties/wallet/required", keyword: "required", params: { missingProperty: g } }], !1;
                                            {
                                                let w = e;
                                                for (let O in u)
                                                    if (!(O === "status" || O === "quota" || O === "journal_id")) {
                                                        return I.errors = [{ instancePath: s + "/wallet", schemaPath: "#/properties/wallet/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: O } }], !1;
                                                        break;
                                                    }
                                                if (w === e) {
                                                    if (u.status !== void 0) {
                                                        let O = u.status, q = e;
                                                        if (typeof O != "string")
                                                            return I.errors = [{ instancePath: s + "/wallet/status", schemaPath: "#/properties/wallet/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                                        if (O !== "credited")
                                                            return I.errors = [{ instancePath: s + "/wallet/status", schemaPath: "#/properties/wallet/properties/status/const", keyword: "const", params: { allowedValue: "credited" } }], !1;
                                                        var p = q === e;
                                                    }
                                                    else
                                                        var p = !0;
                                                    if (p) {
                                                        if (u.quota !== void 0) {
                                                            let O = e;
                                                            Xe(u.quota, { instancePath: s + "/wallet/quota", parentData: u, parentDataProperty: "quota", rootData: y, dynamicAnchors: c }) || (i = i === null ? Xe.errors : i.concat(Xe.errors), e = i.length);
                                                            var p = O === e;
                                                        }
                                                        else
                                                            var p = !0;
                                                        if (p)
                                                            if (u.journal_id !== void 0) {
                                                                let O = e;
                                                                if (typeof u.journal_id != "string")
                                                                    return I.errors = [{ instancePath: s + "/wallet/journal_id", schemaPath: "#/properties/wallet/properties/journal_id/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var p = O === e;
                                                            }
                                                            else
                                                                var p = !0;
                                                    }
                                                }
                                            }
                                        }
                                        else
                                            return I.errors = [{ instancePath: s + "/wallet", schemaPath: "#/properties/wallet/type", keyword: "type", params: { type: "object" } }], !1;
                                    var a = k === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.entitlements !== void 0) {
                                        let u = e;
                                        Ce(r.entitlements, { instancePath: s + "/entitlements", parentData: r, parentDataProperty: "entitlements", rootData: y, dynamicAnchors: c }) || (i = i === null ? Ce.errors : i.concat(Ce.errors), e = i.length);
                                        var a = u === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a) {
                                        if (r.idempotent_replay !== void 0) {
                                            let u = e;
                                            if (typeof r.idempotent_replay != "boolean")
                                                return I.errors = [{ instancePath: s + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
                                            var a = u === e;
                                        }
                                        else
                                            var a = !0;
                                        if (a) {
                                            if (r.code_id !== void 0) {
                                                let u = e;
                                                if (typeof r.code_id != "string")
                                                    return I.errors = [{ instancePath: s + "/code_id", schemaPath: "#/properties/code_id/type", keyword: "type", params: { type: "string" } }], !1;
                                                var a = u === e;
                                            }
                                            else
                                                var a = !0;
                                            if (a) {
                                                if (r.code !== void 0) {
                                                    let u = e;
                                                    if (typeof r.code != "string")
                                                        return I.errors = [{ instancePath: s + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                                                    var a = u === e;
                                                }
                                                else
                                                    var a = !0;
                                                if (a) {
                                                    if (r.name !== void 0) {
                                                        let u = e;
                                                        if (typeof r.name != "string")
                                                            return I.errors = [{ instancePath: s + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" } }], !1;
                                                        var a = u === e;
                                                    }
                                                    else
                                                        var a = !0;
                                                    if (a) {
                                                        if (r.site_code !== void 0) {
                                                            let u = e;
                                                            if (typeof r.site_code != "string")
                                                                return I.errors = [{ instancePath: s + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                            var a = u === e;
                                                        }
                                                        else
                                                            var a = !0;
                                                        if (a) {
                                                            if (r.peach_granted !== void 0) {
                                                                let u = e;
                                                                if (typeof r.peach_granted != "string")
                                                                    return I.errors = [{ instancePath: s + "/peach_granted", schemaPath: "#/properties/peach_granted/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var a = u === e;
                                                            }
                                                            else
                                                                var a = !0;
                                                            if (a) {
                                                                if (r.credited_quota !== void 0) {
                                                                    let u = r.credited_quota, k = e;
                                                                    if (e === k)
                                                                        if (typeof u == "string") {
                                                                            if (!ht.test(u))
                                                                                return I.errors = [{ instancePath: s + "/credited_quota", schemaPath: "#/properties/credited_quota/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                                                        }
                                                                        else
                                                                            return I.errors = [{ instancePath: s + "/credited_quota", schemaPath: "#/properties/credited_quota/type", keyword: "type", params: { type: "string" } }], !1;
                                                                    var a = k === e;
                                                                }
                                                                else
                                                                    var a = !0;
                                                                if (a) {
                                                                    if (r.repaid_overdraft_quota !== void 0) {
                                                                        let u = r.repaid_overdraft_quota, k = e;
                                                                        if (e === k)
                                                                            if (typeof u == "string") {
                                                                                if (!ht.test(u))
                                                                                    return I.errors = [{ instancePath: s + "/repaid_overdraft_quota", schemaPath: "#/properties/repaid_overdraft_quota/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                                                            }
                                                                            else
                                                                                return I.errors = [{ instancePath: s + "/repaid_overdraft_quota", schemaPath: "#/properties/repaid_overdraft_quota/type", keyword: "type", params: { type: "string" } }], !1;
                                                                        var a = k === e;
                                                                    }
                                                                    else
                                                                        var a = !0;
                                                                    if (a) {
                                                                        if (r.added_available_quota !== void 0) {
                                                                            let u = r.added_available_quota, k = e;
                                                                            if (e === k)
                                                                                if (typeof u == "string") {
                                                                                    if (!ht.test(u))
                                                                                        return I.errors = [{ instancePath: s + "/added_available_quota", schemaPath: "#/properties/added_available_quota/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                                                                }
                                                                                else
                                                                                    return I.errors = [{ instancePath: s + "/added_available_quota", schemaPath: "#/properties/added_available_quota/type", keyword: "type", params: { type: "string" } }], !1;
                                                                            var a = k === e;
                                                                        }
                                                                        else
                                                                            var a = !0;
                                                                        if (a) {
                                                                            if (r.inviter_rebate_quota !== void 0) {
                                                                                let u = r.inviter_rebate_quota, k = e;
                                                                                if (e === k)
                                                                                    if (typeof u == "string") {
                                                                                        if (!ht.test(u))
                                                                                            return I.errors = [{ instancePath: s + "/inviter_rebate_quota", schemaPath: "#/properties/inviter_rebate_quota/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                                                                    }
                                                                                    else
                                                                                        return I.errors = [{ instancePath: s + "/inviter_rebate_quota", schemaPath: "#/properties/inviter_rebate_quota/type", keyword: "type", params: { type: "string" } }], !1;
                                                                                var a = k === e;
                                                                            }
                                                                            else
                                                                                var a = !0;
                                                                            if (a) {
                                                                                if (r.grant_group !== void 0) {
                                                                                    let u = r.grant_group, k = e, b = e, g = !1, w = e;
                                                                                    if (typeof u != "string") {
                                                                                        let A = { instancePath: s + "/grant_group", schemaPath: "#/properties/grant_group/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                                                        i === null ? i = [A] : i.push(A), e++;
                                                                                    }
                                                                                    var d = w === e;
                                                                                    g = g || d;
                                                                                    let O = e;
                                                                                    if (u !== null) {
                                                                                        let A = { instancePath: s + "/grant_group", schemaPath: "#/properties/grant_group/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                                                        i === null ? i = [A] : i.push(A), e++;
                                                                                    }
                                                                                    var d = O === e;
                                                                                    if (g = g || d, g)
                                                                                        e = b, i !== null && (b ? i.length = b : i = null);
                                                                                    else {
                                                                                        let A = { instancePath: s + "/grant_group", schemaPath: "#/properties/grant_group/anyOf", keyword: "anyOf", params: {} };
                                                                                        return i === null ? i = [A] : i.push(A), e++, I.errors = i, !1;
                                                                                    }
                                                                                    var a = k === e;
                                                                                }
                                                                                else
                                                                                    var a = !0;
                                                                                if (a) {
                                                                                    if (r.grant_title !== void 0) {
                                                                                        let u = r.grant_title, k = e, b = e, g = !1, w = e;
                                                                                        if (typeof u != "string") {
                                                                                            let A = { instancePath: s + "/grant_title", schemaPath: "#/properties/grant_title/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                                                            i === null ? i = [A] : i.push(A), e++;
                                                                                        }
                                                                                        var t = w === e;
                                                                                        g = g || t;
                                                                                        let O = e;
                                                                                        if (u !== null) {
                                                                                            let A = { instancePath: s + "/grant_title", schemaPath: "#/properties/grant_title/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                                                            i === null ? i = [A] : i.push(A), e++;
                                                                                        }
                                                                                        var t = O === e;
                                                                                        if (g = g || t, g)
                                                                                            e = b, i !== null && (b ? i.length = b : i = null);
                                                                                        else {
                                                                                            let A = { instancePath: s + "/grant_title", schemaPath: "#/properties/grant_title/anyOf", keyword: "anyOf", params: {} };
                                                                                            return i === null ? i = [A] : i.push(A), e++, I.errors = i, !1;
                                                                                        }
                                                                                        var a = k === e;
                                                                                    }
                                                                                    else
                                                                                        var a = !0;
                                                                                    if (a) {
                                                                                        if (r.entitlement_grant_id !== void 0) {
                                                                                            let u = r.entitlement_grant_id, k = e, b = e, g = !1, w = e;
                                                                                            if (typeof u != "string") {
                                                                                                let A = { instancePath: s + "/entitlement_grant_id", schemaPath: "#/properties/entitlement_grant_id/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                                                                i === null ? i = [A] : i.push(A), e++;
                                                                                            }
                                                                                            var o = w === e;
                                                                                            g = g || o;
                                                                                            let O = e;
                                                                                            if (u !== null) {
                                                                                                let A = { instancePath: s + "/entitlement_grant_id", schemaPath: "#/properties/entitlement_grant_id/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                                                                i === null ? i = [A] : i.push(A), e++;
                                                                                            }
                                                                                            var o = O === e;
                                                                                            if (g = g || o, g)
                                                                                                e = b, i !== null && (b ? i.length = b : i = null);
                                                                                            else {
                                                                                                let A = { instancePath: s + "/entitlement_grant_id", schemaPath: "#/properties/entitlement_grant_id/anyOf", keyword: "anyOf", params: {} };
                                                                                                return i === null ? i = [A] : i.push(A), e++, I.errors = i, !1;
                                                                                            }
                                                                                            var a = k === e;
                                                                                        }
                                                                                        else
                                                                                            var a = !0;
                                                                                        if (a) {
                                                                                            if (r.inviter_user_id !== void 0) {
                                                                                                let u = r.inviter_user_id, k = e, b = e, g = !1, w = e;
                                                                                                if (typeof u != "string") {
                                                                                                    let A = { instancePath: s + "/inviter_user_id", schemaPath: "#/properties/inviter_user_id/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                                                                    i === null ? i = [A] : i.push(A), e++;
                                                                                                }
                                                                                                var l = w === e;
                                                                                                g = g || l;
                                                                                                let O = e;
                                                                                                if (u !== null) {
                                                                                                    let A = { instancePath: s + "/inviter_user_id", schemaPath: "#/properties/inviter_user_id/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                                                                    i === null ? i = [A] : i.push(A), e++;
                                                                                                }
                                                                                                var l = O === e;
                                                                                                if (g = g || l, g)
                                                                                                    e = b, i !== null && (b ? i.length = b : i = null);
                                                                                                else {
                                                                                                    let A = { instancePath: s + "/inviter_user_id", schemaPath: "#/properties/inviter_user_id/anyOf", keyword: "anyOf", params: {} };
                                                                                                    return i === null ? i = [A] : i.push(A), e++, I.errors = i, !1;
                                                                                                }
                                                                                                var a = k === e;
                                                                                            }
                                                                                            else
                                                                                                var a = !0;
                                                                                            if (a) {
                                                                                                if (r.rebate_journal_id !== void 0) {
                                                                                                    let u = r.rebate_journal_id, k = e, b = e, g = !1, w = e;
                                                                                                    if (typeof u != "string") {
                                                                                                        let A = { instancePath: s + "/rebate_journal_id", schemaPath: "#/properties/rebate_journal_id/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                                                                        i === null ? i = [A] : i.push(A), e++;
                                                                                                    }
                                                                                                    var f = w === e;
                                                                                                    g = g || f;
                                                                                                    let O = e;
                                                                                                    if (u !== null) {
                                                                                                        let A = { instancePath: s + "/rebate_journal_id", schemaPath: "#/properties/rebate_journal_id/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                                                                        i === null ? i = [A] : i.push(A), e++;
                                                                                                    }
                                                                                                    var f = O === e;
                                                                                                    if (g = g || f, g)
                                                                                                        e = b, i !== null && (b ? i.length = b : i = null);
                                                                                                    else {
                                                                                                        let A = { instancePath: s + "/rebate_journal_id", schemaPath: "#/properties/rebate_journal_id/anyOf", keyword: "anyOf", params: {} };
                                                                                                        return i === null ? i = [A] : i.push(A), e++, I.errors = i, !1;
                                                                                                    }
                                                                                                    var a = k === e;
                                                                                                }
                                                                                                else
                                                                                                    var a = !0;
                                                                                                if (a) {
                                                                                                    if (r.used_count !== void 0) {
                                                                                                        let u = r.used_count, k = e;
                                                                                                        if (!(typeof u == "number" && !(u % 1) && !isNaN(u) && isFinite(u)))
                                                                                                            return I.errors = [{ instancePath: s + "/used_count", schemaPath: "#/properties/used_count/type", keyword: "type", params: { type: "integer" } }], !1;
                                                                                                        if (e === k && typeof u == "number" && isFinite(u) && (u < 0 || isNaN(u)))
                                                                                                            return I.errors = [{ instancePath: s + "/used_count", schemaPath: "#/properties/used_count/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                                                                                        var a = k === e;
                                                                                                    }
                                                                                                    else
                                                                                                        var a = !0;
                                                                                                    if (a) {
                                                                                                        if (r.max_uses !== void 0) {
                                                                                                            let u = r.max_uses, k = e;
                                                                                                            if (!(typeof u == "number" && !(u % 1) && !isNaN(u) && isFinite(u)))
                                                                                                                return I.errors = [{ instancePath: s + "/max_uses", schemaPath: "#/properties/max_uses/type", keyword: "type", params: { type: "integer" } }], !1;
                                                                                                            if (e === k && typeof u == "number" && isFinite(u) && (u < 0 || isNaN(u)))
                                                                                                                return I.errors = [{ instancePath: s + "/max_uses", schemaPath: "#/properties/max_uses/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                                                                                            var a = k === e;
                                                                                                        }
                                                                                                        else
                                                                                                            var a = !0;
                                                                                                        if (a) {
                                                                                                            if (r.epoch !== void 0) {
                                                                                                                let u = r.epoch, k = e;
                                                                                                                if (!(typeof u == "number" && !(u % 1) && !isNaN(u) && isFinite(u)))
                                                                                                                    return I.errors = [{ instancePath: s + "/epoch", schemaPath: "#/properties/epoch/type", keyword: "type", params: { type: "integer" } }], !1;
                                                                                                                if (e === k && typeof u == "number" && isFinite(u) && (u < 0 || isNaN(u)))
                                                                                                                    return I.errors = [{ instancePath: s + "/epoch", schemaPath: "#/properties/epoch/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                                                                                                var a = k === e;
                                                                                                            }
                                                                                                            else
                                                                                                                var a = !0;
                                                                                                            if (a)
                                                                                                                if (r.replayed !== void 0) {
                                                                                                                    let u = e;
                                                                                                                    if (typeof r.replayed != "boolean")
                                                                                                                        return I.errors = [{ instancePath: s + "/replayed", schemaPath: "#/properties/replayed/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                                                                                    var a = u === e;
                                                                                                                }
                                                                                                                else
                                                                                                                    var a = !0;
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return I.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return I.errors = i, e === 0; }
I.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Is = E, Yt = { type: "object", additionalProperties: !1, required: ["actor", "scopes", "release_epoch", "platform_admin", "admin_mfa_required", "user_id"], properties: { actor: { type: "string", const: "user", enum: ["user"] }, scopes: { type: "array", items: { type: "string" } }, release_epoch: { type: "string" }, platform_admin: { type: "boolean" }, admin_mfa_required: { type: "boolean" }, user_id: { type: "string" }, site_code: { type: "string" }, issuer: { type: "string" }, spend_auth_jti: { type: "string" }, username: { type: "string" }, preferred_username: { type: "string" }, email: { type: "string" }, display_name: { type: "string" }, avatar_url: { type: "string" }, aff_code: { type: "string" }, status: { type: "string" }, tenant_id: { type: "string", format: "uuid" }, auth_freshness_seconds: { type: "integer", format: "int64", minimum: 0, maximum: 9223372036854776e3 }, email_verified: { type: "boolean" }, has_totp: { type: "boolean" }, mfa_enabled: { type: "boolean" } } }, ut = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i, $s = It.int64;
function E(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = E.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.actor === void 0 && (d = "actor") || r.scopes === void 0 && (d = "scopes") || r.release_epoch === void 0 && (d = "release_epoch") || r.platform_admin === void 0 && (d = "platform_admin") || r.admin_mfa_required === void 0 && (d = "admin_mfa_required") || r.user_id === void 0 && (d = "user_id"))
            return E.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = e;
            for (let o in r)
                if (!es.call(Yt.properties, o)) {
                    return E.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (t === e) {
                if (r.actor !== void 0) {
                    let o = r.actor, l = e;
                    if (typeof o != "string")
                        return E.errors = [{ instancePath: s + "/actor", schemaPath: "#/properties/actor/type", keyword: "type", params: { type: "string" } }], !1;
                    if (o !== "user")
                        return E.errors = [{ instancePath: s + "/actor", schemaPath: "#/properties/actor/const", keyword: "const", params: { allowedValue: "user" } }], !1;
                    if (o !== "user")
                        return E.errors = [{ instancePath: s + "/actor", schemaPath: "#/properties/actor/enum", keyword: "enum", params: { allowedValues: Yt.properties.actor.enum } }], !1;
                    var a = l === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.scopes !== void 0) {
                        let o = r.scopes, l = e;
                        if (e === l)
                            if (Array.isArray(o)) {
                                var p = !0;
                                let m = o.length;
                                for (let _ = 0; _ < m; _++) {
                                    let u = e;
                                    if (typeof o[_] != "string")
                                        return E.errors = [{ instancePath: s + "/scopes/" + _, schemaPath: "#/properties/scopes/items/type", keyword: "type", params: { type: "string" } }], !1;
                                    var p = u === e;
                                    if (!p)
                                        break;
                                }
                            }
                            else
                                return E.errors = [{ instancePath: s + "/scopes", schemaPath: "#/properties/scopes/type", keyword: "type", params: { type: "array" } }], !1;
                        var a = l === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.release_epoch !== void 0) {
                            let o = e;
                            if (typeof r.release_epoch != "string")
                                return E.errors = [{ instancePath: s + "/release_epoch", schemaPath: "#/properties/release_epoch/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.platform_admin !== void 0) {
                                let o = e;
                                if (typeof r.platform_admin != "boolean")
                                    return E.errors = [{ instancePath: s + "/platform_admin", schemaPath: "#/properties/platform_admin/type", keyword: "type", params: { type: "boolean" } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.admin_mfa_required !== void 0) {
                                    let o = e;
                                    if (typeof r.admin_mfa_required != "boolean")
                                        return E.errors = [{ instancePath: s + "/admin_mfa_required", schemaPath: "#/properties/admin_mfa_required/type", keyword: "type", params: { type: "boolean" } }], !1;
                                    var a = o === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.user_id !== void 0) {
                                        let o = e;
                                        if (typeof r.user_id != "string")
                                            return E.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                                        var a = o === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a) {
                                        if (r.site_code !== void 0) {
                                            let o = e;
                                            if (typeof r.site_code != "string")
                                                return E.errors = [{ instancePath: s + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                                            var a = o === e;
                                        }
                                        else
                                            var a = !0;
                                        if (a) {
                                            if (r.issuer !== void 0) {
                                                let o = e;
                                                if (typeof r.issuer != "string")
                                                    return E.errors = [{ instancePath: s + "/issuer", schemaPath: "#/properties/issuer/type", keyword: "type", params: { type: "string" } }], !1;
                                                var a = o === e;
                                            }
                                            else
                                                var a = !0;
                                            if (a) {
                                                if (r.spend_auth_jti !== void 0) {
                                                    let o = e;
                                                    if (typeof r.spend_auth_jti != "string")
                                                        return E.errors = [{ instancePath: s + "/spend_auth_jti", schemaPath: "#/properties/spend_auth_jti/type", keyword: "type", params: { type: "string" } }], !1;
                                                    var a = o === e;
                                                }
                                                else
                                                    var a = !0;
                                                if (a) {
                                                    if (r.username !== void 0) {
                                                        let o = e;
                                                        if (typeof r.username != "string")
                                                            return E.errors = [{ instancePath: s + "/username", schemaPath: "#/properties/username/type", keyword: "type", params: { type: "string" } }], !1;
                                                        var a = o === e;
                                                    }
                                                    else
                                                        var a = !0;
                                                    if (a) {
                                                        if (r.preferred_username !== void 0) {
                                                            let o = e;
                                                            if (typeof r.preferred_username != "string")
                                                                return E.errors = [{ instancePath: s + "/preferred_username", schemaPath: "#/properties/preferred_username/type", keyword: "type", params: { type: "string" } }], !1;
                                                            var a = o === e;
                                                        }
                                                        else
                                                            var a = !0;
                                                        if (a) {
                                                            if (r.email !== void 0) {
                                                                let o = e;
                                                                if (typeof r.email != "string")
                                                                    return E.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var a = o === e;
                                                            }
                                                            else
                                                                var a = !0;
                                                            if (a) {
                                                                if (r.display_name !== void 0) {
                                                                    let o = e;
                                                                    if (typeof r.display_name != "string")
                                                                        return E.errors = [{ instancePath: s + "/display_name", schemaPath: "#/properties/display_name/type", keyword: "type", params: { type: "string" } }], !1;
                                                                    var a = o === e;
                                                                }
                                                                else
                                                                    var a = !0;
                                                                if (a) {
                                                                    if (r.avatar_url !== void 0) {
                                                                        let o = e;
                                                                        if (typeof r.avatar_url != "string")
                                                                            return E.errors = [{ instancePath: s + "/avatar_url", schemaPath: "#/properties/avatar_url/type", keyword: "type", params: { type: "string" } }], !1;
                                                                        var a = o === e;
                                                                    }
                                                                    else
                                                                        var a = !0;
                                                                    if (a) {
                                                                        if (r.aff_code !== void 0) {
                                                                            let o = e;
                                                                            if (typeof r.aff_code != "string")
                                                                                return E.errors = [{ instancePath: s + "/aff_code", schemaPath: "#/properties/aff_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                                            var a = o === e;
                                                                        }
                                                                        else
                                                                            var a = !0;
                                                                        if (a) {
                                                                            if (r.status !== void 0) {
                                                                                let o = e;
                                                                                if (typeof r.status != "string")
                                                                                    return E.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                                                                var a = o === e;
                                                                            }
                                                                            else
                                                                                var a = !0;
                                                                            if (a) {
                                                                                if (r.tenant_id !== void 0) {
                                                                                    let o = r.tenant_id, l = e;
                                                                                    if (e === l && e === l)
                                                                                        if (typeof o == "string") {
                                                                                            if (!ut.test(o))
                                                                                                return E.errors = [{ instancePath: s + "/tenant_id", schemaPath: "#/properties/tenant_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                                                                                        }
                                                                                        else
                                                                                            return E.errors = [{ instancePath: s + "/tenant_id", schemaPath: "#/properties/tenant_id/type", keyword: "type", params: { type: "string" } }], !1;
                                                                                    var a = l === e;
                                                                                }
                                                                                else
                                                                                    var a = !0;
                                                                                if (a) {
                                                                                    if (r.auth_freshness_seconds !== void 0) {
                                                                                        let o = r.auth_freshness_seconds, l = e;
                                                                                        if (!(typeof o == "number" && !(o % 1) && !isNaN(o) && isFinite(o)))
                                                                                            return E.errors = [{ instancePath: s + "/auth_freshness_seconds", schemaPath: "#/properties/auth_freshness_seconds/type", keyword: "type", params: { type: "integer" } }], !1;
                                                                                        if (e === l && typeof o == "number" && isFinite(o)) {
                                                                                            if (o > 9223372036854776e3 || isNaN(o))
                                                                                                return E.errors = [{ instancePath: s + "/auth_freshness_seconds", schemaPath: "#/properties/auth_freshness_seconds/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9223372036854776e3 } }], !1;
                                                                                            if (o < 0 || isNaN(o))
                                                                                                return E.errors = [{ instancePath: s + "/auth_freshness_seconds", schemaPath: "#/properties/auth_freshness_seconds/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                                                                            if (!$s.validate(o))
                                                                                                return E.errors = [{ instancePath: s + "/auth_freshness_seconds", schemaPath: "#/properties/auth_freshness_seconds/format", keyword: "format", params: { format: "int64" } }], !1;
                                                                                        }
                                                                                        var a = l === e;
                                                                                    }
                                                                                    else
                                                                                        var a = !0;
                                                                                    if (a) {
                                                                                        if (r.email_verified !== void 0) {
                                                                                            let o = e;
                                                                                            if (typeof r.email_verified != "boolean")
                                                                                                return E.errors = [{ instancePath: s + "/email_verified", schemaPath: "#/properties/email_verified/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                                                            var a = o === e;
                                                                                        }
                                                                                        else
                                                                                            var a = !0;
                                                                                        if (a) {
                                                                                            if (r.has_totp !== void 0) {
                                                                                                let o = e;
                                                                                                if (typeof r.has_totp != "boolean")
                                                                                                    return E.errors = [{ instancePath: s + "/has_totp", schemaPath: "#/properties/has_totp/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                                                                var a = o === e;
                                                                                            }
                                                                                            else
                                                                                                var a = !0;
                                                                                            if (a)
                                                                                                if (r.mfa_enabled !== void 0) {
                                                                                                    let o = e;
                                                                                                    if (typeof r.mfa_enabled != "boolean")
                                                                                                        return E.errors = [{ instancePath: s + "/mfa_enabled", schemaPath: "#/properties/mfa_enabled/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                                                                    var a = o === e;
                                                                                                }
                                                                                                else
                                                                                                    var a = !0;
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return E.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return E.errors = i, e === 0; }
E.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Es = V;
var $ = Ft().default;
function V(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = V.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.pathParams === void 0 && (d = "pathParams") || r.query === void 0 && (d = "query") || r.headers === void 0 && (d = "headers") || r.body === void 0 && (d = "body"))
            return V.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = e;
            for (let o in r)
                if (!(o === "pathParams" || o === "query" || o === "headers" || o === "body")) {
                    return V.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (t === e) {
                if (r.pathParams !== void 0) {
                    let o = r.pathParams, l = e;
                    if (e === l)
                        if (o && typeof o == "object" && !Array.isArray(o))
                            for (let f in o) {
                                return V.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return V.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = l === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let o = r.query, l = e;
                        if (e === l)
                            if (o && typeof o == "object" && !Array.isArray(o))
                                for (let m in o) {
                                    return V.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                    break;
                                }
                            else
                                return V.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = l === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let o = r.headers, l = e;
                            if (e === l)
                                if (o && typeof o == "object" && !Array.isArray(o)) {
                                    let m;
                                    if (o["x-csrf-token"] === void 0 && (m = "x-csrf-token"))
                                        return V.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/required", keyword: "required", params: { missingProperty: m } }], !1;
                                    {
                                        let _ = e;
                                        for (let u in o)
                                            if (u !== "x-csrf-token") {
                                                return V.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: u } }], !1;
                                                break;
                                            }
                                        if (_ === e && o["x-csrf-token"] !== void 0) {
                                            let u = o["x-csrf-token"];
                                            if (e === e)
                                                if (typeof u == "string") {
                                                    if ($(u) < 1)
                                                        return V.errors = [{ instancePath: s + "/headers/x-csrf-token", schemaPath: "#/properties/headers/properties/x-csrf-token/minLength", keyword: "minLength", params: { limit: 1 } }], !1;
                                                }
                                                else
                                                    return V.errors = [{ instancePath: s + "/headers/x-csrf-token", schemaPath: "#/properties/headers/properties/x-csrf-token/type", keyword: "type", params: { type: "string" } }], !1;
                                        }
                                    }
                                }
                                else
                                    return V.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = l === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let o = r.body, l = e;
                                if (e === l)
                                    if (o && typeof o == "object" && !Array.isArray(o)) {
                                        let m;
                                        if (o.current_password === void 0 && (m = "current_password") || o.new_password === void 0 && (m = "new_password"))
                                            return V.errors = [{ instancePath: s + "/body", schemaPath: "#/properties/body/required", keyword: "required", params: { missingProperty: m } }], !1;
                                        if (o.current_password !== void 0) {
                                            let _ = e;
                                            if (typeof o.current_password != "string")
                                                return V.errors = [{ instancePath: s + "/body/current_password", schemaPath: "#/properties/body/properties/current_password/type", keyword: "type", params: { type: "string" } }], !1;
                                            var p = _ === e;
                                        }
                                        else
                                            var p = !0;
                                        if (p) {
                                            if (o.new_password !== void 0) {
                                                let _ = o.new_password, u = e;
                                                if (e === u)
                                                    if (typeof _ == "string") {
                                                        if ($(_) > 1024)
                                                            return V.errors = [{ instancePath: s + "/body/new_password", schemaPath: "#/properties/body/properties/new_password/maxLength", keyword: "maxLength", params: { limit: 1024 } }], !1;
                                                        if ($(_) < 8)
                                                            return V.errors = [{ instancePath: s + "/body/new_password", schemaPath: "#/properties/body/properties/new_password/minLength", keyword: "minLength", params: { limit: 8 } }], !1;
                                                    }
                                                    else
                                                        return V.errors = [{ instancePath: s + "/body/new_password", schemaPath: "#/properties/body/properties/new_password/type", keyword: "type", params: { type: "string" } }], !1;
                                                var p = u === e;
                                            }
                                            else
                                                var p = !0;
                                            if (p)
                                                if (o.totp_code !== void 0) {
                                                    let _ = e;
                                                    if (typeof o.totp_code != "string")
                                                        return V.errors = [{ instancePath: s + "/body/totp_code", schemaPath: "#/properties/body/properties/totp_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                    var p = _ === e;
                                                }
                                                else
                                                    var p = !0;
                                        }
                                    }
                                    else
                                        return V.errors = [{ instancePath: s + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "object" } }], !1;
                                var a = l === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return V.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return V.errors = i, e === 0; }
V.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Os = re, xt = { type: "object", additionalProperties: !1, required: ["status", "current_session_preserved", "reauthenticate_applications"], properties: { status: { type: "string", const: "ok", enum: ["ok"] }, current_session_preserved: { type: "boolean", const: !0, enum: [!0] }, reauthenticate_applications: { type: "boolean", const: !0, enum: [!0] } } };
function re(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = re.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status") || r.current_session_preserved === void 0 && (p = "current_session_preserved") || r.reauthenticate_applications === void 0 && (p = "reauthenticate_applications"))
            return re.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "status" || t === "current_session_preserved" || t === "reauthenticate_applications")) {
                    return re.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.status !== void 0) {
                    let t = r.status, o = e;
                    if (typeof t != "string")
                        return re.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                    if (t !== "ok")
                        return re.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/const", keyword: "const", params: { allowedValue: "ok" } }], !1;
                    if (t !== "ok")
                        return re.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: xt.properties.status.enum } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.current_session_preserved !== void 0) {
                        let t = r.current_session_preserved, o = e;
                        if (typeof t != "boolean")
                            return re.errors = [{ instancePath: s + "/current_session_preserved", schemaPath: "#/properties/current_session_preserved/type", keyword: "type", params: { type: "boolean" } }], !1;
                        if (t !== !0)
                            return re.errors = [{ instancePath: s + "/current_session_preserved", schemaPath: "#/properties/current_session_preserved/const", keyword: "const", params: { allowedValue: !0 } }], !1;
                        if (t !== !0)
                            return re.errors = [{ instancePath: s + "/current_session_preserved", schemaPath: "#/properties/current_session_preserved/enum", keyword: "enum", params: { allowedValues: xt.properties.current_session_preserved.enum } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.reauthenticate_applications !== void 0) {
                            let t = r.reauthenticate_applications, o = e;
                            if (typeof t != "boolean")
                                return re.errors = [{ instancePath: s + "/reauthenticate_applications", schemaPath: "#/properties/reauthenticate_applications/type", keyword: "type", params: { type: "boolean" } }], !1;
                            if (t !== !0)
                                return re.errors = [{ instancePath: s + "/reauthenticate_applications", schemaPath: "#/properties/reauthenticate_applications/const", keyword: "const", params: { allowedValue: !0 } }], !1;
                            if (t !== !0)
                                return re.errors = [{ instancePath: s + "/reauthenticate_applications", schemaPath: "#/properties/reauthenticate_applications/enum", keyword: "enum", params: { allowedValues: xt.properties.reauthenticate_applications.enum } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return re.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return re.errors = i, e === 0; }
re.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ls = te;
function te(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = te.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return te.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return te.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return te.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return te.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return te.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return te.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return te.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return te.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = r.body, o = e;
                                if (e === o)
                                    if (t && typeof t == "object" && !Array.isArray(t)) {
                                        let f;
                                        if (t.code === void 0 && (f = "code"))
                                            return te.errors = [{ instancePath: s + "/body", schemaPath: "#/properties/body/required", keyword: "required", params: { missingProperty: f } }], !1;
                                        if (t.code !== void 0 && typeof t.code != "string")
                                            return te.errors = [{ instancePath: s + "/body/code", schemaPath: "#/properties/body/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                                    }
                                    else
                                        return te.errors = [{ instancePath: s + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "object" } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return te.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return te.errors = i, e === 0; }
te.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ss = Ie, Ut = { type: "object", additionalProperties: !1, required: ["status", "consumed"], properties: { status: { type: "string", const: "ok", enum: ["ok"] }, consumed: { type: "boolean", const: !0, enum: [!0] } } };
function Ie(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ie.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status") || r.consumed === void 0 && (p = "consumed"))
            return Ie.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "status" || t === "consumed")) {
                    return Ie.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.status !== void 0) {
                    let t = r.status, o = e;
                    if (typeof t != "string")
                        return Ie.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                    if (t !== "ok")
                        return Ie.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/const", keyword: "const", params: { allowedValue: "ok" } }], !1;
                    if (t !== "ok")
                        return Ie.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: Ut.properties.status.enum } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.consumed !== void 0) {
                        let t = r.consumed, o = e;
                        if (typeof t != "boolean")
                            return Ie.errors = [{ instancePath: s + "/consumed", schemaPath: "#/properties/consumed/type", keyword: "type", params: { type: "boolean" } }], !1;
                        if (t !== !0)
                            return Ie.errors = [{ instancePath: s + "/consumed", schemaPath: "#/properties/consumed/const", keyword: "const", params: { allowedValue: !0 } }], !1;
                        if (t !== !0)
                            return Ie.errors = [{ instancePath: s + "/consumed", schemaPath: "#/properties/consumed/enum", keyword: "enum", params: { allowedValues: Ut.properties.consumed.enum } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return Ie.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ie.errors = i, e === 0; }
Ie.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var zs = se, Vs = { type: "object", additionalProperties: !1, properties: { pathParams: { type: "object", additionalProperties: !1, required: [], properties: {} }, query: { type: "object", additionalProperties: !1, required: ["scene"], properties: { scene: { type: "string", enum: ["login", "register", "recovery", "reset_password", "checkin", "partner_consent"] } } }, headers: { type: "object", additionalProperties: !1, required: [], properties: {} } }, required: ["pathParams", "query", "headers"] };
function se(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = se.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return se.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return se.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return se.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return se.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t)) {
                                let f;
                                if (t.scene === void 0 && (f = "scene"))
                                    return se.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/required", keyword: "required", params: { missingProperty: f } }], !1;
                                {
                                    let m = e;
                                    for (let _ in t)
                                        if (_ !== "scene") {
                                            return se.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: _ } }], !1;
                                            break;
                                        }
                                    if (m === e && t.scene !== void 0) {
                                        let _ = t.scene;
                                        if (typeof _ != "string")
                                            return se.errors = [{ instancePath: s + "/query/scene", schemaPath: "#/properties/query/properties/scene/type", keyword: "type", params: { type: "string" } }], !1;
                                        if (!(_ === "login" || _ === "register" || _ === "recovery" || _ === "reset_password" || _ === "checkin" || _ === "partner_consent"))
                                            return se.errors = [{ instancePath: s + "/query/scene", schemaPath: "#/properties/query/properties/scene/enum", keyword: "enum", params: { allowedValues: Vs.properties.query.properties.scene.enum } }], !1;
                                    }
                                }
                            }
                            else
                                return se.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return se.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return se.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return se.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return se.errors = i, e === 0; }
se.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ns = be, Cs = { type: "object", additionalProperties: !1, required: ["provider", "site_key", "cap_origin", "enabled", "question", "captcha_token"], properties: { provider: { type: "string", enum: ["none", "builtin", "turnstile", "recaptcha", "hcaptcha", "cap"] }, site_key: { type: "string" }, cap_origin: { anyOf: [{ type: "string" }, { type: "null" }] }, enabled: { type: "boolean" }, question: { anyOf: [{ type: "string" }, { type: "null" }] }, captcha_token: { anyOf: [{ type: "string" }, { type: "null" }] } } };
function be(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = be.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let o;
        if (r.provider === void 0 && (o = "provider") || r.site_key === void 0 && (o = "site_key") || r.cap_origin === void 0 && (o = "cap_origin") || r.enabled === void 0 && (o = "enabled") || r.question === void 0 && (o = "question") || r.captcha_token === void 0 && (o = "captcha_token"))
            return be.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: o } }], !1;
        {
            let l = e;
            for (let f in r)
                if (!(f === "provider" || f === "site_key" || f === "cap_origin" || f === "enabled" || f === "question" || f === "captcha_token")) {
                    return be.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                    break;
                }
            if (l === e) {
                if (r.provider !== void 0) {
                    let f = r.provider, m = e;
                    if (typeof f != "string")
                        return be.errors = [{ instancePath: s + "/provider", schemaPath: "#/properties/provider/type", keyword: "type", params: { type: "string" } }], !1;
                    if (!(f === "none" || f === "builtin" || f === "turnstile" || f === "recaptcha" || f === "hcaptcha" || f === "cap"))
                        return be.errors = [{ instancePath: s + "/provider", schemaPath: "#/properties/provider/enum", keyword: "enum", params: { allowedValues: Cs.properties.provider.enum } }], !1;
                    var a = m === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.site_key !== void 0) {
                        let f = e;
                        if (typeof r.site_key != "string")
                            return be.errors = [{ instancePath: s + "/site_key", schemaPath: "#/properties/site_key/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = f === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.cap_origin !== void 0) {
                            let f = r.cap_origin, m = e, _ = e, u = !1, k = e;
                            if (typeof f != "string") {
                                let w = { instancePath: s + "/cap_origin", schemaPath: "#/properties/cap_origin/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                i === null ? i = [w] : i.push(w), e++;
                            }
                            var p = k === e;
                            u = u || p;
                            let b = e;
                            if (f !== null) {
                                let w = { instancePath: s + "/cap_origin", schemaPath: "#/properties/cap_origin/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                i === null ? i = [w] : i.push(w), e++;
                            }
                            var p = b === e;
                            if (u = u || p, u)
                                e = _, i !== null && (_ ? i.length = _ : i = null);
                            else {
                                let w = { instancePath: s + "/cap_origin", schemaPath: "#/properties/cap_origin/anyOf", keyword: "anyOf", params: {} };
                                return i === null ? i = [w] : i.push(w), e++, be.errors = i, !1;
                            }
                            var a = m === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.enabled !== void 0) {
                                let f = e;
                                if (typeof r.enabled != "boolean")
                                    return be.errors = [{ instancePath: s + "/enabled", schemaPath: "#/properties/enabled/type", keyword: "type", params: { type: "boolean" } }], !1;
                                var a = f === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.question !== void 0) {
                                    let f = r.question, m = e, _ = e, u = !1, k = e;
                                    if (typeof f != "string") {
                                        let w = { instancePath: s + "/question", schemaPath: "#/properties/question/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                        i === null ? i = [w] : i.push(w), e++;
                                    }
                                    var d = k === e;
                                    u = u || d;
                                    let b = e;
                                    if (f !== null) {
                                        let w = { instancePath: s + "/question", schemaPath: "#/properties/question/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                        i === null ? i = [w] : i.push(w), e++;
                                    }
                                    var d = b === e;
                                    if (u = u || d, u)
                                        e = _, i !== null && (_ ? i.length = _ : i = null);
                                    else {
                                        let w = { instancePath: s + "/question", schemaPath: "#/properties/question/anyOf", keyword: "anyOf", params: {} };
                                        return i === null ? i = [w] : i.push(w), e++, be.errors = i, !1;
                                    }
                                    var a = m === e;
                                }
                                else
                                    var a = !0;
                                if (a)
                                    if (r.captcha_token !== void 0) {
                                        let f = r.captcha_token, m = e, _ = e, u = !1, k = e;
                                        if (typeof f != "string") {
                                            let w = { instancePath: s + "/captcha_token", schemaPath: "#/properties/captcha_token/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                            i === null ? i = [w] : i.push(w), e++;
                                        }
                                        var t = k === e;
                                        u = u || t;
                                        let b = e;
                                        if (f !== null) {
                                            let w = { instancePath: s + "/captcha_token", schemaPath: "#/properties/captcha_token/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                            i === null ? i = [w] : i.push(w), e++;
                                        }
                                        var t = b === e;
                                        if (u = u || t, u)
                                            e = _, i !== null && (_ ? i.length = _ : i = null);
                                        else {
                                            let w = { instancePath: s + "/captcha_token", schemaPath: "#/properties/captcha_token/anyOf", keyword: "anyOf", params: {} };
                                            return i === null ? i = [w] : i.push(w), e++, be.errors = i, !1;
                                        }
                                        var a = m === e;
                                    }
                                    else
                                        var a = !0;
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return be.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return be.errors = i, e === 0; }
be.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ks = $e;
function Qe(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Qe.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.return_to === void 0 && (a = "return_to"))
            return Qe.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        {
            let p = e;
            for (let d in r)
                if (d !== "return_to") {
                    return Qe.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: d } }], !1;
                    break;
                }
            if (p === e && r.return_to !== void 0) {
                let d = r.return_to;
                if (e === e)
                    if (typeof d == "string") {
                        if ($(d) > 2048)
                            return Qe.errors = [{ instancePath: s + "/return_to", schemaPath: "#/properties/return_to/maxLength", keyword: "maxLength", params: { limit: 2048 } }], !1;
                        if ($(d) < 1)
                            return Qe.errors = [{ instancePath: s + "/return_to", schemaPath: "#/properties/return_to/minLength", keyword: "minLength", params: { limit: 1 } }], !1;
                    }
                    else
                        return Qe.errors = [{ instancePath: s + "/return_to", schemaPath: "#/properties/return_to/type", keyword: "type", params: { type: "string" } }], !1;
            }
        }
    }
    else
        return Qe.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Qe.errors = i, e === 0; }
Qe.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function $e(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = $e.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return $e.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return $e.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return $e.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return $e.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return $e.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return $e.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return $e.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return $e.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Qe(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Qe.errors : i.concat(Qe.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return $e.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return $e.errors = i, e === 0; }
$e.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Rs = We;
function We(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = We.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status") || r.expires_in === void 0 && (p = "expires_in"))
            return We.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "status" || t === "expires_in")) {
                    return We.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.status !== void 0) {
                    let t = r.status, o = e;
                    if (typeof t != "string")
                        return We.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                    if (t !== "ready")
                        return We.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/const", keyword: "const", params: { allowedValue: "ready" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.expires_in !== void 0) {
                        let t = r.expires_in, o = e;
                        if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                            return We.errors = [{ instancePath: s + "/expires_in", schemaPath: "#/properties/expires_in/type", keyword: "type", params: { type: "integer" } }], !1;
                        if (t !== 1800)
                            return We.errors = [{ instancePath: s + "/expires_in", schemaPath: "#/properties/expires_in/const", keyword: "const", params: { allowedValue: 1800 } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return We.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return We.errors = i, e === 0; }
We.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var rs = Ee;
function Dr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Dr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r))
        for (let a in r) {
            return Dr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: a } }], !1;
            break;
        }
    else
        return Dr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Dr.errors = i, e === 0; }
Dr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function Ee(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ee.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return Ee.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return Ee.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return Ee.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return Ee.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return Ee.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return Ee.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return Ee.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return Ee.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Dr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Dr.errors : i.concat(Dr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return Ee.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ee.errors = i, e === 0; }
Ee.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Fs = ct;
function ct(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ct.evaluated; n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0); let a = e, p = !1, d = null, t = e; if (e === t)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let _;
        if (r.status === void 0 && (_ = "status")) {
            let u = { instancePath: s, schemaPath: "#/oneOf/0/required", keyword: "required", params: { missingProperty: _ } };
            i === null ? i = [u] : i.push(u), e++;
        }
        else {
            let u = e;
            for (let k in r)
                if (k !== "status") {
                    let b = { instancePath: s, schemaPath: "#/oneOf/0/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: k } };
                    i === null ? i = [b] : i.push(b), e++;
                    break;
                }
            if (u === e && r.status !== void 0) {
                let k = r.status;
                if (typeof k != "string") {
                    let b = { instancePath: s + "/status", schemaPath: "#/oneOf/0/properties/status/type", keyword: "type", params: { type: "string" } };
                    i === null ? i = [b] : i.push(b), e++;
                }
                if (k !== "none") {
                    let b = { instancePath: s + "/status", schemaPath: "#/oneOf/0/properties/status/const", keyword: "const", params: { allowedValue: "none" } };
                    i === null ? i = [b] : i.push(b), e++;
                }
            }
        }
    }
    else {
        let _ = { instancePath: s, schemaPath: "#/oneOf/0/type", keyword: "type", params: { type: "object" } };
        i === null ? i = [_] : i.push(_), e++;
    } var m = t === e; if (m) {
    p = !0, d = 0;
    var o = !0;
} let l = e; if (e === l)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let _;
        if (r.status === void 0 && (_ = "status") || r.return_to === void 0 && (_ = "return_to")) {
            let u = { instancePath: s, schemaPath: "#/oneOf/1/required", keyword: "required", params: { missingProperty: _ } };
            i === null ? i = [u] : i.push(u), e++;
        }
        else {
            let u = e;
            for (let k in r)
                if (!(k === "status" || k === "return_to")) {
                    let b = { instancePath: s, schemaPath: "#/oneOf/1/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: k } };
                    i === null ? i = [b] : i.push(b), e++;
                    break;
                }
            if (u === e) {
                if (r.status !== void 0) {
                    let k = r.status, b = e;
                    if (typeof k != "string") {
                        let g = { instancePath: s + "/status", schemaPath: "#/oneOf/1/properties/status/type", keyword: "type", params: { type: "string" } };
                        i === null ? i = [g] : i.push(g), e++;
                    }
                    if (k !== "ready") {
                        let g = { instancePath: s + "/status", schemaPath: "#/oneOf/1/properties/status/const", keyword: "const", params: { allowedValue: "ready" } };
                        i === null ? i = [g] : i.push(g), e++;
                    }
                    var f = b === e;
                }
                else
                    var f = !0;
                if (f)
                    if (r.return_to !== void 0) {
                        let k = r.return_to, b = e;
                        if (e === b)
                            if (typeof k == "string") {
                                if ($(k) > 2048) {
                                    let w = { instancePath: s + "/return_to", schemaPath: "#/oneOf/1/properties/return_to/maxLength", keyword: "maxLength", params: { limit: 2048 } };
                                    i === null ? i = [w] : i.push(w), e++;
                                }
                            }
                            else {
                                let w = { instancePath: s + "/return_to", schemaPath: "#/oneOf/1/properties/return_to/type", keyword: "type", params: { type: "string" } };
                                i === null ? i = [w] : i.push(w), e++;
                            }
                        var f = b === e;
                    }
                    else
                        var f = !0;
            }
        }
    }
    else {
        let _ = { instancePath: s, schemaPath: "#/oneOf/1/type", keyword: "type", params: { type: "object" } };
        i === null ? i = [_] : i.push(_), e++;
    } var m = l === e; if (m && p ? (p = !1, d = [d, 1]) : m && (p = !0, d = 1, o !== !0 && (o = !0)), p)
    e = a, i !== null && (a ? i.length = a : i = null);
else {
    let _ = { instancePath: s, schemaPath: "#/oneOf", keyword: "oneOf", params: { passingSchemas: d } };
    return i === null ? i = [_] : i.push(_), e++, ct.errors = i, !1;
} return ct.errors = i, n.props = o, e === 0; }
ct.evaluated = { dynamicProps: !0, dynamicItems: !1 };
var Ts = Je;
function j(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = j.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r["idempotency-key"] === void 0 && (a = "idempotency-key"))
            return j.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        {
            let p = e;
            for (let d in r)
                if (d !== "idempotency-key") {
                    return j.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: d } }], !1;
                    break;
                }
            if (p === e && r["idempotency-key"] !== void 0) {
                let d = r["idempotency-key"];
                if (e === e)
                    if (typeof d == "string") {
                        if ($(d) > 128)
                            return j.errors = [{ instancePath: s + "/idempotency-key", schemaPath: "#/properties/idempotency-key/maxLength", keyword: "maxLength", params: { limit: 128 } }], !1;
                        if ($(d) < 8)
                            return j.errors = [{ instancePath: s + "/idempotency-key", schemaPath: "#/properties/idempotency-key/minLength", keyword: "minLength", params: { limit: 8 } }], !1;
                    }
                    else
                        return j.errors = [{ instancePath: s + "/idempotency-key", schemaPath: "#/properties/idempotency-key/type", keyword: "type", params: { type: "string" } }], !1;
            }
        }
    }
    else
        return j.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return j.errors = i, e === 0; }
j.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Zs = { type: "object", required: ["ticket"], properties: { ticket: { type: "string" }, mode: { type: "string", enum: ["new", "continue"] }, username: { type: "string" }, password: { type: "string", format: "password" }, display_name: { type: "string" } } };
function je(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = je.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.ticket === void 0 && (p = "ticket"))
            return je.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.ticket !== void 0) {
            let d = e;
            if (typeof r.ticket != "string")
                return je.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/type", keyword: "type", params: { type: "string" } }], !1;
            var a = d === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.mode !== void 0) {
                let d = r.mode, t = e;
                if (typeof d != "string")
                    return je.errors = [{ instancePath: s + "/mode", schemaPath: "#/properties/mode/type", keyword: "type", params: { type: "string" } }], !1;
                if (!(d === "new" || d === "continue"))
                    return je.errors = [{ instancePath: s + "/mode", schemaPath: "#/properties/mode/enum", keyword: "enum", params: { allowedValues: Zs.properties.mode.enum } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.username !== void 0) {
                    let d = e;
                    if (typeof r.username != "string")
                        return je.errors = [{ instancePath: s + "/username", schemaPath: "#/properties/username/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = d === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.password !== void 0) {
                        let d = e;
                        if (e === d && e === d && typeof r.password != "string")
                            return je.errors = [{ instancePath: s + "/password", schemaPath: "#/properties/password/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = d === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.display_name !== void 0) {
                            let d = e;
                            if (typeof r.display_name != "string")
                                return je.errors = [{ instancePath: s + "/display_name", schemaPath: "#/properties/display_name/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = d === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return je.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return je.errors = i, e === 0; }
je.evaluated = { props: { ticket: !0, mode: !0, username: !0, password: !0, display_name: !0 }, dynamicProps: !1, dynamicItems: !1 };
function Je(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Je.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return Je.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return Je.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return Je.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return Je.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return Je.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return Je.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                je(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? je.errors : i.concat(je.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return Je.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Je.errors = i, e === 0; }
Je.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ms = Jr, Xs = { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ok"] }, user: { $ref: "#/components/schemas/PortalUser" } } };
function S(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = S.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.user_id === void 0 && (d = "user_id"))
            return S.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        if (r.user_id !== void 0) {
            let t = e;
            if (typeof r.user_id != "string")
                return S.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.username !== void 0) {
                let t = e;
                if (typeof r.username != "string")
                    return S.errors = [{ instancePath: s + "/username", schemaPath: "#/properties/username/type", keyword: "type", params: { type: "string" } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.preferred_username !== void 0) {
                    let t = e;
                    if (typeof r.preferred_username != "string")
                        return S.errors = [{ instancePath: s + "/preferred_username", schemaPath: "#/properties/preferred_username/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.display_name !== void 0) {
                        let t = e;
                        if (typeof r.display_name != "string")
                            return S.errors = [{ instancePath: s + "/display_name", schemaPath: "#/properties/display_name/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = t === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.email !== void 0) {
                            let t = e;
                            if (typeof r.email != "string")
                                return S.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.email_verified !== void 0) {
                                let t = e;
                                if (typeof r.email_verified != "boolean")
                                    return S.errors = [{ instancePath: s + "/email_verified", schemaPath: "#/properties/email_verified/type", keyword: "type", params: { type: "boolean" } }], !1;
                                var a = t === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.site_code !== void 0) {
                                    let t = e;
                                    if (typeof r.site_code != "string")
                                        return S.errors = [{ instancePath: s + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                                    var a = t === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.roles !== void 0) {
                                        let t = r.roles, o = e;
                                        if (e === o)
                                            if (Array.isArray(t)) {
                                                var p = !0;
                                                let f = t.length;
                                                for (let m = 0; m < f; m++) {
                                                    let _ = e;
                                                    if (typeof t[m] != "string")
                                                        return S.errors = [{ instancePath: s + "/roles/" + m, schemaPath: "#/properties/roles/items/type", keyword: "type", params: { type: "string" } }], !1;
                                                    var p = _ === e;
                                                    if (!p)
                                                        break;
                                                }
                                            }
                                            else
                                                return S.errors = [{ instancePath: s + "/roles", schemaPath: "#/properties/roles/type", keyword: "type", params: { type: "array" } }], !1;
                                        var a = o === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a) {
                                        if (r.status !== void 0) {
                                            let t = e;
                                            if (typeof r.status != "string")
                                                return S.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                            var a = t === e;
                                        }
                                        else
                                            var a = !0;
                                        if (a) {
                                            if (r.has_totp !== void 0) {
                                                let t = e;
                                                if (typeof r.has_totp != "boolean")
                                                    return S.errors = [{ instancePath: s + "/has_totp", schemaPath: "#/properties/has_totp/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                var a = t === e;
                                            }
                                            else
                                                var a = !0;
                                            if (a) {
                                                if (r.mfa_enabled !== void 0) {
                                                    let t = e;
                                                    if (typeof r.mfa_enabled != "boolean")
                                                        return S.errors = [{ instancePath: s + "/mfa_enabled", schemaPath: "#/properties/mfa_enabled/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                    var a = t === e;
                                                }
                                                else
                                                    var a = !0;
                                                if (a) {
                                                    if (r.passkey_count !== void 0) {
                                                        let t = r.passkey_count, o = e;
                                                        if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                                                            return S.errors = [{ instancePath: s + "/passkey_count", schemaPath: "#/properties/passkey_count/type", keyword: "type", params: { type: "integer" } }], !1;
                                                        var a = o === e;
                                                    }
                                                    else
                                                        var a = !0;
                                                    if (a) {
                                                        if (r.avatar_url !== void 0) {
                                                            let t = e;
                                                            if (typeof r.avatar_url != "string")
                                                                return S.errors = [{ instancePath: s + "/avatar_url", schemaPath: "#/properties/avatar_url/type", keyword: "type", params: { type: "string" } }], !1;
                                                            var a = t === e;
                                                        }
                                                        else
                                                            var a = !0;
                                                        if (a) {
                                                            if (r.locale !== void 0) {
                                                                let t = e;
                                                                if (typeof r.locale != "string")
                                                                    return S.errors = [{ instancePath: s + "/locale", schemaPath: "#/properties/locale/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var a = t === e;
                                                            }
                                                            else
                                                                var a = !0;
                                                            if (a) {
                                                                if (r.aff_code !== void 0) {
                                                                    let t = e;
                                                                    if (typeof r.aff_code != "string")
                                                                        return S.errors = [{ instancePath: s + "/aff_code", schemaPath: "#/properties/aff_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                                    var a = t === e;
                                                                }
                                                                else
                                                                    var a = !0;
                                                                if (a)
                                                                    if (r.created_at !== void 0) {
                                                                        let t = e;
                                                                        if (typeof r.created_at != "string")
                                                                            return S.errors = [{ instancePath: s + "/created_at", schemaPath: "#/properties/created_at/type", keyword: "type", params: { type: "string" } }], !1;
                                                                        var a = t === e;
                                                                    }
                                                                    else
                                                                        var a = !0;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return S.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return S.errors = i, e === 0; }
S.evaluated = { props: { user_id: !0, username: !0, preferred_username: !0, display_name: !0, email: !0, email_verified: !0, site_code: !0, roles: !0, status: !0, has_totp: !0, mfa_enabled: !0, passkey_count: !0, avatar_url: !0, locale: !0, aff_code: !0, created_at: !0 }, dynamicProps: !1, dynamicItems: !1 };
function Jr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Jr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status"))
            return Jr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.status !== void 0) {
            let d = r.status, t = e;
            if (typeof d != "string")
                return Jr.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
            if (d !== "ok")
                return Jr.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: Xs.properties.status.enum } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a)
            if (r.user !== void 0) {
                let d = e;
                S(r.user, { instancePath: s + "/user", parentData: r, parentDataProperty: "user", rootData: y, dynamicAnchors: c }) || (i = i === null ? S.errors : i.concat(S.errors), e = i.length);
                var a = d === e;
            }
            else
                var a = !0;
    }
    else
        return Jr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Jr.errors = i, e === 0; }
Jr.evaluated = { props: { status: !0, user: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Hs = er;
var nt = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
function Vr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Vr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.email === void 0 && (a = "email"))
            return Vr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        if (r.email !== void 0) {
            let p = r.email, d = e;
            if (e === d && e === d)
                if (typeof p == "string") {
                    if (!nt.test(p))
                        return Vr.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/format", keyword: "format", params: { format: "email" } }], !1;
                }
                else
                    return Vr.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/type", keyword: "type", params: { type: "string" } }], !1;
        }
    }
    else
        return Vr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Vr.errors = i, e === 0; }
Vr.evaluated = { props: { email: !0 }, dynamicProps: !1, dynamicItems: !1 };
function er(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = er.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return er.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return er.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return er.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return er.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return er.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return er.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Vr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Vr.errors : i.concat(Vr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return er.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return er.errors = i, e === 0; }
er.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Zr = st;
function st(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = st.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.status !== void 0) {
            let p = e;
            if (typeof r.status != "string")
                return st.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
            var a = p === e;
        }
        else
            var a = !0;
        if (a)
            if (r.ok !== void 0) {
                let p = e;
                if (typeof r.ok != "boolean")
                    return st.errors = [{ instancePath: s + "/ok", schemaPath: "#/properties/ok/type", keyword: "type", params: { type: "boolean" } }], !1;
                var a = p === e;
            }
            else
                var a = !0;
    }
    else
        return st.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return st.errors = i, e === 0; }
st.evaluated = { props: { status: !0, ok: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Ys = rr;
function Nr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Nr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.ticket === void 0 && (a = "ticket"))
            return Nr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        if (r.ticket !== void 0) {
            let p = r.ticket;
            if (e === e)
                if (typeof p == "string") {
                    if ($(p) < 20)
                        return Nr.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/minLength", keyword: "minLength", params: { limit: 20 } }], !1;
                }
                else
                    return Nr.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/type", keyword: "type", params: { type: "string" } }], !1;
        }
    }
    else
        return Nr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Nr.errors = i, e === 0; }
Nr.evaluated = { props: { ticket: !0 }, dynamicProps: !1, dynamicItems: !1 };
function rr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = rr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return rr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return rr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return rr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return rr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return rr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return rr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Nr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Nr.errors : i.concat(Nr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return rr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return rr.errors = i, e === 0; }
rr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Us = Er, Qs = { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["claim_required"] }, claim_token: { type: "string" }, claim_expires_in: { type: "integer" } } };
function Er(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Er.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status"))
            return Er.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.status !== void 0) {
            let d = r.status, t = e;
            if (typeof d != "string")
                return Er.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
            if (d !== "claim_required")
                return Er.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: Qs.properties.status.enum } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.claim_token !== void 0) {
                let d = e;
                if (typeof r.claim_token != "string")
                    return Er.errors = [{ instancePath: s + "/claim_token", schemaPath: "#/properties/claim_token/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
            if (a)
                if (r.claim_expires_in !== void 0) {
                    let d = r.claim_expires_in, t = e;
                    if (!(typeof d == "number" && !(d % 1) && !isNaN(d) && isFinite(d)))
                        return Er.errors = [{ instancePath: s + "/claim_expires_in", schemaPath: "#/properties/claim_expires_in/type", keyword: "type", params: { type: "integer" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
        }
    }
    else
        return Er.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Er.errors = i, e === 0; }
Er.evaluated = { props: { status: !0, claim_token: !0, claim_expires_in: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Bs = tr;
function Ke(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ke.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.username === void 0 && (p = "username") || r.password === void 0 && (p = "password"))
            return Ke.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.username !== void 0) {
            let d = e;
            if (typeof r.username != "string")
                return Ke.errors = [{ instancePath: s + "/username", schemaPath: "#/properties/username/type", keyword: "type", params: { type: "string" } }], !1;
            var a = d === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.password !== void 0) {
                let d = e;
                if (e === d && e === d && typeof r.password != "string")
                    return Ke.errors = [{ instancePath: s + "/password", schemaPath: "#/properties/password/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.captcha_token !== void 0) {
                    let d = e;
                    if (typeof r.captcha_token != "string")
                        return Ke.errors = [{ instancePath: s + "/captcha_token", schemaPath: "#/properties/captcha_token/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = d === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.captcha_answer !== void 0) {
                        let d = e;
                        if (typeof r.captcha_answer != "string")
                            return Ke.errors = [{ instancePath: s + "/captcha_answer", schemaPath: "#/properties/captcha_answer/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = d === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.captcha_response !== void 0) {
                            let d = e;
                            if (typeof r.captcha_response != "string")
                                return Ke.errors = [{ instancePath: s + "/captcha_response", schemaPath: "#/properties/captcha_response/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = d === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return Ke.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ke.errors = i, e === 0; }
Ke.evaluated = { props: { username: !0, password: !0, captcha_token: !0, captcha_answer: !0, captcha_response: !0 }, dynamicProps: !1, dynamicItems: !1 };
function tr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = tr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return tr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return tr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return tr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return tr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return tr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return tr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Ke(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Ke.errors : i.concat(Ke.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return tr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return tr.errors = i, e === 0; }
tr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var _t = Or, Gs = { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ok", "totp_required", "verify_email_sent"] }, mfa_ticket: { type: "string" }, next: { type: "string" } } };
function Or(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Or.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status"))
            return Or.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.status !== void 0) {
            let d = r.status, t = e;
            if (typeof d != "string")
                return Or.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
            if (!(d === "ok" || d === "totp_required" || d === "verify_email_sent"))
                return Or.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: Gs.properties.status.enum } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.mfa_ticket !== void 0) {
                let d = e;
                if (typeof r.mfa_ticket != "string")
                    return Or.errors = [{ instancePath: s + "/mfa_ticket", schemaPath: "#/properties/mfa_ticket/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
            if (a)
                if (r.next !== void 0) {
                    let d = e;
                    if (typeof r.next != "string")
                        return Or.errors = [{ instancePath: s + "/next", schemaPath: "#/properties/next/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = d === e;
                }
                else
                    var a = !0;
        }
    }
    else
        return Or.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Or.errors = i, e === 0; }
Or.evaluated = { props: { status: !0, mfa_ticket: !0, next: !0 }, dynamicProps: !1, dynamicItems: !1 };
var ts = sr;
function Cr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Cr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.mfa_ticket === void 0 && (p = "mfa_ticket") || r.code === void 0 && (p = "code"))
            return Cr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.mfa_ticket !== void 0) {
            let d = e;
            if (typeof r.mfa_ticket != "string")
                return Cr.errors = [{ instancePath: s + "/mfa_ticket", schemaPath: "#/properties/mfa_ticket/type", keyword: "type", params: { type: "string" } }], !1;
            var a = d === e;
        }
        else
            var a = !0;
        if (a)
            if (r.code !== void 0) {
                let d = e;
                if (typeof r.code != "string")
                    return Cr.errors = [{ instancePath: s + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
    }
    else
        return Cr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Cr.errors = i, e === 0; }
Cr.evaluated = { props: { mfa_ticket: !0, code: !0 }, dynamicProps: !1, dynamicItems: !1 };
function sr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = sr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return sr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return sr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return sr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return sr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return sr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return sr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Cr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Cr.errors : i.concat(Cr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return sr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return sr.errors = i, e === 0; }
sr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var $t = we;
function we(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = we.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return we.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return we.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return we.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return we.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return we.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return we.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return we.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return we.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = r.body, o = e;
                                if (!(t && typeof t == "object" && !Array.isArray(t)))
                                    return we.errors = [{ instancePath: s + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "object" } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return we.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return we.errors = i, e === 0; }
we.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ws = ar;
function Kr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Kr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.credential === void 0 && (p = "credential"))
            return Kr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.request_id !== void 0) {
            let d = e;
            if (typeof r.request_id != "string")
                return Kr.errors = [{ instancePath: s + "/request_id", schemaPath: "#/properties/request_id/type", keyword: "type", params: { type: "string" } }], !1;
            var a = d === e;
        }
        else
            var a = !0;
        if (a)
            if (r.credential !== void 0) {
                let d = r.credential, t = e;
                if (!(d && typeof d == "object" && !Array.isArray(d)))
                    return Kr.errors = [{ instancePath: s + "/credential", schemaPath: "#/properties/credential/type", keyword: "type", params: { type: "object" } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
    }
    else
        return Kr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Kr.errors = i, e === 0; }
Kr.evaluated = { props: { request_id: !0, credential: !0 }, dynamicProps: !1, dynamicItems: !1 };
function ar(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ar.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return ar.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return ar.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return ar.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return ar.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return ar.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return ar.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Kr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Kr.errors : i.concat(Kr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return ar.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ar.errors = i, e === 0; }
ar.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Js = F;
function Be(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Be.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.username !== void 0) {
            let p = e;
            if (typeof r.username != "string")
                return Be.errors = [{ instancePath: s + "/username", schemaPath: "#/properties/username/type", keyword: "type", params: { type: "string" } }], !1;
            var a = p === e;
        }
        else
            var a = !0;
        if (a)
            if (r.display_name !== void 0) {
                let p = e;
                if (typeof r.display_name != "string")
                    return Be.errors = [{ instancePath: s + "/display_name", schemaPath: "#/properties/display_name/type", keyword: "type", params: { type: "string" } }], !1;
                var a = p === e;
            }
            else
                var a = !0;
    }
    else
        return Be.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Be.errors = i, e === 0; }
Be.evaluated = { props: { username: !0, display_name: !0 }, dynamicProps: !1, dynamicItems: !1 };
function F(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = F.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.pathParams === void 0 && (d = "pathParams") || r.query === void 0 && (d = "query") || r.headers === void 0 && (d = "headers") || r.body === void 0 && (d = "body"))
            return F.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = e;
            for (let o in r)
                if (!(o === "pathParams" || o === "query" || o === "headers" || o === "body")) {
                    return F.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (t === e) {
                if (r.pathParams !== void 0) {
                    let o = r.pathParams, l = e;
                    if (e === l)
                        if (o && typeof o == "object" && !Array.isArray(o))
                            for (let f in o) {
                                return F.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return F.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = l === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let o = r.query, l = e;
                        if (e === l)
                            if (o && typeof o == "object" && !Array.isArray(o))
                                for (let m in o) {
                                    return F.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                    break;
                                }
                            else
                                return F.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = l === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let o = r.headers, l = e;
                            if (e === l)
                                if (o && typeof o == "object" && !Array.isArray(o)) {
                                    let m;
                                    if (o["idempotency-key"] === void 0 && (m = "idempotency-key"))
                                        return F.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/required", keyword: "required", params: { missingProperty: m } }], !1;
                                    {
                                        let _ = e;
                                        for (let u in o)
                                            if (!(u === "idempotency-key" || u === "x-csrf-token")) {
                                                return F.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: u } }], !1;
                                                break;
                                            }
                                        if (_ === e) {
                                            if (o["idempotency-key"] !== void 0) {
                                                let u = o["idempotency-key"], k = e;
                                                if (e === k)
                                                    if (typeof u == "string") {
                                                        if ($(u) > 128)
                                                            return F.errors = [{ instancePath: s + "/headers/idempotency-key", schemaPath: "#/properties/headers/properties/idempotency-key/maxLength", keyword: "maxLength", params: { limit: 128 } }], !1;
                                                        if ($(u) < 8)
                                                            return F.errors = [{ instancePath: s + "/headers/idempotency-key", schemaPath: "#/properties/headers/properties/idempotency-key/minLength", keyword: "minLength", params: { limit: 8 } }], !1;
                                                    }
                                                    else
                                                        return F.errors = [{ instancePath: s + "/headers/idempotency-key", schemaPath: "#/properties/headers/properties/idempotency-key/type", keyword: "type", params: { type: "string" } }], !1;
                                                var p = k === e;
                                            }
                                            else
                                                var p = !0;
                                            if (p)
                                                if (o["x-csrf-token"] !== void 0) {
                                                    let u = o["x-csrf-token"], k = e;
                                                    if (e === k)
                                                        if (typeof u == "string") {
                                                            if ($(u) < 1)
                                                                return F.errors = [{ instancePath: s + "/headers/x-csrf-token", schemaPath: "#/properties/headers/properties/x-csrf-token/minLength", keyword: "minLength", params: { limit: 1 } }], !1;
                                                        }
                                                        else
                                                            return F.errors = [{ instancePath: s + "/headers/x-csrf-token", schemaPath: "#/properties/headers/properties/x-csrf-token/type", keyword: "type", params: { type: "string" } }], !1;
                                                    var p = k === e;
                                                }
                                                else
                                                    var p = !0;
                                        }
                                    }
                                }
                                else
                                    return F.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = l === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let o = e;
                                Be(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Be.errors : i.concat(Be.errors), e = i.length);
                                var a = o === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return F.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return F.errors = i, e === 0; }
F.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ea = K, Qt = { type: "object", additionalProperties: !1, required: ["request_id", "options"], properties: { request_id: { type: "string" }, options: { type: "object", additionalProperties: !1, required: ["challenge", "rpId", "timeout", "userVerification", "allowCredentials"], properties: { challenge: { type: "string" }, rpId: { type: "string" }, timeout: { type: "integer", const: 6e4, enum: [6e4] }, userVerification: { type: "string", const: "required", enum: ["required"] }, allowCredentials: { type: "array", items: { $ref: "#/components/schemas/PortalPasskeyDescriptor" } } } } } }, ra = { type: "object", additionalProperties: !1, required: ["id", "type"], properties: { id: { type: "string" }, type: { type: "string", const: "public-key", enum: ["public-key"] }, transports: { type: "array", items: { type: "string" } } } };
function Q(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Q.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.id === void 0 && (d = "id") || r.type === void 0 && (d = "type"))
            return Q.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = e;
            for (let o in r)
                if (!(o === "id" || o === "type" || o === "transports")) {
                    return Q.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (t === e) {
                if (r.id !== void 0) {
                    let o = e;
                    if (typeof r.id != "string")
                        return Q.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.type !== void 0) {
                        let o = r.type, l = e;
                        if (typeof o != "string")
                            return Q.errors = [{ instancePath: s + "/type", schemaPath: "#/properties/type/type", keyword: "type", params: { type: "string" } }], !1;
                        if (o !== "public-key")
                            return Q.errors = [{ instancePath: s + "/type", schemaPath: "#/properties/type/const", keyword: "const", params: { allowedValue: "public-key" } }], !1;
                        if (o !== "public-key")
                            return Q.errors = [{ instancePath: s + "/type", schemaPath: "#/properties/type/enum", keyword: "enum", params: { allowedValues: ra.properties.type.enum } }], !1;
                        var a = l === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.transports !== void 0) {
                            let o = r.transports, l = e;
                            if (e === l)
                                if (Array.isArray(o)) {
                                    var p = !0;
                                    let m = o.length;
                                    for (let _ = 0; _ < m; _++) {
                                        let u = e;
                                        if (typeof o[_] != "string")
                                            return Q.errors = [{ instancePath: s + "/transports/" + _, schemaPath: "#/properties/transports/items/type", keyword: "type", params: { type: "string" } }], !1;
                                        var p = u === e;
                                        if (!p)
                                            break;
                                    }
                                }
                                else
                                    return Q.errors = [{ instancePath: s + "/transports", schemaPath: "#/properties/transports/type", keyword: "type", params: { type: "array" } }], !1;
                            var a = l === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return Q.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Q.errors = i, e === 0; }
Q.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function K(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = K.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let t;
        if (r.request_id === void 0 && (t = "request_id") || r.options === void 0 && (t = "options"))
            return K.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: t } }], !1;
        {
            let o = e;
            for (let l in r)
                if (!(l === "request_id" || l === "options")) {
                    return K.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                    break;
                }
            if (o === e) {
                if (r.request_id !== void 0) {
                    let l = e;
                    if (typeof r.request_id != "string")
                        return K.errors = [{ instancePath: s + "/request_id", schemaPath: "#/properties/request_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = l === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.options !== void 0) {
                        let l = r.options, f = e;
                        if (e === f)
                            if (l && typeof l == "object" && !Array.isArray(l)) {
                                let _;
                                if (l.challenge === void 0 && (_ = "challenge") || l.rpId === void 0 && (_ = "rpId") || l.timeout === void 0 && (_ = "timeout") || l.userVerification === void 0 && (_ = "userVerification") || l.allowCredentials === void 0 && (_ = "allowCredentials"))
                                    return K.errors = [{ instancePath: s + "/options", schemaPath: "#/properties/options/required", keyword: "required", params: { missingProperty: _ } }], !1;
                                {
                                    let u = e;
                                    for (let k in l)
                                        if (!(k === "challenge" || k === "rpId" || k === "timeout" || k === "userVerification" || k === "allowCredentials")) {
                                            return K.errors = [{ instancePath: s + "/options", schemaPath: "#/properties/options/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: k } }], !1;
                                            break;
                                        }
                                    if (u === e) {
                                        if (l.challenge !== void 0) {
                                            let k = e;
                                            if (typeof l.challenge != "string")
                                                return K.errors = [{ instancePath: s + "/options/challenge", schemaPath: "#/properties/options/properties/challenge/type", keyword: "type", params: { type: "string" } }], !1;
                                            var p = k === e;
                                        }
                                        else
                                            var p = !0;
                                        if (p) {
                                            if (l.rpId !== void 0) {
                                                let k = e;
                                                if (typeof l.rpId != "string")
                                                    return K.errors = [{ instancePath: s + "/options/rpId", schemaPath: "#/properties/options/properties/rpId/type", keyword: "type", params: { type: "string" } }], !1;
                                                var p = k === e;
                                            }
                                            else
                                                var p = !0;
                                            if (p) {
                                                if (l.timeout !== void 0) {
                                                    let k = l.timeout, b = e;
                                                    if (!(typeof k == "number" && !(k % 1) && !isNaN(k) && isFinite(k)))
                                                        return K.errors = [{ instancePath: s + "/options/timeout", schemaPath: "#/properties/options/properties/timeout/type", keyword: "type", params: { type: "integer" } }], !1;
                                                    if (k !== 6e4)
                                                        return K.errors = [{ instancePath: s + "/options/timeout", schemaPath: "#/properties/options/properties/timeout/const", keyword: "const", params: { allowedValue: 6e4 } }], !1;
                                                    if (k !== 6e4)
                                                        return K.errors = [{ instancePath: s + "/options/timeout", schemaPath: "#/properties/options/properties/timeout/enum", keyword: "enum", params: { allowedValues: Qt.properties.options.properties.timeout.enum } }], !1;
                                                    var p = b === e;
                                                }
                                                else
                                                    var p = !0;
                                                if (p) {
                                                    if (l.userVerification !== void 0) {
                                                        let k = l.userVerification, b = e;
                                                        if (typeof k != "string")
                                                            return K.errors = [{ instancePath: s + "/options/userVerification", schemaPath: "#/properties/options/properties/userVerification/type", keyword: "type", params: { type: "string" } }], !1;
                                                        if (k !== "required")
                                                            return K.errors = [{ instancePath: s + "/options/userVerification", schemaPath: "#/properties/options/properties/userVerification/const", keyword: "const", params: { allowedValue: "required" } }], !1;
                                                        if (k !== "required")
                                                            return K.errors = [{ instancePath: s + "/options/userVerification", schemaPath: "#/properties/options/properties/userVerification/enum", keyword: "enum", params: { allowedValues: Qt.properties.options.properties.userVerification.enum } }], !1;
                                                        var p = b === e;
                                                    }
                                                    else
                                                        var p = !0;
                                                    if (p)
                                                        if (l.allowCredentials !== void 0) {
                                                            let k = l.allowCredentials, b = e;
                                                            if (e === b)
                                                                if (Array.isArray(k)) {
                                                                    var d = !0;
                                                                    let w = k.length;
                                                                    for (let O = 0; O < w; O++) {
                                                                        let q = e;
                                                                        Q(k[O], { instancePath: s + "/options/allowCredentials/" + O, parentData: k, parentDataProperty: O, rootData: y, dynamicAnchors: c }) || (i = i === null ? Q.errors : i.concat(Q.errors), e = i.length);
                                                                        var d = q === e;
                                                                        if (!d)
                                                                            break;
                                                                    }
                                                                }
                                                                else
                                                                    return K.errors = [{ instancePath: s + "/options/allowCredentials", schemaPath: "#/properties/options/properties/allowCredentials/type", keyword: "type", params: { type: "array" } }], !1;
                                                            var p = b === e;
                                                        }
                                                        else
                                                            var p = !0;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else
                                return K.errors = [{ instancePath: s + "/options", schemaPath: "#/properties/options/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = f === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return K.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return K.errors = i, e === 0; }
K.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ta = ir;
function Re(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Re.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.email === void 0 && (p = "email"))
            return Re.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.email !== void 0) {
            let d = r.email, t = e;
            if (e === t && e === t)
                if (typeof d == "string") {
                    if (!nt.test(d))
                        return Re.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/format", keyword: "format", params: { format: "email" } }], !1;
                }
                else
                    return Re.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/type", keyword: "type", params: { type: "string" } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.captcha_token !== void 0) {
                let d = e;
                if (typeof r.captcha_token != "string")
                    return Re.errors = [{ instancePath: s + "/captcha_token", schemaPath: "#/properties/captcha_token/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.captcha_answer !== void 0) {
                    let d = e;
                    if (typeof r.captcha_answer != "string")
                        return Re.errors = [{ instancePath: s + "/captcha_answer", schemaPath: "#/properties/captcha_answer/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = d === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.captcha_response !== void 0) {
                        let d = e;
                        if (typeof r.captcha_response != "string")
                            return Re.errors = [{ instancePath: s + "/captcha_response", schemaPath: "#/properties/captcha_response/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = d === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return Re.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Re.errors = i, e === 0; }
Re.evaluated = { props: { email: !0, captcha_token: !0, captcha_answer: !0, captcha_response: !0 }, dynamicProps: !1, dynamicItems: !1 };
function ir(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ir.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return ir.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return ir.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return ir.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return ir.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return ir.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return ir.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Re(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Re.errors : i.concat(Re.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return ir.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ir.errors = i, e === 0; }
ir.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var sa = or;
function Rr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Rr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.ticket === void 0 && (p = "ticket") || r.new_password === void 0 && (p = "new_password"))
            return Rr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.ticket !== void 0) {
            let d = e;
            if (typeof r.ticket != "string")
                return Rr.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/type", keyword: "type", params: { type: "string" } }], !1;
            var a = d === e;
        }
        else
            var a = !0;
        if (a)
            if (r.new_password !== void 0) {
                let d = e;
                if (e === d && e === d && typeof r.new_password != "string")
                    return Rr.errors = [{ instancePath: s + "/new_password", schemaPath: "#/properties/new_password/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
    }
    else
        return Rr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Rr.errors = i, e === 0; }
Rr.evaluated = { props: { ticket: !0, new_password: !0 }, dynamicProps: !1, dynamicItems: !1 };
function or(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = or.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return or.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return or.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return or.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return or.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return or.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return or.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Rr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Rr.errors : i.concat(Rr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return or.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return or.errors = i, e === 0; }
or.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var aa = pt;
function Fr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Fr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.provider !== void 0) {
            let p = e;
            if (typeof r.provider != "string")
                return Fr.errors = [{ instancePath: s + "/provider", schemaPath: "#/properties/provider/type", keyword: "type", params: { type: "string" } }], !1;
            var a = p === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.display_name !== void 0) {
                let p = e;
                if (typeof r.display_name != "string")
                    return Fr.errors = [{ instancePath: s + "/display_name", schemaPath: "#/properties/display_name/type", keyword: "type", params: { type: "string" } }], !1;
                var a = p === e;
            }
            else
                var a = !0;
            if (a)
                if (r.enabled !== void 0) {
                    let p = e;
                    if (typeof r.enabled != "boolean")
                        return Fr.errors = [{ instancePath: s + "/enabled", schemaPath: "#/properties/enabled/type", keyword: "type", params: { type: "boolean" } }], !1;
                    var a = p === e;
                }
                else
                    var a = !0;
        }
    }
    else
        return Fr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Fr.errors = i, e === 0; }
Fr.evaluated = { props: { provider: !0, display_name: !0, enabled: !0 }, dynamicProps: !1, dynamicItems: !1 };
function pt(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = pt.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.items !== void 0) {
            let p = r.items;
            if (e === e)
                if (Array.isArray(p)) {
                    var a = !0;
                    let t = p.length;
                    for (let o = 0; o < t; o++) {
                        let l = e;
                        Fr(p[o], { instancePath: s + "/items/" + o, parentData: p, parentDataProperty: o, rootData: y, dynamicAnchors: c }) || (i = i === null ? Fr.errors : i.concat(Fr.errors), e = i.length);
                        var a = l === e;
                        if (!a)
                            break;
                    }
                }
                else
                    return pt.errors = [{ instancePath: s + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" } }], !1;
        }
    }
    else
        return pt.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return pt.errors = i, e === 0; }
pt.evaluated = { props: { items: !0 }, dynamicProps: !1, dynamicItems: !1 };
var ia = nr;
function M(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = M.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.username === void 0 && (p = "username") || r.password === void 0 && (p = "password") || r.email === void 0 && (p = "email"))
            return M.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.username !== void 0) {
            let d = e;
            if (typeof r.username != "string")
                return M.errors = [{ instancePath: s + "/username", schemaPath: "#/properties/username/type", keyword: "type", params: { type: "string" } }], !1;
            var a = d === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.password !== void 0) {
                let d = e;
                if (e === d && e === d && typeof r.password != "string")
                    return M.errors = [{ instancePath: s + "/password", schemaPath: "#/properties/password/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.email !== void 0) {
                    let d = r.email, t = e;
                    if (e === t && e === t)
                        if (typeof d == "string") {
                            if (!nt.test(d))
                                return M.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/format", keyword: "format", params: { format: "email" } }], !1;
                        }
                        else
                            return M.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.display_name !== void 0) {
                        let d = e;
                        if (typeof r.display_name != "string")
                            return M.errors = [{ instancePath: s + "/display_name", schemaPath: "#/properties/display_name/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = d === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.invite_code !== void 0) {
                            let d = e;
                            if (typeof r.invite_code != "string")
                                return M.errors = [{ instancePath: s + "/invite_code", schemaPath: "#/properties/invite_code/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = d === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.aff_code !== void 0) {
                                let d = e;
                                if (typeof r.aff_code != "string")
                                    return M.errors = [{ instancePath: s + "/aff_code", schemaPath: "#/properties/aff_code/type", keyword: "type", params: { type: "string" } }], !1;
                                var a = d === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.locale !== void 0) {
                                    let d = e;
                                    if (typeof r.locale != "string")
                                        return M.errors = [{ instancePath: s + "/locale", schemaPath: "#/properties/locale/type", keyword: "type", params: { type: "string" } }], !1;
                                    var a = d === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.captcha_token !== void 0) {
                                        let d = e;
                                        if (typeof r.captcha_token != "string")
                                            return M.errors = [{ instancePath: s + "/captcha_token", schemaPath: "#/properties/captcha_token/type", keyword: "type", params: { type: "string" } }], !1;
                                        var a = d === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a) {
                                        if (r.captcha_answer !== void 0) {
                                            let d = e;
                                            if (typeof r.captcha_answer != "string")
                                                return M.errors = [{ instancePath: s + "/captcha_answer", schemaPath: "#/properties/captcha_answer/type", keyword: "type", params: { type: "string" } }], !1;
                                            var a = d === e;
                                        }
                                        else
                                            var a = !0;
                                        if (a)
                                            if (r.captcha_response !== void 0) {
                                                let d = e;
                                                if (typeof r.captcha_response != "string")
                                                    return M.errors = [{ instancePath: s + "/captcha_response", schemaPath: "#/properties/captcha_response/type", keyword: "type", params: { type: "string" } }], !1;
                                                var a = d === e;
                                            }
                                            else
                                                var a = !0;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return M.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return M.errors = i, e === 0; }
M.evaluated = { props: { username: !0, password: !0, email: !0, display_name: !0, invite_code: !0, aff_code: !0, locale: !0, captcha_token: !0, captcha_answer: !0, captcha_response: !0 }, dynamicProps: !1, dynamicItems: !1 };
function nr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = nr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return nr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return nr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return nr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return nr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return nr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return nr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                M(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? M.errors : i.concat(M.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return nr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return nr.errors = i, e === 0; }
nr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var oa = Xr, na = { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ok", "verify_email_sent"] }, user_id: { type: "string" } } };
function Xr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Xr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status"))
            return Xr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.status !== void 0) {
            let d = r.status, t = e;
            if (typeof d != "string")
                return Xr.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
            if (!(d === "ok" || d === "verify_email_sent"))
                return Xr.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: na.properties.status.enum } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a)
            if (r.user_id !== void 0) {
                let d = e;
                if (typeof r.user_id != "string")
                    return Xr.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
    }
    else
        return Xr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Xr.errors = i, e === 0; }
Xr.evaluated = { props: { status: !0, user_id: !0 }, dynamicProps: !1, dynamicItems: !1 };
var pa = Lr;
function Lr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Lr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.mfa_ticket === void 0 && (a = "mfa_ticket"))
            return Lr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        {
            let p = e;
            for (let d in r)
                if (d !== "mfa_ticket") {
                    return Lr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: d } }], !1;
                    break;
                }
            if (p === e && r.mfa_ticket !== void 0) {
                let d = r.mfa_ticket;
                if (e === e)
                    if (typeof d == "string") {
                        if ($(d) > 43)
                            return Lr.errors = [{ instancePath: s + "/mfa_ticket", schemaPath: "#/properties/mfa_ticket/maxLength", keyword: "maxLength", params: { limit: 43 } }], !1;
                        if ($(d) < 43)
                            return Lr.errors = [{ instancePath: s + "/mfa_ticket", schemaPath: "#/properties/mfa_ticket/minLength", keyword: "minLength", params: { limit: 43 } }], !1;
                    }
                    else
                        return Lr.errors = [{ instancePath: s + "/mfa_ticket", schemaPath: "#/properties/mfa_ticket/type", keyword: "type", params: { type: "string" } }], !1;
            }
        }
    }
    else
        return Lr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Lr.errors = i, e === 0; }
Lr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var da = ye;
function ye(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ye.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.pathParams === void 0 && (d = "pathParams") || r.query === void 0 && (d = "query") || r.headers === void 0 && (d = "headers"))
            return ye.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = e;
            for (let o in r)
                if (!(o === "pathParams" || o === "query" || o === "headers")) {
                    return ye.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (t === e) {
                if (r.pathParams !== void 0) {
                    let o = e;
                    Me(r.pathParams, { instancePath: s + "/pathParams", parentData: r, parentDataProperty: "pathParams", rootData: y, dynamicAnchors: c }) || (i = i === null ? Me.errors : i.concat(Me.errors), e = i.length);
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let o = r.query, l = e;
                        if (e === l)
                            if (o && typeof o == "object" && !Array.isArray(o)) {
                                let m;
                                if (o.code === void 0 && (m = "code") || o.state === void 0 && (m = "state"))
                                    return ye.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/required", keyword: "required", params: { missingProperty: m } }], !1;
                                {
                                    let _ = e;
                                    for (let u in o)
                                        if (!(u === "code" || u === "state" || u === "error")) {
                                            return ye.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: u } }], !1;
                                            break;
                                        }
                                    if (_ === e) {
                                        if (o.code !== void 0) {
                                            let u = e;
                                            if (typeof o.code != "string")
                                                return ye.errors = [{ instancePath: s + "/query/code", schemaPath: "#/properties/query/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                                            var p = u === e;
                                        }
                                        else
                                            var p = !0;
                                        if (p) {
                                            if (o.state !== void 0) {
                                                let u = e;
                                                if (typeof o.state != "string")
                                                    return ye.errors = [{ instancePath: s + "/query/state", schemaPath: "#/properties/query/properties/state/type", keyword: "type", params: { type: "string" } }], !1;
                                                var p = u === e;
                                            }
                                            else
                                                var p = !0;
                                            if (p)
                                                if (o.error !== void 0) {
                                                    let u = e;
                                                    if (typeof o.error != "string")
                                                        return ye.errors = [{ instancePath: s + "/query/error", schemaPath: "#/properties/query/properties/error/type", keyword: "type", params: { type: "string" } }], !1;
                                                    var p = u === e;
                                                }
                                                else
                                                    var p = !0;
                                        }
                                    }
                                }
                            }
                            else
                                return ye.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = l === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let o = r.headers, l = e;
                            if (e === l)
                                if (o && typeof o == "object" && !Array.isArray(o))
                                    for (let m in o) {
                                        return ye.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                else
                                    return ye.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = l === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return ye.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ye.errors = i, e === 0; }
ye.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Mr = Sr, Bt = { type: "object", additionalProperties: !1, properties: { "cache-control": { type: "string", enum: ["no-store"] }, "x-content-type-options": { type: "string", enum: ["nosniff"] } }, required: [] };
function Sr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Sr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p = e;
        for (let d in r)
            if (!(d === "cache-control" || d === "x-content-type-options")) {
                return Sr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: d } }], !1;
                break;
            }
        if (p === e) {
            if (r["cache-control"] !== void 0) {
                let d = r["cache-control"], t = e;
                if (typeof d != "string")
                    return Sr.errors = [{ instancePath: s + "/cache-control", schemaPath: "#/properties/cache-control/type", keyword: "type", params: { type: "string" } }], !1;
                if (d !== "no-store")
                    return Sr.errors = [{ instancePath: s + "/cache-control", schemaPath: "#/properties/cache-control/enum", keyword: "enum", params: { allowedValues: Bt.properties["cache-control"].enum } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
            if (a)
                if (r["x-content-type-options"] !== void 0) {
                    let d = r["x-content-type-options"], t = e;
                    if (typeof d != "string")
                        return Sr.errors = [{ instancePath: s + "/x-content-type-options", schemaPath: "#/properties/x-content-type-options/type", keyword: "type", params: { type: "string" } }], !1;
                    if (d !== "nosniff")
                        return Sr.errors = [{ instancePath: s + "/x-content-type-options", schemaPath: "#/properties/x-content-type-options/enum", keyword: "enum", params: { allowedValues: Bt.properties["x-content-type-options"].enum } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
        }
    }
    else
        return Sr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Sr.errors = i, e === 0; }
Sr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var la = pr;
function fe(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = fe.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r["x-csrf-token"] === void 0 && (p = "x-csrf-token") || r["idempotency-key"] === void 0 && (p = "idempotency-key"))
            return fe.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "x-csrf-token" || t === "idempotency-key")) {
                    return fe.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r["x-csrf-token"] !== void 0) {
                    let t = e;
                    if (typeof r["x-csrf-token"] != "string")
                        return fe.errors = [{ instancePath: s + "/x-csrf-token", schemaPath: "#/properties/x-csrf-token/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r["idempotency-key"] !== void 0) {
                        let t = r["idempotency-key"], o = e;
                        if (e === o)
                            if (typeof t == "string") {
                                if ($(t) > 128)
                                    return fe.errors = [{ instancePath: s + "/idempotency-key", schemaPath: "#/properties/idempotency-key/maxLength", keyword: "maxLength", params: { limit: 128 } }], !1;
                                if ($(t) < 8)
                                    return fe.errors = [{ instancePath: s + "/idempotency-key", schemaPath: "#/properties/idempotency-key/minLength", keyword: "minLength", params: { limit: 8 } }], !1;
                            }
                            else
                                return fe.errors = [{ instancePath: s + "/idempotency-key", schemaPath: "#/properties/idempotency-key/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return fe.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return fe.errors = i, e === 0; }
fe.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function Pe(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Pe.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.code === void 0 && (p = "code") || r.site_code === void 0 && (p = "site_code") || r.redeem_operation === void 0 && (p = "redeem_operation"))
            return Pe.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "code" || t === "site_code" || t === "redeem_operation" || t === "ttl_seconds")) {
                    return Pe.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.code !== void 0) {
                    let t = e;
                    if (typeof r.code != "string")
                        return Pe.errors = [{ instancePath: s + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.site_code !== void 0) {
                        let t = e;
                        if (typeof r.site_code != "string")
                            return Pe.errors = [{ instancePath: s + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = t === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.redeem_operation !== void 0) {
                            let t = e;
                            if (typeof r.redeem_operation != "string")
                                return Pe.errors = [{ instancePath: s + "/redeem_operation", schemaPath: "#/properties/redeem_operation/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.ttl_seconds !== void 0) {
                                let t = r.ttl_seconds, o = e;
                                if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                                    return Pe.errors = [{ instancePath: s + "/ttl_seconds", schemaPath: "#/properties/ttl_seconds/type", keyword: "type", params: { type: "integer" } }], !1;
                                if (e === o && typeof t == "number" && isFinite(t)) {
                                    if (t > 300 || isNaN(t))
                                        return Pe.errors = [{ instancePath: s + "/ttl_seconds", schemaPath: "#/properties/ttl_seconds/maximum", keyword: "maximum", params: { comparison: "<=", limit: 300 } }], !1;
                                    if (t < 1 || isNaN(t))
                                        return Pe.errors = [{ instancePath: s + "/ttl_seconds", schemaPath: "#/properties/ttl_seconds/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 } }], !1;
                                }
                                var a = o === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return Pe.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Pe.errors = i, e === 0; }
Pe.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function pr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = pr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return pr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return pr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return pr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return pr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return pr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return pr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            fe(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? fe.errors : i.concat(fe.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Pe(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Pe.errors : i.concat(Pe.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return pr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return pr.errors = i, e === 0; }
pr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var fa = Oe;
function Oe(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Oe.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.delegation_id === void 0 && (p = "delegation_id") || r.site_code === void 0 && (p = "site_code") || r.client_id === void 0 && (p = "client_id") || r.expires_at === void 0 && (p = "expires_at") || r.idempotent_replay === void 0 && (p = "idempotent_replay") || r.delegation_proof === void 0 && (p = "delegation_proof"))
            return Oe.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "delegation_id" || t === "site_code" || t === "client_id" || t === "expires_at" || t === "idempotent_replay" || t === "delegation_proof")) {
                    return Oe.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.delegation_id !== void 0) {
                    let t = e;
                    if (typeof r.delegation_id != "string")
                        return Oe.errors = [{ instancePath: s + "/delegation_id", schemaPath: "#/properties/delegation_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.site_code !== void 0) {
                        let t = e;
                        if (typeof r.site_code != "string")
                            return Oe.errors = [{ instancePath: s + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = t === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.client_id !== void 0) {
                            let t = e;
                            if (typeof r.client_id != "string")
                                return Oe.errors = [{ instancePath: s + "/client_id", schemaPath: "#/properties/client_id/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.expires_at !== void 0) {
                                let t = e;
                                if (typeof r.expires_at != "string")
                                    return Oe.errors = [{ instancePath: s + "/expires_at", schemaPath: "#/properties/expires_at/type", keyword: "type", params: { type: "string" } }], !1;
                                var a = t === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.idempotent_replay !== void 0) {
                                    let t = e;
                                    if (typeof r.idempotent_replay != "boolean")
                                        return Oe.errors = [{ instancePath: s + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
                                    var a = t === e;
                                }
                                else
                                    var a = !0;
                                if (a)
                                    if (r.delegation_proof !== void 0) {
                                        let t = e;
                                        if (typeof r.delegation_proof != "string")
                                            return Oe.errors = [{ instancePath: s + "/delegation_proof", schemaPath: "#/properties/delegation_proof/type", keyword: "type", params: { type: "string" } }], !1;
                                        var a = t === e;
                                    }
                                    else
                                        var a = !0;
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return Oe.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Oe.errors = i, e === 0; }
Oe.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ya = dr;
function ve(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ve.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.code === void 0 && (p = "code") || r.site_code === void 0 && (p = "site_code"))
            return ve.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "code" || t === "site_code" || t === "user_id" || t === "delegation_proof")) {
                    return ve.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.code !== void 0) {
                    let t = r.code, o = e;
                    if (e === o)
                        if (typeof t == "string") {
                            if ($(t) > 256)
                                return ve.errors = [{ instancePath: s + "/code", schemaPath: "#/properties/code/maxLength", keyword: "maxLength", params: { limit: 256 } }], !1;
                            if ($(t) < 3)
                                return ve.errors = [{ instancePath: s + "/code", schemaPath: "#/properties/code/minLength", keyword: "minLength", params: { limit: 3 } }], !1;
                        }
                        else
                            return ve.errors = [{ instancePath: s + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.site_code !== void 0) {
                        let t = e;
                        if (typeof r.site_code != "string")
                            return ve.errors = [{ instancePath: s + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = t === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.user_id !== void 0) {
                            let t = e;
                            if (typeof r.user_id != "string")
                                return ve.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.delegation_proof !== void 0) {
                                let t = e;
                                if (typeof r.delegation_proof != "string")
                                    return ve.errors = [{ instancePath: s + "/delegation_proof", schemaPath: "#/properties/delegation_proof/type", keyword: "type", params: { type: "string" } }], !1;
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return ve.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ve.errors = i, e === 0; }
ve.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function dr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = dr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return dr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return dr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return dr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return dr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return dr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return dr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                ve(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? ve.errors : i.concat(ve.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return dr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return dr.errors = i, e === 0; }
dr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ua = lr;
var ss = new RegExp("^[A-Za-z0-9_-]+$", "u");
function ke(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ke.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.ticket === void 0 && (p = "ticket") || r.invitation_version === void 0 && (p = "invitation_version"))
            return ke.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "ticket" || t === "invitation_version")) {
                    return ke.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.ticket !== void 0) {
                    let t = r.ticket, o = e;
                    if (e === o)
                        if (typeof t == "string") {
                            if ($(t) > 200)
                                return ke.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/maxLength", keyword: "maxLength", params: { limit: 200 } }], !1;
                            if ($(t) < 32)
                                return ke.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/minLength", keyword: "minLength", params: { limit: 32 } }], !1;
                            if (!ss.test(t))
                                return ke.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]+$" } }], !1;
                        }
                        else
                            return ke.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.invitation_version !== void 0) {
                        let t = r.invitation_version, o = e;
                        if (e === o)
                            if (typeof t == "string") {
                                if (!ot.test(t))
                                    return ke.errors = [{ instancePath: s + "/invitation_version", schemaPath: "#/properties/invitation_version/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]*$" } }], !1;
                            }
                            else
                                return ke.errors = [{ instancePath: s + "/invitation_version", schemaPath: "#/properties/invitation_version/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return ke.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ke.errors = i, e === 0; }
ke.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function lr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = lr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return lr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return lr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return lr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return lr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return lr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return lr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                ke(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? ke.errors : i.concat(ke.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return lr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return lr.errors = i, e === 0; }
lr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ca = T, Gt = { type: "object", additionalProperties: !1, required: ["status", "invitation_id", "user_id", "role", "membership_version", "platform_admin_changed", "idempotent_replay"], properties: { status: { type: "string", enum: ["ok"] }, invitation_id: { type: "string", format: "uuid" }, user_id: { type: "string" }, role: { type: "string", enum: ["owner", "admin", "member"] }, membership_version: { type: "string", pattern: "^[1-9][0-9]*$" }, platform_admin_changed: { type: "boolean", const: !1 }, idempotent_replay: { type: "boolean" } } };
function T(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = T.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status") || r.invitation_id === void 0 && (p = "invitation_id") || r.user_id === void 0 && (p = "user_id") || r.role === void 0 && (p = "role") || r.membership_version === void 0 && (p = "membership_version") || r.platform_admin_changed === void 0 && (p = "platform_admin_changed") || r.idempotent_replay === void 0 && (p = "idempotent_replay"))
            return T.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "status" || t === "invitation_id" || t === "user_id" || t === "role" || t === "membership_version" || t === "platform_admin_changed" || t === "idempotent_replay")) {
                    return T.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.status !== void 0) {
                    let t = r.status, o = e;
                    if (typeof t != "string")
                        return T.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                    if (t !== "ok")
                        return T.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: Gt.properties.status.enum } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.invitation_id !== void 0) {
                        let t = r.invitation_id, o = e;
                        if (e === o && e === o)
                            if (typeof t == "string") {
                                if (!ut.test(t))
                                    return T.errors = [{ instancePath: s + "/invitation_id", schemaPath: "#/properties/invitation_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                            }
                            else
                                return T.errors = [{ instancePath: s + "/invitation_id", schemaPath: "#/properties/invitation_id/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.user_id !== void 0) {
                            let t = e;
                            if (typeof r.user_id != "string")
                                return T.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.role !== void 0) {
                                let t = r.role, o = e;
                                if (typeof t != "string")
                                    return T.errors = [{ instancePath: s + "/role", schemaPath: "#/properties/role/type", keyword: "type", params: { type: "string" } }], !1;
                                if (!(t === "owner" || t === "admin" || t === "member"))
                                    return T.errors = [{ instancePath: s + "/role", schemaPath: "#/properties/role/enum", keyword: "enum", params: { allowedValues: Gt.properties.role.enum } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.membership_version !== void 0) {
                                    let t = r.membership_version, o = e;
                                    if (e === o)
                                        if (typeof t == "string") {
                                            if (!ot.test(t))
                                                return T.errors = [{ instancePath: s + "/membership_version", schemaPath: "#/properties/membership_version/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]*$" } }], !1;
                                        }
                                        else
                                            return T.errors = [{ instancePath: s + "/membership_version", schemaPath: "#/properties/membership_version/type", keyword: "type", params: { type: "string" } }], !1;
                                    var a = o === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.platform_admin_changed !== void 0) {
                                        let t = r.platform_admin_changed, o = e;
                                        if (typeof t != "boolean")
                                            return T.errors = [{ instancePath: s + "/platform_admin_changed", schemaPath: "#/properties/platform_admin_changed/type", keyword: "type", params: { type: "boolean" } }], !1;
                                        if (t !== !1)
                                            return T.errors = [{ instancePath: s + "/platform_admin_changed", schemaPath: "#/properties/platform_admin_changed/const", keyword: "const", params: { allowedValue: !1 } }], !1;
                                        var a = o === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a)
                                        if (r.idempotent_replay !== void 0) {
                                            let t = e;
                                            if (typeof r.idempotent_replay != "boolean")
                                                return T.errors = [{ instancePath: s + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
                                            var a = t === e;
                                        }
                                        else
                                            var a = !0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return T.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return T.errors = i, e === 0; }
T.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ma = Le;
function Fe(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Fe.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.ticket === void 0 && (a = "ticket"))
            return Fe.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        {
            let p = e;
            for (let d in r)
                if (d !== "ticket") {
                    return Fe.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: d } }], !1;
                    break;
                }
            if (p === e && r.ticket !== void 0) {
                let d = r.ticket;
                if (e === e)
                    if (typeof d == "string") {
                        if ($(d) > 200)
                            return Fe.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/maxLength", keyword: "maxLength", params: { limit: 200 } }], !1;
                        if ($(d) < 32)
                            return Fe.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/minLength", keyword: "minLength", params: { limit: 32 } }], !1;
                        if (!ss.test(d))
                            return Fe.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]+$" } }], !1;
                    }
                    else
                        return Fe.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/type", keyword: "type", params: { type: "string" } }], !1;
            }
        }
    }
    else
        return Fe.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Fe.errors = i, e === 0; }
Fe.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function Le(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Le.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return Le.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return Le.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return Le.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return Le.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return Le.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return Le.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return Le.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return Le.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Fe(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Fe.errors : i.concat(Fe.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return Le.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Le.errors = i, e === 0; }
Le.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ha = Z, Wt = { type: "object", additionalProperties: !1, required: ["invitation_id", "invitation_version", "center_name", "email_hint", "role", "expires_at", "proof_required"], properties: { invitation_id: { type: "string", format: "uuid" }, invitation_version: { type: "string", pattern: "^[1-9][0-9]*$" }, center_name: { type: "string" }, email_hint: { type: "string" }, role: { type: "string", enum: ["owner", "admin", "member"] }, expires_at: { type: "string", format: "date-time" }, proof_required: { type: "string", enum: ["fresh_session_and_verified_invited_email"] } } }, yt = It["date-time"];
function Z(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Z.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.invitation_id === void 0 && (p = "invitation_id") || r.invitation_version === void 0 && (p = "invitation_version") || r.center_name === void 0 && (p = "center_name") || r.email_hint === void 0 && (p = "email_hint") || r.role === void 0 && (p = "role") || r.expires_at === void 0 && (p = "expires_at") || r.proof_required === void 0 && (p = "proof_required"))
            return Z.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "invitation_id" || t === "invitation_version" || t === "center_name" || t === "email_hint" || t === "role" || t === "expires_at" || t === "proof_required")) {
                    return Z.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.invitation_id !== void 0) {
                    let t = r.invitation_id, o = e;
                    if (e === o && e === o)
                        if (typeof t == "string") {
                            if (!ut.test(t))
                                return Z.errors = [{ instancePath: s + "/invitation_id", schemaPath: "#/properties/invitation_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                        }
                        else
                            return Z.errors = [{ instancePath: s + "/invitation_id", schemaPath: "#/properties/invitation_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.invitation_version !== void 0) {
                        let t = r.invitation_version, o = e;
                        if (e === o)
                            if (typeof t == "string") {
                                if (!ot.test(t))
                                    return Z.errors = [{ instancePath: s + "/invitation_version", schemaPath: "#/properties/invitation_version/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]*$" } }], !1;
                            }
                            else
                                return Z.errors = [{ instancePath: s + "/invitation_version", schemaPath: "#/properties/invitation_version/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.center_name !== void 0) {
                            let t = e;
                            if (typeof r.center_name != "string")
                                return Z.errors = [{ instancePath: s + "/center_name", schemaPath: "#/properties/center_name/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.email_hint !== void 0) {
                                let t = e;
                                if (typeof r.email_hint != "string")
                                    return Z.errors = [{ instancePath: s + "/email_hint", schemaPath: "#/properties/email_hint/type", keyword: "type", params: { type: "string" } }], !1;
                                var a = t === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.role !== void 0) {
                                    let t = r.role, o = e;
                                    if (typeof t != "string")
                                        return Z.errors = [{ instancePath: s + "/role", schemaPath: "#/properties/role/type", keyword: "type", params: { type: "string" } }], !1;
                                    if (!(t === "owner" || t === "admin" || t === "member"))
                                        return Z.errors = [{ instancePath: s + "/role", schemaPath: "#/properties/role/enum", keyword: "enum", params: { allowedValues: Wt.properties.role.enum } }], !1;
                                    var a = o === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.expires_at !== void 0) {
                                        let t = r.expires_at, o = e;
                                        if (e === o && e === o)
                                            if (typeof t == "string") {
                                                if (!yt.validate(t))
                                                    return Z.errors = [{ instancePath: s + "/expires_at", schemaPath: "#/properties/expires_at/format", keyword: "format", params: { format: "date-time" } }], !1;
                                            }
                                            else
                                                return Z.errors = [{ instancePath: s + "/expires_at", schemaPath: "#/properties/expires_at/type", keyword: "type", params: { type: "string" } }], !1;
                                        var a = o === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a)
                                        if (r.proof_required !== void 0) {
                                            let t = r.proof_required, o = e;
                                            if (typeof t != "string")
                                                return Z.errors = [{ instancePath: s + "/proof_required", schemaPath: "#/properties/proof_required/type", keyword: "type", params: { type: "string" } }], !1;
                                            if (t !== "fresh_session_and_verified_invited_email")
                                                return Z.errors = [{ instancePath: s + "/proof_required", schemaPath: "#/properties/proof_required/enum", keyword: "enum", params: { allowedValues: Wt.properties.proof_required.enum } }], !1;
                                            var a = o === e;
                                        }
                                        else
                                            var a = !0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return Z.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Z.errors = i, e === 0; }
Z.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var _a = fr;
function He(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = He.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.user_code === void 0 && (a = "user_code"))
            return He.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        {
            let p = e;
            for (let d in r)
                if (d !== "user_code") {
                    return He.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: d } }], !1;
                    break;
                }
            if (p === e && r.user_code !== void 0 && typeof r.user_code != "string")
                return He.errors = [{ instancePath: s + "/user_code", schemaPath: "#/properties/user_code/type", keyword: "type", params: { type: "string" } }], !1;
        }
    }
    else
        return He.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return He.errors = i, e === 0; }
He.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function fr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = fr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return fr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return fr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = e;
                    He(r.pathParams, { instancePath: s + "/pathParams", parentData: r, parentDataProperty: "pathParams", rootData: y, dynamicAnchors: c }) || (i = i === null ? He.errors : i.concat(He.errors), e = i.length);
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return fr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return fr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return fr.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return fr.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return fr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return fr.errors = i, e === 0; }
fr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Pa = qe, va = { type: "object", required: ["user_code"], properties: { user_code: { type: "string" }, client_id: { type: "string" }, site_code: { type: "string" }, scope: { type: "array", items: { type: "string" } }, expires_at: { type: "string" }, status: { type: "string", enum: ["pending", "approved", "denied", "expired"] } } };
function qe(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = qe.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.user_code === void 0 && (d = "user_code"))
            return qe.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        if (r.user_code !== void 0) {
            let t = e;
            if (typeof r.user_code != "string")
                return qe.errors = [{ instancePath: s + "/user_code", schemaPath: "#/properties/user_code/type", keyword: "type", params: { type: "string" } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.client_id !== void 0) {
                let t = e;
                if (typeof r.client_id != "string")
                    return qe.errors = [{ instancePath: s + "/client_id", schemaPath: "#/properties/client_id/type", keyword: "type", params: { type: "string" } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.site_code !== void 0) {
                    let t = e;
                    if (typeof r.site_code != "string")
                        return qe.errors = [{ instancePath: s + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.scope !== void 0) {
                        let t = r.scope, o = e;
                        if (e === o)
                            if (Array.isArray(t)) {
                                var p = !0;
                                let f = t.length;
                                for (let m = 0; m < f; m++) {
                                    let _ = e;
                                    if (typeof t[m] != "string")
                                        return qe.errors = [{ instancePath: s + "/scope/" + m, schemaPath: "#/properties/scope/items/type", keyword: "type", params: { type: "string" } }], !1;
                                    var p = _ === e;
                                    if (!p)
                                        break;
                                }
                            }
                            else
                                return qe.errors = [{ instancePath: s + "/scope", schemaPath: "#/properties/scope/type", keyword: "type", params: { type: "array" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.expires_at !== void 0) {
                            let t = e;
                            if (typeof r.expires_at != "string")
                                return qe.errors = [{ instancePath: s + "/expires_at", schemaPath: "#/properties/expires_at/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.status !== void 0) {
                                let t = r.status, o = e;
                                if (typeof t != "string")
                                    return qe.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                if (!(t === "pending" || t === "approved" || t === "denied" || t === "expired"))
                                    return qe.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: va.properties.status.enum } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return qe.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return qe.errors = i, e === 0; }
qe.evaluated = { props: { user_code: !0, client_id: !0, site_code: !0, scope: !0, expires_at: !0, status: !0 }, dynamicProps: !1, dynamicItems: !1 };
var as = zr;
function zr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = zr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return zr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return zr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = e;
                    He(r.pathParams, { instancePath: s + "/pathParams", parentData: r, parentDataProperty: "pathParams", rootData: y, dynamicAnchors: c }) || (i = i === null ? He.errors : i.concat(He.errors), e = i.length);
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return zr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return zr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = r.body, o = e;
                                if (!(t && typeof t == "object" && !Array.isArray(t)))
                                    return zr.errors = [{ instancePath: s + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "object" } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return zr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return zr.errors = i, e === 0; }
zr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ka = yr;
function de(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = de.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.email === void 0 && (p = "email"))
            return de.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "current_password" || t === "totp_code" || t === "email")) {
                    return de.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.current_password !== void 0) {
                    let t = r.current_password, o = e;
                    if (e === o)
                        if (typeof t == "string") {
                            if ($(t) > 1024)
                                return de.errors = [{ instancePath: s + "/current_password", schemaPath: "#/properties/current_password/maxLength", keyword: "maxLength", params: { limit: 1024 } }], !1;
                        }
                        else
                            return de.errors = [{ instancePath: s + "/current_password", schemaPath: "#/properties/current_password/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.totp_code !== void 0) {
                        let t = r.totp_code, o = e;
                        if (e === o)
                            if (typeof t == "string") {
                                if ($(t) > 1024)
                                    return de.errors = [{ instancePath: s + "/totp_code", schemaPath: "#/properties/totp_code/maxLength", keyword: "maxLength", params: { limit: 1024 } }], !1;
                            }
                            else
                                return de.errors = [{ instancePath: s + "/totp_code", schemaPath: "#/properties/totp_code/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.email !== void 0) {
                            let t = r.email, o = e;
                            if (e === o && e === o)
                                if (typeof t == "string") {
                                    if ($(t) > 254)
                                        return de.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/maxLength", keyword: "maxLength", params: { limit: 254 } }], !1;
                                    if (!nt.test(t))
                                        return de.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/format", keyword: "format", params: { format: "email" } }], !1;
                                }
                                else
                                    return de.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return de.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return de.errors = i, e === 0; }
de.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function yr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = yr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return yr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return yr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return yr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return yr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return yr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return yr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                de(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? de.errors : i.concat(de.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return yr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return yr.errors = i, e === 0; }
yr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ga = Ye, ba = { type: "object", additionalProperties: !1, required: ["status", "expires_at"], properties: { status: { type: "string", enum: ["queued"] }, expires_at: { type: "string", format: "date-time" }, idempotent_replay: { type: "boolean" } } };
function Ye(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ye.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status") || r.expires_at === void 0 && (p = "expires_at"))
            return Ye.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "status" || t === "expires_at" || t === "idempotent_replay")) {
                    return Ye.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.status !== void 0) {
                    let t = r.status, o = e;
                    if (typeof t != "string")
                        return Ye.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                    if (t !== "queued")
                        return Ye.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: ba.properties.status.enum } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.expires_at !== void 0) {
                        let t = r.expires_at, o = e;
                        if (e === o && e === o)
                            if (typeof t == "string") {
                                if (!yt.validate(t))
                                    return Ye.errors = [{ instancePath: s + "/expires_at", schemaPath: "#/properties/expires_at/format", keyword: "format", params: { format: "date-time" } }], !1;
                            }
                            else
                                return Ye.errors = [{ instancePath: s + "/expires_at", schemaPath: "#/properties/expires_at/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.idempotent_replay !== void 0) {
                            let t = e;
                            if (typeof r.idempotent_replay != "boolean")
                                return Ye.errors = [{ instancePath: s + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return Ye.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ye.errors = i, e === 0; }
Ye.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var wa = ur;
var qa = new RegExp("^[A-Za-z0-9_-]{43}\\.[A-Za-z0-9_-]{43}$", "u");
function J(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = J.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.ticket === void 0 && (p = "ticket"))
            return J.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "current_password" || t === "totp_code" || t === "ticket")) {
                    return J.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.current_password !== void 0) {
                    let t = r.current_password, o = e;
                    if (e === o)
                        if (typeof t == "string") {
                            if ($(t) > 1024)
                                return J.errors = [{ instancePath: s + "/current_password", schemaPath: "#/properties/current_password/maxLength", keyword: "maxLength", params: { limit: 1024 } }], !1;
                        }
                        else
                            return J.errors = [{ instancePath: s + "/current_password", schemaPath: "#/properties/current_password/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.totp_code !== void 0) {
                        let t = r.totp_code, o = e;
                        if (e === o)
                            if (typeof t == "string") {
                                if ($(t) > 1024)
                                    return J.errors = [{ instancePath: s + "/totp_code", schemaPath: "#/properties/totp_code/maxLength", keyword: "maxLength", params: { limit: 1024 } }], !1;
                            }
                            else
                                return J.errors = [{ instancePath: s + "/totp_code", schemaPath: "#/properties/totp_code/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.ticket !== void 0) {
                            let t = r.ticket, o = e;
                            if (e === o)
                                if (typeof t == "string") {
                                    if ($(t) > 87)
                                        return J.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/maxLength", keyword: "maxLength", params: { limit: 87 } }], !1;
                                    if ($(t) < 87)
                                        return J.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/minLength", keyword: "minLength", params: { limit: 87 } }], !1;
                                    if (!qa.test(t))
                                        return J.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]{43}\\.[A-Za-z0-9_-]{43}$" } }], !1;
                                }
                                else
                                    return J.errors = [{ instancePath: s + "/ticket", schemaPath: "#/properties/ticket/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return J.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return J.errors = i, e === 0; }
J.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function ur(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ur.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return ur.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return ur.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return ur.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return ur.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return ur.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return ur.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                J(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? J.errors : i.concat(J.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return ur.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ur.errors = i, e === 0; }
ur.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var is = ae, ja = { type: "object", additionalProperties: !1, required: ["status", "email", "email_verified", "current_session_preserved", "reauthenticate_applications"], properties: { status: { type: "string", enum: ["ok"] }, email: { anyOf: [{ type: "string", format: "email" }, { type: "null" }] }, email_verified: { type: "boolean" }, current_session_preserved: { type: "boolean", const: !0 }, reauthenticate_applications: { type: "boolean", const: !0 }, idempotent_replay: { type: "boolean" } } };
function ae(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ae.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.status === void 0 && (d = "status") || r.email === void 0 && (d = "email") || r.email_verified === void 0 && (d = "email_verified") || r.current_session_preserved === void 0 && (d = "current_session_preserved") || r.reauthenticate_applications === void 0 && (d = "reauthenticate_applications"))
            return ae.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = e;
            for (let o in r)
                if (!(o === "status" || o === "email" || o === "email_verified" || o === "current_session_preserved" || o === "reauthenticate_applications" || o === "idempotent_replay")) {
                    return ae.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (t === e) {
                if (r.status !== void 0) {
                    let o = r.status, l = e;
                    if (typeof o != "string")
                        return ae.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                    if (o !== "ok")
                        return ae.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: ja.properties.status.enum } }], !1;
                    var a = l === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.email !== void 0) {
                        let o = r.email, l = e, f = e, m = !1, _ = e;
                        if (e === _ && e === _)
                            if (typeof o == "string") {
                                if (!nt.test(o)) {
                                    let b = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf/0/format", keyword: "format", params: { format: "email" } };
                                    i === null ? i = [b] : i.push(b), e++;
                                }
                            }
                            else {
                                let b = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                i === null ? i = [b] : i.push(b), e++;
                            }
                        var p = _ === e;
                        m = m || p;
                        let u = e;
                        if (o !== null) {
                            let b = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf/1/type", keyword: "type", params: { type: "null" } };
                            i === null ? i = [b] : i.push(b), e++;
                        }
                        var p = u === e;
                        if (m = m || p, m)
                            e = f, i !== null && (f ? i.length = f : i = null);
                        else {
                            let b = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf", keyword: "anyOf", params: {} };
                            return i === null ? i = [b] : i.push(b), e++, ae.errors = i, !1;
                        }
                        var a = l === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.email_verified !== void 0) {
                            let o = e;
                            if (typeof r.email_verified != "boolean")
                                return ae.errors = [{ instancePath: s + "/email_verified", schemaPath: "#/properties/email_verified/type", keyword: "type", params: { type: "boolean" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.current_session_preserved !== void 0) {
                                let o = r.current_session_preserved, l = e;
                                if (typeof o != "boolean")
                                    return ae.errors = [{ instancePath: s + "/current_session_preserved", schemaPath: "#/properties/current_session_preserved/type", keyword: "type", params: { type: "boolean" } }], !1;
                                if (o !== !0)
                                    return ae.errors = [{ instancePath: s + "/current_session_preserved", schemaPath: "#/properties/current_session_preserved/const", keyword: "const", params: { allowedValue: !0 } }], !1;
                                var a = l === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.reauthenticate_applications !== void 0) {
                                    let o = r.reauthenticate_applications, l = e;
                                    if (typeof o != "boolean")
                                        return ae.errors = [{ instancePath: s + "/reauthenticate_applications", schemaPath: "#/properties/reauthenticate_applications/type", keyword: "type", params: { type: "boolean" } }], !1;
                                    if (o !== !0)
                                        return ae.errors = [{ instancePath: s + "/reauthenticate_applications", schemaPath: "#/properties/reauthenticate_applications/const", keyword: "const", params: { allowedValue: !0 } }], !1;
                                    var a = l === e;
                                }
                                else
                                    var a = !0;
                                if (a)
                                    if (r.idempotent_replay !== void 0) {
                                        let o = e;
                                        if (typeof r.idempotent_replay != "boolean")
                                            return ae.errors = [{ instancePath: s + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
                                        var a = o === e;
                                    }
                                    else
                                        var a = !0;
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return ae.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ae.errors = i, e === 0; }
ae.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Aa = cr;
function B(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = B.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p = e;
        for (let d in r)
            if (!(d === "current_password" || d === "totp_code")) {
                return B.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: d } }], !1;
                break;
            }
        if (p === e) {
            if (r.current_password !== void 0) {
                let d = r.current_password, t = e;
                if (e === t)
                    if (typeof d == "string") {
                        if ($(d) > 1024)
                            return B.errors = [{ instancePath: s + "/current_password", schemaPath: "#/properties/current_password/maxLength", keyword: "maxLength", params: { limit: 1024 } }], !1;
                    }
                    else
                        return B.errors = [{ instancePath: s + "/current_password", schemaPath: "#/properties/current_password/type", keyword: "type", params: { type: "string" } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
            if (a)
                if (r.totp_code !== void 0) {
                    let d = r.totp_code, t = e;
                    if (e === t)
                        if (typeof d == "string") {
                            if ($(d) > 1024)
                                return B.errors = [{ instancePath: s + "/totp_code", schemaPath: "#/properties/totp_code/maxLength", keyword: "maxLength", params: { limit: 1024 } }], !1;
                        }
                        else
                            return B.errors = [{ instancePath: s + "/totp_code", schemaPath: "#/properties/totp_code/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
        }
    }
    else
        return B.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return B.errors = i, e === 0; }
B.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function cr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = cr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return cr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return cr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return cr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return cr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return cr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return cr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                B(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? B.errors : i.concat(B.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return cr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return cr.errors = i, e === 0; }
cr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Da = mr;
function mr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = mr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let o;
        if (r.user_id === void 0 && (o = "user_id") || r.group === void 0 && (o = "group") || r.title === void 0 && (o = "title") || r.remote_effects === void 0 && (o = "remote_effects"))
            return mr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: o } }], !1;
        {
            let l = e;
            for (let f in r)
                if (!(f === "user_id" || f === "group" || f === "title" || f === "remote_effects")) {
                    return mr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                    break;
                }
            if (l === e) {
                if (r.user_id !== void 0) {
                    let f = e;
                    if (typeof r.user_id != "string")
                        return mr.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = f === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.group !== void 0) {
                        let f = r.group, m = e, _ = e, u = !1, k = e;
                        z(f, { instancePath: s + "/group", parentData: r, parentDataProperty: "group", rootData: y, dynamicAnchors: c }) || (i = i === null ? z.errors : i.concat(z.errors), e = i.length);
                        var p = k === e;
                        u = u || p;
                        let b = e;
                        if (f !== null) {
                            let w = { instancePath: s + "/group", schemaPath: "#/properties/group/anyOf/1/type", keyword: "type", params: { type: "null" } };
                            i === null ? i = [w] : i.push(w), e++;
                        }
                        var p = b === e;
                        if (u = u || p, u)
                            e = _, i !== null && (_ ? i.length = _ : i = null);
                        else {
                            let w = { instancePath: s + "/group", schemaPath: "#/properties/group/anyOf", keyword: "anyOf", params: {} };
                            return i === null ? i = [w] : i.push(w), e++, mr.errors = i, !1;
                        }
                        var a = m === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.title !== void 0) {
                            let f = r.title, m = e, _ = e, u = !1, k = e;
                            z(f, { instancePath: s + "/title", parentData: r, parentDataProperty: "title", rootData: y, dynamicAnchors: c }) || (i = i === null ? z.errors : i.concat(z.errors), e = i.length);
                            var d = k === e;
                            u = u || d;
                            let b = e;
                            if (f !== null) {
                                let w = { instancePath: s + "/title", schemaPath: "#/properties/title/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                i === null ? i = [w] : i.push(w), e++;
                            }
                            var d = b === e;
                            if (u = u || d, u)
                                e = _, i !== null && (_ ? i.length = _ : i = null);
                            else {
                                let w = { instancePath: s + "/title", schemaPath: "#/properties/title/anyOf", keyword: "anyOf", params: {} };
                                return i === null ? i = [w] : i.push(w), e++, mr.errors = i, !1;
                            }
                            var a = m === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.remote_effects !== void 0) {
                                let f = r.remote_effects, m = e;
                                if (e === m)
                                    if (Array.isArray(f)) {
                                        var t = !0;
                                        let u = f.length;
                                        for (let k = 0; k < u; k++) {
                                            let b = e;
                                            H(f[k], { instancePath: s + "/remote_effects/" + k, parentData: f, parentDataProperty: k, rootData: y, dynamicAnchors: c }) || (i = i === null ? H.errors : i.concat(H.errors), e = i.length);
                                            var t = b === e;
                                            if (!t)
                                                break;
                                        }
                                    }
                                    else
                                        return mr.errors = [{ instancePath: s + "/remote_effects", schemaPath: "#/properties/remote_effects/type", keyword: "type", params: { type: "array" } }], !1;
                                var a = m === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return mr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return mr.errors = i, e === 0; }
mr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var xa = et;
function C(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = C.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let t;
        if (r.id === void 0 && (t = "id") || r.provider === void 0 && (t = "provider") || r.account_label === void 0 && (t = "account_label") || r.email === void 0 && (t = "email") || r.email_verified === void 0 && (t = "email_verified") || r.created_at === void 0 && (t = "created_at") || r.last_login_at === void 0 && (t = "last_login_at"))
            return C.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: t } }], !1;
        {
            let o = e;
            for (let l in r)
                if (!(l === "id" || l === "provider" || l === "account_label" || l === "email" || l === "email_verified" || l === "created_at" || l === "last_login_at")) {
                    return C.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                    break;
                }
            if (o === e) {
                if (r.id !== void 0) {
                    let l = r.id, f = e;
                    if (e === f && e === f)
                        if (typeof l == "string") {
                            if (!ut.test(l))
                                return C.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" } }], !1;
                        }
                        else
                            return C.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = f === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.provider !== void 0) {
                        let l = e;
                        if (typeof r.provider != "string")
                            return C.errors = [{ instancePath: s + "/provider", schemaPath: "#/properties/provider/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = l === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.account_label !== void 0) {
                            let l = e;
                            if (typeof r.account_label != "string")
                                return C.errors = [{ instancePath: s + "/account_label", schemaPath: "#/properties/account_label/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = l === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.email !== void 0) {
                                let l = r.email, f = e, m = e, _ = !1, u = e;
                                if (e === u && e === u)
                                    if (typeof l == "string") {
                                        if (!nt.test(l)) {
                                            let g = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf/0/format", keyword: "format", params: { format: "email" } };
                                            i === null ? i = [g] : i.push(g), e++;
                                        }
                                    }
                                    else {
                                        let g = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                        i === null ? i = [g] : i.push(g), e++;
                                    }
                                var p = u === e;
                                _ = _ || p;
                                let k = e;
                                if (l !== null) {
                                    let g = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                    i === null ? i = [g] : i.push(g), e++;
                                }
                                var p = k === e;
                                if (_ = _ || p, _)
                                    e = m, i !== null && (m ? i.length = m : i = null);
                                else {
                                    let g = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf", keyword: "anyOf", params: {} };
                                    return i === null ? i = [g] : i.push(g), e++, C.errors = i, !1;
                                }
                                var a = f === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.email_verified !== void 0) {
                                    let l = e;
                                    if (typeof r.email_verified != "boolean")
                                        return C.errors = [{ instancePath: s + "/email_verified", schemaPath: "#/properties/email_verified/type", keyword: "type", params: { type: "boolean" } }], !1;
                                    var a = l === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.created_at !== void 0) {
                                        let l = r.created_at, f = e;
                                        if (e === f && e === f)
                                            if (typeof l == "string") {
                                                if (!yt.validate(l))
                                                    return C.errors = [{ instancePath: s + "/created_at", schemaPath: "#/properties/created_at/format", keyword: "format", params: { format: "date-time" } }], !1;
                                            }
                                            else
                                                return C.errors = [{ instancePath: s + "/created_at", schemaPath: "#/properties/created_at/type", keyword: "type", params: { type: "string" } }], !1;
                                        var a = f === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a)
                                        if (r.last_login_at !== void 0) {
                                            let l = r.last_login_at, f = e, m = e, _ = !1, u = e;
                                            if (e === u && e === u)
                                                if (typeof l == "string") {
                                                    if (!yt.validate(l)) {
                                                        let g = { instancePath: s + "/last_login_at", schemaPath: "#/properties/last_login_at/anyOf/0/format", keyword: "format", params: { format: "date-time" } };
                                                        i === null ? i = [g] : i.push(g), e++;
                                                    }
                                                }
                                                else {
                                                    let g = { instancePath: s + "/last_login_at", schemaPath: "#/properties/last_login_at/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                    i === null ? i = [g] : i.push(g), e++;
                                                }
                                            var d = u === e;
                                            _ = _ || d;
                                            let k = e;
                                            if (l !== null) {
                                                let g = { instancePath: s + "/last_login_at", schemaPath: "#/properties/last_login_at/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                i === null ? i = [g] : i.push(g), e++;
                                            }
                                            var d = k === e;
                                            if (_ = _ || d, _)
                                                e = m, i !== null && (m ? i.length = m : i = null);
                                            else {
                                                let g = { instancePath: s + "/last_login_at", schemaPath: "#/properties/last_login_at/anyOf", keyword: "anyOf", params: {} };
                                                return i === null ? i = [g] : i.push(g), e++, C.errors = i, !1;
                                            }
                                            var a = f === e;
                                        }
                                        else
                                            var a = !0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return C.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return C.errors = i, e === 0; }
C.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function et(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = et.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.items === void 0 && (p = "items"))
            return et.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (t !== "items") {
                    return et.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e && r.items !== void 0) {
                let t = r.items;
                if (e === e)
                    if (Array.isArray(t)) {
                        var a = !0;
                        let l = t.length;
                        for (let f = 0; f < l; f++) {
                            let m = e;
                            C(t[f], { instancePath: s + "/items/" + f, parentData: t, parentDataProperty: f, rootData: y, dynamicAnchors: c }) || (i = i === null ? C.errors : i.concat(C.errors), e = i.length);
                            var a = m === e;
                            if (!a)
                                break;
                        }
                    }
                    else
                        return et.errors = [{ instancePath: s + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" } }], !1;
            }
        }
    }
    else
        return et.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return et.errors = i, e === 0; }
et.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ia = Hr;
function qr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = qr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.id === void 0 && (a = "id"))
            return qr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        {
            let p = e;
            for (let d in r)
                if (d !== "id") {
                    return qr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: d } }], !1;
                    break;
                }
            if (p === e && r.id !== void 0) {
                let d = r.id, t = e;
                if (e === t && e === t)
                    if (typeof d == "string") {
                        if (!ut.test(d))
                            return qr.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/format", keyword: "format", params: { format: "uuid" } }], !1;
                    }
                    else
                        return qr.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
            }
        }
    }
    else
        return qr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return qr.errors = i, e === 0; }
qr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function Hr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Hr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return Hr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return Hr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = e;
                    qr(r.pathParams, { instancePath: s + "/pathParams", parentData: r, parentDataProperty: "pathParams", rootData: y, dynamicAnchors: c }) || (i = i === null ? qr.errors : i.concat(qr.errors), e = i.length);
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return Hr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return Hr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                B(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? B.errors : i.concat(B.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return Hr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Hr.errors = i, e === 0; }
Hr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var $a = ue, Ea = { type: "object", additionalProperties: !1, required: ["status", "current_session_preserved", "reauthenticate_applications", "identity_id"], properties: { status: { type: "string", enum: ["ok"] }, current_session_preserved: { type: "boolean", const: !0 }, reauthenticate_applications: { type: "boolean" }, identity_id: { type: "string", format: "uuid" }, idempotent_replay: { type: "boolean" } } };
function ue(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ue.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status") || r.current_session_preserved === void 0 && (p = "current_session_preserved") || r.reauthenticate_applications === void 0 && (p = "reauthenticate_applications") || r.identity_id === void 0 && (p = "identity_id"))
            return ue.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "status" || t === "current_session_preserved" || t === "reauthenticate_applications" || t === "identity_id" || t === "idempotent_replay")) {
                    return ue.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.status !== void 0) {
                    let t = r.status, o = e;
                    if (typeof t != "string")
                        return ue.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                    if (t !== "ok")
                        return ue.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: Ea.properties.status.enum } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.current_session_preserved !== void 0) {
                        let t = r.current_session_preserved, o = e;
                        if (typeof t != "boolean")
                            return ue.errors = [{ instancePath: s + "/current_session_preserved", schemaPath: "#/properties/current_session_preserved/type", keyword: "type", params: { type: "boolean" } }], !1;
                        if (t !== !0)
                            return ue.errors = [{ instancePath: s + "/current_session_preserved", schemaPath: "#/properties/current_session_preserved/const", keyword: "const", params: { allowedValue: !0 } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.reauthenticate_applications !== void 0) {
                            let t = e;
                            if (typeof r.reauthenticate_applications != "boolean")
                                return ue.errors = [{ instancePath: s + "/reauthenticate_applications", schemaPath: "#/properties/reauthenticate_applications/type", keyword: "type", params: { type: "boolean" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.identity_id !== void 0) {
                                let t = r.identity_id, o = e;
                                if (e === o && e === o)
                                    if (typeof t == "string") {
                                        if (!ut.test(t))
                                            return ue.errors = [{ instancePath: s + "/identity_id", schemaPath: "#/properties/identity_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                                    }
                                    else
                                        return ue.errors = [{ instancePath: s + "/identity_id", schemaPath: "#/properties/identity_id/type", keyword: "type", params: { type: "string" } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                            if (a)
                                if (r.idempotent_replay !== void 0) {
                                    let t = e;
                                    if (typeof r.idempotent_replay != "boolean")
                                        return ue.errors = [{ instancePath: s + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
                                    var a = t === e;
                                }
                                else
                                    var a = !0;
                        }
                    }
                }
            }
        }
    }
    else
        return ue.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ue.errors = i, e === 0; }
ue.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Oa = ie;
function ie(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ie.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return ie.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return ie.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t)) {
                            let l;
                            if (t.provider === void 0 && (l = "provider"))
                                return ie.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/required", keyword: "required", params: { missingProperty: l } }], !1;
                            {
                                let f = e;
                                for (let m in t)
                                    if (m !== "provider") {
                                        return ie.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                if (f === e && t.provider !== void 0) {
                                    let m = t.provider;
                                    if (e === e)
                                        if (typeof m == "string") {
                                            if ($(m) > 64)
                                                return ie.errors = [{ instancePath: s + "/pathParams/provider", schemaPath: "#/properties/pathParams/properties/provider/maxLength", keyword: "maxLength", params: { limit: 64 } }], !1;
                                        }
                                        else
                                            return ie.errors = [{ instancePath: s + "/pathParams/provider", schemaPath: "#/properties/pathParams/properties/provider/type", keyword: "type", params: { type: "string" } }], !1;
                                }
                            }
                        }
                        else
                            return ie.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return ie.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return ie.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return ie.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return ie.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Dr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Dr.errors : i.concat(Dr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return ie.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ie.errors = i, e === 0; }
ie.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var La = hr;
var os = It.uri;
function hr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = hr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.authorization_url === void 0 && (p = "authorization_url") || r.expires_in === void 0 && (p = "expires_in"))
            return hr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "authorization_url" || t === "expires_in")) {
                    return hr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.authorization_url !== void 0) {
                    let t = r.authorization_url, o = e;
                    if (e === o && e === o)
                        if (typeof t == "string") {
                            if (!os(t))
                                return hr.errors = [{ instancePath: s + "/authorization_url", schemaPath: "#/properties/authorization_url/format", keyword: "format", params: { format: "uri" } }], !1;
                        }
                        else
                            return hr.errors = [{ instancePath: s + "/authorization_url", schemaPath: "#/properties/authorization_url/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.expires_in !== void 0) {
                        let t = r.expires_in, o = e;
                        if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                            return hr.errors = [{ instancePath: s + "/expires_in", schemaPath: "#/properties/expires_in/type", keyword: "type", params: { type: "integer" } }], !1;
                        if (t !== 300)
                            return hr.errors = [{ instancePath: s + "/expires_in", schemaPath: "#/properties/expires_in/const", keyword: "const", params: { allowedValue: 300 } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return hr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return hr.errors = i, e === 0; }
hr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Sa = _r;
function _r(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = _r.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.user_id === void 0 && (p = "user_id") || r.aff_code === void 0 && (p = "aff_code") || r.aff_version === void 0 && (p = "aff_version"))
            return _r.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "user_id" || t === "aff_code" || t === "aff_version")) {
                    return _r.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.user_id !== void 0) {
                    let t = e;
                    if (typeof r.user_id != "string")
                        return _r.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.aff_code !== void 0) {
                        let t = e;
                        if (typeof r.aff_code != "string")
                            return _r.errors = [{ instancePath: s + "/aff_code", schemaPath: "#/properties/aff_code/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = t === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.aff_version !== void 0) {
                            let t = r.aff_version, o = e;
                            if (e === o)
                                if (typeof t == "string") {
                                    if (!ot.test(t))
                                        return _r.errors = [{ instancePath: s + "/aff_version", schemaPath: "#/properties/aff_version/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]*$" } }], !1;
                                }
                                else
                                    return _r.errors = [{ instancePath: s + "/aff_version", schemaPath: "#/properties/aff_version/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return _r.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return _r.errors = i, e === 0; }
_r.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var za = Pr;
var Va = new RegExp("^[A-Za-z0-9_-]{4,32}$", "u");
function Te(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Te.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.aff_code === void 0 && (p = "aff_code") || r.expected_version === void 0 && (p = "expected_version"))
            return Te.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "aff_code" || t === "expected_version")) {
                    return Te.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.aff_code !== void 0) {
                    let t = r.aff_code, o = e;
                    if (e === o)
                        if (typeof t == "string") {
                            if (!Va.test(t))
                                return Te.errors = [{ instancePath: s + "/aff_code", schemaPath: "#/properties/aff_code/pattern", keyword: "pattern", params: { pattern: "^[A-Za-z0-9_-]{4,32}$" } }], !1;
                        }
                        else
                            return Te.errors = [{ instancePath: s + "/aff_code", schemaPath: "#/properties/aff_code/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.expected_version !== void 0) {
                        let t = r.expected_version, o = e;
                        if (e === o)
                            if (typeof t == "string") {
                                if (!ot.test(t))
                                    return Te.errors = [{ instancePath: s + "/expected_version", schemaPath: "#/properties/expected_version/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]*$" } }], !1;
                            }
                            else
                                return Te.errors = [{ instancePath: s + "/expected_version", schemaPath: "#/properties/expected_version/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return Te.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Te.errors = i, e === 0; }
Te.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function Pr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Pr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return Pr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return Pr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return Pr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return Pr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return Pr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return Pr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            fe(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? fe.errors : i.concat(fe.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Te(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Te.errors : i.concat(Te.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return Pr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Pr.errors = i, e === 0; }
Pr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Na = G, Ca = { type: "object", additionalProperties: !1, required: ["user_id", "aff_code", "aff_version", "center_changed", "downstream_status", "updated_site_rows", "idempotent_replay"], properties: { user_id: { type: "string" }, aff_code: { type: "string" }, aff_version: { type: "string", pattern: "^[1-9][0-9]*$" }, center_changed: { type: "boolean" }, downstream_status: { type: "string", enum: ["pending", "blocked"] }, updated_site_rows: { type: "integer", minimum: 0 }, idempotent_replay: { type: "boolean" } } };
function G(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = G.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.user_id === void 0 && (p = "user_id") || r.aff_code === void 0 && (p = "aff_code") || r.aff_version === void 0 && (p = "aff_version") || r.center_changed === void 0 && (p = "center_changed") || r.downstream_status === void 0 && (p = "downstream_status") || r.updated_site_rows === void 0 && (p = "updated_site_rows") || r.idempotent_replay === void 0 && (p = "idempotent_replay"))
            return G.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "user_id" || t === "aff_code" || t === "aff_version" || t === "center_changed" || t === "downstream_status" || t === "updated_site_rows" || t === "idempotent_replay")) {
                    return G.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.user_id !== void 0) {
                    let t = e;
                    if (typeof r.user_id != "string")
                        return G.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.aff_code !== void 0) {
                        let t = e;
                        if (typeof r.aff_code != "string")
                            return G.errors = [{ instancePath: s + "/aff_code", schemaPath: "#/properties/aff_code/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = t === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.aff_version !== void 0) {
                            let t = r.aff_version, o = e;
                            if (e === o)
                                if (typeof t == "string") {
                                    if (!ot.test(t))
                                        return G.errors = [{ instancePath: s + "/aff_version", schemaPath: "#/properties/aff_version/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]*$" } }], !1;
                                }
                                else
                                    return G.errors = [{ instancePath: s + "/aff_version", schemaPath: "#/properties/aff_version/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.center_changed !== void 0) {
                                let t = e;
                                if (typeof r.center_changed != "boolean")
                                    return G.errors = [{ instancePath: s + "/center_changed", schemaPath: "#/properties/center_changed/type", keyword: "type", params: { type: "boolean" } }], !1;
                                var a = t === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.downstream_status !== void 0) {
                                    let t = r.downstream_status, o = e;
                                    if (typeof t != "string")
                                        return G.errors = [{ instancePath: s + "/downstream_status", schemaPath: "#/properties/downstream_status/type", keyword: "type", params: { type: "string" } }], !1;
                                    if (!(t === "pending" || t === "blocked"))
                                        return G.errors = [{ instancePath: s + "/downstream_status", schemaPath: "#/properties/downstream_status/enum", keyword: "enum", params: { allowedValues: Ca.properties.downstream_status.enum } }], !1;
                                    var a = o === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.updated_site_rows !== void 0) {
                                        let t = r.updated_site_rows, o = e;
                                        if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                                            return G.errors = [{ instancePath: s + "/updated_site_rows", schemaPath: "#/properties/updated_site_rows/type", keyword: "type", params: { type: "integer" } }], !1;
                                        if (e === o && typeof t == "number" && isFinite(t) && (t < 0 || isNaN(t)))
                                            return G.errors = [{ instancePath: s + "/updated_site_rows", schemaPath: "#/properties/updated_site_rows/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                        var a = o === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a)
                                        if (r.idempotent_replay !== void 0) {
                                            let t = e;
                                            if (typeof r.idempotent_replay != "boolean")
                                                return G.errors = [{ instancePath: s + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
                                            var a = t === e;
                                        }
                                        else
                                            var a = !0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return G.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return G.errors = i, e === 0; }
G.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ns = N;
function N(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = N.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.user_id === void 0 && (d = "user_id"))
            return N.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        if (r.user_id !== void 0) {
            let t = e;
            if (typeof r.user_id != "string")
                return N.errors = [{ instancePath: s + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.username !== void 0) {
                let t = e;
                if (typeof r.username != "string")
                    return N.errors = [{ instancePath: s + "/username", schemaPath: "#/properties/username/type", keyword: "type", params: { type: "string" } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.preferred_username !== void 0) {
                    let t = e;
                    if (typeof r.preferred_username != "string")
                        return N.errors = [{ instancePath: s + "/preferred_username", schemaPath: "#/properties/preferred_username/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.display_name !== void 0) {
                        let t = e;
                        if (typeof r.display_name != "string")
                            return N.errors = [{ instancePath: s + "/display_name", schemaPath: "#/properties/display_name/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = t === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.email !== void 0) {
                            let t = e;
                            if (typeof r.email != "string")
                                return N.errors = [{ instancePath: s + "/email", schemaPath: "#/properties/email/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.email_verified !== void 0) {
                                let t = e;
                                if (typeof r.email_verified != "boolean")
                                    return N.errors = [{ instancePath: s + "/email_verified", schemaPath: "#/properties/email_verified/type", keyword: "type", params: { type: "boolean" } }], !1;
                                var a = t === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.site_code !== void 0) {
                                    let t = e;
                                    if (typeof r.site_code != "string")
                                        return N.errors = [{ instancePath: s + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                                    var a = t === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.roles !== void 0) {
                                        let t = r.roles, o = e;
                                        if (e === o)
                                            if (Array.isArray(t)) {
                                                var p = !0;
                                                let f = t.length;
                                                for (let m = 0; m < f; m++) {
                                                    let _ = e;
                                                    if (typeof t[m] != "string")
                                                        return N.errors = [{ instancePath: s + "/roles/" + m, schemaPath: "#/properties/roles/items/type", keyword: "type", params: { type: "string" } }], !1;
                                                    var p = _ === e;
                                                    if (!p)
                                                        break;
                                                }
                                            }
                                            else
                                                return N.errors = [{ instancePath: s + "/roles", schemaPath: "#/properties/roles/type", keyword: "type", params: { type: "array" } }], !1;
                                        var a = o === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a) {
                                        if (r.status !== void 0) {
                                            let t = e;
                                            if (typeof r.status != "string")
                                                return N.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                            var a = t === e;
                                        }
                                        else
                                            var a = !0;
                                        if (a) {
                                            if (r.has_totp !== void 0) {
                                                let t = e;
                                                if (typeof r.has_totp != "boolean")
                                                    return N.errors = [{ instancePath: s + "/has_totp", schemaPath: "#/properties/has_totp/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                var a = t === e;
                                            }
                                            else
                                                var a = !0;
                                            if (a) {
                                                if (r.mfa_enabled !== void 0) {
                                                    let t = e;
                                                    if (typeof r.mfa_enabled != "boolean")
                                                        return N.errors = [{ instancePath: s + "/mfa_enabled", schemaPath: "#/properties/mfa_enabled/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                    var a = t === e;
                                                }
                                                else
                                                    var a = !0;
                                                if (a) {
                                                    if (r.passkey_count !== void 0) {
                                                        let t = r.passkey_count, o = e;
                                                        if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                                                            return N.errors = [{ instancePath: s + "/passkey_count", schemaPath: "#/properties/passkey_count/type", keyword: "type", params: { type: "integer" } }], !1;
                                                        var a = o === e;
                                                    }
                                                    else
                                                        var a = !0;
                                                    if (a) {
                                                        if (r.avatar_url !== void 0) {
                                                            let t = e;
                                                            if (typeof r.avatar_url != "string")
                                                                return N.errors = [{ instancePath: s + "/avatar_url", schemaPath: "#/properties/avatar_url/type", keyword: "type", params: { type: "string" } }], !1;
                                                            var a = t === e;
                                                        }
                                                        else
                                                            var a = !0;
                                                        if (a) {
                                                            if (r.locale !== void 0) {
                                                                let t = e;
                                                                if (typeof r.locale != "string")
                                                                    return N.errors = [{ instancePath: s + "/locale", schemaPath: "#/properties/locale/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var a = t === e;
                                                            }
                                                            else
                                                                var a = !0;
                                                            if (a) {
                                                                if (r.aff_code !== void 0) {
                                                                    let t = e;
                                                                    if (typeof r.aff_code != "string")
                                                                        return N.errors = [{ instancePath: s + "/aff_code", schemaPath: "#/properties/aff_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                                    var a = t === e;
                                                                }
                                                                else
                                                                    var a = !0;
                                                                if (a)
                                                                    if (r.created_at !== void 0) {
                                                                        let t = e;
                                                                        if (typeof r.created_at != "string")
                                                                            return N.errors = [{ instancePath: s + "/created_at", schemaPath: "#/properties/created_at/type", keyword: "type", params: { type: "string" } }], !1;
                                                                        var a = t === e;
                                                                    }
                                                                    else
                                                                        var a = !0;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return N.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return N.errors = i, e === 0; }
N.evaluated = { props: { user_id: !0, username: !0, preferred_username: !0, display_name: !0, email: !0, email_verified: !0, site_code: !0, roles: !0, status: !0, has_totp: !0, mfa_enabled: !0, passkey_count: !0, avatar_url: !0, locale: !0, aff_code: !0, created_at: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Ka = Se;
function Ze(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ze.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.display_name !== void 0) {
            let p = e;
            if (typeof r.display_name != "string")
                return Ze.errors = [{ instancePath: s + "/display_name", schemaPath: "#/properties/display_name/type", keyword: "type", params: { type: "string" } }], !1;
            var a = p === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.avatar_url !== void 0) {
                let p = e;
                if (typeof r.avatar_url != "string")
                    return Ze.errors = [{ instancePath: s + "/avatar_url", schemaPath: "#/properties/avatar_url/type", keyword: "type", params: { type: "string" } }], !1;
                var a = p === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.locale !== void 0) {
                    let p = e;
                    if (typeof r.locale != "string")
                        return Ze.errors = [{ instancePath: s + "/locale", schemaPath: "#/properties/locale/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = p === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.username !== void 0) {
                        let p = r.username, d = e;
                        if (e === d)
                            if (typeof p == "string") {
                                if ($(p) > 256)
                                    return Ze.errors = [{ instancePath: s + "/username", schemaPath: "#/properties/username/maxLength", keyword: "maxLength", params: { limit: 256 } }], !1;
                                if ($(p) < 3)
                                    return Ze.errors = [{ instancePath: s + "/username", schemaPath: "#/properties/username/minLength", keyword: "minLength", params: { limit: 3 } }], !1;
                            }
                            else
                                return Ze.errors = [{ instancePath: s + "/username", schemaPath: "#/properties/username/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = d === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return Ze.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ze.errors = i, e === 0; }
Ze.evaluated = { props: { display_name: !0, avatar_url: !0, locale: !0, username: !0 }, dynamicProps: !1, dynamicItems: !1 };
function Se(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Se.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return Se.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return Se.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return Se.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return Se.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return Se.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return Se.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return Se.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return Se.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Ze(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Ze.errors : i.concat(Ze.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return Se.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Se.errors = i, e === 0; }
Se.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Et = Yr;
function Yr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Yr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.remaining !== void 0) {
            let d = r.remaining, t = e;
            if (!(typeof d == "number" && !(d % 1) && !isNaN(d) && isFinite(d)))
                return Yr.errors = [{ instancePath: s + "/remaining", schemaPath: "#/properties/remaining/type", keyword: "type", params: { type: "integer" } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.generated_at !== void 0) {
                let d = e;
                if (typeof r.generated_at != "string")
                    return Yr.errors = [{ instancePath: s + "/generated_at", schemaPath: "#/properties/generated_at/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
            if (a)
                if (r.recovery_codes !== void 0) {
                    let d = r.recovery_codes, t = e;
                    if (e === t)
                        if (Array.isArray(d)) {
                            var p = !0;
                            let l = d.length;
                            for (let f = 0; f < l; f++) {
                                let m = e;
                                if (typeof d[f] != "string")
                                    return Yr.errors = [{ instancePath: s + "/recovery_codes/" + f, schemaPath: "#/properties/recovery_codes/items/type", keyword: "type", params: { type: "string" } }], !1;
                                var p = m === e;
                                if (!p)
                                    break;
                            }
                        }
                        else
                            return Yr.errors = [{ instancePath: s + "/recovery_codes", schemaPath: "#/properties/recovery_codes/type", keyword: "type", params: { type: "array" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
        }
    }
    else
        return Yr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Yr.errors = i, e === 0; }
Yr.evaluated = { props: { remaining: !0, generated_at: !0, recovery_codes: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Ra = vr;
function Qr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Qr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.totp_code === void 0 && (a = "totp_code"))
            return Qr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        if (r.totp_code !== void 0 && typeof r.totp_code != "string")
            return Qr.errors = [{ instancePath: s + "/totp_code", schemaPath: "#/properties/totp_code/type", keyword: "type", params: { type: "string" } }], !1;
    }
    else
        return Qr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Qr.errors = i, e === 0; }
Qr.evaluated = { props: { totp_code: !0 }, dynamicProps: !1, dynamicItems: !1 };
function vr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = vr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return vr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return vr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return vr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return vr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return vr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return vr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Qr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Qr.errors : i.concat(Qr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return vr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return vr.errors = i, e === 0; }
vr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Fa = kr;
function Tr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Tr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.code === void 0 && (p = "code"))
            return Tr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.setup_ticket !== void 0) {
            let d = e;
            if (typeof r.setup_ticket != "string")
                return Tr.errors = [{ instancePath: s + "/setup_ticket", schemaPath: "#/properties/setup_ticket/type", keyword: "type", params: { type: "string" } }], !1;
            var a = d === e;
        }
        else
            var a = !0;
        if (a)
            if (r.code !== void 0) {
                let d = e;
                if (typeof r.code != "string")
                    return Tr.errors = [{ instancePath: s + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
    }
    else
        return Tr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Tr.errors = i, e === 0; }
Tr.evaluated = { props: { setup_ticket: !0, code: !0 }, dynamicProps: !1, dynamicItems: !1 };
function kr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = kr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return kr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return kr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return kr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return kr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return kr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return kr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Tr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Tr.errors : i.concat(Tr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return kr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return kr.errors = i, e === 0; }
kr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ta = ze;
function Br(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Br.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.totp_code === void 0 && (a = "totp_code"))
            return Br.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        if (r.totp_code !== void 0 && typeof r.totp_code != "string")
            return Br.errors = [{ instancePath: s + "/totp_code", schemaPath: "#/properties/totp_code/type", keyword: "type", params: { type: "string" } }], !1;
    }
    else
        return Br.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Br.errors = i, e === 0; }
Br.evaluated = { props: { totp_code: !0 }, dynamicProps: !1, dynamicItems: !1 };
function ze(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ze.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return ze.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return ze.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return ze.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return ze.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return ze.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return ze.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return ze.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return ze.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Br(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Br.errors : i.concat(Br.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return ze.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ze.errors = i, e === 0; }
ze.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var h = W;
function W(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = W.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.type === void 0 && (d = "type") || r.title === void 0 && (d = "title") || r.status === void 0 && (d = "status") || r.code === void 0 && (d = "code"))
            return W.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        if (r.type !== void 0) {
            let t = r.type, o = e;
            if (e === o && e === o)
                if (typeof t == "string") {
                    if (!os(t))
                        return W.errors = [{ instancePath: s + "/type", schemaPath: "#/properties/type/format", keyword: "format", params: { format: "uri" } }], !1;
                }
                else
                    return W.errors = [{ instancePath: s + "/type", schemaPath: "#/properties/type/type", keyword: "type", params: { type: "string" } }], !1;
            var a = o === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.title !== void 0) {
                let t = e;
                if (typeof r.title != "string")
                    return W.errors = [{ instancePath: s + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.status !== void 0) {
                    let t = r.status, o = e;
                    if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                        return W.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "integer" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.detail !== void 0) {
                        let t = e;
                        if (typeof r.detail != "string")
                            return W.errors = [{ instancePath: s + "/detail", schemaPath: "#/properties/detail/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = t === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.instance !== void 0) {
                            let t = e;
                            if (typeof r.instance != "string")
                                return W.errors = [{ instancePath: s + "/instance", schemaPath: "#/properties/instance/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.code !== void 0) {
                                let t = e;
                                if (typeof r.code != "string")
                                    return W.errors = [{ instancePath: s + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                                var a = t === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.traceId !== void 0) {
                                    let t = e;
                                    if (typeof r.traceId != "string")
                                        return W.errors = [{ instancePath: s + "/traceId", schemaPath: "#/properties/traceId/type", keyword: "type", params: { type: "string" } }], !1;
                                    var a = t === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.retryable !== void 0) {
                                        let t = e;
                                        if (typeof r.retryable != "boolean")
                                            return W.errors = [{ instancePath: s + "/retryable", schemaPath: "#/properties/retryable/type", keyword: "type", params: { type: "boolean" } }], !1;
                                        var a = t === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a)
                                        if (r.conflicts !== void 0) {
                                            let t = r.conflicts, o = e;
                                            if (e === o)
                                                if (Array.isArray(t)) {
                                                    var p = !0;
                                                    let f = t.length;
                                                    for (let m = 0; m < f; m++) {
                                                        let _ = e;
                                                        if (typeof t[m] != "string")
                                                            return W.errors = [{ instancePath: s + "/conflicts/" + m, schemaPath: "#/properties/conflicts/items/type", keyword: "type", params: { type: "string" } }], !1;
                                                        var p = _ === e;
                                                        if (!p)
                                                            break;
                                                    }
                                                }
                                                else
                                                    return W.errors = [{ instancePath: s + "/conflicts", schemaPath: "#/properties/conflicts/type", keyword: "type", params: { type: "array" } }], !1;
                                            var a = o === e;
                                        }
                                        else
                                            var a = !0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return W.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return W.errors = i, e === 0; }
W.evaluated = { props: { type: !0, title: !0, status: !0, detail: !0, instance: !0, code: !0, traceId: !0, retryable: !0, conflicts: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Za = Ue;
function Ue(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ue.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return Ue.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return Ue.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return Ue.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return Ue.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return Ue.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return Ue.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = r.body, o = e;
                                if (!(t && typeof t == "object" && !Array.isArray(t)))
                                    return Ue.errors = [{ instancePath: s + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "object" } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return Ue.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ue.errors = i, e === 0; }
Ue.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ma = gr;
function gr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = gr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.secret === void 0 && (d = "secret") || r.otpauth_url === void 0 && (d = "otpauth_url"))
            return gr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        if (r.secret !== void 0) {
            let t = e;
            if (typeof r.secret != "string")
                return gr.errors = [{ instancePath: s + "/secret", schemaPath: "#/properties/secret/type", keyword: "type", params: { type: "string" } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.otpauth_url !== void 0) {
                let t = e;
                if (typeof r.otpauth_url != "string")
                    return gr.errors = [{ instancePath: s + "/otpauth_url", schemaPath: "#/properties/otpauth_url/type", keyword: "type", params: { type: "string" } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.setup_ticket !== void 0) {
                    let t = e;
                    if (typeof r.setup_ticket != "string")
                        return gr.errors = [{ instancePath: s + "/setup_ticket", schemaPath: "#/properties/setup_ticket/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.recovery_codes !== void 0) {
                        let t = r.recovery_codes, o = e;
                        if (e === o)
                            if (Array.isArray(t)) {
                                var p = !0;
                                let f = t.length;
                                for (let m = 0; m < f; m++) {
                                    let _ = e;
                                    if (typeof t[m] != "string")
                                        return gr.errors = [{ instancePath: s + "/recovery_codes/" + m, schemaPath: "#/properties/recovery_codes/items/type", keyword: "type", params: { type: "string" } }], !1;
                                    var p = _ === e;
                                    if (!p)
                                        break;
                                }
                            }
                            else
                                return gr.errors = [{ instancePath: s + "/recovery_codes", schemaPath: "#/properties/recovery_codes/type", keyword: "type", params: { type: "array" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return gr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return gr.errors = i, e === 0; }
gr.evaluated = { props: { secret: !0, otpauth_url: !0, setup_ticket: !0, recovery_codes: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Xa = oe;
function oe(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = oe.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.pathParams === void 0 && (d = "pathParams") || r.query === void 0 && (d = "query") || r.headers === void 0 && (d = "headers"))
            return oe.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = e;
            for (let o in r)
                if (!(o === "pathParams" || o === "query" || o === "headers")) {
                    return oe.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (t === e) {
                if (r.pathParams !== void 0) {
                    let o = r.pathParams, l = e;
                    if (e === l)
                        if (o && typeof o == "object" && !Array.isArray(o))
                            for (let f in o) {
                                return oe.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return oe.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = l === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let o = r.query, l = e;
                        if (e === l)
                            if (o && typeof o == "object" && !Array.isArray(o)) {
                                let m = e;
                                for (let _ in o)
                                    if (!(_ === "cursor" || _ === "limit")) {
                                        return oe.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: _ } }], !1;
                                        break;
                                    }
                                if (m === e) {
                                    if (o.cursor !== void 0) {
                                        let _ = e;
                                        if (typeof o.cursor != "string")
                                            return oe.errors = [{ instancePath: s + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/type", keyword: "type", params: { type: "string" } }], !1;
                                        var p = _ === e;
                                    }
                                    else
                                        var p = !0;
                                    if (p)
                                        if (o.limit !== void 0) {
                                            let _ = o.limit, u = e;
                                            if (!(typeof _ == "number" && !(_ % 1) && !isNaN(_) && isFinite(_)))
                                                return oe.errors = [{ instancePath: s + "/query/limit", schemaPath: "#/properties/query/properties/limit/type", keyword: "type", params: { type: "integer" } }], !1;
                                            if (e === u && typeof _ == "number" && isFinite(_) && (_ > 200 || isNaN(_)))
                                                return oe.errors = [{ instancePath: s + "/query/limit", schemaPath: "#/properties/query/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 200 } }], !1;
                                            var p = u === e;
                                        }
                                        else
                                            var p = !0;
                                }
                            }
                            else
                                return oe.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = l === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let o = r.headers, l = e;
                            if (e === l)
                                if (o && typeof o == "object" && !Array.isArray(o))
                                    for (let m in o) {
                                        return oe.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                else
                                    return oe.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = l === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return oe.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return oe.errors = i, e === 0; }
oe.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ha = at;
function Ae(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ae.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.notification_id === void 0 && (p = "notification_id"))
            return Ae.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.notification_id !== void 0) {
            let d = e;
            if (typeof r.notification_id != "string")
                return Ae.errors = [{ instancePath: s + "/notification_id", schemaPath: "#/properties/notification_id/type", keyword: "type", params: { type: "string" } }], !1;
            var a = d === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.kind !== void 0) {
                let d = e;
                if (typeof r.kind != "string")
                    return Ae.errors = [{ instancePath: s + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.title !== void 0) {
                    let d = e;
                    if (typeof r.title != "string")
                        return Ae.errors = [{ instancePath: s + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = d === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.body !== void 0) {
                        let d = e;
                        if (typeof r.body != "string")
                            return Ae.errors = [{ instancePath: s + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = d === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.read !== void 0) {
                            let d = e;
                            if (typeof r.read != "boolean")
                                return Ae.errors = [{ instancePath: s + "/read", schemaPath: "#/properties/read/type", keyword: "type", params: { type: "boolean" } }], !1;
                            var a = d === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.created_at !== void 0) {
                                let d = e;
                                if (typeof r.created_at != "string")
                                    return Ae.errors = [{ instancePath: s + "/created_at", schemaPath: "#/properties/created_at/type", keyword: "type", params: { type: "string" } }], !1;
                                var a = d === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return Ae.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ae.errors = i, e === 0; }
Ae.evaluated = { props: { notification_id: !0, kind: !0, title: !0, body: !0, read: !0, created_at: !0 }, dynamicProps: !1, dynamicItems: !1 };
function at(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = at.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.items !== void 0) {
            let d = r.items, t = e;
            if (e === t)
                if (Array.isArray(d)) {
                    var a = !0;
                    let o = d.length;
                    for (let l = 0; l < o; l++) {
                        let f = e;
                        Ae(d[l], { instancePath: s + "/items/" + l, parentData: d, parentDataProperty: l, rootData: y, dynamicAnchors: c }) || (i = i === null ? Ae.errors : i.concat(Ae.errors), e = i.length);
                        var a = f === e;
                        if (!a)
                            break;
                    }
                }
                else
                    return at.errors = [{ instancePath: s + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" } }], !1;
            var p = t === e;
        }
        else
            var p = !0;
        if (p)
            if (r.next_cursor !== void 0) {
                let d = e;
                if (typeof r.next_cursor != "string")
                    return at.errors = [{ instancePath: s + "/next_cursor", schemaPath: "#/properties/next_cursor/type", keyword: "type", params: { type: "string" } }], !1;
                var p = d === e;
            }
            else
                var p = !0;
    }
    else
        return at.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return at.errors = i, e === 0; }
at.evaluated = { props: { items: !0, next_cursor: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Ya = rt;
function rt(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = rt.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.marked === void 0 && (a = "marked"))
            return rt.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        if (r.marked !== void 0) {
            let p = r.marked, d = e;
            if (!(typeof p == "number" && !(p % 1) && !isNaN(p) && isFinite(p)))
                return rt.errors = [{ instancePath: s + "/marked", schemaPath: "#/properties/marked/type", keyword: "type", params: { type: "integer" } }], !1;
            if (e === d && typeof p == "number" && isFinite(p) && (p < 0 || isNaN(p)))
                return rt.errors = [{ instancePath: s + "/marked", schemaPath: "#/properties/marked/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
        }
    }
    else
        return rt.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return rt.errors = i, e === 0; }
rt.evaluated = { props: { marked: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Ua = Y;
function Y(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Y.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return Y.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return Y.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t)) {
                            let l;
                            if (t.id === void 0 && (l = "id"))
                                return Y.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/required", keyword: "required", params: { missingProperty: l } }], !1;
                            {
                                let f = e;
                                for (let m in t)
                                    if (m !== "id") {
                                        return Y.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                if (f === e && t.id !== void 0 && typeof t.id != "string")
                                    return Y.errors = [{ instancePath: s + "/pathParams/id", schemaPath: "#/properties/pathParams/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
                            }
                        }
                        else
                            return Y.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return Y.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return Y.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t)) {
                                    let f;
                                    if (t["x-csrf-token"] === void 0 && (f = "x-csrf-token"))
                                        return Y.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/required", keyword: "required", params: { missingProperty: f } }], !1;
                                    {
                                        let m = e;
                                        for (let _ in t)
                                            if (_ !== "x-csrf-token") {
                                                return Y.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: _ } }], !1;
                                                break;
                                            }
                                        if (m === e && t["x-csrf-token"] !== void 0) {
                                            let _ = t["x-csrf-token"];
                                            if (e === e)
                                                if (typeof _ == "string") {
                                                    if ($(_) < 1)
                                                        return Y.errors = [{ instancePath: s + "/headers/x-csrf-token", schemaPath: "#/properties/headers/properties/x-csrf-token/minLength", keyword: "minLength", params: { limit: 1 } }], !1;
                                                }
                                                else
                                                    return Y.errors = [{ instancePath: s + "/headers/x-csrf-token", schemaPath: "#/properties/headers/properties/x-csrf-token/type", keyword: "type", params: { type: "string" } }], !1;
                                        }
                                    }
                                }
                                else
                                    return Y.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return Y.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Y.errors = i, e === 0; }
Y.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Qa = ne;
var Pt = new RegExp("^(session|grant):[0-9a-f]{64}$", "u");
function ne(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ne.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return ne.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return ne.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return ne.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return ne.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t)) {
                                let f = e;
                                for (let m in t)
                                    if (m !== "cursor") {
                                        return ne.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                if (f === e && t.cursor !== void 0) {
                                    let m = t.cursor;
                                    if (e === e)
                                        if (typeof m == "string") {
                                            if ($(m) > 72)
                                                return ne.errors = [{ instancePath: s + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/maxLength", keyword: "maxLength", params: { limit: 72 } }], !1;
                                            if (!Pt.test(m))
                                                return ne.errors = [{ instancePath: s + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/pattern", keyword: "pattern", params: { pattern: "^(session|grant):[0-9a-f]{64}$" } }], !1;
                                        }
                                        else
                                            return ne.errors = [{ instancePath: s + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/type", keyword: "type", params: { type: "string" } }], !1;
                                }
                            }
                            else
                                return ne.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return ne.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return ne.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return ne.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ne.errors = i, e === 0; }
ne.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ba = Ur;
var Ga = { type: "object", additionalProperties: !1, required: ["id", "kind", "issuer", "client_id", "created_at", "expires_at"], properties: { id: { type: "string", pattern: "^(session|grant):[0-9a-f]{64}$", maxLength: 72 }, kind: { type: "string", enum: ["session", "grant"] }, issuer: { type: "string" }, client_id: { anyOf: [{ type: "string" }, { type: "null" }] }, created_at: { type: "string", format: "date-time" }, expires_at: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] } } };
function X(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = X.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let t;
        if (r.id === void 0 && (t = "id") || r.kind === void 0 && (t = "kind") || r.issuer === void 0 && (t = "issuer") || r.client_id === void 0 && (t = "client_id") || r.created_at === void 0 && (t = "created_at") || r.expires_at === void 0 && (t = "expires_at"))
            return X.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: t } }], !1;
        {
            let o = e;
            for (let l in r)
                if (!(l === "id" || l === "kind" || l === "issuer" || l === "client_id" || l === "created_at" || l === "expires_at")) {
                    return X.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                    break;
                }
            if (o === e) {
                if (r.id !== void 0) {
                    let l = r.id, f = e;
                    if (e === f)
                        if (typeof l == "string") {
                            if ($(l) > 72)
                                return X.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/maxLength", keyword: "maxLength", params: { limit: 72 } }], !1;
                            if (!Pt.test(l))
                                return X.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/pattern", keyword: "pattern", params: { pattern: "^(session|grant):[0-9a-f]{64}$" } }], !1;
                        }
                        else
                            return X.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = f === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.kind !== void 0) {
                        let l = r.kind, f = e;
                        if (typeof l != "string")
                            return X.errors = [{ instancePath: s + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" } }], !1;
                        if (!(l === "session" || l === "grant"))
                            return X.errors = [{ instancePath: s + "/kind", schemaPath: "#/properties/kind/enum", keyword: "enum", params: { allowedValues: Ga.properties.kind.enum } }], !1;
                        var a = f === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.issuer !== void 0) {
                            let l = e;
                            if (typeof r.issuer != "string")
                                return X.errors = [{ instancePath: s + "/issuer", schemaPath: "#/properties/issuer/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = l === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.client_id !== void 0) {
                                let l = r.client_id, f = e, m = e, _ = !1, u = e;
                                if (typeof l != "string") {
                                    let g = { instancePath: s + "/client_id", schemaPath: "#/properties/client_id/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                    i === null ? i = [g] : i.push(g), e++;
                                }
                                var p = u === e;
                                _ = _ || p;
                                let k = e;
                                if (l !== null) {
                                    let g = { instancePath: s + "/client_id", schemaPath: "#/properties/client_id/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                    i === null ? i = [g] : i.push(g), e++;
                                }
                                var p = k === e;
                                if (_ = _ || p, _)
                                    e = m, i !== null && (m ? i.length = m : i = null);
                                else {
                                    let g = { instancePath: s + "/client_id", schemaPath: "#/properties/client_id/anyOf", keyword: "anyOf", params: {} };
                                    return i === null ? i = [g] : i.push(g), e++, X.errors = i, !1;
                                }
                                var a = f === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.created_at !== void 0) {
                                    let l = r.created_at, f = e;
                                    if (e === f && e === f)
                                        if (typeof l == "string") {
                                            if (!yt.validate(l))
                                                return X.errors = [{ instancePath: s + "/created_at", schemaPath: "#/properties/created_at/format", keyword: "format", params: { format: "date-time" } }], !1;
                                        }
                                        else
                                            return X.errors = [{ instancePath: s + "/created_at", schemaPath: "#/properties/created_at/type", keyword: "type", params: { type: "string" } }], !1;
                                    var a = f === e;
                                }
                                else
                                    var a = !0;
                                if (a)
                                    if (r.expires_at !== void 0) {
                                        let l = r.expires_at, f = e, m = e, _ = !1, u = e;
                                        if (e === u && e === u)
                                            if (typeof l == "string") {
                                                if (!yt.validate(l)) {
                                                    let g = { instancePath: s + "/expires_at", schemaPath: "#/properties/expires_at/anyOf/0/format", keyword: "format", params: { format: "date-time" } };
                                                    i === null ? i = [g] : i.push(g), e++;
                                                }
                                            }
                                            else {
                                                let g = { instancePath: s + "/expires_at", schemaPath: "#/properties/expires_at/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                i === null ? i = [g] : i.push(g), e++;
                                            }
                                        var d = u === e;
                                        _ = _ || d;
                                        let k = e;
                                        if (l !== null) {
                                            let g = { instancePath: s + "/expires_at", schemaPath: "#/properties/expires_at/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                            i === null ? i = [g] : i.push(g), e++;
                                        }
                                        var d = k === e;
                                        if (_ = _ || d, _)
                                            e = m, i !== null && (m ? i.length = m : i = null);
                                        else {
                                            let g = { instancePath: s + "/expires_at", schemaPath: "#/properties/expires_at/anyOf", keyword: "anyOf", params: {} };
                                            return i === null ? i = [g] : i.push(g), e++, X.errors = i, !1;
                                        }
                                        var a = f === e;
                                    }
                                    else
                                        var a = !0;
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return X.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return X.errors = i, e === 0; }
X.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function Ur(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ur.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let t;
        if (r.items === void 0 && (t = "items") || r.next_cursor === void 0 && (t = "next_cursor"))
            return Ur.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: t } }], !1;
        {
            let o = e;
            for (let l in r)
                if (!(l === "items" || l === "next_cursor")) {
                    return Ur.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                    break;
                }
            if (o === e) {
                if (r.items !== void 0) {
                    let l = r.items, f = e;
                    if (e === f)
                        if (Array.isArray(l)) {
                            var a = !0;
                            let m = l.length;
                            for (let _ = 0; _ < m; _++) {
                                let u = e;
                                X(l[_], { instancePath: s + "/items/" + _, parentData: l, parentDataProperty: _, rootData: y, dynamicAnchors: c }) || (i = i === null ? X.errors : i.concat(X.errors), e = i.length);
                                var a = u === e;
                                if (!a)
                                    break;
                            }
                        }
                        else
                            return Ur.errors = [{ instancePath: s + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" } }], !1;
                    var p = f === e;
                }
                else
                    var p = !0;
                if (p)
                    if (r.next_cursor !== void 0) {
                        let l = r.next_cursor, f = e, m = e, _ = !1, u = e;
                        if (typeof l != "string") {
                            let g = { instancePath: s + "/next_cursor", schemaPath: "#/properties/next_cursor/anyOf/0/type", keyword: "type", params: { type: "string" } };
                            i === null ? i = [g] : i.push(g), e++;
                        }
                        var d = u === e;
                        _ = _ || d;
                        let k = e;
                        if (l !== null) {
                            let g = { instancePath: s + "/next_cursor", schemaPath: "#/properties/next_cursor/anyOf/1/type", keyword: "type", params: { type: "null" } };
                            i === null ? i = [g] : i.push(g), e++;
                        }
                        var d = k === e;
                        if (_ = _ || d, _)
                            e = m, i !== null && (m ? i.length = m : i = null);
                        else {
                            let g = { instancePath: s + "/next_cursor", schemaPath: "#/properties/next_cursor/anyOf", keyword: "anyOf", params: {} };
                            return i === null ? i = [g] : i.push(g), e++, Ur.errors = i, !1;
                        }
                        var p = f === e;
                    }
                    else
                        var p = !0;
            }
        }
    }
    else
        return Ur.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ur.errors = i, e === 0; }
Ur.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Wa = ce;
function ce(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ce.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return ce.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return ce.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t)) {
                            let l;
                            if (t.id === void 0 && (l = "id"))
                                return ce.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/required", keyword: "required", params: { missingProperty: l } }], !1;
                            {
                                let f = e;
                                for (let m in t)
                                    if (m !== "id") {
                                        return ce.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                if (f === e && t.id !== void 0) {
                                    let m = t.id;
                                    if (e === e)
                                        if (typeof m == "string") {
                                            if ($(m) > 72)
                                                return ce.errors = [{ instancePath: s + "/pathParams/id", schemaPath: "#/properties/pathParams/properties/id/maxLength", keyword: "maxLength", params: { limit: 72 } }], !1;
                                            if (!Pt.test(m))
                                                return ce.errors = [{ instancePath: s + "/pathParams/id", schemaPath: "#/properties/pathParams/properties/id/pattern", keyword: "pattern", params: { pattern: "^(session|grant):[0-9a-f]{64}$" } }], !1;
                                        }
                                        else
                                            return ce.errors = [{ instancePath: s + "/pathParams/id", schemaPath: "#/properties/pathParams/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
                                }
                            }
                        }
                        else
                            return ce.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return ce.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return ce.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                B(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? B.errors : i.concat(B.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return ce.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ce.errors = i, e === 0; }
ce.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ja = R, Jt = { type: "object", additionalProperties: !1, required: ["status", "id", "issuer", "revoked_grants", "access_token_scope", "current_session_preserved"], properties: { status: { type: "string", enum: ["ok"] }, id: { type: "string", pattern: "^(session|grant):[0-9a-f]{64}$", maxLength: 72 }, issuer: { type: "string" }, revoked_grants: { type: "integer", minimum: 0 }, access_token_scope: { type: "string", enum: ["selected_issuer"] }, current_session_preserved: { type: "boolean", const: !0 }, idempotent_replay: { type: "boolean" } } };
function R(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = R.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.status === void 0 && (p = "status") || r.id === void 0 && (p = "id") || r.issuer === void 0 && (p = "issuer") || r.revoked_grants === void 0 && (p = "revoked_grants") || r.access_token_scope === void 0 && (p = "access_token_scope") || r.current_session_preserved === void 0 && (p = "current_session_preserved"))
            return R.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "status" || t === "id" || t === "issuer" || t === "revoked_grants" || t === "access_token_scope" || t === "current_session_preserved" || t === "idempotent_replay")) {
                    return R.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.status !== void 0) {
                    let t = r.status, o = e;
                    if (typeof t != "string")
                        return R.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                    if (t !== "ok")
                        return R.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: Jt.properties.status.enum } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.id !== void 0) {
                        let t = r.id, o = e;
                        if (e === o)
                            if (typeof t == "string") {
                                if ($(t) > 72)
                                    return R.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/maxLength", keyword: "maxLength", params: { limit: 72 } }], !1;
                                if (!Pt.test(t))
                                    return R.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/pattern", keyword: "pattern", params: { pattern: "^(session|grant):[0-9a-f]{64}$" } }], !1;
                            }
                            else
                                return R.errors = [{ instancePath: s + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.issuer !== void 0) {
                            let t = e;
                            if (typeof r.issuer != "string")
                                return R.errors = [{ instancePath: s + "/issuer", schemaPath: "#/properties/issuer/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.revoked_grants !== void 0) {
                                let t = r.revoked_grants, o = e;
                                if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                                    return R.errors = [{ instancePath: s + "/revoked_grants", schemaPath: "#/properties/revoked_grants/type", keyword: "type", params: { type: "integer" } }], !1;
                                if (e === o && typeof t == "number" && isFinite(t) && (t < 0 || isNaN(t)))
                                    return R.errors = [{ instancePath: s + "/revoked_grants", schemaPath: "#/properties/revoked_grants/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.access_token_scope !== void 0) {
                                    let t = r.access_token_scope, o = e;
                                    if (typeof t != "string")
                                        return R.errors = [{ instancePath: s + "/access_token_scope", schemaPath: "#/properties/access_token_scope/type", keyword: "type", params: { type: "string" } }], !1;
                                    if (t !== "selected_issuer")
                                        return R.errors = [{ instancePath: s + "/access_token_scope", schemaPath: "#/properties/access_token_scope/enum", keyword: "enum", params: { allowedValues: Jt.properties.access_token_scope.enum } }], !1;
                                    var a = o === e;
                                }
                                else
                                    var a = !0;
                                if (a) {
                                    if (r.current_session_preserved !== void 0) {
                                        let t = r.current_session_preserved, o = e;
                                        if (typeof t != "boolean")
                                            return R.errors = [{ instancePath: s + "/current_session_preserved", schemaPath: "#/properties/current_session_preserved/type", keyword: "type", params: { type: "boolean" } }], !1;
                                        if (t !== !0)
                                            return R.errors = [{ instancePath: s + "/current_session_preserved", schemaPath: "#/properties/current_session_preserved/const", keyword: "const", params: { allowedValue: !0 } }], !1;
                                        var a = o === e;
                                    }
                                    else
                                        var a = !0;
                                    if (a)
                                        if (r.idempotent_replay !== void 0) {
                                            let t = e;
                                            if (typeof r.idempotent_replay != "boolean")
                                                return R.errors = [{ instancePath: s + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
                                            var a = t === e;
                                        }
                                        else
                                            var a = !0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return R.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return R.errors = i, e === 0; }
R.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ei = dt;
var ps = { type: "object", required: ["credential_id"], properties: { credential_id: { type: "string" }, name: { type: "string" }, created_at: { type: "string" }, last_used_at: { type: "string" }, backed_up: { type: "boolean" }, transports: { type: "array", items: { type: "string" } }, rp_id: { type: "string" }, state: { type: "string", enum: ["legacy_unverified", "pinned_on_login", "registered_pinned"] } } };
function U(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = U.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.credential_id === void 0 && (d = "credential_id"))
            return U.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        if (r.credential_id !== void 0) {
            let t = e;
            if (typeof r.credential_id != "string")
                return U.errors = [{ instancePath: s + "/credential_id", schemaPath: "#/properties/credential_id/type", keyword: "type", params: { type: "string" } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.name !== void 0) {
                let t = e;
                if (typeof r.name != "string")
                    return U.errors = [{ instancePath: s + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.created_at !== void 0) {
                    let t = e;
                    if (typeof r.created_at != "string")
                        return U.errors = [{ instancePath: s + "/created_at", schemaPath: "#/properties/created_at/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.last_used_at !== void 0) {
                        let t = e;
                        if (typeof r.last_used_at != "string")
                            return U.errors = [{ instancePath: s + "/last_used_at", schemaPath: "#/properties/last_used_at/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = t === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.backed_up !== void 0) {
                            let t = e;
                            if (typeof r.backed_up != "boolean")
                                return U.errors = [{ instancePath: s + "/backed_up", schemaPath: "#/properties/backed_up/type", keyword: "type", params: { type: "boolean" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.transports !== void 0) {
                                let t = r.transports, o = e;
                                if (e === o)
                                    if (Array.isArray(t)) {
                                        var p = !0;
                                        let f = t.length;
                                        for (let m = 0; m < f; m++) {
                                            let _ = e;
                                            if (typeof t[m] != "string")
                                                return U.errors = [{ instancePath: s + "/transports/" + m, schemaPath: "#/properties/transports/items/type", keyword: "type", params: { type: "string" } }], !1;
                                            var p = _ === e;
                                            if (!p)
                                                break;
                                        }
                                    }
                                    else
                                        return U.errors = [{ instancePath: s + "/transports", schemaPath: "#/properties/transports/type", keyword: "type", params: { type: "array" } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.rp_id !== void 0) {
                                    let t = e;
                                    if (typeof r.rp_id != "string")
                                        return U.errors = [{ instancePath: s + "/rp_id", schemaPath: "#/properties/rp_id/type", keyword: "type", params: { type: "string" } }], !1;
                                    var a = t === e;
                                }
                                else
                                    var a = !0;
                                if (a)
                                    if (r.state !== void 0) {
                                        let t = r.state, o = e;
                                        if (typeof t != "string")
                                            return U.errors = [{ instancePath: s + "/state", schemaPath: "#/properties/state/type", keyword: "type", params: { type: "string" } }], !1;
                                        if (!(t === "legacy_unverified" || t === "pinned_on_login" || t === "registered_pinned"))
                                            return U.errors = [{ instancePath: s + "/state", schemaPath: "#/properties/state/enum", keyword: "enum", params: { allowedValues: ps.properties.state.enum } }], !1;
                                        var a = o === e;
                                    }
                                    else
                                        var a = !0;
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return U.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return U.errors = i, e === 0; }
U.evaluated = { props: { credential_id: !0, name: !0, created_at: !0, last_used_at: !0, backed_up: !0, transports: !0, rp_id: !0, state: !0 }, dynamicProps: !1, dynamicItems: !1 };
function dt(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = dt.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.items !== void 0) {
            let p = r.items;
            if (e === e)
                if (Array.isArray(p)) {
                    var a = !0;
                    let t = p.length;
                    for (let o = 0; o < t; o++) {
                        let l = e;
                        U(p[o], { instancePath: s + "/items/" + o, parentData: p, parentDataProperty: o, rootData: y, dynamicAnchors: c }) || (i = i === null ? U.errors : i.concat(U.errors), e = i.length);
                        var a = l === e;
                        if (!a)
                            break;
                    }
                }
                else
                    return dt.errors = [{ instancePath: s + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" } }], !1;
        }
    }
    else
        return dt.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return dt.errors = i, e === 0; }
dt.evaluated = { props: { items: !0 }, dynamicProps: !1, dynamicItems: !1 };
var ri = br;
function De(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = De.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r["idempotency-key"] === void 0 && (p = "idempotency-key") || r["x-csrf-token"] === void 0 && (p = "x-csrf-token"))
            return De.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "idempotency-key" || t === "x-csrf-token")) {
                    return De.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r["idempotency-key"] !== void 0) {
                    let t = r["idempotency-key"], o = e;
                    if (e === o)
                        if (typeof t == "string") {
                            if ($(t) > 128)
                                return De.errors = [{ instancePath: s + "/idempotency-key", schemaPath: "#/properties/idempotency-key/maxLength", keyword: "maxLength", params: { limit: 128 } }], !1;
                            if ($(t) < 8)
                                return De.errors = [{ instancePath: s + "/idempotency-key", schemaPath: "#/properties/idempotency-key/minLength", keyword: "minLength", params: { limit: 8 } }], !1;
                        }
                        else
                            return De.errors = [{ instancePath: s + "/idempotency-key", schemaPath: "#/properties/idempotency-key/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r["x-csrf-token"] !== void 0) {
                        let t = r["x-csrf-token"], o = e;
                        if (e === o)
                            if (typeof t == "string") {
                                if ($(t) < 1)
                                    return De.errors = [{ instancePath: s + "/x-csrf-token", schemaPath: "#/properties/x-csrf-token/minLength", keyword: "minLength", params: { limit: 1 } }], !1;
                            }
                            else
                                return De.errors = [{ instancePath: s + "/x-csrf-token", schemaPath: "#/properties/x-csrf-token/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return De.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return De.errors = i, e === 0; }
De.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function br(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = br.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return br.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return br.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return br.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return br.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return br.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return br.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            De(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? De.errors : i.concat(De.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Be(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Be.errors : i.concat(Be.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return br.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return br.errors = i, e === 0; }
br.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ti = D, tt = { type: "object", additionalProperties: !1, required: ["request_id", "options"], properties: { request_id: { type: "string" }, options: { type: "object", additionalProperties: !1, required: ["challenge", "rp", "user", "pubKeyCredParams", "timeout", "attestation", "authenticatorSelection", "excludeCredentials"], properties: { challenge: { type: "string" }, rp: { type: "object", additionalProperties: !1, required: ["name", "id"], properties: { name: { type: "string", const: "XPeach", enum: ["XPeach"] }, id: { type: "string" } } }, user: { type: "object", additionalProperties: !1, required: ["id", "name", "displayName"], properties: { id: { type: "string" }, name: { type: "string" }, displayName: { type: "string" } } }, pubKeyCredParams: { type: "array", items: { type: "object", additionalProperties: !1, required: ["alg", "type"], properties: { alg: { type: "integer", enum: [-7, -257] }, type: { type: "string", const: "public-key", enum: ["public-key"] } } }, minItems: 2, maxItems: 2, uniqueItems: !0 }, timeout: { type: "integer", const: 6e4, enum: [6e4] }, attestation: { type: "string", const: "none", enum: ["none"] }, authenticatorSelection: { type: "object", additionalProperties: !1, required: ["residentKey", "userVerification"], properties: { residentKey: { type: "string", const: "preferred", enum: ["preferred"] }, userVerification: { type: "string", const: "required", enum: ["required"] } } }, excludeCredentials: { type: "array", items: { $ref: "#/components/schemas/PortalPasskeyDescriptor" } } } } } }, si = Xt().default;
function D(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = D.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let _;
        if (r.request_id === void 0 && (_ = "request_id") || r.options === void 0 && (_ = "options"))
            return D.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: _ } }], !1;
        {
            let u = e;
            for (let k in r)
                if (!(k === "request_id" || k === "options")) {
                    return D.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: k } }], !1;
                    break;
                }
            if (u === e) {
                if (r.request_id !== void 0) {
                    let k = e;
                    if (typeof r.request_id != "string")
                        return D.errors = [{ instancePath: s + "/request_id", schemaPath: "#/properties/request_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = k === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.options !== void 0) {
                        let k = r.options, b = e;
                        if (e === b)
                            if (k && typeof k == "object" && !Array.isArray(k)) {
                                let w;
                                if (k.challenge === void 0 && (w = "challenge") || k.rp === void 0 && (w = "rp") || k.user === void 0 && (w = "user") || k.pubKeyCredParams === void 0 && (w = "pubKeyCredParams") || k.timeout === void 0 && (w = "timeout") || k.attestation === void 0 && (w = "attestation") || k.authenticatorSelection === void 0 && (w = "authenticatorSelection") || k.excludeCredentials === void 0 && (w = "excludeCredentials"))
                                    return D.errors = [{ instancePath: s + "/options", schemaPath: "#/properties/options/required", keyword: "required", params: { missingProperty: w } }], !1;
                                {
                                    let O = e;
                                    for (let q in k)
                                        if (!(q === "challenge" || q === "rp" || q === "user" || q === "pubKeyCredParams" || q === "timeout" || q === "attestation" || q === "authenticatorSelection" || q === "excludeCredentials")) {
                                            return D.errors = [{ instancePath: s + "/options", schemaPath: "#/properties/options/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: q } }], !1;
                                            break;
                                        }
                                    if (O === e) {
                                        if (k.challenge !== void 0) {
                                            let q = e;
                                            if (typeof k.challenge != "string")
                                                return D.errors = [{ instancePath: s + "/options/challenge", schemaPath: "#/properties/options/properties/challenge/type", keyword: "type", params: { type: "string" } }], !1;
                                            var p = q === e;
                                        }
                                        else
                                            var p = !0;
                                        if (p) {
                                            if (k.rp !== void 0) {
                                                let q = k.rp, A = e;
                                                if (e === A)
                                                    if (q && typeof q == "object" && !Array.isArray(q)) {
                                                        let ee;
                                                        if (q.name === void 0 && (ee = "name") || q.id === void 0 && (ee = "id"))
                                                            return D.errors = [{ instancePath: s + "/options/rp", schemaPath: "#/properties/options/properties/rp/required", keyword: "required", params: { missingProperty: ee } }], !1;
                                                        {
                                                            let L = e;
                                                            for (let x in q)
                                                                if (!(x === "name" || x === "id")) {
                                                                    return D.errors = [{ instancePath: s + "/options/rp", schemaPath: "#/properties/options/properties/rp/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: x } }], !1;
                                                                    break;
                                                                }
                                                            if (L === e) {
                                                                if (q.name !== void 0) {
                                                                    let x = q.name, Wr = e;
                                                                    if (typeof x != "string")
                                                                        return D.errors = [{ instancePath: s + "/options/rp/name", schemaPath: "#/properties/options/properties/rp/properties/name/type", keyword: "type", params: { type: "string" } }], !1;
                                                                    if (x !== "XPeach")
                                                                        return D.errors = [{ instancePath: s + "/options/rp/name", schemaPath: "#/properties/options/properties/rp/properties/name/const", keyword: "const", params: { allowedValue: "XPeach" } }], !1;
                                                                    if (x !== "XPeach")
                                                                        return D.errors = [{ instancePath: s + "/options/rp/name", schemaPath: "#/properties/options/properties/rp/properties/name/enum", keyword: "enum", params: { allowedValues: tt.properties.options.properties.rp.properties.name.enum } }], !1;
                                                                    var d = Wr === e;
                                                                }
                                                                else
                                                                    var d = !0;
                                                                if (d)
                                                                    if (q.id !== void 0) {
                                                                        let x = e;
                                                                        if (typeof q.id != "string")
                                                                            return D.errors = [{ instancePath: s + "/options/rp/id", schemaPath: "#/properties/options/properties/rp/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
                                                                        var d = x === e;
                                                                    }
                                                                    else
                                                                        var d = !0;
                                                            }
                                                        }
                                                    }
                                                    else
                                                        return D.errors = [{ instancePath: s + "/options/rp", schemaPath: "#/properties/options/properties/rp/type", keyword: "type", params: { type: "object" } }], !1;
                                                var p = A === e;
                                            }
                                            else
                                                var p = !0;
                                            if (p) {
                                                if (k.user !== void 0) {
                                                    let q = k.user, A = e;
                                                    if (e === A)
                                                        if (q && typeof q == "object" && !Array.isArray(q)) {
                                                            let ee;
                                                            if (q.id === void 0 && (ee = "id") || q.name === void 0 && (ee = "name") || q.displayName === void 0 && (ee = "displayName"))
                                                                return D.errors = [{ instancePath: s + "/options/user", schemaPath: "#/properties/options/properties/user/required", keyword: "required", params: { missingProperty: ee } }], !1;
                                                            {
                                                                let L = e;
                                                                for (let x in q)
                                                                    if (!(x === "id" || x === "name" || x === "displayName")) {
                                                                        return D.errors = [{ instancePath: s + "/options/user", schemaPath: "#/properties/options/properties/user/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: x } }], !1;
                                                                        break;
                                                                    }
                                                                if (L === e) {
                                                                    if (q.id !== void 0) {
                                                                        let x = e;
                                                                        if (typeof q.id != "string")
                                                                            return D.errors = [{ instancePath: s + "/options/user/id", schemaPath: "#/properties/options/properties/user/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
                                                                        var t = x === e;
                                                                    }
                                                                    else
                                                                        var t = !0;
                                                                    if (t) {
                                                                        if (q.name !== void 0) {
                                                                            let x = e;
                                                                            if (typeof q.name != "string")
                                                                                return D.errors = [{ instancePath: s + "/options/user/name", schemaPath: "#/properties/options/properties/user/properties/name/type", keyword: "type", params: { type: "string" } }], !1;
                                                                            var t = x === e;
                                                                        }
                                                                        else
                                                                            var t = !0;
                                                                        if (t)
                                                                            if (q.displayName !== void 0) {
                                                                                let x = e;
                                                                                if (typeof q.displayName != "string")
                                                                                    return D.errors = [{ instancePath: s + "/options/user/displayName", schemaPath: "#/properties/options/properties/user/properties/displayName/type", keyword: "type", params: { type: "string" } }], !1;
                                                                                var t = x === e;
                                                                            }
                                                                            else
                                                                                var t = !0;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        else
                                                            return D.errors = [{ instancePath: s + "/options/user", schemaPath: "#/properties/options/properties/user/type", keyword: "type", params: { type: "object" } }], !1;
                                                    var p = A === e;
                                                }
                                                else
                                                    var p = !0;
                                                if (p) {
                                                    if (k.pubKeyCredParams !== void 0) {
                                                        let q = k.pubKeyCredParams, A = e;
                                                        if (e === A)
                                                            if (Array.isArray(q)) {
                                                                if (q.length > 2)
                                                                    return D.errors = [{ instancePath: s + "/options/pubKeyCredParams", schemaPath: "#/properties/options/properties/pubKeyCredParams/maxItems", keyword: "maxItems", params: { limit: 2 } }], !1;
                                                                if (q.length < 2)
                                                                    return D.errors = [{ instancePath: s + "/options/pubKeyCredParams", schemaPath: "#/properties/options/properties/pubKeyCredParams/minItems", keyword: "minItems", params: { limit: 2 } }], !1;
                                                                {
                                                                    var o = !0;
                                                                    let ee = q.length;
                                                                    for (let L = 0; L < ee; L++) {
                                                                        let x = q[L], Wr = e;
                                                                        if (e === Wr)
                                                                            if (x && typeof x == "object" && !Array.isArray(x)) {
                                                                                let vt;
                                                                                if (x.alg === void 0 && (vt = "alg") || x.type === void 0 && (vt = "type"))
                                                                                    return D.errors = [{ instancePath: s + "/options/pubKeyCredParams/" + L, schemaPath: "#/properties/options/properties/pubKeyCredParams/items/required", keyword: "required", params: { missingProperty: vt } }], !1;
                                                                                {
                                                                                    let ls = e;
                                                                                    for (let ge in x)
                                                                                        if (!(ge === "alg" || ge === "type")) {
                                                                                            return D.errors = [{ instancePath: s + "/options/pubKeyCredParams/" + L, schemaPath: "#/properties/options/properties/pubKeyCredParams/items/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: ge } }], !1;
                                                                                            break;
                                                                                        }
                                                                                    if (ls === e) {
                                                                                        if (x.alg !== void 0) {
                                                                                            let ge = x.alg, kt = e;
                                                                                            if (!(typeof ge == "number" && !(ge % 1) && !isNaN(ge) && isFinite(ge)))
                                                                                                return D.errors = [{ instancePath: s + "/options/pubKeyCredParams/" + L + "/alg", schemaPath: "#/properties/options/properties/pubKeyCredParams/items/properties/alg/type", keyword: "type", params: { type: "integer" } }], !1;
                                                                                            if (!(ge === -7 || ge === -257))
                                                                                                return D.errors = [{ instancePath: s + "/options/pubKeyCredParams/" + L + "/alg", schemaPath: "#/properties/options/properties/pubKeyCredParams/items/properties/alg/enum", keyword: "enum", params: { allowedValues: tt.properties.options.properties.pubKeyCredParams.items.properties.alg.enum } }], !1;
                                                                                            var l = kt === e;
                                                                                        }
                                                                                        else
                                                                                            var l = !0;
                                                                                        if (l)
                                                                                            if (x.type !== void 0) {
                                                                                                let ge = x.type, kt = e;
                                                                                                if (typeof ge != "string")
                                                                                                    return D.errors = [{ instancePath: s + "/options/pubKeyCredParams/" + L + "/type", schemaPath: "#/properties/options/properties/pubKeyCredParams/items/properties/type/type", keyword: "type", params: { type: "string" } }], !1;
                                                                                                if (ge !== "public-key")
                                                                                                    return D.errors = [{ instancePath: s + "/options/pubKeyCredParams/" + L + "/type", schemaPath: "#/properties/options/properties/pubKeyCredParams/items/properties/type/const", keyword: "const", params: { allowedValue: "public-key" } }], !1;
                                                                                                if (ge !== "public-key")
                                                                                                    return D.errors = [{ instancePath: s + "/options/pubKeyCredParams/" + L + "/type", schemaPath: "#/properties/options/properties/pubKeyCredParams/items/properties/type/enum", keyword: "enum", params: { allowedValues: tt.properties.options.properties.pubKeyCredParams.items.properties.type.enum } }], !1;
                                                                                                var l = kt === e;
                                                                                            }
                                                                                            else
                                                                                                var l = !0;
                                                                                    }
                                                                                }
                                                                            }
                                                                            else
                                                                                return D.errors = [{ instancePath: s + "/options/pubKeyCredParams/" + L, schemaPath: "#/properties/options/properties/pubKeyCredParams/items/type", keyword: "type", params: { type: "object" } }], !1;
                                                                        var o = Wr === e;
                                                                        if (!o)
                                                                            break;
                                                                    }
                                                                    if (o) {
                                                                        let L = q.length, x;
                                                                        if (L > 1) {
                                                                            e: for (; L--;)
                                                                                for (x = L; x--;)
                                                                                    if (si(q[L], q[x])) {
                                                                                        return D.errors = [{ instancePath: s + "/options/pubKeyCredParams", schemaPath: "#/properties/options/properties/pubKeyCredParams/uniqueItems", keyword: "uniqueItems", params: { i: L, j: x } }], !1;
                                                                                        break e;
                                                                                    }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            else
                                                                return D.errors = [{ instancePath: s + "/options/pubKeyCredParams", schemaPath: "#/properties/options/properties/pubKeyCredParams/type", keyword: "type", params: { type: "array" } }], !1;
                                                        var p = A === e;
                                                    }
                                                    else
                                                        var p = !0;
                                                    if (p) {
                                                        if (k.timeout !== void 0) {
                                                            let q = k.timeout, A = e;
                                                            if (!(typeof q == "number" && !(q % 1) && !isNaN(q) && isFinite(q)))
                                                                return D.errors = [{ instancePath: s + "/options/timeout", schemaPath: "#/properties/options/properties/timeout/type", keyword: "type", params: { type: "integer" } }], !1;
                                                            if (q !== 6e4)
                                                                return D.errors = [{ instancePath: s + "/options/timeout", schemaPath: "#/properties/options/properties/timeout/const", keyword: "const", params: { allowedValue: 6e4 } }], !1;
                                                            if (q !== 6e4)
                                                                return D.errors = [{ instancePath: s + "/options/timeout", schemaPath: "#/properties/options/properties/timeout/enum", keyword: "enum", params: { allowedValues: tt.properties.options.properties.timeout.enum } }], !1;
                                                            var p = A === e;
                                                        }
                                                        else
                                                            var p = !0;
                                                        if (p) {
                                                            if (k.attestation !== void 0) {
                                                                let q = k.attestation, A = e;
                                                                if (typeof q != "string")
                                                                    return D.errors = [{ instancePath: s + "/options/attestation", schemaPath: "#/properties/options/properties/attestation/type", keyword: "type", params: { type: "string" } }], !1;
                                                                if (q !== "none")
                                                                    return D.errors = [{ instancePath: s + "/options/attestation", schemaPath: "#/properties/options/properties/attestation/const", keyword: "const", params: { allowedValue: "none" } }], !1;
                                                                if (q !== "none")
                                                                    return D.errors = [{ instancePath: s + "/options/attestation", schemaPath: "#/properties/options/properties/attestation/enum", keyword: "enum", params: { allowedValues: tt.properties.options.properties.attestation.enum } }], !1;
                                                                var p = A === e;
                                                            }
                                                            else
                                                                var p = !0;
                                                            if (p) {
                                                                if (k.authenticatorSelection !== void 0) {
                                                                    let q = k.authenticatorSelection, A = e;
                                                                    if (e === A)
                                                                        if (q && typeof q == "object" && !Array.isArray(q)) {
                                                                            let ee;
                                                                            if (q.residentKey === void 0 && (ee = "residentKey") || q.userVerification === void 0 && (ee = "userVerification"))
                                                                                return D.errors = [{ instancePath: s + "/options/authenticatorSelection", schemaPath: "#/properties/options/properties/authenticatorSelection/required", keyword: "required", params: { missingProperty: ee } }], !1;
                                                                            {
                                                                                let L = e;
                                                                                for (let x in q)
                                                                                    if (!(x === "residentKey" || x === "userVerification")) {
                                                                                        return D.errors = [{ instancePath: s + "/options/authenticatorSelection", schemaPath: "#/properties/options/properties/authenticatorSelection/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: x } }], !1;
                                                                                        break;
                                                                                    }
                                                                                if (L === e) {
                                                                                    if (q.residentKey !== void 0) {
                                                                                        let x = q.residentKey, Wr = e;
                                                                                        if (typeof x != "string")
                                                                                            return D.errors = [{ instancePath: s + "/options/authenticatorSelection/residentKey", schemaPath: "#/properties/options/properties/authenticatorSelection/properties/residentKey/type", keyword: "type", params: { type: "string" } }], !1;
                                                                                        if (x !== "preferred")
                                                                                            return D.errors = [{ instancePath: s + "/options/authenticatorSelection/residentKey", schemaPath: "#/properties/options/properties/authenticatorSelection/properties/residentKey/const", keyword: "const", params: { allowedValue: "preferred" } }], !1;
                                                                                        if (x !== "preferred")
                                                                                            return D.errors = [{ instancePath: s + "/options/authenticatorSelection/residentKey", schemaPath: "#/properties/options/properties/authenticatorSelection/properties/residentKey/enum", keyword: "enum", params: { allowedValues: tt.properties.options.properties.authenticatorSelection.properties.residentKey.enum } }], !1;
                                                                                        var f = Wr === e;
                                                                                    }
                                                                                    else
                                                                                        var f = !0;
                                                                                    if (f)
                                                                                        if (q.userVerification !== void 0) {
                                                                                            let x = q.userVerification, Wr = e;
                                                                                            if (typeof x != "string")
                                                                                                return D.errors = [{ instancePath: s + "/options/authenticatorSelection/userVerification", schemaPath: "#/properties/options/properties/authenticatorSelection/properties/userVerification/type", keyword: "type", params: { type: "string" } }], !1;
                                                                                            if (x !== "required")
                                                                                                return D.errors = [{ instancePath: s + "/options/authenticatorSelection/userVerification", schemaPath: "#/properties/options/properties/authenticatorSelection/properties/userVerification/const", keyword: "const", params: { allowedValue: "required" } }], !1;
                                                                                            if (x !== "required")
                                                                                                return D.errors = [{ instancePath: s + "/options/authenticatorSelection/userVerification", schemaPath: "#/properties/options/properties/authenticatorSelection/properties/userVerification/enum", keyword: "enum", params: { allowedValues: tt.properties.options.properties.authenticatorSelection.properties.userVerification.enum } }], !1;
                                                                                            var f = Wr === e;
                                                                                        }
                                                                                        else
                                                                                            var f = !0;
                                                                                }
                                                                            }
                                                                        }
                                                                        else
                                                                            return D.errors = [{ instancePath: s + "/options/authenticatorSelection", schemaPath: "#/properties/options/properties/authenticatorSelection/type", keyword: "type", params: { type: "object" } }], !1;
                                                                    var p = A === e;
                                                                }
                                                                else
                                                                    var p = !0;
                                                                if (p)
                                                                    if (k.excludeCredentials !== void 0) {
                                                                        let q = k.excludeCredentials, A = e;
                                                                        if (e === A)
                                                                            if (Array.isArray(q)) {
                                                                                var m = !0;
                                                                                let ee = q.length;
                                                                                for (let L = 0; L < ee; L++) {
                                                                                    let x = e;
                                                                                    Q(q[L], { instancePath: s + "/options/excludeCredentials/" + L, parentData: q, parentDataProperty: L, rootData: y, dynamicAnchors: c }) || (i = i === null ? Q.errors : i.concat(Q.errors), e = i.length);
                                                                                    var m = x === e;
                                                                                    if (!m)
                                                                                        break;
                                                                                }
                                                                            }
                                                                            else
                                                                                return D.errors = [{ instancePath: s + "/options/excludeCredentials", schemaPath: "#/properties/options/properties/excludeCredentials/type", keyword: "type", params: { type: "array" } }], !1;
                                                                        var p = A === e;
                                                                    }
                                                                    else
                                                                        var p = !0;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else
                                return D.errors = [{ instancePath: s + "/options", schemaPath: "#/properties/options/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = b === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return D.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return D.errors = i, e === 0; }
D.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ai = wr;
function jr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = jr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.credential === void 0 && (p = "credential"))
            return jr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.request_id !== void 0) {
            let d = e;
            if (typeof r.request_id != "string")
                return jr.errors = [{ instancePath: s + "/request_id", schemaPath: "#/properties/request_id/type", keyword: "type", params: { type: "string" } }], !1;
            var a = d === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.name !== void 0) {
                let d = e;
                if (typeof r.name != "string")
                    return jr.errors = [{ instancePath: s + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
            if (a)
                if (r.credential !== void 0) {
                    let d = r.credential, t = e;
                    if (!(d && typeof d == "object" && !Array.isArray(d)))
                        return jr.errors = [{ instancePath: s + "/credential", schemaPath: "#/properties/credential/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
        }
    }
    else
        return jr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return jr.errors = i, e === 0; }
jr.evaluated = { props: { request_id: !0, name: !0, credential: !0 }, dynamicProps: !1, dynamicItems: !1 };
function wr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = wr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return wr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return wr.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let l in t) {
                                return wr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                                break;
                            }
                        else
                            return wr.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return wr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return wr.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                jr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? jr.errors : i.concat(jr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return wr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return wr.errors = i, e === 0; }
wr.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ds = pe;
function pe(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = pe.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let d;
        if (r.credential_id === void 0 && (d = "credential_id"))
            return pe.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        if (r.credential_id !== void 0) {
            let t = e;
            if (typeof r.credential_id != "string")
                return pe.errors = [{ instancePath: s + "/credential_id", schemaPath: "#/properties/credential_id/type", keyword: "type", params: { type: "string" } }], !1;
            var a = t === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.name !== void 0) {
                let t = e;
                if (typeof r.name != "string")
                    return pe.errors = [{ instancePath: s + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" } }], !1;
                var a = t === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.created_at !== void 0) {
                    let t = e;
                    if (typeof r.created_at != "string")
                        return pe.errors = [{ instancePath: s + "/created_at", schemaPath: "#/properties/created_at/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = t === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.last_used_at !== void 0) {
                        let t = e;
                        if (typeof r.last_used_at != "string")
                            return pe.errors = [{ instancePath: s + "/last_used_at", schemaPath: "#/properties/last_used_at/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = t === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.backed_up !== void 0) {
                            let t = e;
                            if (typeof r.backed_up != "boolean")
                                return pe.errors = [{ instancePath: s + "/backed_up", schemaPath: "#/properties/backed_up/type", keyword: "type", params: { type: "boolean" } }], !1;
                            var a = t === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.transports !== void 0) {
                                let t = r.transports, o = e;
                                if (e === o)
                                    if (Array.isArray(t)) {
                                        var p = !0;
                                        let f = t.length;
                                        for (let m = 0; m < f; m++) {
                                            let _ = e;
                                            if (typeof t[m] != "string")
                                                return pe.errors = [{ instancePath: s + "/transports/" + m, schemaPath: "#/properties/transports/items/type", keyword: "type", params: { type: "string" } }], !1;
                                            var p = _ === e;
                                            if (!p)
                                                break;
                                        }
                                    }
                                    else
                                        return pe.errors = [{ instancePath: s + "/transports", schemaPath: "#/properties/transports/type", keyword: "type", params: { type: "array" } }], !1;
                                var a = o === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.rp_id !== void 0) {
                                    let t = e;
                                    if (typeof r.rp_id != "string")
                                        return pe.errors = [{ instancePath: s + "/rp_id", schemaPath: "#/properties/rp_id/type", keyword: "type", params: { type: "string" } }], !1;
                                    var a = t === e;
                                }
                                else
                                    var a = !0;
                                if (a)
                                    if (r.state !== void 0) {
                                        let t = r.state, o = e;
                                        if (typeof t != "string")
                                            return pe.errors = [{ instancePath: s + "/state", schemaPath: "#/properties/state/type", keyword: "type", params: { type: "string" } }], !1;
                                        if (!(t === "legacy_unverified" || t === "pinned_on_login" || t === "registered_pinned"))
                                            return pe.errors = [{ instancePath: s + "/state", schemaPath: "#/properties/state/enum", keyword: "enum", params: { allowedValues: ps.properties.state.enum } }], !1;
                                        var a = o === e;
                                    }
                                    else
                                        var a = !0;
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return pe.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return pe.errors = i, e === 0; }
pe.evaluated = { props: { credential_id: !0, name: !0, created_at: !0, last_used_at: !0, backed_up: !0, transports: !0, rp_id: !0, state: !0 }, dynamicProps: !1, dynamicItems: !1 };
var ii = me;
function Gr(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Gr.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let a;
        if (r.name === void 0 && (a = "name"))
            return Gr.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        if (r.name !== void 0 && typeof r.name != "string")
            return Gr.errors = [{ instancePath: s + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" } }], !1;
    }
    else
        return Gr.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Gr.errors = i, e === 0; }
Gr.evaluated = { props: { name: !0 }, dynamicProps: !1, dynamicItems: !1 };
function me(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = me.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return me.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return me.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t)) {
                            let l;
                            if (t.credential_id === void 0 && (l = "credential_id"))
                                return me.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/required", keyword: "required", params: { missingProperty: l } }], !1;
                            {
                                let f = e;
                                for (let m in t)
                                    if (m !== "credential_id") {
                                        return me.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                if (f === e && t.credential_id !== void 0 && typeof t.credential_id != "string")
                                    return me.errors = [{ instancePath: s + "/pathParams/credential_id", schemaPath: "#/properties/pathParams/properties/credential_id/type", keyword: "type", params: { type: "string" } }], !1;
                            }
                        }
                        else
                            return me.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return me.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return me.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return me.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return me.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (r.body !== void 0) {
                                let t = e;
                                Gr(r.body, { instancePath: s + "/body", parentData: r, parentDataProperty: "body", rootData: y, dynamicAnchors: c }) || (i = i === null ? Gr.errors : i.concat(Gr.errors), e = i.length);
                                var a = t === e;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return me.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return me.errors = i, e === 0; }
me.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var oi = he;
function he(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = he.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return he.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return he.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t)) {
                            let l;
                            if (t.credential_id === void 0 && (l = "credential_id"))
                                return he.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/required", keyword: "required", params: { missingProperty: l } }], !1;
                            {
                                let f = e;
                                for (let m in t)
                                    if (m !== "credential_id") {
                                        return he.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                if (f === e && t.credential_id !== void 0 && typeof t.credential_id != "string")
                                    return he.errors = [{ instancePath: s + "/pathParams/credential_id", schemaPath: "#/properties/pathParams/properties/credential_id/type", keyword: "type", params: { type: "string" } }], !1;
                            }
                        }
                        else
                            return he.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return he.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return he.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return he.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return he.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return he.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return he.errors = i, e === 0; }
he.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ni = Ve;
function Ve(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ve.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let t;
        if (r.has_password === void 0 && (t = "has_password") || r.has_totp === void 0 && (t = "has_totp") || r.email === void 0 && (t = "email") || r.email_verified === void 0 && (t = "email_verified") || r.can_unbind_email === void 0 && (t = "can_unbind_email") || r.identities === void 0 && (t = "identities"))
            return Ve.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: t } }], !1;
        {
            let o = e;
            for (let l in r)
                if (!(l === "has_password" || l === "has_totp" || l === "email" || l === "email_verified" || l === "can_unbind_email" || l === "identities")) {
                    return Ve.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: l } }], !1;
                    break;
                }
            if (o === e) {
                if (r.has_password !== void 0) {
                    let l = e;
                    if (typeof r.has_password != "boolean")
                        return Ve.errors = [{ instancePath: s + "/has_password", schemaPath: "#/properties/has_password/type", keyword: "type", params: { type: "boolean" } }], !1;
                    var a = l === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.has_totp !== void 0) {
                        let l = e;
                        if (typeof r.has_totp != "boolean")
                            return Ve.errors = [{ instancePath: s + "/has_totp", schemaPath: "#/properties/has_totp/type", keyword: "type", params: { type: "boolean" } }], !1;
                        var a = l === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.email !== void 0) {
                            let l = r.email, f = e, m = e, _ = !1, u = e;
                            if (e === u && e === u)
                                if (typeof l == "string") {
                                    if (!nt.test(l)) {
                                        let g = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf/0/format", keyword: "format", params: { format: "email" } };
                                        i === null ? i = [g] : i.push(g), e++;
                                    }
                                }
                                else {
                                    let g = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                    i === null ? i = [g] : i.push(g), e++;
                                }
                            var p = u === e;
                            _ = _ || p;
                            let k = e;
                            if (l !== null) {
                                let g = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                i === null ? i = [g] : i.push(g), e++;
                            }
                            var p = k === e;
                            if (_ = _ || p, _)
                                e = m, i !== null && (m ? i.length = m : i = null);
                            else {
                                let g = { instancePath: s + "/email", schemaPath: "#/properties/email/anyOf", keyword: "anyOf", params: {} };
                                return i === null ? i = [g] : i.push(g), e++, Ve.errors = i, !1;
                            }
                            var a = f === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.email_verified !== void 0) {
                                let l = e;
                                if (typeof r.email_verified != "boolean")
                                    return Ve.errors = [{ instancePath: s + "/email_verified", schemaPath: "#/properties/email_verified/type", keyword: "type", params: { type: "boolean" } }], !1;
                                var a = l === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.can_unbind_email !== void 0) {
                                    let l = e;
                                    if (typeof r.can_unbind_email != "boolean")
                                        return Ve.errors = [{ instancePath: s + "/can_unbind_email", schemaPath: "#/properties/can_unbind_email/type", keyword: "type", params: { type: "boolean" } }], !1;
                                    var a = l === e;
                                }
                                else
                                    var a = !0;
                                if (a)
                                    if (r.identities !== void 0) {
                                        let l = r.identities, f = e;
                                        if (e === f)
                                            if (Array.isArray(l)) {
                                                var d = !0;
                                                let _ = l.length;
                                                for (let u = 0; u < _; u++) {
                                                    let k = e;
                                                    C(l[u], { instancePath: s + "/identities/" + u, parentData: l, parentDataProperty: u, rootData: y, dynamicAnchors: c }) || (i = i === null ? C.errors : i.concat(C.errors), e = i.length);
                                                    var d = k === e;
                                                    if (!d)
                                                        break;
                                                }
                                            }
                                            else
                                                return Ve.errors = [{ instancePath: s + "/identities", schemaPath: "#/properties/identities/type", keyword: "type", params: { type: "array" } }], !1;
                                        var a = f === e;
                                    }
                                    else
                                        var a = !0;
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return Ve.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ve.errors = i, e === 0; }
Ve.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var pi = it;
function le(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = le.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.session_id === void 0 && (p = "session_id"))
            return le.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.session_id !== void 0) {
            let d = e;
            if (typeof r.session_id != "string")
                return le.errors = [{ instancePath: s + "/session_id", schemaPath: "#/properties/session_id/type", keyword: "type", params: { type: "string" } }], !1;
            var a = d === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.current !== void 0) {
                let d = e;
                if (typeof r.current != "boolean")
                    return le.errors = [{ instancePath: s + "/current", schemaPath: "#/properties/current/type", keyword: "type", params: { type: "boolean" } }], !1;
                var a = d === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.created_at !== void 0) {
                    let d = e;
                    if (typeof r.created_at != "string")
                        return le.errors = [{ instancePath: s + "/created_at", schemaPath: "#/properties/created_at/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = d === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.last_seen_at !== void 0) {
                        let d = e;
                        if (typeof r.last_seen_at != "string")
                            return le.errors = [{ instancePath: s + "/last_seen_at", schemaPath: "#/properties/last_seen_at/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = d === e;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (r.ip !== void 0) {
                            let d = e;
                            if (typeof r.ip != "string")
                                return le.errors = [{ instancePath: s + "/ip", schemaPath: "#/properties/ip/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = d === e;
                        }
                        else
                            var a = !0;
                        if (a) {
                            if (r.user_agent !== void 0) {
                                let d = e;
                                if (typeof r.user_agent != "string")
                                    return le.errors = [{ instancePath: s + "/user_agent", schemaPath: "#/properties/user_agent/type", keyword: "type", params: { type: "string" } }], !1;
                                var a = d === e;
                            }
                            else
                                var a = !0;
                            if (a) {
                                if (r.device_label !== void 0) {
                                    let d = e;
                                    if (typeof r.device_label != "string")
                                        return le.errors = [{ instancePath: s + "/device_label", schemaPath: "#/properties/device_label/type", keyword: "type", params: { type: "string" } }], !1;
                                    var a = d === e;
                                }
                                else
                                    var a = !0;
                                if (a)
                                    if (r.kind !== void 0) {
                                        let d = e;
                                        if (typeof r.kind != "string")
                                            return le.errors = [{ instancePath: s + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" } }], !1;
                                        var a = d === e;
                                    }
                                    else
                                        var a = !0;
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return le.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return le.errors = i, e === 0; }
le.evaluated = { props: { session_id: !0, current: !0, created_at: !0, last_seen_at: !0, ip: !0, user_agent: !0, device_label: !0, kind: !0 }, dynamicProps: !1, dynamicItems: !1 };
function it(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = it.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.items === void 0 && (p = "items"))
            return it.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.items !== void 0) {
            let d = r.items;
            if (e === e)
                if (Array.isArray(d)) {
                    var a = !0;
                    let o = d.length;
                    for (let l = 0; l < o; l++) {
                        let f = e;
                        le(d[l], { instancePath: s + "/items/" + l, parentData: d, parentDataProperty: l, rootData: y, dynamicAnchors: c }) || (i = i === null ? le.errors : i.concat(le.errors), e = i.length);
                        var a = f === e;
                        if (!a)
                            break;
                    }
                }
                else
                    return it.errors = [{ instancePath: s + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" } }], !1;
        }
    }
    else
        return it.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return it.errors = i, e === 0; }
it.evaluated = { props: { items: !0 }, dynamicProps: !1, dynamicItems: !1 };
var di = lt;
function lt(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = lt.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.revoked !== void 0) {
            let a = r.revoked;
            if (!(typeof a == "number" && !(a % 1) && !isNaN(a) && isFinite(a)))
                return lt.errors = [{ instancePath: s + "/revoked", schemaPath: "#/properties/revoked/type", keyword: "type", params: { type: "integer" } }], !1;
        }
    }
    else
        return lt.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return lt.errors = i, e === 0; }
lt.evaluated = { props: { revoked: !0 }, dynamicProps: !1, dynamicItems: !1 };
var li = _e;
function _e(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = _e.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return _e.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return _e.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t)) {
                            let l;
                            if (t.session_id === void 0 && (l = "session_id"))
                                return _e.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/required", keyword: "required", params: { missingProperty: l } }], !1;
                            {
                                let f = e;
                                for (let m in t)
                                    if (m !== "session_id") {
                                        return _e.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                if (f === e && t.session_id !== void 0 && typeof t.session_id != "string")
                                    return _e.errors = [{ instancePath: s + "/pathParams/session_id", schemaPath: "#/properties/pathParams/properties/session_id/type", keyword: "type", params: { type: "string" } }], !1;
                            }
                        }
                        else
                            return _e.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return _e.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return _e.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let t = r.headers, o = e;
                            if (e === o)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let f in t) {
                                        return _e.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                        break;
                                    }
                                else
                                    return _e.errors = [{ instancePath: s + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = o === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return _e.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return _e.errors = i, e === 0; }
_e.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var fi = ft;
function Ar(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ar.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.site_code !== void 0) {
            let p = e;
            if (typeof r.site_code != "string")
                return Ar.errors = [{ instancePath: s + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
            var a = p === e;
        }
        else
            var a = !0;
        if (a) {
            if (r.display_name !== void 0) {
                let p = e;
                if (typeof r.display_name != "string")
                    return Ar.errors = [{ instancePath: s + "/display_name", schemaPath: "#/properties/display_name/type", keyword: "type", params: { type: "string" } }], !1;
                var a = p === e;
            }
            else
                var a = !0;
            if (a) {
                if (r.is_default !== void 0) {
                    let p = e;
                    if (typeof r.is_default != "boolean")
                        return Ar.errors = [{ instancePath: s + "/is_default", schemaPath: "#/properties/is_default/type", keyword: "type", params: { type: "boolean" } }], !1;
                    var a = p === e;
                }
                else
                    var a = !0;
                if (a)
                    if (r.status !== void 0) {
                        let p = e;
                        if (typeof r.status != "string")
                            return Ar.errors = [{ instancePath: s + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = p === e;
                    }
                    else
                        var a = !0;
            }
        }
    }
    else
        return Ar.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ar.errors = i, e === 0; }
Ar.evaluated = { props: { site_code: !0, display_name: !0, is_default: !0, status: !0 }, dynamicProps: !1, dynamicItems: !1 };
function ft(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = ft.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.items !== void 0) {
            let p = r.items;
            if (e === e)
                if (Array.isArray(p)) {
                    var a = !0;
                    let t = p.length;
                    for (let o = 0; o < t; o++) {
                        let l = e;
                        Ar(p[o], { instancePath: s + "/items/" + o, parentData: p, parentDataProperty: o, rootData: y, dynamicAnchors: c }) || (i = i === null ? Ar.errors : i.concat(Ar.errors), e = i.length);
                        var a = l === e;
                        if (!a)
                            break;
                    }
                }
                else
                    return ft.errors = [{ instancePath: s + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" } }], !1;
        }
    }
    else
        return ft.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ft.errors = i, e === 0; }
ft.evaluated = { props: { items: !0 }, dynamicProps: !1, dynamicItems: !1 };
var yi = Ne;
function Ne(r, { instancePath: s = "", parentData: v, parentDataProperty: P, rootData: y = r, dynamicAnchors: c = {} } = {}) { let i = null, e = 0, n = Ne.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return Ne.errors = [{ instancePath: s, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = e;
            for (let t in r)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return Ne.errors = [{ instancePath: s, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === e) {
                if (r.pathParams !== void 0) {
                    let t = r.pathParams, o = e;
                    if (e === o)
                        if (t && typeof t == "object" && !Array.isArray(t)) {
                            let l;
                            if (t.site_code === void 0 && (l = "site_code"))
                                return Ne.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/required", keyword: "required", params: { missingProperty: l } }], !1;
                            {
                                let f = e;
                                for (let m in t)
                                    if (m !== "site_code") {
                                        return Ne.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                if (f === e && t.site_code !== void 0 && typeof t.site_code != "string")
                                    return Ne.errors = [{ instancePath: s + "/pathParams/site_code", schemaPath: "#/properties/pathParams/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                            }
                        }
                        else
                            return Ne.errors = [{ instancePath: s + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = o === e;
                }
                else
                    var a = !0;
                if (a) {
                    if (r.query !== void 0) {
                        let t = r.query, o = e;
                        if (e === o)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let f in t) {
                                    return Ne.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                    break;
                                }
                            else
                                return Ne.errors = [{ instancePath: s + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = o === e;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (r.headers !== void 0) {
                            let t = e;
                            j(r.headers, { instancePath: s + "/headers", parentData: r, parentDataProperty: "headers", rootData: y, dynamicAnchors: c }) || (i = i === null ? j.errors : i.concat(j.errors), e = i.length);
                            var a = t === e;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return Ne.errors = [{ instancePath: s, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ne.errors = i, e === 0; }
Ne.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
export { Mr as h293_200, Mr as h294_200, Mr as h298_200, Mr as h299_200, Mr as h300_200, Mr as h302_200, Mr as h303_200, Mr as h317_200, Mr as h318_200, Mr as h324_200, xr as q264, Es as q265, Ls as q266, zs as q272, Ks as q273, rs as q274, Ts as q275, Hs as q276, Ys as q277, Bs as q278, ts as q279, ts as q280, $t as q281, Ws as q282, Js as q283, ta as q284, sa as q285, xr as q286, ia as q287, rs as q288, qs as q289, da as q290, la as q291, ya as q292, ua as q293, ma as q294, _a as q295, as as q296, as as q297, ka as q298, wa as q299, Aa as q300, xr as q301, xr as q302, Ia as q303, Oa as q304, xr as q305, za as q306, xr as q307, Ka as q308, xr as q309, Ra as q310, Fa as q311, Ta as q312, Za as q313, Xa as q314, $t as q315, Ua as q316, Qa as q317, Wa as q318, xr as q319, ri as q320, ai as q321, ii as q322, oi as q323, xr as q324, xr as q325, $t as q326, li as q327, xr as q328, yi as q329, Is as s264_200, Os as s265_200, h as s265_400, h as s265_401, h as s265_403, h as s265_409, h as s265_429, h as s265_500, h as s265_503, Ss as s266_200, h as s266_400, h as s266_401, h as s266_403, h as s266_503, Ns as s272_200, h as s272_400, h as s272_401, h as s272_403, h as s272_409, h as s272_503, Rs as s273_200, h as s273_400, h as s273_401, h as s273_403, h as s273_404, h as s273_409, h as s273_503, Fs as s274_200, h as s274_400, h as s274_401, h as s274_403, h as s274_404, h as s274_409, h as s274_503, Ms as s275_200, h as s275_401, h as s275_409, h as s275_429, Zr as s276_200, h as s276_429, Us as s277_200, h as s277_401, h as s277_429, _t as s278_200, h as s278_401, h as s278_403, h as s278_429, _t as s279_200, h as s279_401, _t as s280_200, h as s280_401, Zr as s281_200, _t as s282_200, h as s282_401, ea as s283_200, h as s283_429, Zr as s284_200, h as s284_429, Zr as s285_200, h as s285_400, aa as s286_200, oa as s287_200, h as s287_409, h as s287_429, pa as s288_200, h as s288_400, h as s288_401, h as s288_403, h as s288_404, h as s288_409, h as s288_503, h as s289_404, fa as s291_200, h as s291_400, h as s291_401, h as s291_403, h as s291_409, h as s291_503, js as s292_200, h as s292_400, h as s292_401, h as s292_403, h as s292_409, h as s292_503, ca as s293_200, h as s293_400, h as s293_401, h as s293_403, h as s293_404, h as s293_409, h as s293_429, h as s293_503, ha as s294_200, h as s294_400, h as s294_401, h as s294_403, h as s294_404, h as s294_409, h as s294_429, h as s294_503, Pa as s295_200, h as s295_404, Zr as s296_200, h as s296_409, Zr as s297_200, h as s297_409, ga as s298_200, h as s298_400, h as s298_401, h as s298_403, h as s298_404, h as s298_409, h as s298_429, h as s298_503, is as s299_200, h as s299_400, h as s299_401, h as s299_403, h as s299_404, h as s299_409, h as s299_429, h as s299_503, is as s300_200, h as s300_400, h as s300_401, h as s300_403, h as s300_404, h as s300_409, h as s300_429, h as s300_503, Da as s301_200, h as s301_400, h as s301_401, h as s301_403, h as s301_409, h as s301_503, xa as s302_200, h as s302_400, h as s302_401, h as s302_403, h as s302_404, h as s302_409, h as s302_429, h as s302_503, $a as s303_200, h as s303_400, h as s303_401, h as s303_403, h as s303_404, h as s303_409, h as s303_429, h as s303_503, La as s304_200, h as s304_400, h as s304_401, h as s304_403, h as s304_404, h as s304_409, h as s304_503, Sa as s305_200, h as s305_400, h as s305_401, h as s305_403, h as s305_409, h as s305_503, Na as s306_200, h as s306_400, h as s306_401, h as s306_403, h as s306_409, h as s306_503, ns as s307_200, h as s307_401, ns as s308_200, h as s308_401, Et as s309_200, h as s309_401, Et as s310_200, h as s310_401, Et as s311_200, h as s311_400, Zr as s312_200, h as s312_401, Ma as s313_200, h as s313_409, Ha as s314_200, h as s314_401, Ya as s315_200, h as s316_400, h as s316_401, h as s316_403, h as s316_404, h as s316_503, Ba as s317_200, h as s317_400, h as s317_401, h as s317_403, h as s317_404, h as s317_409, h as s317_429, h as s317_503, Ja as s318_200, h as s318_400, h as s318_401, h as s318_403, h as s318_404, h as s318_409, h as s318_429, h as s318_503, ei as s319_200, h as s319_401, ti as s320_200, h as s320_401, ds as s321_200, h as s321_400, ds as s322_200, h as s322_404, Zr as s323_200, h as s323_404, h as s323_409, ni as s324_200, h as s324_400, h as s324_401, h as s324_403, h as s324_404, h as s324_409, h as s324_429, h as s324_503, pi as s325_200, h as s325_401, di as s326_200, h as s326_401, Zr as s327_200, h as s327_404, fi as s328_200, h as s328_401, Zr as s329_200, h as s329_403, h as s329_404 };
