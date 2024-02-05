export function escapeHtml(unsafe: string) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

//
// Equality
//

export function isEqual(aVariable: any, anotherVariable: any): boolean {
    if (aVariable === undefined) return anotherVariable === undefined;
    if (aVariable === null) return anotherVariable === null;
    if (Array.isArray(aVariable)) return isEqualToArray(aVariable, anotherVariable);
    if (typeof(aVariable) === "object") return isEqualToObject(aVariable, anotherVariable);
    if (["string", "number", "boolean", "bigint"].includes(typeof(aVariable))) {
        return aVariable == anotherVariable
    }

    throw Error("Not implemented for values: " + aVariable + anotherVariable);
}

function isEqualToArray(anArray: Array<any>, candidate: any): boolean {
    if (!Array.isArray(candidate)) return false;

    if (anArray.length !== candidate.length || ! anArray.every(function(value, index) { return isEqual(value,candidate[index]) })) {
        return false;
    }

    return true;
}

function isEqualToObject(anObject: any, candidate: any): boolean {
    if (typeof(candidate) !== "object" || Array.isArray(candidate) || candidate === null) {
        return false;
    }

    const anObjectKeys = Object.keys(anObject);
    const candidateKeys = Object.keys(candidate);
    
    if (!isEqualToArray(anObjectKeys, candidateKeys)) return false;

    if (anObjectKeys.some((k) => {
        return ! isEqual(anObject[k], candidate[k])
    })) return false;

    return true;
}