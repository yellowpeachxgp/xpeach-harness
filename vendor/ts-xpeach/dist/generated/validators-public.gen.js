/** 构建时Ajv2020分域standalone独立产物；无运行时编译器。 */
var X = (e, i) => () => { try {
    return i || e((i = { exports: {} }).exports, i), i.exports;
}
catch (c) {
    throw i = 0, c;
} };
var G = X(D => {
    "use strict";
    Object.defineProperty(D, "__esModule", { value: !0 });
    D.formatNames = D.fastFormats = D.fullFormats = void 0;
    function $(e, i) { return { validate: e, compare: i }; }
    D.fullFormats = { date: $(Y, S), time: $(F(!0), R), "date-time": $(C(!0), U), "iso-time": $(F(), K), "iso-date-time": $(C(), B), duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/, uri: se, "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i, "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i, url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu, email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i, ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/, ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i, regex: fe, uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i, "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/, "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i, "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/, byte: ie, int32: { type: "number", validate: oe }, int64: { type: "number", validate: pe }, float: { type: "number", validate: Z }, double: { type: "number", validate: Z }, password: !0, binary: !0 };
    D.fastFormats = { ...D.fullFormats, date: $(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, S), time: $(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, R), "date-time": $(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, U), "iso-time": $(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, K), "iso-date-time": $(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, B), uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i, "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i, email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i };
    D.formatNames = Object.keys(D.fullFormats);
    function J(e) { return e % 4 === 0 && (e % 100 !== 0 || e % 400 === 0); }
    var Q = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, ee = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function Y(e) { let i = Q.exec(e); if (!i)
        return !1; let c = +i[1], f = +i[2], l = +i[3]; return f >= 1 && f <= 12 && l >= 1 && l <= (f === 2 && J(c) ? 29 : ee[f]); }
    function S(e, i) { if (e && i)
        return e > i ? 1 : e < i ? -1 : 0; }
    var O = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function F(e) { return function (c) { let f = O.exec(c); if (!f)
        return !1; let l = +f[1], y = +f[2], o = +f[3], r = f[4], n = f[5] === "-" ? -1 : 1, s = +(f[6] || 0), p = +(f[7] || 0); if (s > 23 || p > 59 || e && !r)
        return !1; if (l <= 23 && y <= 59 && o < 60)
        return !0; let d = y - p * n, t = l - s * n - (d < 0 ? 1 : 0); return (t === 23 || t === -1) && (d === 59 || d === -1) && o < 61; }; }
    function R(e, i) { if (!(e && i))
        return; let c = new Date("2020-01-01T" + e).valueOf(), f = new Date("2020-01-01T" + i).valueOf(); if (c && f)
        return c - f; }
    function K(e, i) { if (!(e && i))
        return; let c = O.exec(e), f = O.exec(i); if (c && f)
        return e = c[1] + c[2] + c[3], i = f[1] + f[2] + f[3], e > i ? 1 : e < i ? -1 : 0; }
    var M = /t|\s/i;
    function C(e) { let i = F(e); return function (f) { let l = f.split(M); return l.length === 2 && Y(l[0]) && i(l[1]); }; }
    function U(e, i) { if (!(e && i))
        return; let c = new Date(e).valueOf(), f = new Date(i).valueOf(); if (c && f)
        return c - f; }
    function B(e, i) { if (!(e && i))
        return; let [c, f] = e.split(M), [l, y] = i.split(M), o = S(c, l); if (o !== void 0)
        return o || R(f, y); }
    var re = /\/|:/, te = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function se(e) { return re.test(e) && te.test(e); }
    var H = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function ie(e) { return H.lastIndex = 0, H.test(e); }
    var ae = -(2 ** 31), ne = 2 ** 31 - 1;
    function oe(e) { return Number.isInteger(e) && e <= ne && e >= ae; }
    function pe(e) { return Number.isInteger(e); }
    function Z() { return !0; }
    var de = /[^\\]\\Z/;
    function fe(e) { if (de.test(e))
        return !1; try {
        return new RegExp(e), !0;
    }
    catch {
        return !1;
    } }
});
var W = { ...G().fullFormats, uint64: { type: "number", validate: Number.isInteger }, uint32: { type: "number", validate: Number.isInteger } }, E = z;
function z(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = z.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let p;
        if (e.pathParams === void 0 && (p = "pathParams") || e.query === void 0 && (p = "query") || e.headers === void 0 && (p = "headers"))
            return z.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = r;
            for (let t in e)
                if (!(t === "pathParams" || t === "query" || t === "headers")) {
                    return z.errors = [{ instancePath: i, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === r) {
                if (e.pathParams !== void 0) {
                    let t = e.pathParams, a = r;
                    if (r === a)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let m in t) {
                                return z.errors = [{ instancePath: i + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                break;
                            }
                        else
                            return z.errors = [{ instancePath: i + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = a === r;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.query !== void 0) {
                        let t = e.query, a = r;
                        if (r === a)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let q in t) {
                                    return z.errors = [{ instancePath: i + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: q } }], !1;
                                    break;
                                }
                            else
                                return z.errors = [{ instancePath: i + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = a === r;
                    }
                    else
                        var s = !0;
                    if (s)
                        if (e.headers !== void 0) {
                            let t = e.headers, a = r;
                            if (r === a)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let q in t) {
                                        return z.errors = [{ instancePath: i + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: q } }], !1;
                                        break;
                                    }
                                else
                                    return z.errors = [{ instancePath: i + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var s = a === r;
                        }
                        else
                            var s = !0;
                }
            }
        }
    }
    else
        return z.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return z.errors = o, r === 0; }
z.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ce = j, le = { type: "object", additionalProperties: !1, required: ["provider", "enabled", "site_key", "cap_origin", "cap_site_keys", "scenes"], properties: { provider: { type: "string", enum: ["none", "builtin", "turnstile", "recaptcha", "hcaptcha", "cap"] }, enabled: { type: "boolean" }, site_key: { type: "string" }, cap_origin: { anyOf: [{ type: "string" }, { type: "null" }] }, cap_site_keys: { $ref: "#/components/schemas/CaptchaPolicySiteKeys" }, scenes: { $ref: "#/components/schemas/CaptchaPolicyScenes" } } };
function b(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = b.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let p;
        if (e.login === void 0 && (p = "login") || e.register === void 0 && (p = "register") || e.recovery === void 0 && (p = "recovery") || e.checkin === void 0 && (p = "checkin") || e.partner_consent === void 0 && (p = "partner_consent"))
            return b.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = r;
            for (let t in e)
                if (!(t === "login" || t === "register" || t === "recovery" || t === "checkin" || t === "partner_consent")) {
                    return b.errors = [{ instancePath: i, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === r) {
                if (e.login !== void 0) {
                    let t = r;
                    if (typeof e.login != "string")
                        return b.errors = [{ instancePath: i + "/login", schemaPath: "#/properties/login/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = t === r;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.register !== void 0) {
                        let t = r;
                        if (typeof e.register != "string")
                            return b.errors = [{ instancePath: i + "/register", schemaPath: "#/properties/register/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = t === r;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.recovery !== void 0) {
                            let t = r;
                            if (typeof e.recovery != "string")
                                return b.errors = [{ instancePath: i + "/recovery", schemaPath: "#/properties/recovery/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = t === r;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (e.checkin !== void 0) {
                                let t = r;
                                if (typeof e.checkin != "string")
                                    return b.errors = [{ instancePath: i + "/checkin", schemaPath: "#/properties/checkin/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = t === r;
                            }
                            else
                                var s = !0;
                            if (s)
                                if (e.partner_consent !== void 0) {
                                    let t = r;
                                    if (typeof e.partner_consent != "string")
                                        return b.errors = [{ instancePath: i + "/partner_consent", schemaPath: "#/properties/partner_consent/type", keyword: "type", params: { type: "string" } }], !1;
                                    var s = t === r;
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
        return b.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return b.errors = o, r === 0; }
b.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function w(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = w.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let p;
        if (e.login === void 0 && (p = "login") || e.register === void 0 && (p = "register") || e.recovery === void 0 && (p = "recovery") || e.checkin === void 0 && (p = "checkin") || e.partner_consent === void 0 && (p = "partner_consent"))
            return w.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = r;
            for (let t in e)
                if (!(t === "login" || t === "register" || t === "recovery" || t === "checkin" || t === "partner_consent")) {
                    return w.errors = [{ instancePath: i, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === r) {
                if (e.login !== void 0) {
                    let t = r;
                    if (typeof e.login != "boolean")
                        return w.errors = [{ instancePath: i + "/login", schemaPath: "#/properties/login/type", keyword: "type", params: { type: "boolean" } }], !1;
                    var s = t === r;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.register !== void 0) {
                        let t = r;
                        if (typeof e.register != "boolean")
                            return w.errors = [{ instancePath: i + "/register", schemaPath: "#/properties/register/type", keyword: "type", params: { type: "boolean" } }], !1;
                        var s = t === r;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.recovery !== void 0) {
                            let t = r;
                            if (typeof e.recovery != "boolean")
                                return w.errors = [{ instancePath: i + "/recovery", schemaPath: "#/properties/recovery/type", keyword: "type", params: { type: "boolean" } }], !1;
                            var s = t === r;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (e.checkin !== void 0) {
                                let t = r;
                                if (typeof e.checkin != "boolean")
                                    return w.errors = [{ instancePath: i + "/checkin", schemaPath: "#/properties/checkin/type", keyword: "type", params: { type: "boolean" } }], !1;
                                var s = t === r;
                            }
                            else
                                var s = !0;
                            if (s)
                                if (e.partner_consent !== void 0) {
                                    let t = r;
                                    if (typeof e.partner_consent != "boolean")
                                        return w.errors = [{ instancePath: i + "/partner_consent", schemaPath: "#/properties/partner_consent/type", keyword: "type", params: { type: "boolean" } }], !1;
                                    var s = t === r;
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
        return w.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return w.errors = o, r === 0; }
w.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function j(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = j.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let d;
        if (e.provider === void 0 && (d = "provider") || e.enabled === void 0 && (d = "enabled") || e.site_key === void 0 && (d = "site_key") || e.cap_origin === void 0 && (d = "cap_origin") || e.cap_site_keys === void 0 && (d = "cap_site_keys") || e.scenes === void 0 && (d = "scenes"))
            return j.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = r;
            for (let a in e)
                if (!(a === "provider" || a === "enabled" || a === "site_key" || a === "cap_origin" || a === "cap_site_keys" || a === "scenes")) {
                    return j.errors = [{ instancePath: i, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: a } }], !1;
                    break;
                }
            if (t === r) {
                if (e.provider !== void 0) {
                    let a = e.provider, m = r;
                    if (typeof a != "string")
                        return j.errors = [{ instancePath: i + "/provider", schemaPath: "#/properties/provider/type", keyword: "type", params: { type: "string" } }], !1;
                    if (!(a === "none" || a === "builtin" || a === "turnstile" || a === "recaptcha" || a === "hcaptcha" || a === "cap"))
                        return j.errors = [{ instancePath: i + "/provider", schemaPath: "#/properties/provider/enum", keyword: "enum", params: { allowedValues: le.properties.provider.enum } }], !1;
                    var s = m === r;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.enabled !== void 0) {
                        let a = r;
                        if (typeof e.enabled != "boolean")
                            return j.errors = [{ instancePath: i + "/enabled", schemaPath: "#/properties/enabled/type", keyword: "type", params: { type: "boolean" } }], !1;
                        var s = a === r;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.site_key !== void 0) {
                            let a = r;
                            if (typeof e.site_key != "string")
                                return j.errors = [{ instancePath: i + "/site_key", schemaPath: "#/properties/site_key/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = a === r;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (e.cap_origin !== void 0) {
                                let a = e.cap_origin, m = r, q = r, P = !1, g = r;
                                if (typeof a != "string") {
                                    let x = { instancePath: i + "/cap_origin", schemaPath: "#/properties/cap_origin/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                    o === null ? o = [x] : o.push(x), r++;
                                }
                                var p = g === r;
                                P = P || p;
                                let T = r;
                                if (a !== null) {
                                    let x = { instancePath: i + "/cap_origin", schemaPath: "#/properties/cap_origin/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                    o === null ? o = [x] : o.push(x), r++;
                                }
                                var p = T === r;
                                if (P = P || p, P)
                                    r = q, o !== null && (q ? o.length = q : o = null);
                                else {
                                    let x = { instancePath: i + "/cap_origin", schemaPath: "#/properties/cap_origin/anyOf", keyword: "anyOf", params: {} };
                                    return o === null ? o = [x] : o.push(x), r++, j.errors = o, !1;
                                }
                                var s = m === r;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (e.cap_site_keys !== void 0) {
                                    let a = r;
                                    b(e.cap_site_keys, { instancePath: i + "/cap_site_keys", parentData: e, parentDataProperty: "cap_site_keys", rootData: l, dynamicAnchors: y }) || (o = o === null ? b.errors : o.concat(b.errors), r = o.length);
                                    var s = a === r;
                                }
                                else
                                    var s = !0;
                                if (s)
                                    if (e.scenes !== void 0) {
                                        let a = r;
                                        w(e.scenes, { instancePath: i + "/scenes", parentData: e, parentDataProperty: "scenes", rootData: l, dynamicAnchors: y }) || (o = o === null ? w.errors : o.concat(w.errors), r = o.length);
                                        var s = a === r;
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
    else
        return j.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return j.errors = o, r === 0; }
j.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ye = A;
var ue = { type: "object", additionalProperties: !1, required: ["scene"], properties: { scene: { type: "string", enum: ["login", "register", "recovery", "reset_password", "checkin", "partner_consent"] }, captcha_response: { type: "string" }, captcha_token: { type: "string" }, captcha_answer: { type: "string" }, remote_ip: { type: "string" }, expected_action: { type: "string" }, expected_hostnames: { type: "array", items: { type: "string" } } } };
function u(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = u.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let d;
        if (e.scene === void 0 && (d = "scene"))
            return u.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = r;
            for (let a in e)
                if (!(a === "scene" || a === "captcha_response" || a === "captcha_token" || a === "captcha_answer" || a === "remote_ip" || a === "expected_action" || a === "expected_hostnames")) {
                    return u.errors = [{ instancePath: i, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: a } }], !1;
                    break;
                }
            if (t === r) {
                if (e.scene !== void 0) {
                    let a = e.scene, m = r;
                    if (typeof a != "string")
                        return u.errors = [{ instancePath: i + "/scene", schemaPath: "#/properties/scene/type", keyword: "type", params: { type: "string" } }], !1;
                    if (!(a === "login" || a === "register" || a === "recovery" || a === "reset_password" || a === "checkin" || a === "partner_consent"))
                        return u.errors = [{ instancePath: i + "/scene", schemaPath: "#/properties/scene/enum", keyword: "enum", params: { allowedValues: ue.properties.scene.enum } }], !1;
                    var s = m === r;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.captcha_response !== void 0) {
                        let a = r;
                        if (typeof e.captcha_response != "string")
                            return u.errors = [{ instancePath: i + "/captcha_response", schemaPath: "#/properties/captcha_response/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = a === r;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.captcha_token !== void 0) {
                            let a = r;
                            if (typeof e.captcha_token != "string")
                                return u.errors = [{ instancePath: i + "/captcha_token", schemaPath: "#/properties/captcha_token/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = a === r;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (e.captcha_answer !== void 0) {
                                let a = r;
                                if (typeof e.captcha_answer != "string")
                                    return u.errors = [{ instancePath: i + "/captcha_answer", schemaPath: "#/properties/captcha_answer/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = a === r;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (e.remote_ip !== void 0) {
                                    let a = r;
                                    if (typeof e.remote_ip != "string")
                                        return u.errors = [{ instancePath: i + "/remote_ip", schemaPath: "#/properties/remote_ip/type", keyword: "type", params: { type: "string" } }], !1;
                                    var s = a === r;
                                }
                                else
                                    var s = !0;
                                if (s) {
                                    if (e.expected_action !== void 0) {
                                        let a = r;
                                        if (typeof e.expected_action != "string")
                                            return u.errors = [{ instancePath: i + "/expected_action", schemaPath: "#/properties/expected_action/type", keyword: "type", params: { type: "string" } }], !1;
                                        var s = a === r;
                                    }
                                    else
                                        var s = !0;
                                    if (s)
                                        if (e.expected_hostnames !== void 0) {
                                            let a = e.expected_hostnames, m = r;
                                            if (r === m)
                                                if (Array.isArray(a)) {
                                                    var p = !0;
                                                    let P = a.length;
                                                    for (let g = 0; g < P; g++) {
                                                        let T = r;
                                                        if (typeof a[g] != "string")
                                                            return u.errors = [{ instancePath: i + "/expected_hostnames/" + g, schemaPath: "#/properties/expected_hostnames/items/type", keyword: "type", params: { type: "string" } }], !1;
                                                        var p = T === r;
                                                        if (!p)
                                                            break;
                                                    }
                                                }
                                                else
                                                    return u.errors = [{ instancePath: i + "/expected_hostnames", schemaPath: "#/properties/expected_hostnames/type", keyword: "type", params: { type: "array" } }], !1;
                                            var s = m === r;
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
        return u.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return u.errors = o, r === 0; }
u.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function A(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = A.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let p;
        if (e.pathParams === void 0 && (p = "pathParams") || e.query === void 0 && (p = "query") || e.headers === void 0 && (p = "headers") || e.body === void 0 && (p = "body"))
            return A.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = r;
            for (let t in e)
                if (!(t === "pathParams" || t === "query" || t === "headers" || t === "body")) {
                    return A.errors = [{ instancePath: i, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === r) {
                if (e.pathParams !== void 0) {
                    let t = e.pathParams, a = r;
                    if (r === a)
                        if (t && typeof t == "object" && !Array.isArray(t))
                            for (let m in t) {
                                return A.errors = [{ instancePath: i + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                break;
                            }
                        else
                            return A.errors = [{ instancePath: i + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = a === r;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.query !== void 0) {
                        let t = e.query, a = r;
                        if (r === a)
                            if (t && typeof t == "object" && !Array.isArray(t))
                                for (let q in t) {
                                    return A.errors = [{ instancePath: i + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: q } }], !1;
                                    break;
                                }
                            else
                                return A.errors = [{ instancePath: i + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = a === r;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.headers !== void 0) {
                            let t = e.headers, a = r;
                            if (r === a)
                                if (t && typeof t == "object" && !Array.isArray(t))
                                    for (let q in t) {
                                        return A.errors = [{ instancePath: i + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: q } }], !1;
                                        break;
                                    }
                                else
                                    return A.errors = [{ instancePath: i + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var s = a === r;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (e.body !== void 0) {
                                let t = r;
                                u(e.body, { instancePath: i + "/body", parentData: e, parentDataProperty: "body", rootData: l, dynamicAnchors: y }) || (o = o === null ? u.errors : o.concat(u.errors), r = o.length);
                                var s = t === r;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return A.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return A.errors = o, r === 0; }
A.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var me = _, L = { type: "object", additionalProperties: !1, required: ["ok", "provider", "scene", "enforced", "code", "message"], properties: { ok: { type: "boolean" }, provider: { type: "string", enum: ["none", "builtin", "turnstile", "recaptcha", "hcaptcha", "cap"] }, scene: { type: "string", enum: ["login", "register", "recovery", "checkin", "partner_consent"] }, enforced: { type: "boolean" }, code: { type: "string" }, message: { type: "string" } } };
function _(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = _.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let p;
        if (e.ok === void 0 && (p = "ok") || e.provider === void 0 && (p = "provider") || e.scene === void 0 && (p = "scene") || e.enforced === void 0 && (p = "enforced") || e.code === void 0 && (p = "code") || e.message === void 0 && (p = "message"))
            return _.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = r;
            for (let t in e)
                if (!(t === "ok" || t === "provider" || t === "scene" || t === "enforced" || t === "code" || t === "message")) {
                    return _.errors = [{ instancePath: i, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === r) {
                if (e.ok !== void 0) {
                    let t = r;
                    if (typeof e.ok != "boolean")
                        return _.errors = [{ instancePath: i + "/ok", schemaPath: "#/properties/ok/type", keyword: "type", params: { type: "boolean" } }], !1;
                    var s = t === r;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.provider !== void 0) {
                        let t = e.provider, a = r;
                        if (typeof t != "string")
                            return _.errors = [{ instancePath: i + "/provider", schemaPath: "#/properties/provider/type", keyword: "type", params: { type: "string" } }], !1;
                        if (!(t === "none" || t === "builtin" || t === "turnstile" || t === "recaptcha" || t === "hcaptcha" || t === "cap"))
                            return _.errors = [{ instancePath: i + "/provider", schemaPath: "#/properties/provider/enum", keyword: "enum", params: { allowedValues: L.properties.provider.enum } }], !1;
                        var s = a === r;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.scene !== void 0) {
                            let t = e.scene, a = r;
                            if (typeof t != "string")
                                return _.errors = [{ instancePath: i + "/scene", schemaPath: "#/properties/scene/type", keyword: "type", params: { type: "string" } }], !1;
                            if (!(t === "login" || t === "register" || t === "recovery" || t === "checkin" || t === "partner_consent"))
                                return _.errors = [{ instancePath: i + "/scene", schemaPath: "#/properties/scene/enum", keyword: "enum", params: { allowedValues: L.properties.scene.enum } }], !1;
                            var s = a === r;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (e.enforced !== void 0) {
                                let t = r;
                                if (typeof e.enforced != "boolean")
                                    return _.errors = [{ instancePath: i + "/enforced", schemaPath: "#/properties/enforced/type", keyword: "type", params: { type: "boolean" } }], !1;
                                var s = t === r;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (e.code !== void 0) {
                                    let t = r;
                                    if (typeof e.code != "string")
                                        return _.errors = [{ instancePath: i + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                                    var s = t === r;
                                }
                                else
                                    var s = !0;
                                if (s)
                                    if (e.message !== void 0) {
                                        let t = r;
                                        if (typeof e.message != "string")
                                            return _.errors = [{ instancePath: i + "/message", schemaPath: "#/properties/message/type", keyword: "type", params: { type: "string" } }], !1;
                                        var s = t === r;
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
    else
        return _.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return _.errors = o, r === 0; }
_.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var he = N;
function N(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = N.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let s;
        if (e.client_ip === void 0 && (s = "client_ip"))
            return N.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: s } }], !1;
        {
            let p = r;
            for (let d in e)
                if (d !== "client_ip") {
                    return N.errors = [{ instancePath: i, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: d } }], !1;
                    break;
                }
            if (p === r && e.client_ip !== void 0 && typeof e.client_ip != "string")
                return N.errors = [{ instancePath: i + "/client_ip", schemaPath: "#/properties/client_ip/type", keyword: "type", params: { type: "string" } }], !1;
        }
    }
    else
        return N.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return N.errors = o, r === 0; }
N.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var V = k, ve = { type: "object", additionalProperties: !1, required: ["release_digest", "schema_version", "epoch", "mode", "dependencies_ok", "business_ready", "checks"], properties: { release_digest: { type: "string" }, schema_version: { type: "string" }, epoch: { type: "string" }, mode: { type: "string", enum: ["pre_open", "maintenance", "active", "draining"] }, dependencies_ok: { type: "boolean" }, business_ready: { type: "boolean" }, checks: { type: "array", items: { $ref: "#/components/schemas/CenterHealthCheck" } } } };
var _e = W.uint64;
function v(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = v.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let p;
        if (e.name === void 0 && (p = "name") || e.ok === void 0 && (p = "ok") || e.required === void 0 && (p = "required") || e.latency_ms === void 0 && (p = "latency_ms"))
            return v.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let d = r;
            for (let t in e)
                if (!(t === "name" || t === "ok" || t === "required" || t === "detail" || t === "latency_ms")) {
                    return v.errors = [{ instancePath: i, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: t } }], !1;
                    break;
                }
            if (d === r) {
                if (e.name !== void 0) {
                    let t = r;
                    if (typeof e.name != "string")
                        return v.errors = [{ instancePath: i + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = t === r;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.ok !== void 0) {
                        let t = r;
                        if (typeof e.ok != "boolean")
                            return v.errors = [{ instancePath: i + "/ok", schemaPath: "#/properties/ok/type", keyword: "type", params: { type: "boolean" } }], !1;
                        var s = t === r;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.required !== void 0) {
                            let t = r;
                            if (typeof e.required != "boolean")
                                return v.errors = [{ instancePath: i + "/required", schemaPath: "#/properties/required/type", keyword: "type", params: { type: "boolean" } }], !1;
                            var s = t === r;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (e.detail !== void 0) {
                                let t = r;
                                if (typeof e.detail != "string")
                                    return v.errors = [{ instancePath: i + "/detail", schemaPath: "#/properties/detail/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = t === r;
                            }
                            else
                                var s = !0;
                            if (s)
                                if (e.latency_ms !== void 0) {
                                    let t = e.latency_ms, a = r;
                                    if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                                        return v.errors = [{ instancePath: i + "/latency_ms", schemaPath: "#/properties/latency_ms/type", keyword: "type", params: { type: "integer" } }], !1;
                                    if (r === a && typeof t == "number" && isFinite(t)) {
                                        if (t > 18446744073709552e3 || isNaN(t))
                                            return v.errors = [{ instancePath: i + "/latency_ms", schemaPath: "#/properties/latency_ms/maximum", keyword: "maximum", params: { comparison: "<=", limit: 18446744073709552e3 } }], !1;
                                        if (t < 0 || isNaN(t))
                                            return v.errors = [{ instancePath: i + "/latency_ms", schemaPath: "#/properties/latency_ms/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                        if (!_e.validate(t))
                                            return v.errors = [{ instancePath: i + "/latency_ms", schemaPath: "#/properties/latency_ms/format", keyword: "format", params: { format: "uint64" } }], !1;
                                    }
                                    var s = a === r;
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
        return v.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return v.errors = o, r === 0; }
v.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function k(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = k.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let d;
        if (e.release_digest === void 0 && (d = "release_digest") || e.schema_version === void 0 && (d = "schema_version") || e.epoch === void 0 && (d = "epoch") || e.mode === void 0 && (d = "mode") || e.dependencies_ok === void 0 && (d = "dependencies_ok") || e.business_ready === void 0 && (d = "business_ready") || e.checks === void 0 && (d = "checks"))
            return k.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        {
            let t = r;
            for (let a in e)
                if (!(a === "release_digest" || a === "schema_version" || a === "epoch" || a === "mode" || a === "dependencies_ok" || a === "business_ready" || a === "checks")) {
                    return k.errors = [{ instancePath: i, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: a } }], !1;
                    break;
                }
            if (t === r) {
                if (e.release_digest !== void 0) {
                    let a = r;
                    if (typeof e.release_digest != "string")
                        return k.errors = [{ instancePath: i + "/release_digest", schemaPath: "#/properties/release_digest/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = a === r;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.schema_version !== void 0) {
                        let a = r;
                        if (typeof e.schema_version != "string")
                            return k.errors = [{ instancePath: i + "/schema_version", schemaPath: "#/properties/schema_version/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = a === r;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.epoch !== void 0) {
                            let a = r;
                            if (typeof e.epoch != "string")
                                return k.errors = [{ instancePath: i + "/epoch", schemaPath: "#/properties/epoch/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = a === r;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (e.mode !== void 0) {
                                let a = e.mode, m = r;
                                if (typeof a != "string")
                                    return k.errors = [{ instancePath: i + "/mode", schemaPath: "#/properties/mode/type", keyword: "type", params: { type: "string" } }], !1;
                                if (!(a === "pre_open" || a === "maintenance" || a === "active" || a === "draining"))
                                    return k.errors = [{ instancePath: i + "/mode", schemaPath: "#/properties/mode/enum", keyword: "enum", params: { allowedValues: ve.properties.mode.enum } }], !1;
                                var s = m === r;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (e.dependencies_ok !== void 0) {
                                    let a = r;
                                    if (typeof e.dependencies_ok != "boolean")
                                        return k.errors = [{ instancePath: i + "/dependencies_ok", schemaPath: "#/properties/dependencies_ok/type", keyword: "type", params: { type: "boolean" } }], !1;
                                    var s = a === r;
                                }
                                else
                                    var s = !0;
                                if (s) {
                                    if (e.business_ready !== void 0) {
                                        let a = r;
                                        if (typeof e.business_ready != "boolean")
                                            return k.errors = [{ instancePath: i + "/business_ready", schemaPath: "#/properties/business_ready/type", keyword: "type", params: { type: "boolean" } }], !1;
                                        var s = a === r;
                                    }
                                    else
                                        var s = !0;
                                    if (s)
                                        if (e.checks !== void 0) {
                                            let a = e.checks, m = r;
                                            if (r === m)
                                                if (Array.isArray(a)) {
                                                    var p = !0;
                                                    let P = a.length;
                                                    for (let g = 0; g < P; g++) {
                                                        let T = r;
                                                        v(a[g], { instancePath: i + "/checks/" + g, parentData: a, parentDataProperty: g, rootData: l, dynamicAnchors: y }) || (o = o === null ? v.errors : o.concat(v.errors), r = o.length);
                                                        var p = T === r;
                                                        if (!p)
                                                            break;
                                                    }
                                                }
                                                else
                                                    return k.errors = [{ instancePath: i + "/checks", schemaPath: "#/properties/checks/type", keyword: "type", params: { type: "array" } }], !1;
                                            var s = m === r;
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
        return k.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return k.errors = o, r === 0; }
k.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var I = h;
var ke = W.uri;
function h(e, { instancePath: i = "", parentData: c, parentDataProperty: f, rootData: l = e, dynamicAnchors: y = {} } = {}) { let o = null, r = 0, n = h.evaluated; if (n.dynamicProps && (n.props = void 0), n.dynamicItems && (n.items = void 0), r === 0)
    if (e && typeof e == "object" && !Array.isArray(e)) {
        let d;
        if (e.type === void 0 && (d = "type") || e.title === void 0 && (d = "title") || e.status === void 0 && (d = "status") || e.code === void 0 && (d = "code"))
            return h.errors = [{ instancePath: i, schemaPath: "#/required", keyword: "required", params: { missingProperty: d } }], !1;
        if (e.type !== void 0) {
            let t = e.type, a = r;
            if (r === a && r === a)
                if (typeof t == "string") {
                    if (!ke(t))
                        return h.errors = [{ instancePath: i + "/type", schemaPath: "#/properties/type/format", keyword: "format", params: { format: "uri" } }], !1;
                }
                else
                    return h.errors = [{ instancePath: i + "/type", schemaPath: "#/properties/type/type", keyword: "type", params: { type: "string" } }], !1;
            var s = a === r;
        }
        else
            var s = !0;
        if (s) {
            if (e.title !== void 0) {
                let t = r;
                if (typeof e.title != "string")
                    return h.errors = [{ instancePath: i + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" } }], !1;
                var s = t === r;
            }
            else
                var s = !0;
            if (s) {
                if (e.status !== void 0) {
                    let t = e.status, a = r;
                    if (!(typeof t == "number" && !(t % 1) && !isNaN(t) && isFinite(t)))
                        return h.errors = [{ instancePath: i + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "integer" } }], !1;
                    var s = a === r;
                }
                else
                    var s = !0;
                if (s) {
                    if (e.detail !== void 0) {
                        let t = r;
                        if (typeof e.detail != "string")
                            return h.errors = [{ instancePath: i + "/detail", schemaPath: "#/properties/detail/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = t === r;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (e.instance !== void 0) {
                            let t = r;
                            if (typeof e.instance != "string")
                                return h.errors = [{ instancePath: i + "/instance", schemaPath: "#/properties/instance/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = t === r;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (e.code !== void 0) {
                                let t = r;
                                if (typeof e.code != "string")
                                    return h.errors = [{ instancePath: i + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = t === r;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (e.traceId !== void 0) {
                                    let t = r;
                                    if (typeof e.traceId != "string")
                                        return h.errors = [{ instancePath: i + "/traceId", schemaPath: "#/properties/traceId/type", keyword: "type", params: { type: "string" } }], !1;
                                    var s = t === r;
                                }
                                else
                                    var s = !0;
                                if (s) {
                                    if (e.retryable !== void 0) {
                                        let t = r;
                                        if (typeof e.retryable != "boolean")
                                            return h.errors = [{ instancePath: i + "/retryable", schemaPath: "#/properties/retryable/type", keyword: "type", params: { type: "boolean" } }], !1;
                                        var s = t === r;
                                    }
                                    else
                                        var s = !0;
                                    if (s)
                                        if (e.conflicts !== void 0) {
                                            let t = e.conflicts, a = r;
                                            if (r === a)
                                                if (Array.isArray(t)) {
                                                    var p = !0;
                                                    let q = t.length;
                                                    for (let P = 0; P < q; P++) {
                                                        let g = r;
                                                        if (typeof t[P] != "string")
                                                            return h.errors = [{ instancePath: i + "/conflicts/" + P, schemaPath: "#/properties/conflicts/items/type", keyword: "type", params: { type: "string" } }], !1;
                                                        var p = g === r;
                                                        if (!p)
                                                            break;
                                                    }
                                                }
                                                else
                                                    return h.errors = [{ instancePath: i + "/conflicts", schemaPath: "#/properties/conflicts/type", keyword: "type", params: { type: "array" } }], !1;
                                            var s = a === r;
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
        return h.errors = [{ instancePath: i, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return h.errors = o, r === 0; }
h.evaluated = { props: { type: !0, title: !0, status: !0, detail: !0, instance: !0, code: !0, traceId: !0, retryable: !0, conflicts: !0 }, dynamicProps: !1, dynamicItems: !1 };
export { E as q235, ye as q236, E as q244, E as q245, E as q246, ce as s235_200, I as s235_400, I as s235_401, I as s235_403, I as s235_409, I as s235_503, me as s236_200, I as s236_400, I as s236_401, I as s236_403, I as s236_409, I as s236_503, he as s244_200, V as s245_200, V as s246_200, V as s246_503 };
