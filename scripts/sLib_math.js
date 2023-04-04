import { getScoreboard, setScoreboard } from "ioLib.js";
import { registerFunction, executeFunction } from "functionRegister.js";

/**
* @param {number} value
* @param {number} min
* @param {number} max
*/
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
* @param {Entity} entityId
* @param {string} str
*/
export function scoreToNumber(entityId, str) {
    const regex = /\$([recf])?{(.*?)}/g;
    return str.replace(regex, (match, type, key) => {
        let value = getScoreboard(entityId, key);
        if (type === 'r') {
            value = Math.round(value);
        } else if (type === 'e') {
            value = value.toExponential();
        } else if (type === 'c') {
            value = Math.ceil(value);
        } else if (type === 'f') {
            value = Math.floor(value);
        }
        return String(value);
    });
}

export
    function evaluate(expression) {
    const tokens = tokenize(expression);
    const ast = parse(tokens);
    return evaluateAst(ast);
}

function tokenize(expression) {
    const tokens = [];
    let currentToken = '';
    for (const char of expression) {
        if (/[\d.]/.test(char)) {
            currentToken += char;
        } else if (/[+\-*/()\"\s,]/.test(char)) {
            if (currentToken) {
                if (/[a-zA-Z]/.test(currentToken)) {
                    tokens.push({ type: 'string', value: currentToken });
                    currentToken = '';
                } else {
                    tokens.push({ type: 'number', value: Number(currentToken) });
                    currentToken = '';
                }
            }
            if (char != ' ') {
                tokens.push({ type: 'operator', value: char });
            }
        } else {
            currentToken += char;
        }
    }
    if (currentToken) {
        tokens.push(/[a-zA-Z]/.test(currentToken) ? { type: 'string', value: currentToken } : { type: 'number', value: Number(currentToken) });
    }
    return tokens;
}

function parse(tokens) {
    let index = 0;

    function parseExpression() {
        let left = parseFactor();
        while (index < tokens.length && /[+\-]/.test(tokens[index].value)) {
            const operator = tokens[index++].value;
            const right = parseFactor();
            left = { type: 'binary', operator, left, right };
        }
        return left;
    }

    function parseFactor() {
        let left = parseExponent();
        while (index < tokens.length && /[*\/]/.test(tokens[index].value)) {
            const operator = tokens[index++].value;
            const right = parseExponent();
            left = { type: 'binary', operator, left, right };
        }
        return left;
    }

    function parseExponent() {
        let left = parsePrimary();
        while (index < tokens.length && /\"/.test(tokens[index].value)) {
            const operator = tokens[index++].value;
            const right = parsePrimary();
            left = { type: 'binary', operator, left, right };
        }
        return left;
    }

    function parsePrimary() {
        const token = tokens[index++];
        if (token.type === 'number') {
            return token;
        } else if (token.type === 'string') {
            if (tokens[index].value === '(') {
                index++;
                const args = [];
                while (tokens[index].value !== ')') {
                    args.push(parseExpression());
                    if (tokens[index].value === ',') {
                        index++;
                    }
                }
                index++;
                return { type: 'function', name: token.value, args };
            } else {
                return token;
            }
        } else if (token.value === '-') {
            return { type: 'unary', operator: '-', operand: parsePrimary() };
        } else if (token.value === '(') {
            const expression = parseExpression();
            index++;
            return expression;
        }
    }

    return parseExpression();
}

function evaluateAst(ast) {
    switch (ast.type) {
        case "number":
            return ast.value;
        case "unary":
            switch (ast.operator) {
                case "-":
                    return -evaluateAst(ast.operand);
            }
        case "binary":
            switch (ast.operator) {
                case "+":
                    return evaluateAst(ast.left) + evaluateAst(ast.right);
                case "-":
                    return evaluateAst(ast.left) - evaluateAst(ast.right);
                case "*":
                    return evaluateAst(ast.left) * evaluateAst(ast.right);
                case "/":
                    return evaluateAst(ast.left) / evaluateAst(ast.right);
                case "\"":
                    return Math.pow(evaluateAst(ast.left), evaluateAst(ast.right));
            }
        case "function":
            const evaluatedArgs = ast.args.map(arg => evaluateAst(arg));
            return executeFunction(ast.name, ...evaluatedArgs);
    }
}