/** 构建时Ajv2020分域standalone独立产物；无运行时编译器。 */
var We = (r, t) => () => { try {
    return t || r((t = { exports: {} }).exports, t), t.exports;
}
catch (v) {
    throw t = 0, v;
} };
var ar = We(xe => {
    "use strict";
    Object.defineProperty(xe, "__esModule", { value: !0 });
    xe.formatNames = xe.fastFormats = xe.fullFormats = void 0;
    function Ae(r, t) { return { validate: r, compare: t }; }
    xe.fullFormats = { date: Ae(er, Be), time: Ae(Ue(!0), Ze), "date-time": Ae(Ke(!0), tr), "iso-time": Ae(Ue(), rr), "iso-date-time": Ae(Ke(), sr), duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/, uri: br, "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i, "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i, url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu, email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i, ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/, ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i, regex: Ar, uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i, "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/, "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i, "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/, byte: gr, int32: { type: "number", validate: wr }, int64: { type: "number", validate: jr }, float: { type: "number", validate: Je }, double: { type: "number", validate: Je }, password: !0, binary: !0 };
    xe.fastFormats = { ...xe.fullFormats, date: Ae(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, Be), time: Ae(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, Ze), "date-time": Ae(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, tr), "iso-time": Ae(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, rr), "iso-date-time": Ae(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, sr), uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i, "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i, email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i };
    xe.formatNames = Object.keys(xe.fullFormats);
    function mr(r) { return r % 4 === 0 && (r % 100 !== 0 || r % 400 === 0); }
    var _r = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, hr = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function er(r) { let t = _r.exec(r); if (!t)
        return !1; let v = +t[1], h = +t[2], l = +t[3]; return h >= 1 && h <= 12 && l >= 1 && l <= (h === 2 && mr(v) ? 29 : hr[h]); }
    function Be(r, t) { if (r && t)
        return r > t ? 1 : r < t ? -1 : 0; }
    var Le = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function Ue(r) { return function (v) { let h = Le.exec(v); if (!h)
        return !1; let l = +h[1], u = +h[2], a = +h[3], e = h[4], d = h[5] === "-" ? -1 : 1, s = +(h[6] || 0), n = +(h[7] || 0); if (s > 23 || n > 59 || r && !e)
        return !1; if (l <= 23 && u <= 59 && a < 60)
        return !0; let p = u - n * d, i = l - s * d - (p < 0 ? 1 : 0); return (i === 23 || i === -1) && (p === 59 || p === -1) && a < 61; }; }
    function Ze(r, t) { if (!(r && t))
        return; let v = new Date("2020-01-01T" + r).valueOf(), h = new Date("2020-01-01T" + t).valueOf(); if (v && h)
        return v - h; }
    function rr(r, t) { if (!(r && t))
        return; let v = Le.exec(r), h = Le.exec(t); if (v && h)
        return r = v[1] + v[2] + v[3], t = h[1] + h[2] + h[3], r > t ? 1 : r < t ? -1 : 0; }
    var Ye = /t|\s/i;
    function Ke(r) { let t = Ue(r); return function (h) { let l = h.split(Ye); return l.length === 2 && er(l[0]) && t(l[1]); }; }
    function tr(r, t) { if (!(r && t))
        return; let v = new Date(r).valueOf(), h = new Date(t).valueOf(); if (v && h)
        return v - h; }
    function sr(r, t) { if (!(r && t))
        return; let [v, h] = r.split(Ye), [l, u] = t.split(Ye), a = Be(v, l); if (a !== void 0)
        return a || Ze(h, u); }
    var vr = /\/|:/, Pr = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function br(r) { return vr.test(r) && Pr.test(r); }
    var Xe = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function gr(r) { return Xe.lastIndex = 0, Xe.test(r); }
    var kr = -(2 ** 31), qr = 2 ** 31 - 1;
    function wr(r) { return Number.isInteger(r) && r <= qr && r >= kr; }
    function jr(r) { return Number.isInteger(r); }
    function Je() { return !0; }
    var Dr = /[^\\]\\Z/;
    function Ar(r) { if (Dr.test(r))
        return !1; try {
        return new RegExp(r), !0;
    }
    catch {
        return !1;
    } }
});
var or = We(He => {
    "use strict";
    Object.defineProperty(He, "__esModule", { value: !0 });
    function ir(r) { let t = r.length, v = 0, h = 0, l; for (; h < t;)
        v++, l = r.charCodeAt(h++), l >= 55296 && l <= 56319 && h < t && (l = r.charCodeAt(h), (l & 64512) === 56320 && h++); return v; }
    He.default = ir;
    ir.code = 'require("ajv/dist/runtime/ucs2length").default';
});
var pr = { ...ar().fullFormats, uint64: { type: "number", validate: Number.isInteger }, uint32: { type: "number", validate: Number.isInteger } }, xr = K;
function K(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = K.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers"))
            return K.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers")) {
                    return K.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return K.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return K.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return K.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return K.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s)
                        if (r.headers !== void 0) {
                            let i = r.headers, o = e;
                            if (e === o)
                                if (i && typeof i == "object" && !Array.isArray(i))
                                    for (let y in i) {
                                        return K.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                        break;
                                    }
                                else
                                    return K.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var s = o === e;
                        }
                        else
                            var s = !0;
                }
            }
        }
    }
    else
        return K.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return K.errors = a, e === 0; }
K.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var $r = le;
var Te = or().default;
function q(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = q.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let s;
        if (r["idempotency-key"] === void 0 && (s = "idempotency-key"))
            return q.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: s } }], !1;
        {
            let n = e;
            for (let p in r)
                if (p !== "idempotency-key") {
                    return q.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: p } }], !1;
                    break;
                }
            if (n === e && r["idempotency-key"] !== void 0) {
                let p = r["idempotency-key"];
                if (e === e)
                    if (typeof p == "string") {
                        if (Te(p) > 128)
                            return q.errors = [{ instancePath: t + "/idempotency-key", schemaPath: "#/properties/idempotency-key/maxLength", keyword: "maxLength", params: { limit: 128 } }], !1;
                        if (Te(p) < 8)
                            return q.errors = [{ instancePath: t + "/idempotency-key", schemaPath: "#/properties/idempotency-key/minLength", keyword: "minLength", params: { limit: 8 } }], !1;
                    }
                    else
                        return q.errors = [{ instancePath: t + "/idempotency-key", schemaPath: "#/properties/idempotency-key/type", keyword: "type", params: { type: "string" } }], !1;
            }
        }
    }
    else
        return q.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return q.errors = a, e === 0; }
q.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function Oe(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = Oe.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let s;
        if (r.code === void 0 && (s = "code"))
            return Oe.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: s } }], !1;
        if (r.code !== void 0 && typeof r.code != "string")
            return Oe.errors = [{ instancePath: t + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
    }
    else
        return Oe.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Oe.errors = a, e === 0; }
Oe.evaluated = { props: { code: !0 }, dynamicProps: !1, dynamicItems: !1 };
function le(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = le.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return le.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return le.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return le.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return le.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return le.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return le.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                Oe(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? Oe.errors : a.concat(Oe.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return le.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return le.errors = a, e === 0; }
le.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ir = D, Or = { type: "object", additionalProperties: !1, required: ["user_id", "record_id", "quota_granted", "journal_id", "wallet", "entitlements", "idempotent_replay"], properties: { user_id: { type: "string" }, record_id: { type: "string" }, quota_granted: { $ref: "#/components/schemas/PosQuota" }, journal_id: { type: "string" }, wallet: { type: "object", additionalProperties: !1, required: ["status", "quota", "journal_id"], properties: { status: { type: "string", const: "credited" }, quota: { $ref: "#/components/schemas/PosQuota" }, journal_id: { type: "string" } } }, entitlements: { $ref: "#/components/schemas/CdkClosureEntitlements" }, idempotent_replay: { type: "boolean" }, code_id: { type: "string" }, code: { type: "string" }, name: { type: "string" }, site_code: { type: "string" }, peach_granted: { type: "string" }, credited_quota: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, repaid_overdraft_quota: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, added_available_quota: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, inviter_rebate_quota: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, grant_group: { anyOf: [{ type: "string" }, { type: "null" }] }, grant_title: { anyOf: [{ type: "string" }, { type: "null" }] }, entitlement_grant_id: { anyOf: [{ type: "string" }, { type: "null" }] }, inviter_user_id: { anyOf: [{ type: "string" }, { type: "null" }] }, rebate_journal_id: { anyOf: [{ type: "string" }, { type: "null" }] }, used_count: { type: "integer", minimum: 0 }, max_uses: { type: "integer", minimum: 0 }, epoch: { type: "integer", minimum: 0 }, replayed: { type: "boolean" } } }, dr = Object.prototype.hasOwnProperty;
var Er = new RegExp("^[1-9][0-9]{0,18}$", "u"), Ve = new RegExp("^(?!-0$)(?:(?:[0-9]{1,18}|9223372036854775807|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6])|-(?:[0-9]{1,18}|9223372036854775808|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-7]))$", "u");
function $(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = $.evaluated; d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0); let s = e; if (e === s)
    if (typeof r == "string") {
        if (!Er.test(r))
            return $.errors = [{ instancePath: t, schemaPath: "#/allOf/0/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]{0,18}$" } }], !1;
    }
    else
        return $.errors = [{ instancePath: t, schemaPath: "#/allOf/0/type", keyword: "type", params: { type: "string" } }], !1; var n = s === e; if (n) {
    let p = e;
    if (e === p)
        if (typeof r == "string") {
            if (!Ve.test(r))
                return $.errors = [{ instancePath: t, schemaPath: "#/allOf/1/pattern", keyword: "pattern", params: { pattern: "^(?!-0$)(?:(?:[0-9]{1,18}|9223372036854775807|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6])|-(?:[0-9]{1,18}|9223372036854775808|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-7]))$" } }], !1;
        }
        else
            return $.errors = [{ instancePath: t, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "string" } }], !1;
    var n = p === e;
} return $.errors = a, e === 0; }
$.evaluated = { dynamicProps: !1, dynamicItems: !1 };
var zr = new RegExp("^[1-9][0-9]*$", "u");
function Q(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = Q.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.value === void 0 && (n = "value") || r.version === void 0 && (n = "version") || r.record_id === void 0 && (n = "record_id") || r.status === void 0 && (n = "status"))
            return Q.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "value" || i === "version" || i === "record_id" || i === "status")) {
                    return Q.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.value !== void 0) {
                    let i = e;
                    if (typeof r.value != "string")
                        return Q.errors = [{ instancePath: t + "/value", schemaPath: "#/properties/value/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = i === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.version !== void 0) {
                        let i = r.version, o = e;
                        if (e === o)
                            if (typeof i == "string") {
                                if (!zr.test(i))
                                    return Q.errors = [{ instancePath: t + "/version", schemaPath: "#/properties/version/pattern", keyword: "pattern", params: { pattern: "^[1-9][0-9]*$" } }], !1;
                            }
                            else
                                return Q.errors = [{ instancePath: t + "/version", schemaPath: "#/properties/version/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.record_id !== void 0) {
                            let i = e;
                            if (typeof r.record_id != "string")
                                return Q.errors = [{ instancePath: t + "/record_id", schemaPath: "#/properties/record_id/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.status !== void 0) {
                                let i = r.status, o = e;
                                if (typeof i != "string")
                                    return Q.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                if (i !== "delivered")
                                    return Q.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/const", keyword: "const", params: { allowedValue: "delivered" } }], !1;
                                var s = o === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return Q.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Q.errors = a, e === 0; }
Q.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var nr = { type: "object", additionalProperties: !1, required: ["id", "target_key", "kind", "status", "error_code"], properties: { id: { type: "string" }, target_key: { type: "string" }, kind: { type: "string", enum: ["group", "title"] }, status: { type: "string", enum: ["queued", "delivering", "dispatch_unknown", "observed", "blocked", "failed", "superseded"] }, error_code: { anyOf: [{ type: "string" }, { type: "null" }] } } };
function U(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = U.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.id === void 0 && (p = "id") || r.target_key === void 0 && (p = "target_key") || r.kind === void 0 && (p = "kind") || r.status === void 0 && (p = "status") || r.error_code === void 0 && (p = "error_code"))
            return U.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let i = e;
            for (let o in r)
                if (!(o === "id" || o === "target_key" || o === "kind" || o === "status" || o === "error_code")) {
                    return U.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (i === e) {
                if (r.id !== void 0) {
                    let o = e;
                    if (typeof r.id != "string")
                        return U.errors = [{ instancePath: t + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.target_key !== void 0) {
                        let o = e;
                        if (typeof r.target_key != "string")
                            return U.errors = [{ instancePath: t + "/target_key", schemaPath: "#/properties/target_key/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.kind !== void 0) {
                            let o = r.kind, f = e;
                            if (typeof o != "string")
                                return U.errors = [{ instancePath: t + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: "string" } }], !1;
                            if (!(o === "group" || o === "title"))
                                return U.errors = [{ instancePath: t + "/kind", schemaPath: "#/properties/kind/enum", keyword: "enum", params: { allowedValues: nr.properties.kind.enum } }], !1;
                            var s = f === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.status !== void 0) {
                                let o = r.status, f = e;
                                if (typeof o != "string")
                                    return U.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                if (!(o === "queued" || o === "delivering" || o === "dispatch_unknown" || o === "observed" || o === "blocked" || o === "failed" || o === "superseded"))
                                    return U.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: nr.properties.status.enum } }], !1;
                                var s = f === e;
                            }
                            else
                                var s = !0;
                            if (s)
                                if (r.error_code !== void 0) {
                                    let o = r.error_code, f = e, y = e, m = !1, P = e;
                                    if (typeof o != "string") {
                                        let _ = { instancePath: t + "/error_code", schemaPath: "#/properties/error_code/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                        a === null ? a = [_] : a.push(_), e++;
                                    }
                                    var n = P === e;
                                    m = m || n;
                                    let c = e;
                                    if (o !== null) {
                                        let _ = { instancePath: t + "/error_code", schemaPath: "#/properties/error_code/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                        a === null ? a = [_] : a.push(_), e++;
                                    }
                                    var n = c === e;
                                    if (m = m || n, m)
                                        e = y, a !== null && (y ? a.length = y : a = null);
                                    else {
                                        let _ = { instancePath: t + "/error_code", schemaPath: "#/properties/error_code/anyOf", keyword: "anyOf", params: {} };
                                        return a === null ? a = [_] : a.push(_), e++, U.errors = a, !1;
                                    }
                                    var s = f === e;
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
        return U.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return U.errors = a, e === 0; }
U.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function ee(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ee.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let o;
        if (r.user_id === void 0 && (o = "user_id") || r.group === void 0 && (o = "group") || r.title === void 0 && (o = "title") || r.remote_effects === void 0 && (o = "remote_effects"))
            return ee.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: o } }], !1;
        {
            let f = e;
            for (let y in r)
                if (!(y === "user_id" || y === "group" || y === "title" || y === "remote_effects")) {
                    return ee.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                    break;
                }
            if (f === e) {
                if (r.user_id !== void 0) {
                    let y = e;
                    if (typeof r.user_id != "string")
                        return ee.errors = [{ instancePath: t + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = y === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.group !== void 0) {
                        let y = r.group, m = e, P = e, c = !1, g = e;
                        Q(y, { instancePath: t + "/group", parentData: r, parentDataProperty: "group", rootData: l, dynamicAnchors: u }) || (a = a === null ? Q.errors : a.concat(Q.errors), e = a.length);
                        var n = g === e;
                        c = c || n;
                        let _ = e;
                        if (y !== null) {
                            let x = { instancePath: t + "/group", schemaPath: "#/properties/group/anyOf/1/type", keyword: "type", params: { type: "null" } };
                            a === null ? a = [x] : a.push(x), e++;
                        }
                        var n = _ === e;
                        if (c = c || n, c)
                            e = P, a !== null && (P ? a.length = P : a = null);
                        else {
                            let x = { instancePath: t + "/group", schemaPath: "#/properties/group/anyOf", keyword: "anyOf", params: {} };
                            return a === null ? a = [x] : a.push(x), e++, ee.errors = a, !1;
                        }
                        var s = m === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.title !== void 0) {
                            let y = r.title, m = e, P = e, c = !1, g = e;
                            Q(y, { instancePath: t + "/title", parentData: r, parentDataProperty: "title", rootData: l, dynamicAnchors: u }) || (a = a === null ? Q.errors : a.concat(Q.errors), e = a.length);
                            var p = g === e;
                            c = c || p;
                            let _ = e;
                            if (y !== null) {
                                let x = { instancePath: t + "/title", schemaPath: "#/properties/title/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                a === null ? a = [x] : a.push(x), e++;
                            }
                            var p = _ === e;
                            if (c = c || p, c)
                                e = P, a !== null && (P ? a.length = P : a = null);
                            else {
                                let x = { instancePath: t + "/title", schemaPath: "#/properties/title/anyOf", keyword: "anyOf", params: {} };
                                return a === null ? a = [x] : a.push(x), e++, ee.errors = a, !1;
                            }
                            var s = m === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.remote_effects !== void 0) {
                                let y = r.remote_effects, m = e;
                                if (e === m)
                                    if (Array.isArray(y)) {
                                        var i = !0;
                                        let c = y.length;
                                        for (let g = 0; g < c; g++) {
                                            let _ = e;
                                            U(y[g], { instancePath: t + "/remote_effects/" + g, parentData: y, parentDataProperty: g, rootData: l, dynamicAnchors: u }) || (a = a === null ? U.errors : a.concat(U.errors), e = a.length);
                                            var i = _ === e;
                                            if (!i)
                                                break;
                                        }
                                    }
                                    else
                                        return ee.errors = [{ instancePath: t + "/remote_effects", schemaPath: "#/properties/remote_effects/type", keyword: "type", params: { type: "array" } }], !1;
                                var s = m === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return ee.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ee.errors = a, e === 0; }
ee.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ee = new RegExp("^(0|[1-9][0-9]*)$", "u");
function D(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = D.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let m;
        if (r.user_id === void 0 && (m = "user_id") || r.record_id === void 0 && (m = "record_id") || r.quota_granted === void 0 && (m = "quota_granted") || r.journal_id === void 0 && (m = "journal_id") || r.wallet === void 0 && (m = "wallet") || r.entitlements === void 0 && (m = "entitlements") || r.idempotent_replay === void 0 && (m = "idempotent_replay"))
            return D.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: m } }], !1;
        {
            let P = e;
            for (let c in r)
                if (!dr.call(Or.properties, c)) {
                    return D.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: c } }], !1;
                    break;
                }
            if (P === e) {
                if (r.user_id !== void 0) {
                    let c = e;
                    if (typeof r.user_id != "string")
                        return D.errors = [{ instancePath: t + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = c === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.record_id !== void 0) {
                        let c = e;
                        if (typeof r.record_id != "string")
                            return D.errors = [{ instancePath: t + "/record_id", schemaPath: "#/properties/record_id/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = c === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.quota_granted !== void 0) {
                            let c = e;
                            $(r.quota_granted, { instancePath: t + "/quota_granted", parentData: r, parentDataProperty: "quota_granted", rootData: l, dynamicAnchors: u }) || (a = a === null ? $.errors : a.concat($.errors), e = a.length);
                            var s = c === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.journal_id !== void 0) {
                                let c = e;
                                if (typeof r.journal_id != "string")
                                    return D.errors = [{ instancePath: t + "/journal_id", schemaPath: "#/properties/journal_id/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = c === e;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (r.wallet !== void 0) {
                                    let c = r.wallet, g = e;
                                    if (e === g)
                                        if (c && typeof c == "object" && !Array.isArray(c)) {
                                            let k;
                                            if (c.status === void 0 && (k = "status") || c.quota === void 0 && (k = "quota") || c.journal_id === void 0 && (k = "journal_id"))
                                                return D.errors = [{ instancePath: t + "/wallet", schemaPath: "#/properties/wallet/required", keyword: "required", params: { missingProperty: k } }], !1;
                                            {
                                                let x = e;
                                                for (let j in c)
                                                    if (!(j === "status" || j === "quota" || j === "journal_id")) {
                                                        return D.errors = [{ instancePath: t + "/wallet", schemaPath: "#/properties/wallet/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: j } }], !1;
                                                        break;
                                                    }
                                                if (x === e) {
                                                    if (c.status !== void 0) {
                                                        let j = c.status, cr = e;
                                                        if (typeof j != "string")
                                                            return D.errors = [{ instancePath: t + "/wallet/status", schemaPath: "#/properties/wallet/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                                        if (j !== "credited")
                                                            return D.errors = [{ instancePath: t + "/wallet/status", schemaPath: "#/properties/wallet/properties/status/const", keyword: "const", params: { allowedValue: "credited" } }], !1;
                                                        var n = cr === e;
                                                    }
                                                    else
                                                        var n = !0;
                                                    if (n) {
                                                        if (c.quota !== void 0) {
                                                            let j = e;
                                                            $(c.quota, { instancePath: t + "/wallet/quota", parentData: c, parentDataProperty: "quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? $.errors : a.concat($.errors), e = a.length);
                                                            var n = j === e;
                                                        }
                                                        else
                                                            var n = !0;
                                                        if (n)
                                                            if (c.journal_id !== void 0) {
                                                                let j = e;
                                                                if (typeof c.journal_id != "string")
                                                                    return D.errors = [{ instancePath: t + "/wallet/journal_id", schemaPath: "#/properties/wallet/properties/journal_id/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var n = j === e;
                                                            }
                                                            else
                                                                var n = !0;
                                                    }
                                                }
                                            }
                                        }
                                        else
                                            return D.errors = [{ instancePath: t + "/wallet", schemaPath: "#/properties/wallet/type", keyword: "type", params: { type: "object" } }], !1;
                                    var s = g === e;
                                }
                                else
                                    var s = !0;
                                if (s) {
                                    if (r.entitlements !== void 0) {
                                        let c = e;
                                        ee(r.entitlements, { instancePath: t + "/entitlements", parentData: r, parentDataProperty: "entitlements", rootData: l, dynamicAnchors: u }) || (a = a === null ? ee.errors : a.concat(ee.errors), e = a.length);
                                        var s = c === e;
                                    }
                                    else
                                        var s = !0;
                                    if (s) {
                                        if (r.idempotent_replay !== void 0) {
                                            let c = e;
                                            if (typeof r.idempotent_replay != "boolean")
                                                return D.errors = [{ instancePath: t + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
                                            var s = c === e;
                                        }
                                        else
                                            var s = !0;
                                        if (s) {
                                            if (r.code_id !== void 0) {
                                                let c = e;
                                                if (typeof r.code_id != "string")
                                                    return D.errors = [{ instancePath: t + "/code_id", schemaPath: "#/properties/code_id/type", keyword: "type", params: { type: "string" } }], !1;
                                                var s = c === e;
                                            }
                                            else
                                                var s = !0;
                                            if (s) {
                                                if (r.code !== void 0) {
                                                    let c = e;
                                                    if (typeof r.code != "string")
                                                        return D.errors = [{ instancePath: t + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                                                    var s = c === e;
                                                }
                                                else
                                                    var s = !0;
                                                if (s) {
                                                    if (r.name !== void 0) {
                                                        let c = e;
                                                        if (typeof r.name != "string")
                                                            return D.errors = [{ instancePath: t + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" } }], !1;
                                                        var s = c === e;
                                                    }
                                                    else
                                                        var s = !0;
                                                    if (s) {
                                                        if (r.site_code !== void 0) {
                                                            let c = e;
                                                            if (typeof r.site_code != "string")
                                                                return D.errors = [{ instancePath: t + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                            var s = c === e;
                                                        }
                                                        else
                                                            var s = !0;
                                                        if (s) {
                                                            if (r.peach_granted !== void 0) {
                                                                let c = e;
                                                                if (typeof r.peach_granted != "string")
                                                                    return D.errors = [{ instancePath: t + "/peach_granted", schemaPath: "#/properties/peach_granted/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var s = c === e;
                                                            }
                                                            else
                                                                var s = !0;
                                                            if (s) {
                                                                if (r.credited_quota !== void 0) {
                                                                    let c = r.credited_quota, g = e;
                                                                    if (e === g)
                                                                        if (typeof c == "string") {
                                                                            if (!Ee.test(c))
                                                                                return D.errors = [{ instancePath: t + "/credited_quota", schemaPath: "#/properties/credited_quota/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                                                        }
                                                                        else
                                                                            return D.errors = [{ instancePath: t + "/credited_quota", schemaPath: "#/properties/credited_quota/type", keyword: "type", params: { type: "string" } }], !1;
                                                                    var s = g === e;
                                                                }
                                                                else
                                                                    var s = !0;
                                                                if (s) {
                                                                    if (r.repaid_overdraft_quota !== void 0) {
                                                                        let c = r.repaid_overdraft_quota, g = e;
                                                                        if (e === g)
                                                                            if (typeof c == "string") {
                                                                                if (!Ee.test(c))
                                                                                    return D.errors = [{ instancePath: t + "/repaid_overdraft_quota", schemaPath: "#/properties/repaid_overdraft_quota/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                                                            }
                                                                            else
                                                                                return D.errors = [{ instancePath: t + "/repaid_overdraft_quota", schemaPath: "#/properties/repaid_overdraft_quota/type", keyword: "type", params: { type: "string" } }], !1;
                                                                        var s = g === e;
                                                                    }
                                                                    else
                                                                        var s = !0;
                                                                    if (s) {
                                                                        if (r.added_available_quota !== void 0) {
                                                                            let c = r.added_available_quota, g = e;
                                                                            if (e === g)
                                                                                if (typeof c == "string") {
                                                                                    if (!Ee.test(c))
                                                                                        return D.errors = [{ instancePath: t + "/added_available_quota", schemaPath: "#/properties/added_available_quota/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                                                                }
                                                                                else
                                                                                    return D.errors = [{ instancePath: t + "/added_available_quota", schemaPath: "#/properties/added_available_quota/type", keyword: "type", params: { type: "string" } }], !1;
                                                                            var s = g === e;
                                                                        }
                                                                        else
                                                                            var s = !0;
                                                                        if (s) {
                                                                            if (r.inviter_rebate_quota !== void 0) {
                                                                                let c = r.inviter_rebate_quota, g = e;
                                                                                if (e === g)
                                                                                    if (typeof c == "string") {
                                                                                        if (!Ee.test(c))
                                                                                            return D.errors = [{ instancePath: t + "/inviter_rebate_quota", schemaPath: "#/properties/inviter_rebate_quota/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                                                                    }
                                                                                    else
                                                                                        return D.errors = [{ instancePath: t + "/inviter_rebate_quota", schemaPath: "#/properties/inviter_rebate_quota/type", keyword: "type", params: { type: "string" } }], !1;
                                                                                var s = g === e;
                                                                            }
                                                                            else
                                                                                var s = !0;
                                                                            if (s) {
                                                                                if (r.grant_group !== void 0) {
                                                                                    let c = r.grant_group, g = e, _ = e, k = !1, x = e;
                                                                                    if (typeof c != "string") {
                                                                                        let w = { instancePath: t + "/grant_group", schemaPath: "#/properties/grant_group/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                                                        a === null ? a = [w] : a.push(w), e++;
                                                                                    }
                                                                                    var p = x === e;
                                                                                    k = k || p;
                                                                                    let j = e;
                                                                                    if (c !== null) {
                                                                                        let w = { instancePath: t + "/grant_group", schemaPath: "#/properties/grant_group/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                                                        a === null ? a = [w] : a.push(w), e++;
                                                                                    }
                                                                                    var p = j === e;
                                                                                    if (k = k || p, k)
                                                                                        e = _, a !== null && (_ ? a.length = _ : a = null);
                                                                                    else {
                                                                                        let w = { instancePath: t + "/grant_group", schemaPath: "#/properties/grant_group/anyOf", keyword: "anyOf", params: {} };
                                                                                        return a === null ? a = [w] : a.push(w), e++, D.errors = a, !1;
                                                                                    }
                                                                                    var s = g === e;
                                                                                }
                                                                                else
                                                                                    var s = !0;
                                                                                if (s) {
                                                                                    if (r.grant_title !== void 0) {
                                                                                        let c = r.grant_title, g = e, _ = e, k = !1, x = e;
                                                                                        if (typeof c != "string") {
                                                                                            let w = { instancePath: t + "/grant_title", schemaPath: "#/properties/grant_title/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                                                            a === null ? a = [w] : a.push(w), e++;
                                                                                        }
                                                                                        var i = x === e;
                                                                                        k = k || i;
                                                                                        let j = e;
                                                                                        if (c !== null) {
                                                                                            let w = { instancePath: t + "/grant_title", schemaPath: "#/properties/grant_title/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                                                            a === null ? a = [w] : a.push(w), e++;
                                                                                        }
                                                                                        var i = j === e;
                                                                                        if (k = k || i, k)
                                                                                            e = _, a !== null && (_ ? a.length = _ : a = null);
                                                                                        else {
                                                                                            let w = { instancePath: t + "/grant_title", schemaPath: "#/properties/grant_title/anyOf", keyword: "anyOf", params: {} };
                                                                                            return a === null ? a = [w] : a.push(w), e++, D.errors = a, !1;
                                                                                        }
                                                                                        var s = g === e;
                                                                                    }
                                                                                    else
                                                                                        var s = !0;
                                                                                    if (s) {
                                                                                        if (r.entitlement_grant_id !== void 0) {
                                                                                            let c = r.entitlement_grant_id, g = e, _ = e, k = !1, x = e;
                                                                                            if (typeof c != "string") {
                                                                                                let w = { instancePath: t + "/entitlement_grant_id", schemaPath: "#/properties/entitlement_grant_id/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                                                                a === null ? a = [w] : a.push(w), e++;
                                                                                            }
                                                                                            var o = x === e;
                                                                                            k = k || o;
                                                                                            let j = e;
                                                                                            if (c !== null) {
                                                                                                let w = { instancePath: t + "/entitlement_grant_id", schemaPath: "#/properties/entitlement_grant_id/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                                                                a === null ? a = [w] : a.push(w), e++;
                                                                                            }
                                                                                            var o = j === e;
                                                                                            if (k = k || o, k)
                                                                                                e = _, a !== null && (_ ? a.length = _ : a = null);
                                                                                            else {
                                                                                                let w = { instancePath: t + "/entitlement_grant_id", schemaPath: "#/properties/entitlement_grant_id/anyOf", keyword: "anyOf", params: {} };
                                                                                                return a === null ? a = [w] : a.push(w), e++, D.errors = a, !1;
                                                                                            }
                                                                                            var s = g === e;
                                                                                        }
                                                                                        else
                                                                                            var s = !0;
                                                                                        if (s) {
                                                                                            if (r.inviter_user_id !== void 0) {
                                                                                                let c = r.inviter_user_id, g = e, _ = e, k = !1, x = e;
                                                                                                if (typeof c != "string") {
                                                                                                    let w = { instancePath: t + "/inviter_user_id", schemaPath: "#/properties/inviter_user_id/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                                                                    a === null ? a = [w] : a.push(w), e++;
                                                                                                }
                                                                                                var f = x === e;
                                                                                                k = k || f;
                                                                                                let j = e;
                                                                                                if (c !== null) {
                                                                                                    let w = { instancePath: t + "/inviter_user_id", schemaPath: "#/properties/inviter_user_id/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                                                                    a === null ? a = [w] : a.push(w), e++;
                                                                                                }
                                                                                                var f = j === e;
                                                                                                if (k = k || f, k)
                                                                                                    e = _, a !== null && (_ ? a.length = _ : a = null);
                                                                                                else {
                                                                                                    let w = { instancePath: t + "/inviter_user_id", schemaPath: "#/properties/inviter_user_id/anyOf", keyword: "anyOf", params: {} };
                                                                                                    return a === null ? a = [w] : a.push(w), e++, D.errors = a, !1;
                                                                                                }
                                                                                                var s = g === e;
                                                                                            }
                                                                                            else
                                                                                                var s = !0;
                                                                                            if (s) {
                                                                                                if (r.rebate_journal_id !== void 0) {
                                                                                                    let c = r.rebate_journal_id, g = e, _ = e, k = !1, x = e;
                                                                                                    if (typeof c != "string") {
                                                                                                        let w = { instancePath: t + "/rebate_journal_id", schemaPath: "#/properties/rebate_journal_id/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                                                                                        a === null ? a = [w] : a.push(w), e++;
                                                                                                    }
                                                                                                    var y = x === e;
                                                                                                    k = k || y;
                                                                                                    let j = e;
                                                                                                    if (c !== null) {
                                                                                                        let w = { instancePath: t + "/rebate_journal_id", schemaPath: "#/properties/rebate_journal_id/anyOf/1/type", keyword: "type", params: { type: "null" } };
                                                                                                        a === null ? a = [w] : a.push(w), e++;
                                                                                                    }
                                                                                                    var y = j === e;
                                                                                                    if (k = k || y, k)
                                                                                                        e = _, a !== null && (_ ? a.length = _ : a = null);
                                                                                                    else {
                                                                                                        let w = { instancePath: t + "/rebate_journal_id", schemaPath: "#/properties/rebate_journal_id/anyOf", keyword: "anyOf", params: {} };
                                                                                                        return a === null ? a = [w] : a.push(w), e++, D.errors = a, !1;
                                                                                                    }
                                                                                                    var s = g === e;
                                                                                                }
                                                                                                else
                                                                                                    var s = !0;
                                                                                                if (s) {
                                                                                                    if (r.used_count !== void 0) {
                                                                                                        let c = r.used_count, g = e;
                                                                                                        if (!(typeof c == "number" && !(c % 1) && !isNaN(c) && isFinite(c)))
                                                                                                            return D.errors = [{ instancePath: t + "/used_count", schemaPath: "#/properties/used_count/type", keyword: "type", params: { type: "integer" } }], !1;
                                                                                                        if (e === g && typeof c == "number" && isFinite(c) && (c < 0 || isNaN(c)))
                                                                                                            return D.errors = [{ instancePath: t + "/used_count", schemaPath: "#/properties/used_count/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                                                                                        var s = g === e;
                                                                                                    }
                                                                                                    else
                                                                                                        var s = !0;
                                                                                                    if (s) {
                                                                                                        if (r.max_uses !== void 0) {
                                                                                                            let c = r.max_uses, g = e;
                                                                                                            if (!(typeof c == "number" && !(c % 1) && !isNaN(c) && isFinite(c)))
                                                                                                                return D.errors = [{ instancePath: t + "/max_uses", schemaPath: "#/properties/max_uses/type", keyword: "type", params: { type: "integer" } }], !1;
                                                                                                            if (e === g && typeof c == "number" && isFinite(c) && (c < 0 || isNaN(c)))
                                                                                                                return D.errors = [{ instancePath: t + "/max_uses", schemaPath: "#/properties/max_uses/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                                                                                            var s = g === e;
                                                                                                        }
                                                                                                        else
                                                                                                            var s = !0;
                                                                                                        if (s) {
                                                                                                            if (r.epoch !== void 0) {
                                                                                                                let c = r.epoch, g = e;
                                                                                                                if (!(typeof c == "number" && !(c % 1) && !isNaN(c) && isFinite(c)))
                                                                                                                    return D.errors = [{ instancePath: t + "/epoch", schemaPath: "#/properties/epoch/type", keyword: "type", params: { type: "integer" } }], !1;
                                                                                                                if (e === g && typeof c == "number" && isFinite(c) && (c < 0 || isNaN(c)))
                                                                                                                    return D.errors = [{ instancePath: t + "/epoch", schemaPath: "#/properties/epoch/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                                                                                                                var s = g === e;
                                                                                                            }
                                                                                                            else
                                                                                                                var s = !0;
                                                                                                            if (s)
                                                                                                                if (r.replayed !== void 0) {
                                                                                                                    let c = e;
                                                                                                                    if (typeof r.replayed != "boolean")
                                                                                                                        return D.errors = [{ instancePath: t + "/replayed", schemaPath: "#/properties/replayed/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                                                                                    var s = c === e;
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
        return D.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return D.errors = a, e === 0; }
D.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Nr = ue;
var Rr = { type: "object", additionalProperties: !1, required: ["week_key", "currency", "roster_id", "amount_minor"], properties: { week_key: { type: "string" }, currency: { type: "string", enum: ["CNY", "USD", "GBP", "EUR"] }, roster_id: { anyOf: [{ type: "string", pattern: "^(0|[1-9][0-9]*)$" }, { type: "integer", minimum: 1 }] }, amount_minor: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, note: { type: "string" }, attachments: { type: "array", maxItems: 0 } } };
function E(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = E.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.week_key === void 0 && (p = "week_key") || r.currency === void 0 && (p = "currency") || r.roster_id === void 0 && (p = "roster_id") || r.amount_minor === void 0 && (p = "amount_minor"))
            return E.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let i = e;
            for (let o in r)
                if (!(o === "week_key" || o === "currency" || o === "roster_id" || o === "amount_minor" || o === "note" || o === "attachments")) {
                    return E.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (i === e) {
                if (r.week_key !== void 0) {
                    let o = e;
                    if (typeof r.week_key != "string")
                        return E.errors = [{ instancePath: t + "/week_key", schemaPath: "#/properties/week_key/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.currency !== void 0) {
                        let o = r.currency, f = e;
                        if (typeof o != "string")
                            return E.errors = [{ instancePath: t + "/currency", schemaPath: "#/properties/currency/type", keyword: "type", params: { type: "string" } }], !1;
                        if (!(o === "CNY" || o === "USD" || o === "GBP" || o === "EUR"))
                            return E.errors = [{ instancePath: t + "/currency", schemaPath: "#/properties/currency/enum", keyword: "enum", params: { allowedValues: Rr.properties.currency.enum } }], !1;
                        var s = f === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.roster_id !== void 0) {
                            let o = r.roster_id, f = e, y = e, m = !1, P = e;
                            if (e === P)
                                if (typeof o == "string") {
                                    if (!Ee.test(o)) {
                                        let _ = { instancePath: t + "/roster_id", schemaPath: "#/properties/roster_id/anyOf/0/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } };
                                        a === null ? a = [_] : a.push(_), e++;
                                    }
                                }
                                else {
                                    let _ = { instancePath: t + "/roster_id", schemaPath: "#/properties/roster_id/anyOf/0/type", keyword: "type", params: { type: "string" } };
                                    a === null ? a = [_] : a.push(_), e++;
                                }
                            var n = P === e;
                            m = m || n;
                            let c = e;
                            if (!(typeof o == "number" && !(o % 1) && !isNaN(o) && isFinite(o))) {
                                let _ = { instancePath: t + "/roster_id", schemaPath: "#/properties/roster_id/anyOf/1/type", keyword: "type", params: { type: "integer" } };
                                a === null ? a = [_] : a.push(_), e++;
                            }
                            if (e === c && typeof o == "number" && isFinite(o) && (o < 1 || isNaN(o))) {
                                let _ = { instancePath: t + "/roster_id", schemaPath: "#/properties/roster_id/anyOf/1/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 } };
                                a === null ? a = [_] : a.push(_), e++;
                            }
                            var n = c === e;
                            if (m = m || n, m)
                                e = y, a !== null && (y ? a.length = y : a = null);
                            else {
                                let _ = { instancePath: t + "/roster_id", schemaPath: "#/properties/roster_id/anyOf", keyword: "anyOf", params: {} };
                                return a === null ? a = [_] : a.push(_), e++, E.errors = a, !1;
                            }
                            var s = f === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.amount_minor !== void 0) {
                                let o = r.amount_minor, f = e;
                                if (e === f)
                                    if (typeof o == "string") {
                                        if (!Ee.test(o))
                                            return E.errors = [{ instancePath: t + "/amount_minor", schemaPath: "#/properties/amount_minor/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                    }
                                    else
                                        return E.errors = [{ instancePath: t + "/amount_minor", schemaPath: "#/properties/amount_minor/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = f === e;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (r.note !== void 0) {
                                    let o = e;
                                    if (typeof r.note != "string")
                                        return E.errors = [{ instancePath: t + "/note", schemaPath: "#/properties/note/type", keyword: "type", params: { type: "string" } }], !1;
                                    var s = o === e;
                                }
                                else
                                    var s = !0;
                                if (s)
                                    if (r.attachments !== void 0) {
                                        let o = r.attachments, f = e;
                                        if (e === f)
                                            if (Array.isArray(o)) {
                                                if (o.length > 0)
                                                    return E.errors = [{ instancePath: t + "/attachments", schemaPath: "#/properties/attachments/maxItems", keyword: "maxItems", params: { limit: 0 } }], !1;
                                            }
                                            else
                                                return E.errors = [{ instancePath: t + "/attachments", schemaPath: "#/properties/attachments/type", keyword: "type", params: { type: "array" } }], !1;
                                        var s = f === e;
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
        return E.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return E.errors = a, e === 0; }
E.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function ue(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ue.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return ue.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return ue.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return ue.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return ue.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return ue.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return ue.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                E(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? E.errors : a.concat(E.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return ue.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ue.errors = a, e === 0; }
ue.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var fr = O, Sr = { type: "object", additionalProperties: !1, required: ["week_key", "roster_id", "currency", "declared_minor", "row_version", "replayed", "idempotent_replay", "external_payment_executed", "wallet_changed"], properties: { week_key: { type: "string" }, roster_id: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, currency: { type: "string" }, declared_minor: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, row_version: { type: "string", pattern: "^(0|[1-9][0-9]*)$" }, replayed: { type: "boolean" }, idempotent_replay: { type: "boolean" }, external_payment_executed: { type: "boolean", const: !1 }, wallet_changed: { type: "boolean", const: !1 } } };
function O(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = O.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.week_key === void 0 && (n = "week_key") || r.roster_id === void 0 && (n = "roster_id") || r.currency === void 0 && (n = "currency") || r.declared_minor === void 0 && (n = "declared_minor") || r.row_version === void 0 && (n = "row_version") || r.replayed === void 0 && (n = "replayed") || r.idempotent_replay === void 0 && (n = "idempotent_replay") || r.external_payment_executed === void 0 && (n = "external_payment_executed") || r.wallet_changed === void 0 && (n = "wallet_changed"))
            return O.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!dr.call(Sr.properties, i)) {
                    return O.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.week_key !== void 0) {
                    let i = e;
                    if (typeof r.week_key != "string")
                        return O.errors = [{ instancePath: t + "/week_key", schemaPath: "#/properties/week_key/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = i === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.roster_id !== void 0) {
                        let i = r.roster_id, o = e;
                        if (e === o)
                            if (typeof i == "string") {
                                if (!Ee.test(i))
                                    return O.errors = [{ instancePath: t + "/roster_id", schemaPath: "#/properties/roster_id/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                            }
                            else
                                return O.errors = [{ instancePath: t + "/roster_id", schemaPath: "#/properties/roster_id/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.currency !== void 0) {
                            let i = e;
                            if (typeof r.currency != "string")
                                return O.errors = [{ instancePath: t + "/currency", schemaPath: "#/properties/currency/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.declared_minor !== void 0) {
                                let i = r.declared_minor, o = e;
                                if (e === o)
                                    if (typeof i == "string") {
                                        if (!Ee.test(i))
                                            return O.errors = [{ instancePath: t + "/declared_minor", schemaPath: "#/properties/declared_minor/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                    }
                                    else
                                        return O.errors = [{ instancePath: t + "/declared_minor", schemaPath: "#/properties/declared_minor/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = o === e;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (r.row_version !== void 0) {
                                    let i = r.row_version, o = e;
                                    if (e === o)
                                        if (typeof i == "string") {
                                            if (!Ee.test(i))
                                                return O.errors = [{ instancePath: t + "/row_version", schemaPath: "#/properties/row_version/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]*)$" } }], !1;
                                        }
                                        else
                                            return O.errors = [{ instancePath: t + "/row_version", schemaPath: "#/properties/row_version/type", keyword: "type", params: { type: "string" } }], !1;
                                    var s = o === e;
                                }
                                else
                                    var s = !0;
                                if (s) {
                                    if (r.replayed !== void 0) {
                                        let i = e;
                                        if (typeof r.replayed != "boolean")
                                            return O.errors = [{ instancePath: t + "/replayed", schemaPath: "#/properties/replayed/type", keyword: "type", params: { type: "boolean" } }], !1;
                                        var s = i === e;
                                    }
                                    else
                                        var s = !0;
                                    if (s) {
                                        if (r.idempotent_replay !== void 0) {
                                            let i = e;
                                            if (typeof r.idempotent_replay != "boolean")
                                                return O.errors = [{ instancePath: t + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
                                            var s = i === e;
                                        }
                                        else
                                            var s = !0;
                                        if (s) {
                                            if (r.external_payment_executed !== void 0) {
                                                let i = r.external_payment_executed, o = e;
                                                if (typeof i != "boolean")
                                                    return O.errors = [{ instancePath: t + "/external_payment_executed", schemaPath: "#/properties/external_payment_executed/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                if (i !== !1)
                                                    return O.errors = [{ instancePath: t + "/external_payment_executed", schemaPath: "#/properties/external_payment_executed/const", keyword: "const", params: { allowedValue: !1 } }], !1;
                                                var s = o === e;
                                            }
                                            else
                                                var s = !0;
                                            if (s)
                                                if (r.wallet_changed !== void 0) {
                                                    let i = r.wallet_changed, o = e;
                                                    if (typeof i != "boolean")
                                                        return O.errors = [{ instancePath: t + "/wallet_changed", schemaPath: "#/properties/wallet_changed/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                    if (i !== !1)
                                                        return O.errors = [{ instancePath: t + "/wallet_changed", schemaPath: "#/properties/wallet_changed/const", keyword: "const", params: { allowedValue: !1 } }], !1;
                                                    var s = o === e;
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
        }
    }
    else
        return O.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return O.errors = a, e === 0; }
O.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Qr = ye;
function G(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = G.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r["x-csrf-token"] === void 0 && (n = "x-csrf-token") || r["idempotency-key"] === void 0 && (n = "idempotency-key"))
            return G.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "x-csrf-token" || i === "idempotency-key")) {
                    return G.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r["x-csrf-token"] !== void 0) {
                    let i = r["x-csrf-token"], o = e;
                    if (e === o)
                        if (typeof i == "string") {
                            if (Te(i) < 1)
                                return G.errors = [{ instancePath: t + "/x-csrf-token", schemaPath: "#/properties/x-csrf-token/minLength", keyword: "minLength", params: { limit: 1 } }], !1;
                        }
                        else
                            return G.errors = [{ instancePath: t + "/x-csrf-token", schemaPath: "#/properties/x-csrf-token/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s)
                    if (r["idempotency-key"] !== void 0) {
                        let i = r["idempotency-key"], o = e;
                        if (e === o)
                            if (typeof i == "string") {
                                if (Te(i) > 128)
                                    return G.errors = [{ instancePath: t + "/idempotency-key", schemaPath: "#/properties/idempotency-key/maxLength", keyword: "maxLength", params: { limit: 128 } }], !1;
                                if (Te(i) < 8)
                                    return G.errors = [{ instancePath: t + "/idempotency-key", schemaPath: "#/properties/idempotency-key/minLength", keyword: "minLength", params: { limit: 8 } }], !1;
                            }
                            else
                                return G.errors = [{ instancePath: t + "/idempotency-key", schemaPath: "#/properties/idempotency-key/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
            }
        }
    }
    else
        return G.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return G.errors = a, e === 0; }
G.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function ye(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ye.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return ye.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return ye.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return ye.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return ye.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return ye.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return ye.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            G(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? G.errors : a.concat(G.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                E(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? E.errors : a.concat(E.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return ye.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ye.errors = a, e === 0; }
ye.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Fr = Fe;
var Tr = { type: "object", properties: { week_key: { type: "string" }, roster_id: { type: "string" }, currency: { type: "string" }, amount_minor: { $ref: "#/components/schemas/MoneyMinor" }, status: { type: "string", enum: ["draft", "submitted", "approved", "paid", "reopened"] }, note: { type: "string" } } };
var lr = new RegExp("^-?(0|[1-9][0-9]{0,18})$", "u");
function R(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = R.evaluated; d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0); let s = e; if (e === s)
    if (typeof r == "string") {
        if (!lr.test(r))
            return R.errors = [{ instancePath: t, schemaPath: "#/allOf/0/pattern", keyword: "pattern", params: { pattern: "^-?(0|[1-9][0-9]{0,18})$" } }], !1;
    }
    else
        return R.errors = [{ instancePath: t, schemaPath: "#/allOf/0/type", keyword: "type", params: { type: "string" } }], !1; var n = s === e; if (n) {
    let p = e;
    if (e === p)
        if (typeof r == "string") {
            if (!Ve.test(r))
                return R.errors = [{ instancePath: t, schemaPath: "#/allOf/1/pattern", keyword: "pattern", params: { pattern: "^(?!-0$)(?:(?:[0-9]{1,18}|9223372036854775807|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6])|-(?:[0-9]{1,18}|9223372036854775808|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-7]))$" } }], !1;
        }
        else
            return R.errors = [{ instancePath: t, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "string" } }], !1;
    var n = p === e;
} return R.errors = a, e === 0; }
R.evaluated = { dynamicProps: !1, dynamicItems: !1 };
function re(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = re.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.week_key !== void 0) {
            let n = e;
            if (typeof r.week_key != "string")
                return re.errors = [{ instancePath: t + "/week_key", schemaPath: "#/properties/week_key/type", keyword: "type", params: { type: "string" } }], !1;
            var s = n === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.roster_id !== void 0) {
                let n = e;
                if (typeof r.roster_id != "string")
                    return re.errors = [{ instancePath: t + "/roster_id", schemaPath: "#/properties/roster_id/type", keyword: "type", params: { type: "string" } }], !1;
                var s = n === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.currency !== void 0) {
                    let n = e;
                    if (typeof r.currency != "string")
                        return re.errors = [{ instancePath: t + "/currency", schemaPath: "#/properties/currency/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = n === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.amount_minor !== void 0) {
                        let n = e;
                        R(r.amount_minor, { instancePath: t + "/amount_minor", parentData: r, parentDataProperty: "amount_minor", rootData: l, dynamicAnchors: u }) || (a = a === null ? R.errors : a.concat(R.errors), e = a.length);
                        var s = n === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.status !== void 0) {
                            let n = r.status, p = e;
                            if (typeof n != "string")
                                return re.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                            if (!(n === "draft" || n === "submitted" || n === "approved" || n === "paid" || n === "reopened"))
                                return re.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: Tr.properties.status.enum } }], !1;
                            var s = p === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.note !== void 0) {
                                let n = e;
                                if (typeof r.note != "string")
                                    return re.errors = [{ instancePath: t + "/note", schemaPath: "#/properties/note/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = n === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return re.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return re.errors = a, e === 0; }
re.evaluated = { props: { week_key: !0, roster_id: !0, currency: !0, amount_minor: !0, status: !0, note: !0 }, dynamicProps: !1, dynamicItems: !1 };
function Fe(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = Fe.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.items !== void 0) {
            let n = r.items;
            if (e === e)
                if (Array.isArray(n)) {
                    var s = !0;
                    let i = n.length;
                    for (let o = 0; o < i; o++) {
                        let f = e;
                        re(n[o], { instancePath: t + "/items/" + o, parentData: n, parentDataProperty: o, rootData: l, dynamicAnchors: u }) || (a = a === null ? re.errors : a.concat(re.errors), e = a.length);
                        var s = f === e;
                        if (!s)
                            break;
                    }
                }
                else
                    return Fe.errors = [{ instancePath: t + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" } }], !1;
        }
    }
    else
        return Fe.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Fe.errors = a, e === 0; }
Fe.evaluated = { props: { items: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Mr = S;
function S(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = S.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return S.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let i = e;
            for (let o in r)
                if (!(o === "pathParams" || o === "query" || o === "headers")) {
                    return S.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (i === e) {
                if (r.pathParams !== void 0) {
                    let o = r.pathParams, f = e;
                    if (e === f)
                        if (o && typeof o == "object" && !Array.isArray(o))
                            for (let y in o) {
                                return S.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                break;
                            }
                        else
                            return S.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = f === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let o = r.query, f = e;
                        if (e === f)
                            if (o && typeof o == "object" && !Array.isArray(o)) {
                                let m = e;
                                for (let P in o)
                                    if (!(P === "user_id" || P === "status" || P === "cursor" || P === "limit")) {
                                        return S.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: P } }], !1;
                                        break;
                                    }
                                if (m === e) {
                                    if (o.user_id !== void 0) {
                                        let P = e;
                                        if (typeof o.user_id != "string")
                                            return S.errors = [{ instancePath: t + "/query/user_id", schemaPath: "#/properties/query/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                                        var n = P === e;
                                    }
                                    else
                                        var n = !0;
                                    if (n) {
                                        if (o.status !== void 0) {
                                            let P = e;
                                            if (typeof o.status != "string")
                                                return S.errors = [{ instancePath: t + "/query/status", schemaPath: "#/properties/query/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                                            var n = P === e;
                                        }
                                        else
                                            var n = !0;
                                        if (n) {
                                            if (o.cursor !== void 0) {
                                                let P = e;
                                                if (typeof o.cursor != "string")
                                                    return S.errors = [{ instancePath: t + "/query/cursor", schemaPath: "#/properties/query/properties/cursor/type", keyword: "type", params: { type: "string" } }], !1;
                                                var n = P === e;
                                            }
                                            else
                                                var n = !0;
                                            if (n)
                                                if (o.limit !== void 0) {
                                                    let P = o.limit, c = e;
                                                    if (!(typeof P == "number" && !(P % 1) && !isNaN(P) && isFinite(P)))
                                                        return S.errors = [{ instancePath: t + "/query/limit", schemaPath: "#/properties/query/properties/limit/type", keyword: "type", params: { type: "integer" } }], !1;
                                                    if (e === c && typeof P == "number" && isFinite(P) && (P > 200 || isNaN(P)))
                                                        return S.errors = [{ instancePath: t + "/query/limit", schemaPath: "#/properties/query/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 200 } }], !1;
                                                    var n = c === e;
                                                }
                                                else
                                                    var n = !0;
                                        }
                                    }
                                }
                            }
                            else
                                return S.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = f === e;
                    }
                    else
                        var s = !0;
                    if (s)
                        if (r.headers !== void 0) {
                            let o = r.headers, f = e;
                            if (e === f)
                                if (o && typeof o == "object" && !Array.isArray(o))
                                    for (let m in o) {
                                        return S.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                else
                                    return S.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var s = f === e;
                        }
                        else
                            var s = !0;
                }
            }
        }
    }
    else
        return S.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return S.errors = a, e === 0; }
S.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Vr = ze;
var ur = { type: "object", properties: { order_id: { type: "string", format: "uuid" }, order_ref: { type: "string" }, status: { type: "string", enum: ["pending", "paid", "partial", "expired", "canceled", "refunded", "disputed"] }, quota_amount: { $ref: "#/components/schemas/Quota" }, fiat_amount_minor: { $ref: "#/components/schemas/MoneyMinor" }, currency: { type: "string" }, checkout_hint: { type: "object", additionalProperties: !0 }, expires_at: { type: "string", format: "date-time" } } }, M = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i, Ge = pr["date-time"];
function b(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = b.evaluated; d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0); let s = e; if (e === s)
    if (typeof r == "string") {
        if (!lr.test(r))
            return b.errors = [{ instancePath: t, schemaPath: "#/allOf/0/pattern", keyword: "pattern", params: { pattern: "^-?(0|[1-9][0-9]{0,18})$" } }], !1;
    }
    else
        return b.errors = [{ instancePath: t, schemaPath: "#/allOf/0/type", keyword: "type", params: { type: "string" } }], !1; var n = s === e; if (n) {
    let p = e;
    if (e === p)
        if (typeof r == "string") {
            if (!Ve.test(r))
                return b.errors = [{ instancePath: t, schemaPath: "#/allOf/1/pattern", keyword: "pattern", params: { pattern: "^(?!-0$)(?:(?:[0-9]{1,18}|9223372036854775807|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6])|-(?:[0-9]{1,18}|9223372036854775808|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-7]))$" } }], !1;
        }
        else
            return b.errors = [{ instancePath: t, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "string" } }], !1;
    var n = p === e;
} return b.errors = a, e === 0; }
b.evaluated = { dynamicProps: !1, dynamicItems: !1 };
function Y(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = Y.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.order_id !== void 0) {
            let n = r.order_id, p = e;
            if (e === p && e === p)
                if (typeof n == "string") {
                    if (!M.test(n))
                        return Y.errors = [{ instancePath: t + "/order_id", schemaPath: "#/properties/order_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                }
                else
                    return Y.errors = [{ instancePath: t + "/order_id", schemaPath: "#/properties/order_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = p === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.order_ref !== void 0) {
                let n = e;
                if (typeof r.order_ref != "string")
                    return Y.errors = [{ instancePath: t + "/order_ref", schemaPath: "#/properties/order_ref/type", keyword: "type", params: { type: "string" } }], !1;
                var s = n === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.status !== void 0) {
                    let n = r.status, p = e;
                    if (typeof n != "string")
                        return Y.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                    if (!(n === "pending" || n === "paid" || n === "partial" || n === "expired" || n === "canceled" || n === "refunded" || n === "disputed"))
                        return Y.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: ur.properties.status.enum } }], !1;
                    var s = p === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.quota_amount !== void 0) {
                        let n = e;
                        b(r.quota_amount, { instancePath: t + "/quota_amount", parentData: r, parentDataProperty: "quota_amount", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                        var s = n === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.fiat_amount_minor !== void 0) {
                            let n = e;
                            R(r.fiat_amount_minor, { instancePath: t + "/fiat_amount_minor", parentData: r, parentDataProperty: "fiat_amount_minor", rootData: l, dynamicAnchors: u }) || (a = a === null ? R.errors : a.concat(R.errors), e = a.length);
                            var s = n === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.currency !== void 0) {
                                let n = e;
                                if (typeof r.currency != "string")
                                    return Y.errors = [{ instancePath: t + "/currency", schemaPath: "#/properties/currency/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = n === e;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (r.checkout_hint !== void 0) {
                                    let n = r.checkout_hint, p = e;
                                    if (e === p && !(n && typeof n == "object" && !Array.isArray(n)))
                                        return Y.errors = [{ instancePath: t + "/checkout_hint", schemaPath: "#/properties/checkout_hint/type", keyword: "type", params: { type: "object" } }], !1;
                                    var s = p === e;
                                }
                                else
                                    var s = !0;
                                if (s)
                                    if (r.expires_at !== void 0) {
                                        let n = r.expires_at, p = e;
                                        if (e === p && e === p)
                                            if (typeof n == "string") {
                                                if (!Ge.validate(n))
                                                    return Y.errors = [{ instancePath: t + "/expires_at", schemaPath: "#/properties/expires_at/format", keyword: "format", params: { format: "date-time" } }], !1;
                                            }
                                            else
                                                return Y.errors = [{ instancePath: t + "/expires_at", schemaPath: "#/properties/expires_at/type", keyword: "type", params: { type: "string" } }], !1;
                                        var s = p === e;
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
        return Y.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Y.errors = a, e === 0; }
Y.evaluated = { props: { order_id: !0, order_ref: !0, status: !0, quota_amount: !0, fiat_amount_minor: !0, currency: !0, checkout_hint: !0, expires_at: !0 }, dynamicProps: !1, dynamicItems: !1 };
function ze(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ze.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.items !== void 0) {
            let p = r.items, i = e;
            if (e === i)
                if (Array.isArray(p)) {
                    var s = !0;
                    let o = p.length;
                    for (let f = 0; f < o; f++) {
                        let y = e;
                        Y(p[f], { instancePath: t + "/items/" + f, parentData: p, parentDataProperty: f, rootData: l, dynamicAnchors: u }) || (a = a === null ? Y.errors : a.concat(Y.errors), e = a.length);
                        var s = y === e;
                        if (!s)
                            break;
                    }
                }
                else
                    return ze.errors = [{ instancePath: t + "/items", schemaPath: "#/properties/items/type", keyword: "type", params: { type: "array" } }], !1;
            var n = i === e;
        }
        else
            var n = !0;
        if (n)
            if (r.next_cursor !== void 0) {
                let p = e;
                if (typeof r.next_cursor != "string")
                    return ze.errors = [{ instancePath: t + "/next_cursor", schemaPath: "#/properties/next_cursor/type", keyword: "type", params: { type: "string" } }], !1;
                var n = p === e;
            }
            else
                var n = !0;
    }
    else
        return ze.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ze.errors = a, e === 0; }
ze.evaluated = { props: { items: !0, next_cursor: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Cr = ce;
function te(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = te.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.site_code === void 0 && (n = "site_code") || r.product_code === void 0 && (n = "product_code") || r.price_version === void 0 && (n = "price_version"))
            return te.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "site_code" || i === "product_code" || i === "price_version" || i === "expires_in_seconds")) {
                    return te.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.site_code !== void 0) {
                    let i = e;
                    if (typeof r.site_code != "string")
                        return te.errors = [{ instancePath: t + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = i === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.product_code !== void 0) {
                        let i = e;
                        if (typeof r.product_code != "string")
                            return te.errors = [{ instancePath: t + "/product_code", schemaPath: "#/properties/product_code/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = i === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.price_version !== void 0) {
                            let i = e;
                            if (typeof r.price_version != "string")
                                return te.errors = [{ instancePath: t + "/price_version", schemaPath: "#/properties/price_version/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.expires_in_seconds !== void 0) {
                                let i = r.expires_in_seconds, o = e;
                                if (!(typeof i == "number" && !(i % 1) && !isNaN(i) && isFinite(i)))
                                    return te.errors = [{ instancePath: t + "/expires_in_seconds", schemaPath: "#/properties/expires_in_seconds/type", keyword: "type", params: { type: "integer" } }], !1;
                                var s = o === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return te.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return te.errors = a, e === 0; }
te.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function ce(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ce.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return ce.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return ce.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return ce.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return ce.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return ce.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return ce.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                te(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? te.errors : a.concat(te.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return ce.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ce.errors = a, e === 0; }
ce.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Lr = H;
function H(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = H.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.order_id !== void 0) {
            let n = r.order_id, p = e;
            if (e === p && e === p)
                if (typeof n == "string") {
                    if (!M.test(n))
                        return H.errors = [{ instancePath: t + "/order_id", schemaPath: "#/properties/order_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                }
                else
                    return H.errors = [{ instancePath: t + "/order_id", schemaPath: "#/properties/order_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = p === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.order_ref !== void 0) {
                let n = e;
                if (typeof r.order_ref != "string")
                    return H.errors = [{ instancePath: t + "/order_ref", schemaPath: "#/properties/order_ref/type", keyword: "type", params: { type: "string" } }], !1;
                var s = n === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.status !== void 0) {
                    let n = r.status, p = e;
                    if (typeof n != "string")
                        return H.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "string" } }], !1;
                    if (!(n === "pending" || n === "paid" || n === "partial" || n === "expired" || n === "canceled" || n === "refunded" || n === "disputed"))
                        return H.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/enum", keyword: "enum", params: { allowedValues: ur.properties.status.enum } }], !1;
                    var s = p === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.quota_amount !== void 0) {
                        let n = e;
                        b(r.quota_amount, { instancePath: t + "/quota_amount", parentData: r, parentDataProperty: "quota_amount", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                        var s = n === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.fiat_amount_minor !== void 0) {
                            let n = e;
                            R(r.fiat_amount_minor, { instancePath: t + "/fiat_amount_minor", parentData: r, parentDataProperty: "fiat_amount_minor", rootData: l, dynamicAnchors: u }) || (a = a === null ? R.errors : a.concat(R.errors), e = a.length);
                            var s = n === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.currency !== void 0) {
                                let n = e;
                                if (typeof r.currency != "string")
                                    return H.errors = [{ instancePath: t + "/currency", schemaPath: "#/properties/currency/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = n === e;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (r.checkout_hint !== void 0) {
                                    let n = r.checkout_hint, p = e;
                                    if (e === p && !(n && typeof n == "object" && !Array.isArray(n)))
                                        return H.errors = [{ instancePath: t + "/checkout_hint", schemaPath: "#/properties/checkout_hint/type", keyword: "type", params: { type: "object" } }], !1;
                                    var s = p === e;
                                }
                                else
                                    var s = !0;
                                if (s)
                                    if (r.expires_at !== void 0) {
                                        let n = r.expires_at, p = e;
                                        if (e === p && e === p)
                                            if (typeof n == "string") {
                                                if (!Ge.validate(n))
                                                    return H.errors = [{ instancePath: t + "/expires_at", schemaPath: "#/properties/expires_at/format", keyword: "format", params: { format: "date-time" } }], !1;
                                            }
                                            else
                                                return H.errors = [{ instancePath: t + "/expires_at", schemaPath: "#/properties/expires_at/type", keyword: "type", params: { type: "string" } }], !1;
                                        var s = p === e;
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
        return H.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return H.errors = a, e === 0; }
H.evaluated = { props: { order_id: !0, order_ref: !0, status: !0, quota_amount: !0, fiat_amount_minor: !0, currency: !0, checkout_hint: !0, expires_at: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Ur = me;
function we(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = we.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.source_receipt_id === void 0 && (n = "source_receipt_id") || r.proof_jws === void 0 && (n = "proof_jws"))
            return we.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        if (r.source_receipt_id !== void 0) {
            let p = r.source_receipt_id, i = e;
            if (e === i && e === i)
                if (typeof p == "string") {
                    if (!M.test(p))
                        return we.errors = [{ instancePath: t + "/source_receipt_id", schemaPath: "#/properties/source_receipt_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                }
                else
                    return we.errors = [{ instancePath: t + "/source_receipt_id", schemaPath: "#/properties/source_receipt_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = i === e;
        }
        else
            var s = !0;
        if (s)
            if (r.proof_jws !== void 0) {
                let p = e;
                if (typeof r.proof_jws != "string")
                    return we.errors = [{ instancePath: t + "/proof_jws", schemaPath: "#/properties/proof_jws/type", keyword: "type", params: { type: "string" } }], !1;
                var s = p === e;
            }
            else
                var s = !0;
    }
    else
        return we.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return we.errors = a, e === 0; }
we.evaluated = { props: { source_receipt_id: !0, proof_jws: !0 }, dynamicProps: !1, dynamicItems: !1 };
function me(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = me.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return me.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return me.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return me.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return me.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return me.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return me.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                we(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? we.errors : a.concat(we.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return me.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return me.errors = a, e === 0; }
me.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Yr = Ne;
function Ne(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = Ne.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.inbox_id !== void 0) {
            let n = e;
            if (typeof r.inbox_id != "string")
                return Ne.errors = [{ instancePath: t + "/inbox_id", schemaPath: "#/properties/inbox_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = n === e;
        }
        else
            var s = !0;
        if (s)
            if (r.takeover_id !== void 0) {
                let n = e;
                if (typeof r.takeover_id != "string")
                    return Ne.errors = [{ instancePath: t + "/takeover_id", schemaPath: "#/properties/takeover_id/type", keyword: "type", params: { type: "string" } }], !1;
                var s = n === e;
            }
            else
                var s = !0;
    }
    else
        return Ne.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ne.errors = a, e === 0; }
Ne.evaluated = { props: { inbox_id: !0, takeover_id: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Br = X;
var yr = new RegExp("\\S", "u");
function Re(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = Re.evaluated; return d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0 && !(r && typeof r == "object" && !Array.isArray(r)) ? (Re.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1) : (Re.errors = a, e === 0); }
Re.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function W(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = W.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.provider_order_ref === void 0 && (p = "provider_order_ref"))
            return W.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let i = e;
            for (let o in r)
                if (!(o === "channel" || o === "environment" || o === "provider_order_ref" || o === "evidence")) {
                    return W.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (i === e) {
                if (r.channel !== void 0) {
                    let o = e;
                    if (typeof r.channel != "string")
                        return W.errors = [{ instancePath: t + "/channel", schemaPath: "#/properties/channel/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.environment !== void 0) {
                        let o = e;
                        if (typeof r.environment != "string")
                            return W.errors = [{ instancePath: t + "/environment", schemaPath: "#/properties/environment/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.provider_order_ref !== void 0) {
                            let o = r.provider_order_ref, f = e;
                            if (e === f)
                                if (typeof o == "string") {
                                    if (!yr.test(o))
                                        return W.errors = [{ instancePath: t + "/provider_order_ref", schemaPath: "#/properties/provider_order_ref/pattern", keyword: "pattern", params: { pattern: "\\S" } }], !1;
                                }
                                else
                                    return W.errors = [{ instancePath: t + "/provider_order_ref", schemaPath: "#/properties/provider_order_ref/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = f === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.evidence !== void 0) {
                                let o = r.evidence, f = e, y = e, m = !1, P = null, c = e;
                                Re(o, { instancePath: t + "/evidence", parentData: r, parentDataProperty: "evidence", rootData: l, dynamicAnchors: u }) || (a = a === null ? Re.errors : a.concat(Re.errors), e = a.length);
                                var n = c === e;
                                n && (m = !0, P = 0);
                                let g = e;
                                if (o !== null) {
                                    let k = { instancePath: t + "/evidence", schemaPath: "#/properties/evidence/oneOf/1/type", keyword: "type", params: { type: "null" } };
                                    a === null ? a = [k] : a.push(k), e++;
                                }
                                var n = g === e;
                                if (n && m ? (m = !1, P = [P, 1]) : n && (m = !0, P = 1), m)
                                    e = y, a !== null && (y ? a.length = y : a = null);
                                else {
                                    let k = { instancePath: t + "/evidence", schemaPath: "#/properties/evidence/oneOf", keyword: "oneOf", params: { passingSchemas: P } };
                                    return a === null ? a = [k] : a.push(k), e++, W.errors = a, !1;
                                }
                                var s = f === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return W.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return W.errors = a, e === 0; }
W.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Zr = new RegExp("^provider_order_ref$", "u");
function $e(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = $e.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.provider_order_ref === void 0 && (n = "provider_order_ref"))
            return $e.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        var s = !0;
        for (let p in r)
            if (Zr.test(p)) {
                let i = r[p], o = e;
                if (e === o)
                    if (typeof i == "string") {
                        if (!yr.test(i))
                            return $e.errors = [{ instancePath: t + "/" + p.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/patternProperties/%5Eprovider_order_ref%24/pattern", keyword: "pattern", params: { pattern: "\\S" } }], !1;
                    }
                    else
                        return $e.errors = [{ instancePath: t + "/" + p.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/patternProperties/%5Eprovider_order_ref%24/type", keyword: "type", params: { type: "string" } }], !1;
                var s = o === e;
                if (!s)
                    break;
            }
    }
    else
        return $e.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return $e.errors = a, e === 0; }
$e.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function de(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = de.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.evidence === void 0 && (n = "evidence"))
            return de.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "channel" || i === "environment" || i === "provider_order_ref" || i === "evidence")) {
                    return de.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.channel !== void 0) {
                    let i = e;
                    if (typeof r.channel != "string")
                        return de.errors = [{ instancePath: t + "/channel", schemaPath: "#/properties/channel/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = i === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.environment !== void 0) {
                        let i = e;
                        if (typeof r.environment != "string")
                            return de.errors = [{ instancePath: t + "/environment", schemaPath: "#/properties/environment/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = i === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.provider_order_ref !== void 0) {
                            let i = e;
                            if (typeof r.provider_order_ref != "string")
                                return de.errors = [{ instancePath: t + "/provider_order_ref", schemaPath: "#/properties/provider_order_ref/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.evidence !== void 0) {
                                let i = e;
                                $e(r.evidence, { instancePath: t + "/evidence", parentData: r, parentDataProperty: "evidence", rootData: l, dynamicAnchors: u }) || (a = a === null ? $e.errors : a.concat($e.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return de.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return de.errors = a, e === 0; }
de.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function Se(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = Se.evaluated; d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0); let s = e, n = !1, p = e; W(r, { instancePath: t, parentData: v, parentDataProperty: h, rootData: l, dynamicAnchors: u }) || (a = a === null ? W.errors : a.concat(W.errors), e = a.length); var f = p === e; if (n = n || f, f)
    var i = !0; let o = e; de(r, { instancePath: t, parentData: v, parentDataProperty: h, rootData: l, dynamicAnchors: u }) || (a = a === null ? de.errors : a.concat(de.errors), e = a.length); var f = o === e; if (n = n || f, f && i !== !0 && (i = !0), n)
    e = s, a !== null && (s ? a.length = s : a = null);
else {
    let y = { instancePath: t, schemaPath: "#/anyOf", keyword: "anyOf", params: {} };
    return a === null ? a = [y] : a.push(y), e++, Se.errors = a, !1;
} return Se.errors = a, d.props = i, e === 0; }
Se.evaluated = { dynamicProps: !0, dynamicItems: !1 };
function X(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = X.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return X.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return X.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return X.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return X.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return X.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return X.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = r.headers, o = e;
                            if (e === o)
                                if (i && typeof i == "object" && !Array.isArray(i))
                                    for (let y in i) {
                                        return X.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                        break;
                                    }
                                else
                                    return X.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var s = o === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                Se(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? Se.errors : a.concat(Se.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return X.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return X.errors = a, e === 0; }
X.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Hr = _e, Gr = { type: "object", additionalProperties: !1, properties: { matched: { type: "boolean", const: !0 }, action: { type: "string", enum: ["processed", "noop"] }, detail: { $ref: "#/components/schemas/PaymentReconcileDetail" } }, required: ["matched", "action", "detail"] };
function fe(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = fe.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.inbox_id === void 0 && (n = "inbox_id") || r.process_status === void 0 && (n = "process_status"))
            return fe.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "inbox_id" || i === "process_status")) {
                    return fe.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.inbox_id !== void 0) {
                    let i = r.inbox_id, o = e;
                    if (e === o && e === o)
                        if (typeof i == "string") {
                            if (!M.test(i))
                                return fe.errors = [{ instancePath: t + "/inbox_id", schemaPath: "#/properties/inbox_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                        }
                        else
                            return fe.errors = [{ instancePath: t + "/inbox_id", schemaPath: "#/properties/inbox_id/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s)
                    if (r.process_status !== void 0) {
                        let i = e;
                        if (typeof r.process_status != "string")
                            return fe.errors = [{ instancePath: t + "/process_status", schemaPath: "#/properties/process_status/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = i === e;
                    }
                    else
                        var s = !0;
            }
        }
    }
    else
        return fe.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return fe.errors = a, e === 0; }
fe.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function I(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = I.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let f;
        if (r.order_ref === void 0 && (f = "order_ref") || r.inbox_rows === void 0 && (f = "inbox_rows") || r.advanced_inbox_ids === void 0 && (f = "advanced_inbox_ids") || r.quarantined_inbox_ids === void 0 && (f = "quarantined_inbox_ids") || r.skipped_unbound_inbox_ids === void 0 && (f = "skipped_unbound_inbox_ids") || r.statuses === void 0 && (f = "statuses"))
            return I.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: f } }], !1;
        {
            let y = e;
            for (let m in r)
                if (!(m === "order_ref" || m === "inbox_rows" || m === "advanced_inbox_ids" || m === "quarantined_inbox_ids" || m === "skipped_unbound_inbox_ids" || m === "statuses")) {
                    return I.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                    break;
                }
            if (y === e) {
                if (r.order_ref !== void 0) {
                    let m = e;
                    if (typeof r.order_ref != "string")
                        return I.errors = [{ instancePath: t + "/order_ref", schemaPath: "#/properties/order_ref/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = m === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.inbox_rows !== void 0) {
                        let m = r.inbox_rows, P = e;
                        if (!(typeof m == "number" && !(m % 1) && !isNaN(m) && isFinite(m)))
                            return I.errors = [{ instancePath: t + "/inbox_rows", schemaPath: "#/properties/inbox_rows/type", keyword: "type", params: { type: "integer" } }], !1;
                        if (e === P && typeof m == "number" && isFinite(m) && (m < 0 || isNaN(m)))
                            return I.errors = [{ instancePath: t + "/inbox_rows", schemaPath: "#/properties/inbox_rows/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                        var s = P === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.advanced_inbox_ids !== void 0) {
                            let m = r.advanced_inbox_ids, P = e;
                            if (e === P)
                                if (Array.isArray(m)) {
                                    var n = !0;
                                    let g = m.length;
                                    for (let _ = 0; _ < g; _++) {
                                        let k = m[_], x = e;
                                        if (e === x && e === x)
                                            if (typeof k == "string") {
                                                if (!M.test(k))
                                                    return I.errors = [{ instancePath: t + "/advanced_inbox_ids/" + _, schemaPath: "#/properties/advanced_inbox_ids/items/format", keyword: "format", params: { format: "uuid" } }], !1;
                                            }
                                            else
                                                return I.errors = [{ instancePath: t + "/advanced_inbox_ids/" + _, schemaPath: "#/properties/advanced_inbox_ids/items/type", keyword: "type", params: { type: "string" } }], !1;
                                        var n = x === e;
                                        if (!n)
                                            break;
                                    }
                                }
                                else
                                    return I.errors = [{ instancePath: t + "/advanced_inbox_ids", schemaPath: "#/properties/advanced_inbox_ids/type", keyword: "type", params: { type: "array" } }], !1;
                            var s = P === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.quarantined_inbox_ids !== void 0) {
                                let m = r.quarantined_inbox_ids, P = e;
                                if (e === P)
                                    if (Array.isArray(m)) {
                                        var p = !0;
                                        let g = m.length;
                                        for (let _ = 0; _ < g; _++) {
                                            let k = m[_], x = e;
                                            if (e === x && e === x)
                                                if (typeof k == "string") {
                                                    if (!M.test(k))
                                                        return I.errors = [{ instancePath: t + "/quarantined_inbox_ids/" + _, schemaPath: "#/properties/quarantined_inbox_ids/items/format", keyword: "format", params: { format: "uuid" } }], !1;
                                                }
                                                else
                                                    return I.errors = [{ instancePath: t + "/quarantined_inbox_ids/" + _, schemaPath: "#/properties/quarantined_inbox_ids/items/type", keyword: "type", params: { type: "string" } }], !1;
                                            var p = x === e;
                                            if (!p)
                                                break;
                                        }
                                    }
                                    else
                                        return I.errors = [{ instancePath: t + "/quarantined_inbox_ids", schemaPath: "#/properties/quarantined_inbox_ids/type", keyword: "type", params: { type: "array" } }], !1;
                                var s = P === e;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (r.skipped_unbound_inbox_ids !== void 0) {
                                    let m = r.skipped_unbound_inbox_ids, P = e;
                                    if (e === P)
                                        if (Array.isArray(m)) {
                                            var i = !0;
                                            let g = m.length;
                                            for (let _ = 0; _ < g; _++) {
                                                let k = m[_], x = e;
                                                if (e === x && e === x)
                                                    if (typeof k == "string") {
                                                        if (!M.test(k))
                                                            return I.errors = [{ instancePath: t + "/skipped_unbound_inbox_ids/" + _, schemaPath: "#/properties/skipped_unbound_inbox_ids/items/format", keyword: "format", params: { format: "uuid" } }], !1;
                                                    }
                                                    else
                                                        return I.errors = [{ instancePath: t + "/skipped_unbound_inbox_ids/" + _, schemaPath: "#/properties/skipped_unbound_inbox_ids/items/type", keyword: "type", params: { type: "string" } }], !1;
                                                var i = x === e;
                                                if (!i)
                                                    break;
                                            }
                                        }
                                        else
                                            return I.errors = [{ instancePath: t + "/skipped_unbound_inbox_ids", schemaPath: "#/properties/skipped_unbound_inbox_ids/type", keyword: "type", params: { type: "array" } }], !1;
                                    var s = P === e;
                                }
                                else
                                    var s = !0;
                                if (s)
                                    if (r.statuses !== void 0) {
                                        let m = r.statuses, P = e;
                                        if (e === P)
                                            if (Array.isArray(m)) {
                                                var o = !0;
                                                let g = m.length;
                                                for (let _ = 0; _ < g; _++) {
                                                    let k = e;
                                                    fe(m[_], { instancePath: t + "/statuses/" + _, parentData: m, parentDataProperty: _, rootData: l, dynamicAnchors: u }) || (a = a === null ? fe.errors : a.concat(fe.errors), e = a.length);
                                                    var o = k === e;
                                                    if (!o)
                                                        break;
                                                }
                                            }
                                            else
                                                return I.errors = [{ instancePath: t + "/statuses", schemaPath: "#/properties/statuses/type", keyword: "type", params: { type: "array" } }], !1;
                                        var s = P === e;
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
        return I.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return I.errors = a, e === 0; }
I.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
function _e(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = _e.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.matched === void 0 && (n = "matched") || r.action === void 0 && (n = "action") || r.detail === void 0 && (n = "detail"))
            return _e.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "matched" || i === "action" || i === "detail")) {
                    return _e.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.matched !== void 0) {
                    let i = r.matched, o = e;
                    if (typeof i != "boolean")
                        return _e.errors = [{ instancePath: t + "/matched", schemaPath: "#/properties/matched/type", keyword: "type", params: { type: "boolean" } }], !1;
                    if (i !== !0)
                        return _e.errors = [{ instancePath: t + "/matched", schemaPath: "#/properties/matched/const", keyword: "const", params: { allowedValue: !0 } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.action !== void 0) {
                        let i = r.action, o = e;
                        if (typeof i != "string")
                            return _e.errors = [{ instancePath: t + "/action", schemaPath: "#/properties/action/type", keyword: "type", params: { type: "string" } }], !1;
                        if (!(i === "processed" || i === "noop"))
                            return _e.errors = [{ instancePath: t + "/action", schemaPath: "#/properties/action/enum", keyword: "enum", params: { allowedValues: Gr.properties.action.enum } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s)
                        if (r.detail !== void 0) {
                            let i = e;
                            I(r.detail, { instancePath: t + "/detail", parentData: r, parentDataProperty: "detail", rootData: l, dynamicAnchors: u }) || (a = a === null ? I.errors : a.concat(I.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                }
            }
        }
    }
    else
        return _e.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return _e.errors = a, e === 0; }
_e.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Qe = N;
function N(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = N.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.type === void 0 && (p = "type") || r.title === void 0 && (p = "title") || r.status === void 0 && (p = "status") || r.detail === void 0 && (p = "detail") || r.code === void 0 && (p = "code") || r.traceId === void 0 && (p = "traceId") || r.retryable === void 0 && (p = "retryable") || r.conflicts === void 0 && (p = "conflicts"))
            return N.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let i = e;
            for (let o in r)
                if (!(o === "type" || o === "title" || o === "status" || o === "detail" || o === "code" || o === "traceId" || o === "retryable" || o === "conflicts")) {
                    return N.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (i === e) {
                if (r.type !== void 0) {
                    let o = r.type, f = e;
                    if (typeof o != "string")
                        return N.errors = [{ instancePath: t + "/type", schemaPath: "#/properties/type/type", keyword: "type", params: { type: "string" } }], !1;
                    if (o !== "about:blank")
                        return N.errors = [{ instancePath: t + "/type", schemaPath: "#/properties/type/const", keyword: "const", params: { allowedValue: "about:blank" } }], !1;
                    var s = f === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.title !== void 0) {
                        let o = e;
                        if (typeof r.title != "string")
                            return N.errors = [{ instancePath: t + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.status !== void 0) {
                            let o = r.status, f = e;
                            if (!(typeof o == "number" && !(o % 1) && !isNaN(o) && isFinite(o)))
                                return N.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "integer" } }], !1;
                            if (e === f && typeof o == "number" && isFinite(o)) {
                                if (o > 599 || isNaN(o))
                                    return N.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/maximum", keyword: "maximum", params: { comparison: "<=", limit: 599 } }], !1;
                                if (o < 400 || isNaN(o))
                                    return N.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/minimum", keyword: "minimum", params: { comparison: ">=", limit: 400 } }], !1;
                            }
                            var s = f === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.detail !== void 0) {
                                let o = e;
                                if (typeof r.detail != "string")
                                    return N.errors = [{ instancePath: t + "/detail", schemaPath: "#/properties/detail/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = o === e;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (r.code !== void 0) {
                                    let o = e;
                                    if (typeof r.code != "string")
                                        return N.errors = [{ instancePath: t + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                                    var s = o === e;
                                }
                                else
                                    var s = !0;
                                if (s) {
                                    if (r.traceId !== void 0) {
                                        let o = e;
                                        if (typeof r.traceId != "string")
                                            return N.errors = [{ instancePath: t + "/traceId", schemaPath: "#/properties/traceId/type", keyword: "type", params: { type: "string" } }], !1;
                                        var s = o === e;
                                    }
                                    else
                                        var s = !0;
                                    if (s) {
                                        if (r.retryable !== void 0) {
                                            let o = e;
                                            if (typeof r.retryable != "boolean")
                                                return N.errors = [{ instancePath: t + "/retryable", schemaPath: "#/properties/retryable/type", keyword: "type", params: { type: "boolean" } }], !1;
                                            var s = o === e;
                                        }
                                        else
                                            var s = !0;
                                        if (s)
                                            if (r.conflicts !== void 0) {
                                                let o = r.conflicts, f = e;
                                                if (e === f)
                                                    if (Array.isArray(o)) {
                                                        var n = !0;
                                                        let m = o.length;
                                                        for (let P = 0; P < m; P++) {
                                                            let c = e;
                                                            if (typeof o[P] != "string")
                                                                return N.errors = [{ instancePath: t + "/conflicts/" + P, schemaPath: "#/properties/conflicts/items/type", keyword: "type", params: { type: "string" } }], !1;
                                                            var n = c === e;
                                                            if (!n)
                                                                break;
                                                        }
                                                    }
                                                    else
                                                        return N.errors = [{ instancePath: t + "/conflicts", schemaPath: "#/properties/conflicts/type", keyword: "type", params: { type: "array" } }], !1;
                                                var s = f === e;
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
    }
    else
        return N.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return N.errors = a, e === 0; }
N.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var A = F;
var Wr = pr.uri;
function F(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = F.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.type === void 0 && (p = "type") || r.title === void 0 && (p = "title") || r.status === void 0 && (p = "status") || r.code === void 0 && (p = "code"))
            return F.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.type !== void 0) {
            let i = r.type, o = e;
            if (e === o && e === o)
                if (typeof i == "string") {
                    if (!Wr(i))
                        return F.errors = [{ instancePath: t + "/type", schemaPath: "#/properties/type/format", keyword: "format", params: { format: "uri" } }], !1;
                }
                else
                    return F.errors = [{ instancePath: t + "/type", schemaPath: "#/properties/type/type", keyword: "type", params: { type: "string" } }], !1;
            var s = o === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.title !== void 0) {
                let i = e;
                if (typeof r.title != "string")
                    return F.errors = [{ instancePath: t + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" } }], !1;
                var s = i === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.status !== void 0) {
                    let i = r.status, o = e;
                    if (!(typeof i == "number" && !(i % 1) && !isNaN(i) && isFinite(i)))
                        return F.errors = [{ instancePath: t + "/status", schemaPath: "#/properties/status/type", keyword: "type", params: { type: "integer" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.detail !== void 0) {
                        let i = e;
                        if (typeof r.detail != "string")
                            return F.errors = [{ instancePath: t + "/detail", schemaPath: "#/properties/detail/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = i === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.instance !== void 0) {
                            let i = e;
                            if (typeof r.instance != "string")
                                return F.errors = [{ instancePath: t + "/instance", schemaPath: "#/properties/instance/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.code !== void 0) {
                                let i = e;
                                if (typeof r.code != "string")
                                    return F.errors = [{ instancePath: t + "/code", schemaPath: "#/properties/code/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = i === e;
                            }
                            else
                                var s = !0;
                            if (s) {
                                if (r.traceId !== void 0) {
                                    let i = e;
                                    if (typeof r.traceId != "string")
                                        return F.errors = [{ instancePath: t + "/traceId", schemaPath: "#/properties/traceId/type", keyword: "type", params: { type: "string" } }], !1;
                                    var s = i === e;
                                }
                                else
                                    var s = !0;
                                if (s) {
                                    if (r.retryable !== void 0) {
                                        let i = e;
                                        if (typeof r.retryable != "boolean")
                                            return F.errors = [{ instancePath: t + "/retryable", schemaPath: "#/properties/retryable/type", keyword: "type", params: { type: "boolean" } }], !1;
                                        var s = i === e;
                                    }
                                    else
                                        var s = !0;
                                    if (s)
                                        if (r.conflicts !== void 0) {
                                            let i = r.conflicts, o = e;
                                            if (e === o)
                                                if (Array.isArray(i)) {
                                                    var n = !0;
                                                    let y = i.length;
                                                    for (let m = 0; m < y; m++) {
                                                        let P = e;
                                                        if (typeof i[m] != "string")
                                                            return F.errors = [{ instancePath: t + "/conflicts/" + m, schemaPath: "#/properties/conflicts/items/type", keyword: "type", params: { type: "string" } }], !1;
                                                        var n = P === e;
                                                        if (!n)
                                                            break;
                                                    }
                                                }
                                                else
                                                    return F.errors = [{ instancePath: t + "/conflicts", schemaPath: "#/properties/conflicts/type", keyword: "type", params: { type: "array" } }], !1;
                                            var s = o === e;
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
        return F.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return F.errors = a, e === 0; }
F.evaluated = { props: { type: !0, title: !0, status: !0, detail: !0, instance: !0, code: !0, traceId: !0, retryable: !0, conflicts: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Kr = z, Xr = { type: "object", additionalProperties: !1, properties: { pathParams: { type: "object", additionalProperties: !1, required: [], properties: {} }, query: { type: "object", additionalProperties: !1, required: [], properties: {} }, headers: { $ref: "#/components/schemas/__SdkShared7" }, body: { type: "object", required: ["user_id", "site_code", "direction", "quota", "approval_ref"], properties: { user_id: { type: "string" }, site_code: { type: "string" }, direction: { type: "string", enum: ["credit", "debit"] }, quota: { $ref: "#/components/schemas/PosQuota" }, approval_ref: { type: "string" }, reason: { type: "string" }, evidence: { type: "object" } } } }, required: ["pathParams", "query", "headers", "body"] };
function z(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = z.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers") || r.body === void 0 && (p = "body"))
            return z.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let i = e;
            for (let o in r)
                if (!(o === "pathParams" || o === "query" || o === "headers" || o === "body")) {
                    return z.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (i === e) {
                if (r.pathParams !== void 0) {
                    let o = r.pathParams, f = e;
                    if (e === f)
                        if (o && typeof o == "object" && !Array.isArray(o))
                            for (let y in o) {
                                return z.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                break;
                            }
                        else
                            return z.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = f === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let o = r.query, f = e;
                        if (e === f)
                            if (o && typeof o == "object" && !Array.isArray(o))
                                for (let m in o) {
                                    return z.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                    break;
                                }
                            else
                                return z.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = f === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let o = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = o === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let o = r.body, f = e;
                                if (e === f)
                                    if (o && typeof o == "object" && !Array.isArray(o)) {
                                        let m;
                                        if (o.user_id === void 0 && (m = "user_id") || o.site_code === void 0 && (m = "site_code") || o.direction === void 0 && (m = "direction") || o.quota === void 0 && (m = "quota") || o.approval_ref === void 0 && (m = "approval_ref"))
                                            return z.errors = [{ instancePath: t + "/body", schemaPath: "#/properties/body/required", keyword: "required", params: { missingProperty: m } }], !1;
                                        if (o.user_id !== void 0) {
                                            let P = e;
                                            if (typeof o.user_id != "string")
                                                return z.errors = [{ instancePath: t + "/body/user_id", schemaPath: "#/properties/body/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                                            var n = P === e;
                                        }
                                        else
                                            var n = !0;
                                        if (n) {
                                            if (o.site_code !== void 0) {
                                                let P = e;
                                                if (typeof o.site_code != "string")
                                                    return z.errors = [{ instancePath: t + "/body/site_code", schemaPath: "#/properties/body/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                var n = P === e;
                                            }
                                            else
                                                var n = !0;
                                            if (n) {
                                                if (o.direction !== void 0) {
                                                    let P = o.direction, c = e;
                                                    if (typeof P != "string")
                                                        return z.errors = [{ instancePath: t + "/body/direction", schemaPath: "#/properties/body/properties/direction/type", keyword: "type", params: { type: "string" } }], !1;
                                                    if (!(P === "credit" || P === "debit"))
                                                        return z.errors = [{ instancePath: t + "/body/direction", schemaPath: "#/properties/body/properties/direction/enum", keyword: "enum", params: { allowedValues: Xr.properties.body.properties.direction.enum } }], !1;
                                                    var n = c === e;
                                                }
                                                else
                                                    var n = !0;
                                                if (n) {
                                                    if (o.quota !== void 0) {
                                                        let P = e;
                                                        $(o.quota, { instancePath: t + "/body/quota", parentData: o, parentDataProperty: "quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? $.errors : a.concat($.errors), e = a.length);
                                                        var n = P === e;
                                                    }
                                                    else
                                                        var n = !0;
                                                    if (n) {
                                                        if (o.approval_ref !== void 0) {
                                                            let P = e;
                                                            if (typeof o.approval_ref != "string")
                                                                return z.errors = [{ instancePath: t + "/body/approval_ref", schemaPath: "#/properties/body/properties/approval_ref/type", keyword: "type", params: { type: "string" } }], !1;
                                                            var n = P === e;
                                                        }
                                                        else
                                                            var n = !0;
                                                        if (n) {
                                                            if (o.reason !== void 0) {
                                                                let P = e;
                                                                if (typeof o.reason != "string")
                                                                    return z.errors = [{ instancePath: t + "/body/reason", schemaPath: "#/properties/body/properties/reason/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var n = P === e;
                                                            }
                                                            else
                                                                var n = !0;
                                                            if (n)
                                                                if (o.evidence !== void 0) {
                                                                    let P = o.evidence, c = e;
                                                                    if (!(P && typeof P == "object" && !Array.isArray(P)))
                                                                        return z.errors = [{ instancePath: t + "/body/evidence", schemaPath: "#/properties/body/properties/evidence/type", keyword: "type", params: { type: "object" } }], !1;
                                                                    var n = c === e;
                                                                }
                                                                else
                                                                    var n = !0;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else
                                        return z.errors = [{ instancePath: t + "/body", schemaPath: "#/properties/body/type", keyword: "type", params: { type: "object" } }], !1;
                                var s = f === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return z.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return z.errors = a, e === 0; }
z.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Ce = J;
function De(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = De.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        if (r.idempotent_replay !== void 0 && typeof r.idempotent_replay != "boolean")
            return De.errors = [{ instancePath: t + "/idempotent_replay", schemaPath: "#/properties/idempotent_replay/type", keyword: "type", params: { type: "boolean" } }], !1;
    }
    else
        return De.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return De.errors = a, e === 0; }
De.evaluated = { props: { idempotent_replay: !0 }, dynamicProps: !1, dynamicItems: !1 };
function J(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = J.evaluated; d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0); let s = e; De(r, { instancePath: t, parentData: v, parentDataProperty: h, rootData: l, dynamicAnchors: u }) || (a = a === null ? De.errors : a.concat(De.errors), e = a.length); var n = s === e; if (n) {
    let i = e;
    if (e === i)
        if (r && typeof r == "object" && !Array.isArray(r)) {
            if (r.journal_id !== void 0) {
                let f = r.journal_id, y = e;
                if (e === y && e === y)
                    if (typeof f == "string") {
                        if (!M.test(f))
                            return J.errors = [{ instancePath: t + "/journal_id", schemaPath: "#/allOf/1/properties/journal_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                    }
                    else
                        return J.errors = [{ instancePath: t + "/journal_id", schemaPath: "#/allOf/1/properties/journal_id/type", keyword: "type", params: { type: "string" } }], !1;
                var p = y === e;
            }
            else
                var p = !0;
            if (p) {
                if (r.refund_of !== void 0) {
                    let f = r.refund_of, y = e;
                    if (e === y && e === y)
                        if (typeof f == "string") {
                            if (!M.test(f))
                                return J.errors = [{ instancePath: t + "/refund_of", schemaPath: "#/allOf/1/properties/refund_of/format", keyword: "format", params: { format: "uuid" } }], !1;
                        }
                        else
                            return J.errors = [{ instancePath: t + "/refund_of", schemaPath: "#/allOf/1/properties/refund_of/type", keyword: "type", params: { type: "string" } }], !1;
                    var p = y === e;
                }
                else
                    var p = !0;
                if (p) {
                    if (r.reversal_of !== void 0) {
                        let f = r.reversal_of, y = e;
                        if (e === y && e === y)
                            if (typeof f == "string") {
                                if (!M.test(f))
                                    return J.errors = [{ instancePath: t + "/reversal_of", schemaPath: "#/allOf/1/properties/reversal_of/format", keyword: "format", params: { format: "uuid" } }], !1;
                            }
                            else
                                return J.errors = [{ instancePath: t + "/reversal_of", schemaPath: "#/allOf/1/properties/reversal_of/type", keyword: "type", params: { type: "string" } }], !1;
                        var p = y === e;
                    }
                    else
                        var p = !0;
                    if (p) {
                        if (r.reversed_biz_category !== void 0) {
                            let f = e;
                            if (typeof r.reversed_biz_category != "string")
                                return J.errors = [{ instancePath: t + "/reversed_biz_category", schemaPath: "#/allOf/1/properties/reversed_biz_category/type", keyword: "type", params: { type: "string" } }], !1;
                            var p = f === e;
                        }
                        else
                            var p = !0;
                        if (p) {
                            if (r.user_id !== void 0) {
                                let f = e;
                                if (typeof r.user_id != "string")
                                    return J.errors = [{ instancePath: t + "/user_id", schemaPath: "#/allOf/1/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                                var p = f === e;
                            }
                            else
                                var p = !0;
                            if (p) {
                                if (r.refunded_quota !== void 0) {
                                    let f = e;
                                    b(r.refunded_quota, { instancePath: t + "/refunded_quota", parentData: r, parentDataProperty: "refunded_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                    var p = f === e;
                                }
                                else
                                    var p = !0;
                                if (p) {
                                    if (r.original_creditable_quota !== void 0) {
                                        let f = e;
                                        b(r.original_creditable_quota, { instancePath: t + "/original_creditable_quota", parentData: r, parentDataProperty: "original_creditable_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                        var p = f === e;
                                    }
                                    else
                                        var p = !0;
                                    if (p) {
                                        if (r.refunded_total_quota !== void 0) {
                                            let f = e;
                                            b(r.refunded_total_quota, { instancePath: t + "/refunded_total_quota", parentData: r, parentDataProperty: "refunded_total_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                            var p = f === e;
                                        }
                                        else
                                            var p = !0;
                                        if (p) {
                                            if (r.remaining_refundable_quota !== void 0) {
                                                let f = e;
                                                b(r.remaining_refundable_quota, { instancePath: t + "/remaining_refundable_quota", parentData: r, parentDataProperty: "remaining_refundable_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                                var p = f === e;
                                            }
                                            else
                                                var p = !0;
                                            if (p) {
                                                if (r.chargeback_quota !== void 0) {
                                                    let f = e;
                                                    b(r.chargeback_quota, { instancePath: t + "/chargeback_quota", parentData: r, parentDataProperty: "chargeback_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                                    var p = f === e;
                                                }
                                                else
                                                    var p = !0;
                                                if (p) {
                                                    if (r.debited_quota !== void 0) {
                                                        let f = e;
                                                        b(r.debited_quota, { instancePath: t + "/debited_quota", parentData: r, parentDataProperty: "debited_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                                        var p = f === e;
                                                    }
                                                    else
                                                        var p = !0;
                                                    if (p) {
                                                        if (r.covered_from_available_quota !== void 0) {
                                                            let f = e;
                                                            b(r.covered_from_available_quota, { instancePath: t + "/covered_from_available_quota", parentData: r, parentDataProperty: "covered_from_available_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                                            var p = f === e;
                                                        }
                                                        else
                                                            var p = !0;
                                                        if (p)
                                                            if (r.overdraft_receivable_quota !== void 0) {
                                                                let f = e;
                                                                b(r.overdraft_receivable_quota, { instancePath: t + "/overdraft_receivable_quota", parentData: r, parentDataProperty: "overdraft_receivable_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                                                var p = f === e;
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
                }
            }
        }
        else
            return J.errors = [{ instancePath: t, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "object" } }], !1;
    var n = i === e;
} return J.errors = a, e === 0; }
J.evaluated = { props: { journal_id: !0, refund_of: !0, reversal_of: !0, reversed_biz_category: !0, user_id: !0, refunded_quota: !0, original_creditable_quota: !0, refunded_total_quota: !0, remaining_refundable_quota: !0, chargeback_quota: !0, debited_quota: !0, covered_from_available_quota: !0, overdraft_receivable_quota: !0, idempotent_replay: !0 }, dynamicProps: !1, dynamicItems: !1 };
var Jr = V;
function V(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = V.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.pathParams === void 0 && (p = "pathParams") || r.query === void 0 && (p = "query") || r.headers === void 0 && (p = "headers"))
            return V.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        {
            let i = e;
            for (let o in r)
                if (!(o === "pathParams" || o === "query" || o === "headers")) {
                    return V.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: o } }], !1;
                    break;
                }
            if (i === e) {
                if (r.pathParams !== void 0) {
                    let o = r.pathParams, f = e;
                    if (e === f)
                        if (o && typeof o == "object" && !Array.isArray(o))
                            for (let y in o) {
                                return V.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                break;
                            }
                        else
                            return V.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = f === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let o = r.query, f = e;
                        if (e === f)
                            if (o && typeof o == "object" && !Array.isArray(o)) {
                                let m;
                                if (o.user_id === void 0 && (m = "user_id") || o.site_code === void 0 && (m = "site_code"))
                                    return V.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/required", keyword: "required", params: { missingProperty: m } }], !1;
                                {
                                    let P = e;
                                    for (let c in o)
                                        if (!(c === "user_id" || c === "site_code")) {
                                            return V.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: c } }], !1;
                                            break;
                                        }
                                    if (P === e) {
                                        if (o.user_id !== void 0) {
                                            let c = e;
                                            if (typeof o.user_id != "string")
                                                return V.errors = [{ instancePath: t + "/query/user_id", schemaPath: "#/properties/query/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                                            var n = c === e;
                                        }
                                        else
                                            var n = !0;
                                        if (n)
                                            if (o.site_code !== void 0) {
                                                let c = e;
                                                if (typeof o.site_code != "string")
                                                    return V.errors = [{ instancePath: t + "/query/site_code", schemaPath: "#/properties/query/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                var n = c === e;
                                            }
                                            else
                                                var n = !0;
                                    }
                                }
                            }
                            else
                                return V.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = f === e;
                    }
                    else
                        var s = !0;
                    if (s)
                        if (r.headers !== void 0) {
                            let o = r.headers, f = e;
                            if (e === f)
                                if (o && typeof o == "object" && !Array.isArray(o))
                                    for (let m in o) {
                                        return V.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                else
                                    return V.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var s = f === e;
                        }
                        else
                            var s = !0;
                }
            }
        }
    }
    else
        return V.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return V.errors = a, e === 0; }
V.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var et = Ie;
function Ie(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = Ie.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.user_id === void 0 && (n = "user_id") || r.available_quota === void 0 && (n = "available_quota") || r.held_quota === void 0 && (n = "held_quota"))
            return Ie.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        if (r.user_id !== void 0) {
            let p = e;
            if (typeof r.user_id != "string")
                return Ie.errors = [{ instancePath: t + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = p === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.available_quota !== void 0) {
                let p = e;
                b(r.available_quota, { instancePath: t + "/available_quota", parentData: r, parentDataProperty: "available_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                var s = p === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.held_quota !== void 0) {
                    let p = e;
                    b(r.held_quota, { instancePath: t + "/held_quota", parentData: r, parentDataProperty: "held_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                    var s = p === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.receivable_quota !== void 0) {
                        let p = e;
                        b(r.receivable_quota, { instancePath: t + "/receivable_quota", parentData: r, parentDataProperty: "receivable_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                        var s = p === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.isolated !== void 0) {
                            let p = e;
                            if (typeof r.isolated != "boolean")
                                return Ie.errors = [{ instancePath: t + "/isolated", schemaPath: "#/properties/isolated/type", keyword: "type", params: { type: "boolean" } }], !1;
                            var s = p === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.epoch !== void 0) {
                                let p = e;
                                if (typeof r.epoch != "string")
                                    return Ie.errors = [{ instancePath: t + "/epoch", schemaPath: "#/properties/epoch/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = p === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return Ie.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Ie.errors = a, e === 0; }
Ie.evaluated = { props: { user_id: !0, available_quota: !0, held_quota: !0, receivable_quota: !0, isolated: !0, epoch: !0 }, dynamicProps: !1, dynamicItems: !1 };
var rt = he;
function se(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = se.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.user_id === void 0 && (n = "user_id") || r.site_code === void 0 && (n = "site_code") || r.chargeback_quota === void 0 && (n = "chargeback_quota") || r.approval_ref === void 0 && (n = "approval_ref"))
            return se.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        if (r.user_id !== void 0) {
            let p = e;
            if (typeof r.user_id != "string")
                return se.errors = [{ instancePath: t + "/user_id", schemaPath: "#/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = p === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.site_code !== void 0) {
                let p = e;
                if (typeof r.site_code != "string")
                    return se.errors = [{ instancePath: t + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                var s = p === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.chargeback_quota !== void 0) {
                    let p = e;
                    $(r.chargeback_quota, { instancePath: t + "/chargeback_quota", parentData: r, parentDataProperty: "chargeback_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? $.errors : a.concat($.errors), e = a.length);
                    var s = p === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.reason !== void 0) {
                        let p = e;
                        if (typeof r.reason != "string")
                            return se.errors = [{ instancePath: t + "/reason", schemaPath: "#/properties/reason/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = p === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.approval_ref !== void 0) {
                            let p = e;
                            if (typeof r.approval_ref != "string")
                                return se.errors = [{ instancePath: t + "/approval_ref", schemaPath: "#/properties/approval_ref/type", keyword: "type", params: { type: "string" } }], !1;
                            var s = p === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.evidence !== void 0) {
                                let p = r.evidence, i = e;
                                if (!(p && typeof p == "object" && !Array.isArray(p)))
                                    return se.errors = [{ instancePath: t + "/evidence", schemaPath: "#/properties/evidence/type", keyword: "type", params: { type: "object" } }], !1;
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return se.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return se.errors = a, e === 0; }
se.evaluated = { props: { user_id: !0, site_code: !0, chargeback_quota: !0, reason: !0, approval_ref: !0, evidence: !0 }, dynamicProps: !1, dynamicItems: !1 };
function he(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = he.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return he.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return he.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return he.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return he.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return he.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return he.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                se(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? se.errors : a.concat(se.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return he.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return he.errors = a, e === 0; }
he.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var tt = ve;
var st = new RegExp("^(0|[1-9][0-9]{0,18})$", "u");
function Z(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = Z.evaluated; d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0); let s = e; if (e === s)
    if (typeof r == "string") {
        if (!st.test(r))
            return Z.errors = [{ instancePath: t, schemaPath: "#/allOf/0/pattern", keyword: "pattern", params: { pattern: "^(0|[1-9][0-9]{0,18})$" } }], !1;
    }
    else
        return Z.errors = [{ instancePath: t, schemaPath: "#/allOf/0/type", keyword: "type", params: { type: "string" } }], !1; var n = s === e; if (n) {
    let p = e;
    if (e === p)
        if (typeof r == "string") {
            if (!Ve.test(r))
                return Z.errors = [{ instancePath: t, schemaPath: "#/allOf/1/pattern", keyword: "pattern", params: { pattern: "^(?!-0$)(?:(?:[0-9]{1,18}|9223372036854775807|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-6])|-(?:[0-9]{1,18}|9223372036854775808|[0-8][0-9]{18}|9[0-1][0-9]{17}|92[0-1][0-9]{16}|922[0-2][0-9]{15}|9223[0-2][0-9]{14}|92233[0-6][0-9]{13}|922337[0-1][0-9]{12}|92233720[0-2][0-9]{10}|922337203[0-5][0-9]{9}|9223372036[0-7][0-9]{8}|92233720368[0-4][0-9]{7}|922337203685[0-3][0-9]{6}|9223372036854[0-6][0-9]{5}|92233720368547[0-6][0-9]{4}|922337203685477[0-4][0-9]{3}|9223372036854775[0-7][0-9]{2}|922337203685477580[0-7]))$" } }], !1;
        }
        else
            return Z.errors = [{ instancePath: t, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "string" } }], !1;
    var n = p === e;
} return Z.errors = a, e === 0; }
Z.evaluated = { dynamicProps: !1, dynamicItems: !1 };
function ae(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ae.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.reservation_id === void 0 && (n = "reservation_id") || r.target_total_units === void 0 && (n = "target_total_units") || r.price_version === void 0 && (n = "price_version"))
            return ae.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        if (r.reservation_id !== void 0) {
            let p = r.reservation_id, i = e;
            if (e === i && e === i)
                if (typeof p == "string") {
                    if (!M.test(p))
                        return ae.errors = [{ instancePath: t + "/reservation_id", schemaPath: "#/properties/reservation_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                }
                else
                    return ae.errors = [{ instancePath: t + "/reservation_id", schemaPath: "#/properties/reservation_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = i === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.target_total_units !== void 0) {
                let p = e;
                Z(r.target_total_units, { instancePath: t + "/target_total_units", parentData: r, parentDataProperty: "target_total_units", rootData: l, dynamicAnchors: u }) || (a = a === null ? Z.errors : a.concat(Z.errors), e = a.length);
                var s = p === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.price_version !== void 0) {
                    let p = e;
                    if (typeof r.price_version != "string")
                        return ae.errors = [{ instancePath: t + "/price_version", schemaPath: "#/properties/price_version/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = p === e;
                }
                else
                    var s = !0;
                if (s)
                    if (r.ttl_seconds !== void 0) {
                        let p = r.ttl_seconds, i = e;
                        if (!(typeof p == "number" && !(p % 1) && !isNaN(p) && isFinite(p)))
                            return ae.errors = [{ instancePath: t + "/ttl_seconds", schemaPath: "#/properties/ttl_seconds/type", keyword: "type", params: { type: "integer" } }], !1;
                        if (e === i && typeof p == "number" && isFinite(p) && (p < 0 || isNaN(p)))
                            return ae.errors = [{ instancePath: t + "/ttl_seconds", schemaPath: "#/properties/ttl_seconds/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 } }], !1;
                        var s = i === e;
                    }
                    else
                        var s = !0;
            }
        }
    }
    else
        return ae.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ae.errors = a, e === 0; }
ae.evaluated = { props: { reservation_id: !0, target_total_units: !0, price_version: !0, ttl_seconds: !0 }, dynamicProps: !1, dynamicItems: !1 };
function ve(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ve.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return ve.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return ve.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return ve.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return ve.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return ve.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return ve.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                ae(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? ae.errors : a.concat(ae.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return ve.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ve.errors = a, e === 0; }
ve.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var Me = pe, at = { allOf: [{ $ref: "#/components/schemas/IdempotentResult" }, { type: "object", properties: { reservation_id: { type: "string", format: "uuid" }, state: { type: "string", enum: ["open", "settled", "released", "quarantined", "expired"] }, held_quota: { $ref: "#/components/schemas/Quota" }, target_total_units: { $ref: "#/components/schemas/Quota" }, approved_total_units: { $ref: "#/components/schemas/Quota" }, fixed_fee_quota: { $ref: "#/components/schemas/Quota" }, price_version: { type: "string" }, expires_at: { type: "string", format: "date-time" } } }] };
function pe(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = pe.evaluated; d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0); let s = e; De(r, { instancePath: t, parentData: v, parentDataProperty: h, rootData: l, dynamicAnchors: u }) || (a = a === null ? De.errors : a.concat(De.errors), e = a.length); var n = s === e; if (n) {
    let i = e;
    if (e === i)
        if (r && typeof r == "object" && !Array.isArray(r)) {
            if (r.reservation_id !== void 0) {
                let f = r.reservation_id, y = e;
                if (e === y && e === y)
                    if (typeof f == "string") {
                        if (!M.test(f))
                            return pe.errors = [{ instancePath: t + "/reservation_id", schemaPath: "#/allOf/1/properties/reservation_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                    }
                    else
                        return pe.errors = [{ instancePath: t + "/reservation_id", schemaPath: "#/allOf/1/properties/reservation_id/type", keyword: "type", params: { type: "string" } }], !1;
                var p = y === e;
            }
            else
                var p = !0;
            if (p) {
                if (r.state !== void 0) {
                    let f = r.state, y = e;
                    if (typeof f != "string")
                        return pe.errors = [{ instancePath: t + "/state", schemaPath: "#/allOf/1/properties/state/type", keyword: "type", params: { type: "string" } }], !1;
                    if (!(f === "open" || f === "settled" || f === "released" || f === "quarantined" || f === "expired"))
                        return pe.errors = [{ instancePath: t + "/state", schemaPath: "#/allOf/1/properties/state/enum", keyword: "enum", params: { allowedValues: at.allOf[1].properties.state.enum } }], !1;
                    var p = y === e;
                }
                else
                    var p = !0;
                if (p) {
                    if (r.held_quota !== void 0) {
                        let f = e;
                        b(r.held_quota, { instancePath: t + "/held_quota", parentData: r, parentDataProperty: "held_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                        var p = f === e;
                    }
                    else
                        var p = !0;
                    if (p) {
                        if (r.target_total_units !== void 0) {
                            let f = e;
                            b(r.target_total_units, { instancePath: t + "/target_total_units", parentData: r, parentDataProperty: "target_total_units", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                            var p = f === e;
                        }
                        else
                            var p = !0;
                        if (p) {
                            if (r.approved_total_units !== void 0) {
                                let f = e;
                                b(r.approved_total_units, { instancePath: t + "/approved_total_units", parentData: r, parentDataProperty: "approved_total_units", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                var p = f === e;
                            }
                            else
                                var p = !0;
                            if (p) {
                                if (r.fixed_fee_quota !== void 0) {
                                    let f = e;
                                    b(r.fixed_fee_quota, { instancePath: t + "/fixed_fee_quota", parentData: r, parentDataProperty: "fixed_fee_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                    var p = f === e;
                                }
                                else
                                    var p = !0;
                                if (p) {
                                    if (r.price_version !== void 0) {
                                        let f = e;
                                        if (typeof r.price_version != "string")
                                            return pe.errors = [{ instancePath: t + "/price_version", schemaPath: "#/allOf/1/properties/price_version/type", keyword: "type", params: { type: "string" } }], !1;
                                        var p = f === e;
                                    }
                                    else
                                        var p = !0;
                                    if (p)
                                        if (r.expires_at !== void 0) {
                                            let f = r.expires_at, y = e;
                                            if (e === y && e === y)
                                                if (typeof f == "string") {
                                                    if (!Ge.validate(f))
                                                        return pe.errors = [{ instancePath: t + "/expires_at", schemaPath: "#/allOf/1/properties/expires_at/format", keyword: "format", params: { format: "date-time" } }], !1;
                                                }
                                                else
                                                    return pe.errors = [{ instancePath: t + "/expires_at", schemaPath: "#/allOf/1/properties/expires_at/type", keyword: "type", params: { type: "string" } }], !1;
                                            var p = y === e;
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
        else
            return pe.errors = [{ instancePath: t, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "object" } }], !1;
    var n = i === e;
} return pe.errors = a, e === 0; }
pe.evaluated = { props: { reservation_id: !0, state: !0, held_quota: !0, target_total_units: !0, approved_total_units: !0, fixed_fee_quota: !0, price_version: !0, expires_at: !0, idempotent_replay: !0 }, dynamicProps: !1, dynamicItems: !1 };
var it = C;
function C(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = C.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers"))
            return C.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers")) {
                    return C.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return C.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return C.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i)) {
                                let y = e;
                                for (let m in i)
                                    if (m !== "limit") {
                                        return C.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                if (y === e && i.limit !== void 0) {
                                    let m = i.limit, P = e;
                                    if (!(typeof m == "number" && !(m % 1) && !isNaN(m) && isFinite(m)))
                                        return C.errors = [{ instancePath: t + "/query/limit", schemaPath: "#/properties/query/properties/limit/type", keyword: "type", params: { type: "integer" } }], !1;
                                    if (e === P && typeof m == "number" && isFinite(m)) {
                                        if (m > 100 || isNaN(m))
                                            return C.errors = [{ instancePath: t + "/query/limit", schemaPath: "#/properties/query/properties/limit/maximum", keyword: "maximum", params: { comparison: "<=", limit: 100 } }], !1;
                                        if (m < 1 || isNaN(m))
                                            return C.errors = [{ instancePath: t + "/query/limit", schemaPath: "#/properties/query/properties/limit/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 } }], !1;
                                    }
                                }
                            }
                            else
                                return C.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s)
                        if (r.headers !== void 0) {
                            let i = r.headers, o = e;
                            if (e === o)
                                if (i && typeof i == "object" && !Array.isArray(i))
                                    for (let y in i) {
                                        return C.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                        break;
                                    }
                                else
                                    return C.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var s = o === e;
                        }
                        else
                            var s = !0;
                }
            }
        }
    }
    else
        return C.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return C.errors = a, e === 0; }
C.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ot = T;
function T(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = T.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let f;
        if (r.differences === void 0 && (f = "differences") || r.receivables === void 0 && (f = "receivables"))
            return T.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: f } }], !1;
        if (r.accounts_total_quota !== void 0) {
            let y = e;
            b(r.accounts_total_quota, { instancePath: t + "/accounts_total_quota", parentData: r, parentDataProperty: "accounts_total_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
            var s = y === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.journal_legs_total_quota !== void 0) {
                let y = e;
                b(r.journal_legs_total_quota, { instancePath: t + "/journal_legs_total_quota", parentData: r, parentDataProperty: "journal_legs_total_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                var s = y === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.total_difference_quota !== void 0) {
                    let y = e;
                    b(r.total_difference_quota, { instancePath: t + "/total_difference_quota", parentData: r, parentDataProperty: "total_difference_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                    var s = y === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.difference_account_count !== void 0) {
                        let y = e;
                        b(r.difference_account_count, { instancePath: t + "/difference_account_count", parentData: r, parentDataProperty: "difference_account_count", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                        var s = y === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.receivable_total_quota !== void 0) {
                            let y = e;
                            b(r.receivable_total_quota, { instancePath: t + "/receivable_total_quota", parentData: r, parentDataProperty: "receivable_total_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                            var s = y === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.differences !== void 0) {
                                let y = r.differences, m = e;
                                if (e === m)
                                    if (Array.isArray(y)) {
                                        var n = !0;
                                        let c = y.length;
                                        for (let g = 0; g < c; g++) {
                                            let _ = y[g], k = e;
                                            if (e === k)
                                                if (_ && typeof _ == "object" && !Array.isArray(_)) {
                                                    if (_.account_code !== void 0) {
                                                        let j = e;
                                                        if (typeof _.account_code != "string")
                                                            return T.errors = [{ instancePath: t + "/differences/" + g + "/account_code", schemaPath: "#/properties/differences/items/properties/account_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                        var p = j === e;
                                                    }
                                                    else
                                                        var p = !0;
                                                    if (p) {
                                                        if (_.account_kind !== void 0) {
                                                            let j = e;
                                                            if (typeof _.account_kind != "string")
                                                                return T.errors = [{ instancePath: t + "/differences/" + g + "/account_kind", schemaPath: "#/properties/differences/items/properties/account_kind/type", keyword: "type", params: { type: "string" } }], !1;
                                                            var p = j === e;
                                                        }
                                                        else
                                                            var p = !0;
                                                        if (p) {
                                                            if (_.user_id !== void 0) {
                                                                let j = e;
                                                                if (typeof _.user_id != "string")
                                                                    return T.errors = [{ instancePath: t + "/differences/" + g + "/user_id", schemaPath: "#/properties/differences/items/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var p = j === e;
                                                            }
                                                            else
                                                                var p = !0;
                                                            if (p) {
                                                                if (_.site_code !== void 0) {
                                                                    let j = e;
                                                                    if (typeof _.site_code != "string")
                                                                        return T.errors = [{ instancePath: t + "/differences/" + g + "/site_code", schemaPath: "#/properties/differences/items/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                                    var p = j === e;
                                                                }
                                                                else
                                                                    var p = !0;
                                                                if (p) {
                                                                    if (_.balance_quota !== void 0) {
                                                                        let j = e;
                                                                        b(_.balance_quota, { instancePath: t + "/differences/" + g + "/balance_quota", parentData: _, parentDataProperty: "balance_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                                                        var p = j === e;
                                                                    }
                                                                    else
                                                                        var p = !0;
                                                                    if (p) {
                                                                        if (_.journal_legs_quota !== void 0) {
                                                                            let j = e;
                                                                            b(_.journal_legs_quota, { instancePath: t + "/differences/" + g + "/journal_legs_quota", parentData: _, parentDataProperty: "journal_legs_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                                                            var p = j === e;
                                                                        }
                                                                        else
                                                                            var p = !0;
                                                                        if (p)
                                                                            if (_.difference_quota !== void 0) {
                                                                                let j = e;
                                                                                b(_.difference_quota, { instancePath: t + "/differences/" + g + "/difference_quota", parentData: _, parentDataProperty: "difference_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                                                                var p = j === e;
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
                                                    return T.errors = [{ instancePath: t + "/differences/" + g, schemaPath: "#/properties/differences/items/type", keyword: "type", params: { type: "object" } }], !1;
                                            var n = k === e;
                                            if (!n)
                                                break;
                                        }
                                    }
                                    else
                                        return T.errors = [{ instancePath: t + "/differences", schemaPath: "#/properties/differences/type", keyword: "type", params: { type: "array" } }], !1;
                                var s = m === e;
                            }
                            else
                                var s = !0;
                            if (s)
                                if (r.receivables !== void 0) {
                                    let y = r.receivables, m = e;
                                    if (e === m)
                                        if (Array.isArray(y)) {
                                            var i = !0;
                                            let c = y.length;
                                            for (let g = 0; g < c; g++) {
                                                let _ = y[g], k = e;
                                                if (e === k)
                                                    if (_ && typeof _ == "object" && !Array.isArray(_)) {
                                                        if (_.account_code !== void 0) {
                                                            let j = e;
                                                            if (typeof _.account_code != "string")
                                                                return T.errors = [{ instancePath: t + "/receivables/" + g + "/account_code", schemaPath: "#/properties/receivables/items/properties/account_code/type", keyword: "type", params: { type: "string" } }], !1;
                                                            var o = j === e;
                                                        }
                                                        else
                                                            var o = !0;
                                                        if (o) {
                                                            if (_.user_id !== void 0) {
                                                                let j = e;
                                                                if (typeof _.user_id != "string")
                                                                    return T.errors = [{ instancePath: t + "/receivables/" + g + "/user_id", schemaPath: "#/properties/receivables/items/properties/user_id/type", keyword: "type", params: { type: "string" } }], !1;
                                                                var o = j === e;
                                                            }
                                                            else
                                                                var o = !0;
                                                            if (o) {
                                                                if (_.receivable_quota !== void 0) {
                                                                    let j = e;
                                                                    b(_.receivable_quota, { instancePath: t + "/receivables/" + g + "/receivable_quota", parentData: _, parentDataProperty: "receivable_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? b.errors : a.concat(b.errors), e = a.length);
                                                                    var o = j === e;
                                                                }
                                                                else
                                                                    var o = !0;
                                                                if (o)
                                                                    if (_.quarantined !== void 0) {
                                                                        let j = e;
                                                                        if (typeof _.quarantined != "boolean")
                                                                            return T.errors = [{ instancePath: t + "/receivables/" + g + "/quarantined", schemaPath: "#/properties/receivables/items/properties/quarantined/type", keyword: "type", params: { type: "boolean" } }], !1;
                                                                        var o = j === e;
                                                                    }
                                                                    else
                                                                        var o = !0;
                                                            }
                                                        }
                                                    }
                                                    else
                                                        return T.errors = [{ instancePath: t + "/receivables/" + g, schemaPath: "#/properties/receivables/items/type", keyword: "type", params: { type: "object" } }], !1;
                                                var i = k === e;
                                                if (!i)
                                                    break;
                                            }
                                        }
                                        else
                                            return T.errors = [{ instancePath: t + "/receivables", schemaPath: "#/properties/receivables/type", keyword: "type", params: { type: "array" } }], !1;
                                    var s = m === e;
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
        return T.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return T.errors = a, e === 0; }
T.evaluated = { props: { accounts_total_quota: !0, journal_legs_total_quota: !0, total_difference_quota: !0, difference_account_count: !0, receivable_total_quota: !0, differences: !0, receivables: !0 }, dynamicProps: !1, dynamicItems: !1 };
var nt = Pe;
function ie(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ie.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.journal_id === void 0 && (n = "journal_id") || r.refund_quota === void 0 && (n = "refund_quota") || r.approval_ref === void 0 && (n = "approval_ref"))
            return ie.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        if (r.journal_id !== void 0) {
            let p = r.journal_id, i = e;
            if (e === i && e === i)
                if (typeof p == "string") {
                    if (!M.test(p))
                        return ie.errors = [{ instancePath: t + "/journal_id", schemaPath: "#/properties/journal_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                }
                else
                    return ie.errors = [{ instancePath: t + "/journal_id", schemaPath: "#/properties/journal_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = i === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.refund_quota !== void 0) {
                let p = e;
                $(r.refund_quota, { instancePath: t + "/refund_quota", parentData: r, parentDataProperty: "refund_quota", rootData: l, dynamicAnchors: u }) || (a = a === null ? $.errors : a.concat($.errors), e = a.length);
                var s = p === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.reason !== void 0) {
                    let p = e;
                    if (typeof r.reason != "string")
                        return ie.errors = [{ instancePath: t + "/reason", schemaPath: "#/properties/reason/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = p === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.approval_ref !== void 0) {
                        let p = e;
                        if (typeof r.approval_ref != "string")
                            return ie.errors = [{ instancePath: t + "/approval_ref", schemaPath: "#/properties/approval_ref/type", keyword: "type", params: { type: "string" } }], !1;
                        var s = p === e;
                    }
                    else
                        var s = !0;
                    if (s)
                        if (r.evidence !== void 0) {
                            let p = r.evidence, i = e;
                            if (!(p && typeof p == "object" && !Array.isArray(p)))
                                return ie.errors = [{ instancePath: t + "/evidence", schemaPath: "#/properties/evidence/type", keyword: "type", params: { type: "object" } }], !1;
                            var s = i === e;
                        }
                        else
                            var s = !0;
                }
            }
        }
    }
    else
        return ie.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ie.errors = a, e === 0; }
ie.evaluated = { props: { journal_id: !0, refund_quota: !0, reason: !0, approval_ref: !0, evidence: !0 }, dynamicProps: !1, dynamicItems: !1 };
function Pe(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = Pe.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return Pe.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return Pe.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return Pe.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return Pe.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return Pe.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return Pe.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                ie(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? ie.errors : a.concat(ie.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return Pe.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return Pe.errors = a, e === 0; }
Pe.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var pt = be;
function je(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = je.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.reservation_id === void 0 && (n = "reservation_id"))
            return je.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        if (r.reservation_id !== void 0) {
            let p = r.reservation_id, i = e;
            if (e === i && e === i)
                if (typeof p == "string") {
                    if (!M.test(p))
                        return je.errors = [{ instancePath: t + "/reservation_id", schemaPath: "#/properties/reservation_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                }
                else
                    return je.errors = [{ instancePath: t + "/reservation_id", schemaPath: "#/properties/reservation_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = i === e;
        }
        else
            var s = !0;
        if (s)
            if (r.reason !== void 0) {
                let p = e;
                if (typeof r.reason != "string")
                    return je.errors = [{ instancePath: t + "/reason", schemaPath: "#/properties/reason/type", keyword: "type", params: { type: "string" } }], !1;
                var s = p === e;
            }
            else
                var s = !0;
    }
    else
        return je.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return je.errors = a, e === 0; }
je.evaluated = { props: { reservation_id: !0, reason: !0 }, dynamicProps: !1, dynamicItems: !1 };
function be(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = be.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return be.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return be.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return be.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return be.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return be.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return be.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                je(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? je.errors : a.concat(je.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return be.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return be.errors = a, e === 0; }
be.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var dt = L;
function L(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = L.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers"))
            return L.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers")) {
                    return L.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i)) {
                            let f;
                            if (i.reservationId === void 0 && (f = "reservationId"))
                                return L.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/required", keyword: "required", params: { missingProperty: f } }], !1;
                            {
                                let y = e;
                                for (let m in i)
                                    if (m !== "reservationId") {
                                        return L.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: m } }], !1;
                                        break;
                                    }
                                if (y === e && i.reservationId !== void 0) {
                                    let m = i.reservationId, P = e;
                                    if (e === P && e === P)
                                        if (typeof m == "string") {
                                            if (!M.test(m))
                                                return L.errors = [{ instancePath: t + "/pathParams/reservationId", schemaPath: "#/properties/pathParams/properties/reservationId/format", keyword: "format", params: { format: "uuid" } }], !1;
                                        }
                                        else
                                            return L.errors = [{ instancePath: t + "/pathParams/reservationId", schemaPath: "#/properties/pathParams/properties/reservationId/type", keyword: "type", params: { type: "string" } }], !1;
                                }
                            }
                        }
                        else
                            return L.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return L.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return L.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s)
                        if (r.headers !== void 0) {
                            let i = r.headers, o = e;
                            if (e === o)
                                if (i && typeof i == "object" && !Array.isArray(i))
                                    for (let y in i) {
                                        return L.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                        break;
                                    }
                                else
                                    return L.errors = [{ instancePath: t + "/headers", schemaPath: "#/properties/headers/type", keyword: "type", params: { type: "object" } }], !1;
                            var s = o === e;
                        }
                        else
                            var s = !0;
                }
            }
        }
    }
    else
        return L.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return L.errors = a, e === 0; }
L.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ft = ge;
function oe(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = oe.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.site_code === void 0 && (n = "site_code") || r.spend_auth_jti === void 0 && (n = "spend_auth_jti") || r.price_version === void 0 && (n = "price_version") || r.target_total_units === void 0 && (n = "target_total_units") || r.execution_cap === void 0 && (n = "execution_cap"))
            return oe.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        if (r.site_code !== void 0) {
            let p = e;
            if (typeof r.site_code != "string")
                return oe.errors = [{ instancePath: t + "/site_code", schemaPath: "#/properties/site_code/type", keyword: "type", params: { type: "string" } }], !1;
            var s = p === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.spend_auth_jti !== void 0) {
                let p = e;
                if (typeof r.spend_auth_jti != "string")
                    return oe.errors = [{ instancePath: t + "/spend_auth_jti", schemaPath: "#/properties/spend_auth_jti/type", keyword: "type", params: { type: "string" } }], !1;
                var s = p === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.price_version !== void 0) {
                    let p = e;
                    if (typeof r.price_version != "string")
                        return oe.errors = [{ instancePath: t + "/price_version", schemaPath: "#/properties/price_version/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = p === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.target_total_units !== void 0) {
                        let p = e;
                        Z(r.target_total_units, { instancePath: t + "/target_total_units", parentData: r, parentDataProperty: "target_total_units", rootData: l, dynamicAnchors: u }) || (a = a === null ? Z.errors : a.concat(Z.errors), e = a.length);
                        var s = p === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.execution_cap !== void 0) {
                            let p = e;
                            $(r.execution_cap, { instancePath: t + "/execution_cap", parentData: r, parentDataProperty: "execution_cap", rootData: l, dynamicAnchors: u }) || (a = a === null ? $.errors : a.concat($.errors), e = a.length);
                            var s = p === e;
                        }
                        else
                            var s = !0;
                        if (s) {
                            if (r.billable_unit !== void 0) {
                                let p = e;
                                if (typeof r.billable_unit != "string")
                                    return oe.errors = [{ instancePath: t + "/billable_unit", schemaPath: "#/properties/billable_unit/type", keyword: "type", params: { type: "string" } }], !1;
                                var s = p === e;
                            }
                            else
                                var s = !0;
                            if (s)
                                if (r.usage_estimate !== void 0) {
                                    let p = r.usage_estimate, i = e;
                                    if (e === i && !(p && typeof p == "object" && !Array.isArray(p)))
                                        return oe.errors = [{ instancePath: t + "/usage_estimate", schemaPath: "#/properties/usage_estimate/type", keyword: "type", params: { type: "object" } }], !1;
                                    var s = i === e;
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
        return oe.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return oe.errors = a, e === 0; }
oe.evaluated = { props: { site_code: !0, spend_auth_jti: !0, price_version: !0, target_total_units: !0, execution_cap: !0, billable_unit: !0, usage_estimate: !0 }, dynamicProps: !1, dynamicItems: !1 };
function ge(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ge.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return ge.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return ge.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return ge.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return ge.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return ge.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return ge.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                oe(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? oe.errors : a.concat(oe.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return ge.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ge.errors = a, e === 0; }
ge.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var lt = ke;
function ne(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ne.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.journal_id === void 0 && (n = "journal_id") || r.approval_ref === void 0 && (n = "approval_ref"))
            return ne.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        if (r.journal_id !== void 0) {
            let p = r.journal_id, i = e;
            if (e === i && e === i)
                if (typeof p == "string") {
                    if (!M.test(p))
                        return ne.errors = [{ instancePath: t + "/journal_id", schemaPath: "#/properties/journal_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                }
                else
                    return ne.errors = [{ instancePath: t + "/journal_id", schemaPath: "#/properties/journal_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = i === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.reason !== void 0) {
                let p = e;
                if (typeof r.reason != "string")
                    return ne.errors = [{ instancePath: t + "/reason", schemaPath: "#/properties/reason/type", keyword: "type", params: { type: "string" } }], !1;
                var s = p === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.approval_ref !== void 0) {
                    let p = e;
                    if (typeof r.approval_ref != "string")
                        return ne.errors = [{ instancePath: t + "/approval_ref", schemaPath: "#/properties/approval_ref/type", keyword: "type", params: { type: "string" } }], !1;
                    var s = p === e;
                }
                else
                    var s = !0;
                if (s)
                    if (r.evidence !== void 0) {
                        let p = r.evidence, i = e;
                        if (!(p && typeof p == "object" && !Array.isArray(p)))
                            return ne.errors = [{ instancePath: t + "/evidence", schemaPath: "#/properties/evidence/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = i === e;
                    }
                    else
                        var s = !0;
            }
        }
    }
    else
        return ne.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ne.errors = a, e === 0; }
ne.evaluated = { props: { journal_id: !0, reason: !0, approval_ref: !0, evidence: !0 }, dynamicProps: !1, dynamicItems: !1 };
function ke(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = ke.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return ke.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return ke.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return ke.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return ke.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return ke.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return ke.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                ne(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? ne.errors : a.concat(ne.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return ke.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return ke.errors = a, e === 0; }
ke.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
var ut = qe;
var yt = { type: "object", required: ["reservation_id", "actual_units", "usage_evidence"], properties: { reservation_id: { type: "string", format: "uuid" }, actual_units: { $ref: "#/components/schemas/NonNegQuota" }, usage_evidence: { type: "object", additionalProperties: !0 }, cost: { type: "object", properties: { cost_micro_usd: { $ref: "#/components/schemas/MoneyMinor" }, cost_currency: { type: "string" }, fx_rate_to_usd: { type: "string" }, cost_status: { type: "string", enum: ["confirmed", "estimated", "pending_reconcile", "not_applicable"] } } } } };
function B(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = B.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let p;
        if (r.reservation_id === void 0 && (p = "reservation_id") || r.actual_units === void 0 && (p = "actual_units") || r.usage_evidence === void 0 && (p = "usage_evidence"))
            return B.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: p } }], !1;
        if (r.reservation_id !== void 0) {
            let i = r.reservation_id, o = e;
            if (e === o && e === o)
                if (typeof i == "string") {
                    if (!M.test(i))
                        return B.errors = [{ instancePath: t + "/reservation_id", schemaPath: "#/properties/reservation_id/format", keyword: "format", params: { format: "uuid" } }], !1;
                }
                else
                    return B.errors = [{ instancePath: t + "/reservation_id", schemaPath: "#/properties/reservation_id/type", keyword: "type", params: { type: "string" } }], !1;
            var s = o === e;
        }
        else
            var s = !0;
        if (s) {
            if (r.actual_units !== void 0) {
                let i = e;
                Z(r.actual_units, { instancePath: t + "/actual_units", parentData: r, parentDataProperty: "actual_units", rootData: l, dynamicAnchors: u }) || (a = a === null ? Z.errors : a.concat(Z.errors), e = a.length);
                var s = i === e;
            }
            else
                var s = !0;
            if (s) {
                if (r.usage_evidence !== void 0) {
                    let i = r.usage_evidence, o = e;
                    if (e === o && !(i && typeof i == "object" && !Array.isArray(i)))
                        return B.errors = [{ instancePath: t + "/usage_evidence", schemaPath: "#/properties/usage_evidence/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s)
                    if (r.cost !== void 0) {
                        let i = r.cost, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i)) {
                                if (i.cost_micro_usd !== void 0) {
                                    let y = e;
                                    R(i.cost_micro_usd, { instancePath: t + "/cost/cost_micro_usd", parentData: i, parentDataProperty: "cost_micro_usd", rootData: l, dynamicAnchors: u }) || (a = a === null ? R.errors : a.concat(R.errors), e = a.length);
                                    var n = y === e;
                                }
                                else
                                    var n = !0;
                                if (n) {
                                    if (i.cost_currency !== void 0) {
                                        let y = e;
                                        if (typeof i.cost_currency != "string")
                                            return B.errors = [{ instancePath: t + "/cost/cost_currency", schemaPath: "#/properties/cost/properties/cost_currency/type", keyword: "type", params: { type: "string" } }], !1;
                                        var n = y === e;
                                    }
                                    else
                                        var n = !0;
                                    if (n) {
                                        if (i.fx_rate_to_usd !== void 0) {
                                            let y = e;
                                            if (typeof i.fx_rate_to_usd != "string")
                                                return B.errors = [{ instancePath: t + "/cost/fx_rate_to_usd", schemaPath: "#/properties/cost/properties/fx_rate_to_usd/type", keyword: "type", params: { type: "string" } }], !1;
                                            var n = y === e;
                                        }
                                        else
                                            var n = !0;
                                        if (n)
                                            if (i.cost_status !== void 0) {
                                                let y = i.cost_status, m = e;
                                                if (typeof y != "string")
                                                    return B.errors = [{ instancePath: t + "/cost/cost_status", schemaPath: "#/properties/cost/properties/cost_status/type", keyword: "type", params: { type: "string" } }], !1;
                                                if (!(y === "confirmed" || y === "estimated" || y === "pending_reconcile" || y === "not_applicable"))
                                                    return B.errors = [{ instancePath: t + "/cost/cost_status", schemaPath: "#/properties/cost/properties/cost_status/enum", keyword: "enum", params: { allowedValues: yt.properties.cost.properties.cost_status.enum } }], !1;
                                                var n = m === e;
                                            }
                                            else
                                                var n = !0;
                                    }
                                }
                            }
                            else
                                return B.errors = [{ instancePath: t + "/cost", schemaPath: "#/properties/cost/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
            }
        }
    }
    else
        return B.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return B.errors = a, e === 0; }
B.evaluated = { props: { reservation_id: !0, actual_units: !0, usage_evidence: !0, cost: !0 }, dynamicProps: !1, dynamicItems: !1 };
function qe(r, { instancePath: t = "", parentData: v, parentDataProperty: h, rootData: l = r, dynamicAnchors: u = {} } = {}) { let a = null, e = 0, d = qe.evaluated; if (d.dynamicProps && (d.props = void 0), d.dynamicItems && (d.items = void 0), e === 0)
    if (r && typeof r == "object" && !Array.isArray(r)) {
        let n;
        if (r.pathParams === void 0 && (n = "pathParams") || r.query === void 0 && (n = "query") || r.headers === void 0 && (n = "headers") || r.body === void 0 && (n = "body"))
            return qe.errors = [{ instancePath: t, schemaPath: "#/required", keyword: "required", params: { missingProperty: n } }], !1;
        {
            let p = e;
            for (let i in r)
                if (!(i === "pathParams" || i === "query" || i === "headers" || i === "body")) {
                    return qe.errors = [{ instancePath: t, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: i } }], !1;
                    break;
                }
            if (p === e) {
                if (r.pathParams !== void 0) {
                    let i = r.pathParams, o = e;
                    if (e === o)
                        if (i && typeof i == "object" && !Array.isArray(i))
                            for (let f in i) {
                                return qe.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: f } }], !1;
                                break;
                            }
                        else
                            return qe.errors = [{ instancePath: t + "/pathParams", schemaPath: "#/properties/pathParams/type", keyword: "type", params: { type: "object" } }], !1;
                    var s = o === e;
                }
                else
                    var s = !0;
                if (s) {
                    if (r.query !== void 0) {
                        let i = r.query, o = e;
                        if (e === o)
                            if (i && typeof i == "object" && !Array.isArray(i))
                                for (let y in i) {
                                    return qe.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: y } }], !1;
                                    break;
                                }
                            else
                                return qe.errors = [{ instancePath: t + "/query", schemaPath: "#/properties/query/type", keyword: "type", params: { type: "object" } }], !1;
                        var s = o === e;
                    }
                    else
                        var s = !0;
                    if (s) {
                        if (r.headers !== void 0) {
                            let i = e;
                            q(r.headers, { instancePath: t + "/headers", parentData: r, parentDataProperty: "headers", rootData: l, dynamicAnchors: u }) || (a = a === null ? q.errors : a.concat(q.errors), e = a.length);
                            var s = i === e;
                        }
                        else
                            var s = !0;
                        if (s)
                            if (r.body !== void 0) {
                                let i = e;
                                B(r.body, { instancePath: t + "/body", parentData: r, parentDataProperty: "body", rootData: l, dynamicAnchors: u }) || (a = a === null ? B.errors : a.concat(B.errors), e = a.length);
                                var s = i === e;
                            }
                            else
                                var s = !0;
                    }
                }
            }
        }
    }
    else
        return qe.errors = [{ instancePath: t, schemaPath: "#/type", keyword: "type", params: { type: "object" } }], !1; return qe.errors = a, e === 0; }
qe.evaluated = { props: !0, dynamicProps: !1, dynamicItems: !1 };
export { $r as q237, Nr as q241, Qr as q242, xr as q243, Mr as q268, Cr as q269, Ur as q270, Br as q271, Kr as q343, Jr as q344, rt as q345, tt as q346, it as q347, nt as q348, pt as q349, dt as q350, ft as q351, lt as q352, ut as q353, Ir as s237_200, A as s237_409, fr as s241_200, A as s241_400, A as s241_401, A as s241_403, A as s241_409, A as s241_503, fr as s242_200, A as s242_400, A as s242_401, A as s242_403, A as s242_409, A as s242_503, Fr as s243_200, Vr as s268_200, Lr as s269_200, A as s269_403, Yr as s270_200, A as s270_403, A as s270_409, Hr as s271_200, Qe as s271_400, Qe as s271_401, Qe as s271_403, Qe as s271_409, Qe as s271_500, Qe as s271_503, Qe as s271_default, Ce as s343_200, A as s343_400, A as s343_403, A as s343_409, et as s344_200, A as s344_403, Ce as s345_200, A as s345_403, A as s345_409, Me as s346_200, A as s346_403, A as s346_409, ot as s347_200, A as s347_401, A as s347_403, Ce as s348_200, A as s348_400, A as s348_402, A as s348_403, A as s348_404, A as s348_409, Me as s349_200, A as s349_409, Me as s350_200, A as s350_404, Me as s351_200, A as s351_402, A as s351_403, A as s351_409, Ce as s352_200, A as s352_403, A as s352_404, A as s352_409, Me as s353_200, A as s353_409 };
