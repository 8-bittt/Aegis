const Discord = require('discord.js');
const Schema = require("../../database/models/economy");

module.exports = async (client, interaction, args) => {
    let user = interaction.user;
    let slots = [0.5, 1, 1.5, 2, 2.5, 3]; // Different multipliers for the slots
    let dropResult = Math.floor(Math.random() * slots.length); // Determine which slot the chip lands in
    let multiplier = slots[dropResult];
    let plinkoBoard = [
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜"
    ];

    const renderBoard = (board, chipPosition) => {
        return board.map((row, rowIndex) => {
            return row.split("").map((slot, slotIndex) => slotIndex === chipPosition[rowIndex] ? "🔵" : slot).join("");
        }).join("\n");
    };

    Schema.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, data) => {
        if (data) {
            let money = parseInt(interaction.options.getNumber('amount'));
            if (!money) return client.errUsage({ usage: "plinko [amount]", type: 'editreply' }, interaction);

            if (money > data.Money) return client.errNormal({ error: `You are betting more than you have!`, type: 'editreply' }, interaction);

            let chipPositions = new Array(plinkoBoard.length).fill(Math.floor(plinkoBoard[0].length / 2)); // Start in the middle

            const initialBoard = renderBoard(plinkoBoard, chipPositions);

            client.embed({
                desc: `Plinko started by ${user}・React ⬇️ to drop the chip`,
                fields: [
                    {
                        name: `Current Multiplier`,
                        value: `1x`,
                        inline: true,
                    }
                ],
                components: [],
                type: 'editreply'
            }, interaction).then(async msg => {
                await msg.edit({
                    content: initialBoard,
                    components: []
                });

                for (let i = 0; i < plinkoBoard.length - 1; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    let direction = Math.random() > 0.5 ? 1 : -1;
                    chipPositions[i + 1] = Math.min(Math.max(chipPositions[i] + direction, 0), plinkoBoard[0].length - 1);
                    const updatedBoard = renderBoard(plinkoBoard, chipPositions);
                    await msg.edit({
                        content: updatedBoard,
                        components: []
                    });
                }

                let finalPosition = chipPositions[plinkoBoard.length - 1];
                let finalMultiplier = slots[Math.floor(finalPosition / (plinkoBoard[0].length / slots.length))];
                let profit = money * finalMultiplier;

                Schema.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, data) => {
                    if (data) {
                        if (finalMultiplier > 1) {
                            data.Money += parseInt(profit);
                        } else {
                            data.Money -= money;
                        }
                        data.save();
                    }
                });

                return client.embed({
                    desc: `Plinko Results for ${user}`,
                    fields: [
                        {
                            name: `Final Multiplier`,
                            value: `${finalMultiplier}x`,
                            inline: true,
                        },
                        {
                            name: `Profit/Loss`,
                            value: `${finalMultiplier > 1 ? `+${profit.toFixed(2)}` : `-${money}`}`,
                            inline: true,
                        }
                    ],
                    type: 'edit'
                }, msg);
            });

        } else {
            client.errNormal({ error: `You have no ${client.emotes.economy.coins}!`, type: 'editreply' }, interaction);
        }
    });
};
