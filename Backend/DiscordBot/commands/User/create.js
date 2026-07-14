const { MessageEmbed } = require("discord.js");
const User = require("../../../model/user.js")
const functions = require("../../../structs/functions.js");

module.exports = {
    commandInfo: {
        name: "create",
        description: "Creates an account",
        options: [
            {
                name: "email",
                description: "Your email.",
                required: true,
                type: 3
            },
            // L'option "username" a été retirée ici
            {
                name: "password",
                description: "Your password.",
                required: true,
                type: 3
            }
        ],
    },
    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;

        const discordId = interaction.user.id;
        const email = options.get("email").value;
        const password = options.get("password").value;

        // Récupère automatiquement le nom d'utilisateur Discord unique (pas le surnom)
        const username = interaction.user.username;

        const existingEmail = await User.findOne({ email: email });
        const existingUser = await User.findOne({ username: username });

        const emailFilter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (!emailFilter.test(email)) {
            return interaction.editReply({ content: "You did not provide a valid email address!", ephemeral: true });
        }
        if (existingEmail) {
            return interaction.editReply({ content: "Email is already in use, please choose another one.", ephemeral: true });
        }
        if (existingUser) {
            return interaction.editReply({ content: "Your Discord username is already registered on a backend account.", ephemeral: true });
        }
        
        // Les limites de Discord sont de 2 à 32 caractères. On adapte les messages si ça dépasse tes limites.
        if (username.length >= 25) {
            return interaction.editReply({ content: "Your Discord username is too long (must be less than 25 characters). Please change it on Discord first.", ephemeral: true });
        }
        if (username.length < 3) {
            return interaction.editReply({ content: "Your Discord username is too short (must be at least 3 characters long).", ephemeral: true });
        }
        
        if (password.length >= 128) {
            return interaction.editReply({ content: "Your password must be less than 128 characters long.", ephemeral: true });
        }
        if (password.length < 4) {
            return interaction.editReply({ content: "Your password must be at least 4 characters long.", ephemeral: true });
        }

        await functions.registerUser(discordId, username, email, password).then(resp => {
            let embed = new MessageEmbed()
            .setColor(resp.status >= 400 ? "#ff0000" : "#56ff00")
            .setThumbnail(interaction.user.avatarURL({ format: 'png', dynamic: true, size: 256 }))
            .addFields({
                name: "Message",
                value: "Successfully created an account.",
            }, {
                name: "Username",
                value: username,
            }, {
                name: "Discord Tag",
                value: interaction.user.tag,
            })
            .setTimestamp()
            .setFooter({
                text: "Project Galaxy",
                iconURL: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdKhIerd0T79ANGVJjz_br9-fW2Nn7-FHNo-0chdzOQw&s",
            });

            if (resp.status >= 400) return interaction.editReply({ embeds: [embed], ephemeral: true });

            (interaction.channel ? interaction.channel : interaction.user).send({ embeds: [embed] });
            interaction.editReply({ content: "You successfully created an account!", ephemeral: true });
        });
    }
}