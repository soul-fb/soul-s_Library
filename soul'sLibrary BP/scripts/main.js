import * as minecraft from "@minecraft/server";
import * as minecraft_ui from "@minecraft/server-ui";
import * as ioLib from "ioLib.js";
//import { registerFunction, executeFunction } from "functionRegister.js";
import * as sMath from "sLib_math.js";
let overWorld = minecraft.world.getDimension("minecraft:overworld");

minecraft.world.events.worldInitialize.subscribe((e) => {
    let click = new minecraft.DynamicPropertiesDefinition();
    // def.defineNumber("A");
    // def.defineNumber("B");
    click.defineString("selfCommand", 64);
    click.defineString("targetCommand", 64);
    let type = minecraft.EntityTypes.get("slib:click");
    e.propertyRegistry.registerEntityTypeDynamicProperties(click, type);

    let player = new minecraft.DynamicPropertiesDefinition();
    // def.defineNumber("A");
    // def.defineNumber("B");
    player.defineNumber("idBuff");
    e.propertyRegistry.registerEntityTypeDynamicProperties(player, minecraft.MinecraftEntityTypes.player);
});

minecraft.system.events.scriptEventReceive.subscribe(ev => {
    const { id, message, sourceEntity } = ev;
    //sourceEntity.setDynamicProperty("errorCode", "\n");
    if (id === 'sLib:if') {
        return;
    }

    if (id === 'sLib:runCommand') {
        sourceEntity.runCommandAsync(sMath.scoreToNumber(sourceEntity, message));
        return;
    }

    if (id === 'sLib:math') {
        ioLib.evaluateScore(sourceEntity, message);
        return;
    }

    if (id === 'sLib:math_p') {
        sourceEntity.sendMessage(ioLib.evaluateScore(sourceEntity, message));
        return;
    }

    if (id === 'sLib:printScore') {
        sourceEntity.sendMessage(message + " = " + String(ioLib.getScoreboard(sourceEntity, message)));
        return;
    }

    if (id == 'sLib:xpBar') {
        if (sourceEntity.typeId != "minecraft:player") return;
        let values = message.split(" ");
        sourceEntity.resetLevel();
        sourceEntity.addLevels(129);
        sourceEntity.addExperience(Number(sMath.scoreToNumber(sourceEntity, values[0])));
        sourceEntity.addLevels(-129);
        sourceEntity.addLevels(Number(sMath.scoreToNumber(sourceEntity, values[1])));
        return;
    }

    if (id === 'sLib:createScore') {
        if (message.length > 15) {
            sourceEntity.sendMessage("§e小数型は15文字以下で宣言してください。");
            return;
        }
        minecraft.world.scoreboard.addObjective(message + "N", message + " :§e本体§r");
        minecraft.world.scoreboard.addObjective(message + "D", message + " :§e仮数部§r");
        sourceEntity.sendMessage("§b小数型スコアボード §e" + message + "§b を作成しました");

        return;
    }
    if (id === 'sLib:deleteScore') {
        minecraft.world.scoreboard.removeObjective(message + "N");
        minecraft.world.scoreboard.removeObjective(message + "D");
        sourceEntity.sendMessage("§c小数型スコアボード §e" + message + "§c を削除しました");
        return;
    }
    if (id === "sLib:setItemData") {
        if (message == "") {
            let inventory = sourceEntity.getComponent("minecraft:inventory").container;
            let item = inventory.getItem(sourceEntity.selectedSlot);

            let name = "";
            try { name = item.nameTag.replace("\n", "\\n") } catch { }

            let modalForm = new minecraft_ui.ModalFormData();
            modalForm.title("setItemData")
                .textField("itemName", "", name)
                .textField("itemLore", "", String(item.getLore().join("\n")).replace("\n", "\\n"))
                .slider("itemAmount", 1, item.maxAmount, 1, item.amount);

            modalForm.show(sourceEntity).then(response => {
                if (!response.canceled) {
                    item.nameTag = response.formValues[0].replace("\\n", "\n");
                    item.setLore([String(response.formValues[1]).replace("\\n", "\n")]);
                    item.amount = Number(response.formValues[2]);
                    inventory.setItem(sourceEntity.selectedSlot, item);
                }
            });
            return;
        } else {
            let [name, lore, amount] = message.split(" ");

            let inventory = sourceEntity.getComponent("minecraft:inventory").container;
            let item = inventory.getItem(sourceEntity.selectedSlot);
            item.nameTag = name.replace("\\n", "\n");
            item.setLore([lore.replace("\\n", "\n")]);
            item.amount = Number(amount);
            inventory.setItem(sourceEntity.selectedSlot, item);
            return;
        }
    }
    if (id === 'sLib:setString') {
        let [identifier, ...args] = message.split(" ");
        sourceEntity.setDynamicProperty(identifier, args.join(" "));
    }
})


minecraft.world.events.entityHit.subscribe(data => {
    const { entity, hitBlock, hitEntity } = data;
    //entity.applyKnockback(0, 0, 0, 0.5);
    // if (entity.typeId != "minecraft:player") return;
    //let player = minecraft.Player(entity);
    if (hitEntity.typeId != 'slib:click') return;
    let inventory = entity.getComponent("minecraft:inventory").container;
    let hasItem = inventory.getItem(entity.selectedSlot);

    let entInventory = hitEntity.getComponent("minecraft:inventory").container;
    let entHasItem = entInventory.getItem(0);
    if ((hasItem == undefined && entHasItem != undefined)) return;
    if (entHasItem == undefined || hasItem.typeId == entHasItem.typeId) {
        hitEntity.runCommandAsync(hitEntity.getDynamicProperty("selfCommand"));
        entity.runCommandAsync(hitEntity.getDynamicProperty("targetCommand"));
    }

    entity.sendMessage(hasItem.typeId);
    entity.sendMessage(entHasItem.typeId);
    //hitEntity.applyKnockback(0, 0, 0, 10);
    //const dr = entity.getViewDirection();
    //hitEntity.applyKnockback(dr.x, dr.z, 0.5, 0.5);
})