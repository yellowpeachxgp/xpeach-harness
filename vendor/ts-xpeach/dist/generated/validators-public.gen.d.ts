declare function D(e: any, { instancePath: r, parentData: d, parentDataProperty: n, rootData: l, dynamicAnchors: v }?: {
    instancePath?: string | undefined;
    rootData?: any;
    dynamicAnchors?: {} | undefined;
}): boolean;
declare namespace D {
    namespace evaluated {
        let props: boolean;
        let dynamicProps: boolean;
        let dynamicItems: boolean;
    }
}
declare function re(e: any, { instancePath: r, parentData: d, parentDataProperty: n, rootData: l, dynamicAnchors: v }?: {
    instancePath?: string | undefined;
    rootData?: any;
    dynamicAnchors?: {} | undefined;
}): boolean;
declare namespace re {
    export namespace evaluated_1 {
        let props_1: boolean;
        export { props_1 as props };
        let dynamicProps_1: boolean;
        export { dynamicProps_1 as dynamicProps };
        let dynamicItems_1: boolean;
        export { dynamicItems_1 as dynamicItems };
    }
    export { evaluated_1 as evaluated };
}
declare function j(e: any, { instancePath: r, parentData: d, parentDataProperty: n, rootData: l, dynamicAnchors: v }?: {
    instancePath?: string | undefined;
    rootData?: any;
    dynamicAnchors?: {} | undefined;
}): boolean;
declare namespace j {
    export namespace evaluated_2 {
        let props_2: boolean;
        export { props_2 as props };
        let dynamicProps_2: boolean;
        export { dynamicProps_2 as dynamicProps };
        let dynamicItems_2: boolean;
        export { dynamicItems_2 as dynamicItems };
    }
    export { evaluated_2 as evaluated };
}
export { D as q242, D as q243, D as q244, re as s242_200, j as s243_200, j as s244_200, j as s244_503 };
