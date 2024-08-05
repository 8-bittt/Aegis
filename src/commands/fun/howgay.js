module.exports = async (client, interaction, args) => {
    
    if (interaction.member.user.id === '700745506300887090') {
        var result = 100; 
    } else {
        var result = Math.ceil(Math.random() * 100); 
    }

    client.embed({
        title: `🏳️‍🌈・Gay rate`,
        desc: `You are ${result}% gay!`,
        type: 'editreply'
    }, interaction);
}

