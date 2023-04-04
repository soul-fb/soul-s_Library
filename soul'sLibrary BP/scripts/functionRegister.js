// レジスタとして使用するオブジェクトを作成
const register = {};

// string型のトリガーを処理関数にマッピングする関数
/**
* @param {string} trigger
* @param {{ (): void; (): void; }} func
*/
export function registerFunction(trigger, func) {
    register[trigger] = func;
}

// トリガー文字列を受け取り、関数を実行する関数
/**
* @param {string | number} trigger
* @param {undefined[]} args
*/
export function executeFunction(trigger, ...args) {
    // レジスタに登録された関数を取得
    const func = register[trigger];

    // レジスタに登録されていない場合は、エラーを返す
    if (!func) {
        throw new Error(`No function registered for trigger '${trigger}'`);
    }

    // 関数を実行する
    return func(...args);
}

registerFunction("sFunc:sin", (/** @type {number} */ x) => Math.sin(x));
registerFunction("sFunc:pi", () => Math.PI);
registerFunction("sFunc:atan2", (/** @type {number} */ y, /** @type {number} */ x) => Math.atan2(y, x));