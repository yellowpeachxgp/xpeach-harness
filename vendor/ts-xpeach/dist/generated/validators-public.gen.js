/** 构建时Ajv2020分域standalone独立产物；无运行时编译器。 */
var H = (e, r) => () => { try {
    return r || e((r = { exports: {} }).exports, r), r.exports;
}
catch (d) {
    throw r = 0, d;
} };
var O = H(_ => {
    "use strict";
    Object.defineProperty(_, "__esModule", { value: !0 });
    _.formatNames = _.fastFormats = _.fullFormats = void 0;
    function h(e, r) { return { validate: e, compare: r }; }
    _.fullFormats = { date: h(x, q), time: h($(!0), A), "date-time": h(I(!0), F), "iso-time": h($(), E), "iso-date-time": h(I(), M), duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/, uri: B, "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i, "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i, url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu, email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i, ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/, ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i, regex: Q, uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i, "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/, "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i, "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/, byte: G, int32: { type: "number", validate: W }, int64: { type: "number", validate: X }, float: { type: "number", validate: N }, double: { type: "number", validate: N }, password: !0, binary: !0 };
    _.fastFormats = { ..._.fullFormats, date: h(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, q), time: h(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, A), "date-time": h(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, F), "iso-time": h(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, E), "iso-date-time": h(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, M), uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i, "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i, email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i };
    _.formatNames = Object.keys(_.fullFormats);
    function Z(e) { return e % 4 === 0 && (e % 100 !== 0 || e % 400 === 0); }
    var Y = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, C = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function x(e) { let r = Y.exec(e); if (!r)
        return !1; let d = +r[1], n = +r[2], l = +r[3]; return n >= 1 && n <= 12 && l >= 1 && l <= (n === 2 && Z(d) ? 29 : C[n]); }
    function q(e, r) { if (e && r)
        return e > r ? 1 : e < r ? -1 : 0; }
    var g = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function $(e) { return function (d) { let n = g.exec(d); if (!n)
        return !1; let l = +n[1], v = +n[2], u = +n[3], a = n[4], o = n[5] === "-" ? -1 : 1, s = +(n[6] || 0), p = +(n[7] || 0); if (s > 23 || p > 59 || e && !a)
        return !1; if (l <= 23 && v <= 59 && u < 60)
        return !0; let f = v - p * o, t = l - s * o - (f < 0 ? 1 : 0); return (t === 23 || t === -1) && (f === 59 || f === -1) && u < 61; }; }
    function A(e, r) { if (!(e && r))
        return; let d = new Date("2020-01-01T" + e).valueOf(), n = new Date("2020-01-01T" + r).valueOf(); if (d && n)
        return d - n; }
    function E(e, r) { if (!(e && r))
        return; let d = g.exec(e), n = g.exec(r); if (d && n)
        return e = d[1] + d[2] + d[3], r = n[1] + n[2] + n[3], e > r ? 1 : e < r ? -1 : 0; }
    var w = /t|\s/i;
    function I(e) { let r = $(e); return function (n) { let l = n.split(w); return l.length === 2 && x(l[0]) && r(l[1]); }; }
    function F(e, r) { if (!(e && r))
        return; let d = new Date(e).valueOf(), n = new Date(r).valueOf(); if (d && n)
        return d - n; }
    function M(e, r) { if (!(e && r))
        return; let [d, n] = e.split(w), [l, v] = r.split(w), u = q(d, l); if (u !== void 0)
        return u || A(n, v); }
    var V = /\/|:/, U = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function B(e) { return V.test(e) && U.test(e); }
    var T = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function G(e) { return T.lastIndex = 0, T.test(e); }
    var K = -(2 ** 31), L = 2 ** 31 - 1;
    function W(e) { return Number.isInteger(e) && e <= L && e >= K; }
    function X(e) { return Number.isInteger(e); }
    function N() { return !0; }
    var J = /[^\\]\\Z/;
    function Q(e) { if (J.test(e))
        return !1; try {
        return new RegExp(e), !0;
    }
    catch {
        return !1;
    } }
});
var ee = { ...O().fullFormats, uint64: { type: "number", validate: Number.isInteger }, uint32: { type: "number", validate: Number.isInteger } }, D = y;
function y(e, { instancePath: r = "", parentData: d, parentDataProperty: n, rootData: l = e, dynamicAnchors: v = {} } = {}) { let u = null, a = 0, o = y.evaluated; if (o.dynamicProps && (o.props = void 0), o.dynamicItems && (o.items = void 0), a === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let p;
        if (e.pathParams === void 0 && (p = "pathParams") || e.query === void 0 && (p = "query") || e.headers === void 0 && (p = "headers"))
            return y.errors = [{ instancePath: r, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let f = a;
            for (let t in e)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return y.errors = [{ instancePath: r, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (f === a) {
                if (e.pathParams !== void 0) {
                    let t = e.pathParams, i = a;
                    if (a === i)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let k in t) {
                                return y.errors = [{ instancePath: r + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: k } }], !1;
                                break;
                            }
                        else
                            return y.errors = [{ instancePath: r + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = i === a;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.query !== void 0) {
                        let t = e.query, i = a;
                        if (a === i)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let b in t) {
                                    return y.errors = [{ instancePath: r + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: b } }], !1;
                                    break;
                                }
                            else
                                return y.errors = [{ instancePath: r + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = i === a;
                    }
                    else
                        var s = !0;
                    if (s)
                        if (e.headers !== void 0) {
                            let t = e.headers, i = a;
                            if (a === i)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let b in t) {
                                        return y.errors = [{ instancePath: r + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: b } }], !1;
                                        break;
                                    }
                                else
                                    return y.errors = [{ instancePath: r + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var s = i === a;
                        }
                        else
                            var s = !0;
                }
            }
        }
    }
    else
        return y.errors = [{ instancePath: r, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return y.errors = u, a === 0; }
y.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var re = P;
function P(e, { instancePath: r = "", parentData: d, parentDataProperty: n, rootData: l = e, dynamicAnchors: v = {} } = {}) { let u = null, a = 0, o = P.evaluated; if (o.dynamicProps && (o.props = void 0), o.dynamicItems && (o.items = void 0), a === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let s;
        if (e.client_ip === void 0 && (s = "client_ip"))
            return P.errors = [{ instancePath: r, schemaPath: "#/required", keyword: "required", params: { missingProperty: s } }], !1;
        {
            let p = a;
            for (let f in e)
                if (f !== "client_ip") {
                    return P.errors = [{ instancePath: r, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                    break;
                }
            if (p === a && e.client_ip !== void 0 && typeof e.client_ip != "string")
                return P.errors = [{ instancePath: r + "/client_ip", schemaPath: "#/properties/client_ip/type", keyword: "type", params: { type: "string" } }], !1;
        }
    }
    else
        return P.errors = [{ instancePath: r, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return P.errors = u, a === 0; }
P.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var j = m, ae = { type: "object", additionalProperties: !1, required: ["release_digest", "schema_version", "epoch", "mode", "dependencies_ok", "business_ready", "checks"], properties: { release_digest: { type: "string" }, schema_version: { type: "string" }, epoch: { type: "string" }, mode: { type: "string", enum: ["pre_open", "maintenance", "active", "draining"] }, dependencies_ok: { type: "boolean" }, business_ready: { type: "boolean" }, checks: { type: "array", items: { $ref: "#/components/schemas/CenterHealthCheck" } } } };
var te = ee.uint64;
function c(e, { instancePath: r = "", parentData: d, parentDataProperty: n, rootData: l = e, dynamicAnchors: v = {} } = {}) { let u = null, a = 0, o = c.evaluated; if (o.dynamicProps && (o.props = void 0), o.dynamicItems && (o.items = void 0), a === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let p;
        if (e.name === void 0 && (p = "name") || e.ok === void 0 && (p = "ok") || e.required === void 0 && (p = "required") || e.latency_ms === void 0 && (p = "latency_ms"))
            return c.errors = [{ instancePath: r, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let f = a;
            for (let t in e)
                if (!(t === "name" || t === "ok" || t === "required" || t === "detail" || t === "latency_ms")) {
                    return c.errors = [{ instancePath: r, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (f === a) {
                if (e.name !== void 0) {
                    let t = a;
                    if (typeof e.name != "string")
                        return c.errors = [{ instancePath: r + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = t === a;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.ok !== void 0) {
                        let t = a;
                        if (typeof e.ok != "boolean")
                            return c.errors = [{ instancePath: r + "/ok", schemaPath: "#/properties/ok/type", keyword: "type", params: { type: "boolean" } }], !1;
                        var s = t === a;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.required !== void 0) {
                            let t = a;
                            if (typeof e.required != "boolean")
                                return c.errors = [{ instancePath: r + "/required", schemaPath: "#/properties/required/type", keyword: "type", params: { type: "boolean" } }], !1;
                            var s = t === a;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (e.detail !== void 0) {
                                let t = a;
                                if (typeof e.detail != "string")
                                    return c.errors = [{ instancePath: r + "/detail", schemaPath: "#/properties/detail/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = t === a;
                            }
                            else
                                var s = !0;
                            if (s)
                                if (e.latency_ms !== void 0) {
                                    let t = e.latency_ms, i = a;
                                    if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                                        return c.errors = [{ instancePath: r + "/latency_ms", schemaPath: "#/properties/latency_ms/type", keyword: "type", params: { type: "integer" } }], !1;
                                    if (a === i && typeof t == "number" && isFinite(t)) {
                                        if (t > 18446744073709552e3 || isNaN(t))
                                            return c.errors = [{ instancePath: r + "/latency_ms", schemaPath: "#/properties/latency_ms/maximum", keyword: "maximum", params: { comparison: "<=", limit: 18446744073709552e3 } }], !1;
                                        if (t < 0 || isNaN(t))
                                            return c.errors = [{ instancePath: r + "/latency_ms", schemaPath: "#/properties/latency_ms/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                        if (!te.validate(t))
                                            return c.errors = [{ instancePath: r + "/latency_ms", schemaPath: "#/properties/latency_ms/format", keyword: "format", params: { format: "uint64" } }], !1;
                                    }
                                    var s = i === a;
                                }
                                else
                                    var s = !0;
                        }
                    }
                }
            }
        }
    }
    else
        return c.errors = [{ instancePath: r, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return c.errors = u, a === 0; }
c.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function m(e, { instancePath: r = "", parentData: d, parentDataProperty: n, rootData: l = e, dynamicAnchors: v = {} } = {}) { let u = null, a = 0, o = m.evaluated; if (o.dynamicProps && (o.props = void 0), o.dynamicItems && (o.items = void 0), a === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let f;
        if (e.release_digest === void 0 && (f = "release_digest") || e.schema_version === void 0 && (f = "schema_version") || e.epoch === void 0 && (f = "epoch") || e.mode === void 0 && (f = "mode") || e.dependencies_ok === void 0 && (f = "dependencies_ok") || e.business_ready === void 0 && (f = "business_ready") || e.checks === void 0 && (f = "checks"))
            return m.errors = [{ instancePath: r, schemaPath: "#/required", keyword: "required", params: { missingProperty: f } }], !1;
        {
            let t = a;
            for (let i in e)
                if (!(i === "release_digest" || i === "schema_version" || i === "epoch" || i === "mode" || i === "dependencies_ok" || i === "business_ready" || i === "checks")) {
                    return m.errors = [{ instancePath: r, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (t === a) {
                if (e.release_digest !== void 0) {
                    let i = a;
                    if (typeof e.release_digest != "string")
                        return m.errors = [{ instancePath: r + "/release_digest", schemaPath: "#/properties/release_digest/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = i === a;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.schema_version !== void 0) {
                        let i = a;
                        if (typeof e.schema_version != "string")
                            return m.errors = [{ instancePath: r + "/schema_version", schemaPath: "#/properties/schema_version/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = i === a;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.epoch !== void 0) {
                            let i = a;
                            if (typeof e.epoch != "string")
                                return m.errors = [{ instancePath: r + "/epoch", schemaPath: "#/properties/epoch/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = i === a;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (e.mode !== void 0) {
                                let i = e.mode, k = a;
                                if (typeof i != "string")
                                    return m.errors = [{ instancePath: r + "/mode", schemaPath: "#/properties/mode/type", keyword: "type", params: { type: "string" } }], !1;
                                if (!(i === "pre_open" || i === "maintenance" || i === "active" || i === "draining"))
                                    return m.errors = [{ instancePath: r + "/mode", schemaPath: "#/properties/mode/enum", keyword: "enum", params: { allowedValues: ae.properties.mode.enum } }], !1;
                                var s = k === a;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (e.dependencies_ok !== void 0) {
                                    let i = a;
                                    if (typeof e.dependencies_ok != "boolean")
                                        return m.errors = [{ instancePath: r + "/dependencies_ok", schemaPath: "#/properties/dependencies_ok/type", keyword: "type", params: { type: "boolean" } }], !1;
                                    var s = i === a;
                                }
                                else
                                    var s = !0;
                                if (s) {
                                    if (e.business_ready !== void 0) {
                                        let i = a;
                                        if (typeof e.business_ready != "boolean")
                                            return m.errors = [{ instancePath: r + "/business_ready", schemaPath: "#/properties/business_ready/type", keyword: "type", params: { type: "boolean" } }], !1;
                                        var s = i === a;
                                    }
                                    else
                                        var s = !0;
                                    if (s)
                                        if (e.checks !== void 0) {
                                            let i = e.checks, k = a;
                                            if (a === k)
                                                if (Array.isArray(i)) {
                                                    var p = !0;
                                                    let R = i.length;
                                                    for (let z = 0; z < R; z++) {
                                                        let S = a;
                                                        c(i[z], { instancePath: r + "/checks/" + z, parentData: i, parentDataProperty: z, rootData: l, dynamicAnchors: v }) || (u = u === null ? c.errors : u.concat(c.errors), a = u.length);
                                                        var p = S === a;
                                                        if (!p)
                                                            break;
                                                    }
                                                }
                                                else
                                                    return m.errors = [{ instancePath: r + "/checks", schemaPath: "#/properties/checks/type", keyword: "type", params: { type: "array" } }], !1;
                                            var s = k === a;
                                        }
                                        else
                                            var s = !0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    else
        return m.errors = [{ instancePath: r, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return m.errors = u, a === 0; }
m.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
export { D as q242, D as q243, D as q244, re as s242_200, j as s243_200, j as s244_200, j as s244_503 };
