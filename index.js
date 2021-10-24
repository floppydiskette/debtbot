const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { GoalNear, GoalBlock, GoalXZ, GoalY, GoalInvert, GoalFollow, GoalBreakBlock } = require('mineflayer-pathfinder').goals

const emails = ["email array goes here"];

const passwords = ["password array goes here"];

const bot = mineflayer.createBot({
    host: 'uwueviee.live',
    port: 25565,
    username: emails[parseInt(process.argv[2])],
    password: passwords[parseInt(process.argv[2])]
});
bot.loadPlugin(pathfinder);
bot.physicsEnabled = true;

let running = true;

bot.once('spawn', () => {
    //mineflayerViewer(bot, { port: 3000 });
    bot.waitForChunksToLoad().then(() => {
        console.log("spawned!");


        const mcData = require('minecraft-data')(bot.version);
        const defaultMove = new Movements(bot, mcData);

        const STONE = mcData.blocksByName["stone"].id;
        const EMERALD = mcData.blocksByName["emerald_ore"].id;


        bot.equip(mcData.itemsByName["netherite_pickaxe"].id, "hand").then(() => console.log("EQUIPPED AND READY!"));

        bot.on('chat:wallet', matches => {
            console.log(matches);

            let balance = Number(matches[0][0]);
            if (balance > 0) { bot.chat(`/transfer oweth ${balance} funny`); };
            console.log(`TRANSFERRED ${balance} TO HUSKY!`);
        });

        async function transferFundsToHusky(){
            return new Promise(resolve => {
                bot.removeChatPattern('wallet');
                bot.addChatPattern('wallet', /\s(\d+)\sNNC\./, {repeat: false, parse: true});
                bot.chat("/wallet");
                resolve(true);
            });
        }
/*
        bot.on('path_update', (r) => {
            const nodesPerTick = (r.visitedNodes * 50 / r.time).toFixed(2)
            console.log(`I can get there in ${r.path.length} moves. Computation took ${r.time.toFixed(2)} ms (${r.visitedNodes} nodes, ${nodesPerTick} nodes/tick)`)
        })

 */

        async function mine_an_stone(pos) {
            return new Promise(resolve => {
                if (bot.canDigBlock(bot.blockAt(pos))) {
                    bot.dig(bot.blockAt(pos)).then(() => {
                        console.log(`MINED STONE AT ${pos}`);
                        resolve(true);
                    });
                } else {
                    console.log("GOTTA NAVIGATE!");
                    bot.pathfinder.setMovements(defaultMove);
                    const goal = new GoalBreakBlock(pos.x, pos.y, pos.z, bot);
                    bot.pathfinder.goto(goal).then(() => {
                        if (bot.canDigBlock(bot.blockAt(pos))) {
                            bot.dig(bot.blockAt(pos)).then(() => {
                                console.log(`MINED STONE AT ${pos}`);
                                resolve(true);
                            });
                        } else {
                            //something happened and we couldn't mine the block, just give up
                            console.log(`ERROR MINING STONE AT ${pos}, GIVING UP!`);
                            resolve(true);
                        }
                    });
                }
            });
        }

        async function noEmeraldsJustStones() {
            return new Promise(async resolve => {
                //no emeralds found, search for stone and mine all those first
                let stones = bot.findBlocks({matching: (block) => block.type === STONE});
                if (stones.length > 0) {
                    console.log("FOUND STONES!");
                    for (const pos of stones) {
                        let st = await mine_an_stone(pos);
                    }
                    resolve(true);
                } else {
                    console.log("NO STONES FOUND IN TYPICAL RADIUS, NAVIGATING TO GOOD STONE AREA!");


                    let navigation_stone = bot.findBlock({matching: (block) => block.type === STONE, maxDistance: 64});

                    if (navigation_stone != null) {
                        console.log("GOTTA NAVIGATE!");
                        bot.pathfinder.setMovements(defaultMove);
                        const goal = new GoalBreakBlock(navigation_stone.x, navigation_stone.y, navigation_stone.z, bot);
                        bot.pathfinder.goto(goal).then(() => {
                            //we've gotten to stones again! let's search once more
                            console.log("NAVIGATED TO GOOD STONE AREA! BACK ON TRACK!");
                            resolve(true);
                        });
                    } else {
                        console.log("AN ERROR HAS OCCURRED! I AM LOST ):\nDISCONNECTING TO BE SAFE!");
                        transferFundsToHusky();
                        bot.quit();
                        running = false;
                    }

                }
            });
        }

        async function mine_an_emerald(pos) {
            return new Promise((resolve) => {
                if (bot.canDigBlock(bot.blockAt(pos))) {
                    console.log("CAN DIG!");
                    bot.dig(bot.blockAt(pos)).then(() => {
                        console.log(`MINED EMERALD AT ${pos}`);
                        resolve(true);
                    });
                } else {
                    console.log("GOTTA NAVIGATE!");
                    bot.pathfinder.setMovements(defaultMove);
                    const goal = new GoalBreakBlock(pos.x, pos.y, pos.z, bot);
                    bot.pathfinder.goto(goal).then(() => {
                        if (bot.canDigBlock(bot.blockAt(pos))) {
                            bot.dig(bot.blockAt(pos)).then(() => {
                                console.log(`MINED EMERALD AT ${pos}`);
                                resolve(true);
                            });
                        } else {
                            //something happened and we couldn't mine the block, just give up
                            console.log(`ERROR MINING EMERALD AT ${pos}, GIVING UP!`);
                            resolve(true);
                        }
                    }).catch(e => {
                        console.log(e);
                    });
                }
            });
        }

        async function loop(){
            console.log("loop!")
            let emeralds = bot.findBlocks({matching: (block) => block.type === EMERALD});

            if (emeralds.length > 0) {
                console.log("FOUND EMERALDS!");
                for (const pos of emeralds) {
                    await mine_an_emerald(pos);
                }
                await transferFundsToHusky();
            } else {
                await noEmeraldsJustStones();
            }

            await loop();
        }

        loop();
    }).catch((e) => {
        console.log(e);
    });

});
