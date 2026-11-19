/** 构建时Ajv2020分域standalone独立产物；无运行时编译器。 */
var ae = (e, t) => () => { try {
    return t || e((t = { exports: {} }).exports, t), t.exports;
}
catch (u) {
    throw t = 0, u;
} };
var X = ae(D => {
    "use strict";
    Object.defineProperty(D, "__esModule", { value: !0 });
    D.formatNames = D.fastFormats = D.fullFormats = void 0;
    function z(e, t) { return { validate: e, compare: t }; }
    D.fullFormats = { date: z(G, O), time: z(F(!0), R), "date-time": z(V(!0), L), "iso-time": z(F(), K), "iso-date-time": z(V(), W), duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/, uri: pe, "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i, "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i, url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu, email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i, ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/, ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i, regex: he, uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i, "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/, "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i, "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/, byte: fe, int32: { type: "number", validate: le }, int64: { type: "number", validate: ce }, float: { type: "number", validate: C }, double: { type: "number", validate: C }, password: !0, binary: !0 };
    D.fastFormats = { ...D.fullFormats, date: z(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, O), time: z(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, R), "date-time": z(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, L), "iso-time": z(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, K), "iso-date-time": z(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, W), uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i, "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i, email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i };
    D.formatNames = Object.keys(D.fullFormats);
    function se(e) { return e % 4 === 0 && (e % 100 !== 0 || e % 400 === 0); }
    var ie = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, oe = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function G(e) { let t = ie.exec(e); if (!t)
        return !1; let u = +t[1], p = +t[2], l = +t[3]; return p >= 1 && p <= 12 && l >= 1 && l <= (p === 2 && se(u) ? 29 : oe[p]); }
    function O(e, t) { if (e && t)
        return e > t ? 1 : e < t ? -1 : 0; }
    var S = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function F(e) { return function (u) { let p = S.exec(u); if (!p)
        return !1; let l = +p[1], h = +p[2], d = +p[3], r = p[4], n = p[5] === "-" ? -1 : 1, a = +(p[6] || 0), i = +(p[7] || 0); if (a > 23 || i > 59 || e && !r)
        return !1; if (l <= 23 && h <= 59 && d < 60)
        return !0; let f = h - i * n, o = l - a * n - (f < 0 ? 1 : 0); return (o === 23 || o === -1) && (f === 59 || f === -1) && d < 61; }; }
    function R(e, t) { if (!(e && t))
        return; let u = new Date("2020-01-01T" + e).valueOf(), p = new Date("2020-01-01T" + t).valueOf(); if (u && p)
        return u - p; }
    function K(e, t) { if (!(e && t))
        return; let u = S.exec(e), p = S.exec(t); if (u && p)
        return e = u[1] + u[2] + u[3], t = p[1] + p[2] + p[3], e > t ? 1 : e < t ? -1 : 0; }
    var M = /t|\s/i;
    function V(e) { let t = F(e); return function (p) { let l = p.split(M); return l.length === 2 && G(l[0]) && t(l[1]); }; }
    function L(e, t) { if (!(e && t))
        return; let u = new Date(e).valueOf(), p = new Date(t).valueOf(); if (u && p)
        return u - p; }
    function W(e, t) { if (!(e && t))
        return; let [u, p] = e.split(M), [l, h] = t.split(M), d = O(u, l); if (d !== void 0)
        return d || R(p, h); }
    var ne = /\/|:/, de = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function pe(e) { return ne.test(e) && de.test(e); }
    var B = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function fe(e) { return B.lastIndex = 0, B.test(e); }
    var ye = -(2 ** 31), ue = 2 ** 31 - 1;
    function le(e) { return Number.isInteger(e) && e <= ue && e >= ye; }
    function ce(e) { return Number.isInteger(e); }
    function C() { return !0; }
    var me = /[^\\]\\Z/;
    function he(e) { if (me.test(e))
        return !1; try {
        return new RegExp(e), !0;
    }
    catch {
        return !1;
    } }
});
var be = { ...X().fullFormats, uint64: { type: "number", validate: Number.isInteger }, uint32: { type: "number", validate: Number.isInteger } }, Z = q;
function q(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = q.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let i;
        if (e.pathParams === void 0 && (i = "pathParams") || e.query === void 0 && (i = "query") || e.headers === void 0 && (i = "headers"))
            return q.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: i } }], !1;
        {
            let f = r;
            for (let o in e)
                if (!(o === "pathParams" || o === "query" || o === "headers")) {
                    return q.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (f === r) {
                if (e.pathParams !== void 0) {
                    let o = e.pathParams, s = r;
                    if (r === s)
                        if (o && typeof o == "object" && !Array.isArray(o))
                            for (let c in o) {
                                return q.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: c } }], !1;
                                break;
                            }
                        else
                            return q.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = s === r;
                }
                else
                    var a = !0;
                if (a) {
                    if (e.query !== void 0) {
                        let o = e.query, s = r;
                        if (r === s)
                            if (o && typeof o == "object" && !Array.isArray(o))
                                for (let P in o) {
                                    return q.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: P } }], !1;
                                    break;
                                }
                            else
                                return q.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = s === r;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (e.headers !== void 0) {
                            let o = e.headers, s = r;
                            if (r === s)
                                if (o && typeof o == "object" && !Array.isArray(o))
                                    for (let P in o) {
                                        return q.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: P } }], !1;
                                        break;
                                    }
                                else
                                    return q.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = s === r;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return q.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return q.errors = d, r === 0; }
q.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var H = I;
function I(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = I.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        if (e.keys !== void 0) {
            let i = e.keys;
            if (r === r)
                if (Array.isArray(i)) {
                    var a = !0;
                    let o = i.length;
                    for (let s = 0; s < o; s++) {
                        let c = i[s], P = r;
                        if (!(c && typeof c == "object" && !Array.isArray(c)))
                            return I.errors = [{ instancePath: t + "/keys/" + s, schemaPath: "#/properties/keys/items/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = P === r;
                        if (!a)
                            break;
                    }
                }
                else
                    return I.errors = [{ instancePath: t + "/keys", schemaPath: "#/properties/keys/type", keyword: "type", params: { type: "array" } }], !1;
        }
    }
    else
        return I.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return I.errors = d, r === 0; }
I.evaluated = { props: { keys: !0 }, dynamicProps: !1, dynamicItems: !1 };
var J = E;
function E(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = E.evaluated; return n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), e && typeof e == "object" && !Array.isArray(e) ? (E.errors = d, r === 0) : (E.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1); }
E.evaluated = { dynamicProps: !1, dynamicItems: !1 };
var Q = $;
function $(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = $.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let i = r;
        for (let f in e)
            if (!(f === "cache-control" || f === "pragma")) {
                return $.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                break;
            }
        if (i === r) {
            if (e["cache-control"] !== void 0) {
                let f = r;
                if (typeof e["cache-control"] != "string")
                    return $.errors = [{ instancePath: t + "/cache-control", schemaPath: "#/properties/cache-control/type", keyword: "type", params: { type: "string" } }], !1;
                var a = f === r;
            }
            else
                var a = !0;
            if (a)
                if (e.pragma !== void 0) {
                    let f = r;
                    if (typeof e.pragma != "string")
                        return $.errors = [{ instancePath: t + "/pragma", schemaPath: "#/properties/pragma/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = f === r;
                }
                else
                    var a = !0;
        }
    }
    else
        return $.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return $.errors = d, r === 0; }
$.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Y = k;
function k(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = k.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let i;
        if (e.pathParams === void 0 && (i = "pathParams") || e.query === void 0 && (i = "query") || e.headers === void 0 && (i = "headers") || e.body === void 0 && (i = "body"))
            return k.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: i } }], !1;
        {
            let f = r;
            for (let o in e)
                if (!(o === "pathParams" || o === "query" || o === "headers" || o === "body")) {
                    return k.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (f === r) {
                if (e.pathParams !== void 0) {
                    let o = e.pathParams, s = r;
                    if (r === s)
                        if (o && typeof o == "object" && !Array.isArray(o))
                            for (let c in o) {
                                return k.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: c } }], !1;
                                break;
                            }
                        else
                            return k.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = s === r;
                }
                else
                    var a = !0;
                if (a) {
                    if (e.query !== void 0) {
                        let o = e.query, s = r;
                        if (r === s)
                            if (o && typeof o == "object" && !Array.isArray(o))
                                for (let P in o) {
                                    return k.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: P } }], !1;
                                    break;
                                }
                            else
                                return k.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = s === r;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (e.headers !== void 0) {
                            let o = e.headers, s = r;
                            if (r === s)
                                if (o && typeof o == "object" && !Array.isArray(o))
                                    for (let P in o) {
                                        return k.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: P } }], !1;
                                        break;
                                    }
                                else
                                    return k.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = s === r;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (e.body !== void 0) {
                                let o = e.body, s = r;
                                if (!(o && typeof o == "object" && !Array.isArray(o)))
                                    return k.errors = [{ instancePath: t + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "object" } }], !1;
                                var a = s === r;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return k.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return k.errors = d, r === 0; }
k.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Pe = m;
function m(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = m.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let f;
        if (e.pathParams === void 0 && (f = "pathParams") || e.query === void 0 && (f = "query") || e.headers === void 0 && (f = "headers"))
            return m.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: f } }], !1;
        {
            let o = r;
            for (let s in e)
                if (!(s === "pathParams" || s === "query" || s === "headers")) {
                    return m.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: s } }], !1;
                    break;
                }
            if (o === r) {
                if (e.pathParams !== void 0) {
                    let s = e.pathParams, c = r;
                    if (r === c)
                        if (s && typeof s == "object" && !Array.isArray(s))
                            for (let P in s) {
                                return m.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: P } }], !1;
                                break;
                            }
                        else
                            return m.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var a = c === r;
                }
                else
                    var a = !0;
                if (a) {
                    if (e.query !== void 0) {
                        let s = e.query, c = r;
                        if (r === c)
                            if (s && typeof s == "object" && !Array.isArray(s)) {
                                let b;
                                if (s.client_id === void 0 && (b = "client_id") || s.redirect_uri === void 0 && (b = "redirect_uri") || s.response_type === void 0 && (b = "response_type"))
                                    return m.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/required", keyword: "required", params: { missingProperty: b } }], !1;
                                {
                                    let N = r;
                                    for (let y in s)
                                        if (!(y === "client_id" || y === "redirect_uri" || y === "response_type" || y === "scope" || y === "state" || y === "code_challenge" || y === "code_challenge_method")) {
                                            return m.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                            break;
                                        }
                                    if (N === r) {
                                        if (s.client_id !== void 0) {
                                            let y = r;
                                            if (typeof s.client_id != "string")
                                                return m.errors = [{ instancePath: t + "/query/client_id", schemaPath: "#/properties/query/properties/client_id/type", keyword: "type", params: { type: "string" } }], !1;
                                            var i = y === r;
                                        }
                                        else
                                            var i = !0;
                                        if (i) {
                                            if (s.redirect_uri !== void 0) {
                                                let y = r;
                                                if (typeof s.redirect_uri != "string")
                                                    return m.errors = [{ instancePath: t + "/query/redirect_uri", schemaPath: "#/properties/query/properties/redirect_uri/type", keyword: "type", params: { type: "string" } }], !1;
                                                var i = y === r;
                                            }
                                            else
                                                var i = !0;
                                            if (i) {
                                                if (s.response_type !== void 0) {
                                                    let y = r;
                                                    if (typeof s.response_type != "string")
                                                        return m.errors = [{ instancePath: t + "/query/response_type", schemaPath: "#/properties/query/properties/response_type/type", keyword: "type", params: { type: "string" } }], !1;
                                                    var i = y === r;
                                                }
                                                else
                                                    var i = !0;
                                                if (i) {
                                                    if (s.scope !== void 0) {
                                                        let y = r;
                                                        if (typeof s.scope != "string")
                                                            return m.errors = [{ instancePath: t + "/query/scope", schemaPath: "#/properties/query/properties/scope/type", keyword: "type", params: { type: "string" } }], !1;
                                                        var i = y === r;
                                                    }
                                                    else
                                                        var i = !0;
                                                    if (i) {
                                                        if (s.state !== void 0) {
                                                            let y = r;
                                                            if (typeof s.state != "string")
                                                                return m.errors = [{ instancePath: t + "/query/state", schemaPath: "#/properties/query/properties/state/type", keyword: "type", params: { type: "string" } }], !1;
                                                            var i = y === r;
                                                        }
                                                        else
                                                            var i = !0;
                                                        if (i) {
                                                            if (s.code_challenge !== void 0) {
                                                                let y = r;
                                                                if (typeof s.code_challenge != "string")
                                                                    return m.errors = [{ instancePath: t + "/query/code_challenge", schemaPath: "#/properties/query/properties/code_challenge/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var i = y === r;
                                                            }
                                                            else
                                                                var i = !0;
                                                            if (i)
                                                                if (s.code_challenge_method !== void 0) {
                                                                    let y = r;
                                                                    if (typeof s.code_challenge_method != "string")
                                                                        return m.errors = [{ instancePath: t + "/query/code_challenge_method", schemaPath: "#/properties/query/properties/code_challenge_method/type", keyword: "type", params: { type: "string" } }], !1;
                                                                    var i = y === r;
                                                                }
                                                                else
                                                                    var i = !0;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else
                                return m.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = c === r;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (e.headers !== void 0) {
                            let s = e.headers, c = r;
                            if (r === c)
                                if (s && typeof s == "object" && !Array.isArray(s))
                                    for (let b in s) {
                                        return m.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: b } }], !1;
                                        break;
                                    }
                                else
                                    return m.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = c === r;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return m.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return m.errors = d, r === 0; }
m.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ee = j;
function j(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = j.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        if (e.device_code !== void 0) {
            let i = r;
            if (typeof e.device_code != "string")
                return j.errors = [{ instancePath: t + "/device_code", schemaPath: "#/properties/device_code/type", keyword: "type", params: { type: "string" } }], !1;
            var a = i === r;
        }
        else
            var a = !0;
        if (a) {
            if (e.user_code !== void 0) {
                let i = r;
                if (typeof e.user_code != "string")
                    return j.errors = [{ instancePath: t + "/user_code", schemaPath: "#/properties/user_code/type", keyword: "type", params: { type: "string" } }], !1;
                var a = i === r;
            }
            else
                var a = !0;
            if (a) {
                if (e.verification_uri !== void 0) {
                    let i = r;
                    if (typeof e.verification_uri != "string")
                        return j.errors = [{ instancePath: t + "/verification_uri", schemaPath: "#/properties/verification_uri/type", keyword: "type", params: { type: "string" } }], !1;
                    var a = i === r;
                }
                else
                    var a = !0;
                if (a) {
                    if (e.verification_uri_complete !== void 0) {
                        let i = r;
                        if (typeof e.verification_uri_complete != "string")
                            return j.errors = [{ instancePath: t + "/verification_uri_complete", schemaPath: "#/properties/verification_uri_complete/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = i === r;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (e.expires_in !== void 0) {
                            let i = e.expires_in, f = r;
                            if (!(typeof i == "number" && !(i % 1) && !isNaN(i) && isFinite(i)))
                                return j.errors = [{ instancePath: t + "/expires_in", schemaPath: "#/properties/expires_in/type", keyword: "type", params: { type: "integer" } }], !1;
                            var a = f === r;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (e.interval !== void 0) {
                                let i = e.interval, f = r;
                                if (!(typeof i == "number" && !(i % 1) && !isNaN(i) && isFinite(i)))
                                    return j.errors = [{ instancePath: t + "/interval", schemaPath: "#/properties/interval/type", keyword: "type", params: { type: "integer" } }], !1;
                                var a = f === r;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return j.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return j.errors = d, r === 0; }
j.evaluated = { props: { device_code: !0, user_code: !0, verification_uri: !0, verification_uri_complete: !0, expires_in: !0, interval: !0 }, dynamicProps: !1, dynamicItems: !1 };
var T = w;
function v(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = v.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let a;
        if (e.slug === void 0 && (a = "slug"))
            return v.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: a } }], !1;
        {
            let i = r;
            for (let f in e)
                if (f !== "slug") {
                    return v.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                    break;
                }
            if (i === r && e.slug !== void 0 && typeof e.slug != "string")
                return v.errors = [{ instancePath: t + "/slug", schemaPath: "#/properties/slug/type", keyword: "type", params: { type: "string" } }], !1;
        }
    }
    else
        return v.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return v.errors = d, r === 0; }
v.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function w(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = w.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let i;
        if (e.pathParams === void 0 && (i = "pathParams") || e.query === void 0 && (i = "query") || e.headers === void 0 && (i = "headers"))
            return w.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: i } }], !1;
        {
            let f = r;
            for (let o in e)
                if (!(o === "pathParams" || o === "query" || o === "headers")) {
                    return w.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (f === r) {
                if (e.pathParams !== void 0) {
                    let o = r;
                    v(e.pathParams, { instancePath: t + "/pathParams", parentData: e, parentDataProperty: "pathParams", rootData: l, dynamicAnchors: h }) || (d = d === null ? v.errors : d.concat(v.errors), r = d.length);
                    var a = o === r;
                }
                else
                    var a = !0;
                if (a) {
                    if (e.query !== void 0) {
                        let o = e.query, s = r;
                        if (r === s)
                            if (o && typeof o == "object" && !Array.isArray(o))
                                for (let P in o) {
                                    return w.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: P } }], !1;
                                    break;
                                }
                            else
                                return w.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = s === r;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (e.headers !== void 0) {
                            let o = e.headers, s = r;
                            if (r === s)
                                if (o && typeof o == "object" && !Array.isArray(o))
                                    for (let P in o) {
                                        return w.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: P } }], !1;
                                        break;
                                    }
                                else
                                    return w.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = s === r;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return w.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return w.errors = d, r === 0; }
w.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ve = _;
function _(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = _.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let f;
        if (e.pathParams === void 0 && (f = "pathParams") || e.query === void 0 && (f = "query") || e.headers === void 0 && (f = "headers"))
            return _.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: f } }], !1;
        {
            let o = r;
            for (let s in e)
                if (!(s === "pathParams" || s === "query" || s === "headers")) {
                    return _.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: s } }], !1;
                    break;
                }
            if (o === r) {
                if (e.pathParams !== void 0) {
                    let s = r;
                    v(e.pathParams, { instancePath: t + "/pathParams", parentData: e, parentDataProperty: "pathParams", rootData: l, dynamicAnchors: h }) || (d = d === null ? v.errors : d.concat(v.errors), r = d.length);
                    var a = s === r;
                }
                else
                    var a = !0;
                if (a) {
                    if (e.query !== void 0) {
                        let s = e.query, c = r;
                        if (r === c)
                            if (s && typeof s == "object" && !Array.isArray(s)) {
                                let b;
                                if (s.client_id === void 0 && (b = "client_id") || s.redirect_uri === void 0 && (b = "redirect_uri") || s.response_type === void 0 && (b = "response_type"))
                                    return _.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/required", keyword: "required", params: { missingProperty: b } }], !1;
                                {
                                    let N = r;
                                    for (let y in s)
                                        if (!(y === "client_id" || y === "redirect_uri" || y === "response_type")) {
                                            return _.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                            break;
                                        }
                                    if (N === r) {
                                        if (s.client_id !== void 0) {
                                            let y = r;
                                            if (typeof s.client_id != "string")
                                                return _.errors = [{ instancePath: t + "/query/client_id", schemaPath: "#/properties/query/properties/client_id/type", keyword: "type", params: { type: "string" } }], !1;
                                            var i = y === r;
                                        }
                                        else
                                            var i = !0;
                                        if (i) {
                                            if (s.redirect_uri !== void 0) {
                                                let y = r;
                                                if (typeof s.redirect_uri != "string")
                                                    return _.errors = [{ instancePath: t + "/query/redirect_uri", schemaPath: "#/properties/query/properties/redirect_uri/type", keyword: "type", params: { type: "string" } }], !1;
                                                var i = y === r;
                                            }
                                            else
                                                var i = !0;
                                            if (i)
                                                if (s.response_type !== void 0) {
                                                    let y = r;
                                                    if (typeof s.response_type != "string")
                                                        return _.errors = [{ instancePath: t + "/query/response_type", schemaPath: "#/properties/query/properties/response_type/type", keyword: "type", params: { type: "string" } }], !1;
                                                    var i = y === r;
                                                }
                                                else
                                                    var i = !0;
                                        }
                                    }
                                }
                            }
                            else
                                return _.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = c === r;
                    }
                    else
                        var a = !0;
                    if (a)
                        if (e.headers !== void 0) {
                            let s = e.headers, c = r;
                            if (r === c)
                                if (s && typeof s == "object" && !Array.isArray(s))
                                    for (let b in s) {
                                        return _.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: b } }], !1;
                                        break;
                                    }
                                else
                                    return _.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = c === r;
                        }
                        else
                            var a = !0;
                }
            }
        }
    }
    else
        return _.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return _.errors = d, r === 0; }
_.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var U = g;
function g(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = g.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let i;
        if (e.pathParams === void 0 && (i = "pathParams") || e.query === void 0 && (i = "query") || e.headers === void 0 && (i = "headers") || e.body === void 0 && (i = "body"))
            return g.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: i } }], !1;
        {
            let f = r;
            for (let o in e)
                if (!(o === "pathParams" || o === "query" || o === "headers" || o === "body")) {
                    return g.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (f === r) {
                if (e.pathParams !== void 0) {
                    let o = r;
                    v(e.pathParams, { instancePath: t + "/pathParams", parentData: e, parentDataProperty: "pathParams", rootData: l, dynamicAnchors: h }) || (d = d === null ? v.errors : d.concat(v.errors), r = d.length);
                    var a = o === r;
                }
                else
                    var a = !0;
                if (a) {
                    if (e.query !== void 0) {
                        let o = e.query, s = r;
                        if (r === s)
                            if (o && typeof o == "object" && !Array.isArray(o))
                                for (let P in o) {
                                    return g.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: P } }], !1;
                                    break;
                                }
                            else
                                return g.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var a = s === r;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (e.headers !== void 0) {
                            let o = e.headers, s = r;
                            if (r === s)
                                if (o && typeof o == "object" && !Array.isArray(o))
                                    for (let P in o) {
                                        return g.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: P } }], !1;
                                        break;
                                    }
                                else
                                    return g.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var a = s === r;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (e.body !== void 0) {
                                let o = e.body, s = r;
                                if (!(o && typeof o == "object" && !Array.isArray(o)))
                                    return g.errors = [{ instancePath: t + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "object" } }], !1;
                                var a = s === r;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return g.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return g.errors = d, r === 0; }
g.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var re = x;
function x(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = x.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        if (e.sub !== void 0 && typeof e.sub != "string")
            return x.errors = [{ instancePath: t + "/sub", schemaPath: "#/properties/sub/type", keyword: "type", params: { type: "string" } }], !1;
    }
    else
        return x.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return x.errors = d, r === 0; }
x.evaluated = { props: { sub: !0 }, dynamicProps: !1, dynamicItems: !1 };
var te = A;
function A(e, { instancePath: t = "", parentData: u, parentDataProperty: p, rootData: l = e, dynamicAnchors: h = {} } = {}) { let d = null, r = 0, n = A.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        if (e.access_token !== void 0) {
            let i = r;
            if (typeof e.access_token != "string")
                return A.errors = [{ instancePath: t + "/access_token", schemaPath: "#/properties/access_token/type", keyword: "type", params: { type: "string" } }], !1;
            var a = i === r;
        }
        else
            var a = !0;
        if (a) {
            if (e.token_type !== void 0) {
                let i = r;
                if (typeof e.token_type != "string")
                    return A.errors = [{ instancePath: t + "/token_type", schemaPath: "#/properties/token_type/type", keyword: "type", params: { type: "string" } }], !1;
                var a = i === r;
            }
            else
                var a = !0;
            if (a) {
                if (e.expires_in !== void 0) {
                    let i = e.expires_in, f = r;
                    if (!(typeof i == "number" && !(i % 1) && !isNaN(i) && isFinite(i)))
                        return A.errors = [{ instancePath: t + "/expires_in", schemaPath: "#/properties/expires_in/type", keyword: "type", params: { type: "integer" } }], !1;
                    var a = f === r;
                }
                else
                    var a = !0;
                if (a) {
                    if (e.refresh_token !== void 0) {
                        let i = r;
                        if (typeof e.refresh_token != "string")
                            return A.errors = [{ instancePath: t + "/refresh_token", schemaPath: "#/properties/refresh_token/type", keyword: "type", params: { type: "string" } }], !1;
                        var a = i === r;
                    }
                    else
                        var a = !0;
                    if (a) {
                        if (e.id_token !== void 0) {
                            let i = r;
                            if (typeof e.id_token != "string")
                                return A.errors = [{ instancePath: t + "/id_token", schemaPath: "#/properties/id_token/type", keyword: "type", params: { type: "string" } }], !1;
                            var a = i === r;
                        }
                        else
                            var a = !0;
                        if (a)
                            if (e.scope !== void 0) {
                                let i = r;
                                if (typeof e.scope != "string")
                                    return A.errors = [{ instancePath: t + "/scope", schemaPath: "#/properties/scope/type", keyword: "type", params: { type: "string" } }], !1;
                                var a = i === r;
                            }
                            else
                                var a = !0;
                    }
                }
            }
        }
    }
    else
        return A.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return A.errors = d, r === 0; }
A.evaluated = { props: { access_token: !0, token_type: !0, expires_in: !0, refresh_token: !0, id_token: !0, scope: !0 }, dynamicProps: !1, dynamicItems: !1 };
export { Q as h340_200, Q as h342_200, Z as q0, Z as q1, Pe as q234, Y as q240, Z as q261, T as q333, ve as q334, U as q335, T as q336, T as q337, T as q338, U as q339, U as q340, Y as q341, Y as q342, H as s0_200, J as s1_200, ee as s240_200, H as s261_200, J as s333_200, ee as s335_200, H as s336_200, re as s337_200, re as s338_200, te as s339_200, te as s341_200 };
