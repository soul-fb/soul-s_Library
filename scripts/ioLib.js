import { world, system, Entity, DynamicPropertiesDefinition } from '@minecraft/server';
import * as sMath from "sLib_math.js";
import { registerFunction, executeFunction } from "functionRegister.js";

/**
* @param {Entity} entityId
* @param {String} scoreName
*/
export function getScoreboard(entityId, scoreName) {
    if (scoreName.endsWith("N")) {
        return getFloatScore(entityId, scoreName);
    }
    if (scoreName.startsWith("Prop:")) {
        return entityId.getDynamicProperty(scoreName.slice(5));
    }
    if (scoreName.startsWith("WProp:")) {
        return world.getDynamicProperty(scoreName.slice(6));
    }
    return getIntScore(entityId, scoreName);
}

/**
* @param {Entity} entityId
* @param {String} scoreName
* @param {Number} value
*/
export function setScoreboard(entityId, scoreName, value) {
    if (scoreName.endsWith("N")) {
        setFloatScore(entityId, scoreName, value);
        return;
    }
    if (scoreName.startsWith("Prop:")) {
        entityId.setDynamicProperty(scoreName.slice(5), value);
        return;
    }
    if (scoreName.startsWith("WProp:")) {
        world.setDynamicProperty(scoreName.slice(6), value);
        return;
    }
    setIntScore(entityId, scoreName, value);
    return;
}

/**
* @param {Entity} entityId
* @param {string} scoreName
* @param {number} value
*/
function setFloatScore(entityId, scoreName, value) {
    let buffer = new ArrayBuffer(8);
    let floatView = new Float64Array(buffer);
    floatView[0] = value;
    let intView = new Int32Array(buffer);
    world.scoreboard.getObjective(scoreName).setScore(entityId.scoreboard, intView[1]);
    world.scoreboard.getObjective(scoreName.slice(0, -1) + "D").setScore(entityId.scoreboard, intView[0]);
}

/**
* @param {Entity} entityId
* @param {string} scoreName
*/
function getFloatScore(entityId, scoreName) {
    let buffer = new ArrayBuffer(8);
    let intView = new Int32Array(buffer);
    intView[1] = world.scoreboard.getObjective(scoreName).getScore(entityId.scoreboard);
    intView[0] = world.scoreboard.getObjective(scoreName.slice(0, -1) + "D").getScore(entityId.scoreboard);
    let floatView = new Float64Array(buffer);
    return floatView[0];
}

/**
* @param {Entity} entityId
* @param {String} scoreName
*/
function getIntScore(entityId, scoreName) {
    return world.scoreboard.getObjective(scoreName).getScore(entityId.scoreboard);
}

/**
* @param {Entity} entityId
* @param {String} scoreName
* @param {Number} value
*/
function setIntScore(entityId, scoreName, value) {
    world.scoreboard.getObjective(scoreName).setScore(entityId.scoreboard, value);
}


/**
* @param {import("@minecraft/server").Entity} entityId
* @param {string} expression
*/
export function evaluateScore(entityId, expression) {
    // スコアボードの値を取得する関数
    /**
* @param {string} scoreName
*/
    function getScore(scoreName) {
        return getScoreboard(entityId, scoreName);
    }

    // スコアボードの値を設定する関数
    /**
* @param {string} scoreName
* @param {number} newScore
*/
    function setScore(scoreName, newScore) {
        setScoreboard(entityId, scoreName, newScore);
    }

    let [scoreA, equal, rest] = expression.split(' ');
    rest = sMath.scoreToNumber(entityId, rest);

    // }
    let exp = " ( " + rest + " ) ";
    if (/[+\-*/\"]/.test(equal)) {
        exp = " ( " + getScore(scoreA) + " ) " + equal.charAt(0) + exp;
    }
    let value = sMath.evaluate(exp);
    //entityId.sendMessage(scoreA + " = " + String(value) + " = " + exp);
    setScore(scoreA, value);
    return (scoreA + " << " + String(value) + " =" + exp);
}