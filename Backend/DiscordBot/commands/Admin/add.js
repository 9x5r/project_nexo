const { MessageEmbed } = require("discord.js");
const path = require("path");
const fs = require("fs");
const Users = require('../../../model/user.js');
const Profiles = require('../../../model/profiles.js');
const log = require("../../../structs/log.js");
const destr = require("destr");
const config = require('../../../Config/config.json');
const uuid = require("uuid");
const functions = require("../../../structs/functions.js");

module.exports = {
    commandInfo: {
        name: "add",
        description: "Allows you to give a user specific cosmetic packs or V-Bucks.",
        options: [
            {
                name: "pack",
                description: "The pack or currency you want to give",
                required: true,
                type: 3,
                choices: [
                    { name: "Donator Ultra", value: "full" },
                    { name: "Donator", value: "og" },
                    { name: "Donator +", value: "founder" }, 
                    { name: "V-Bucks", value: "vbucks" },
                    { name: "Single Item", value: "item" }
                ]
            },
            {
                name: "user",
                description: "The user you want to give the pack to",
                required: true,
                type: 6
            },
            {
                name: "amount",
                description: "The amount of V-Bucks to give (required if V-Bucks is selected)",
                required: false,
                type: 4
            },
            {
                name: "itemname",
                description: "The name of the item to give (required if Single Item is selected)",
                required: false,
                type: 3
            }
        ]
    },
    execute: async (interaction) => {
        if (!config.moderators.includes(interaction.user.id)) {
            return interaction.reply({ content: "You do not have moderator permissions.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const pack = interaction.options.getString('pack');
        const selectedUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const itemname = interaction.options.getString('itemname');
        const selectedUserId = selectedUser?.id;

        try {
            const targetUser = await Users.findOne({ discordId: selectedUserId });
            if (!targetUser) {
                return interaction.editReply({ content: "That user does not own an account" });
            }

            const profile = await Profiles.findOne({ accountId: targetUser.accountId });
            if (!profile) {
                return interaction.editReply({ content: "That user does not have a profile" });
            }

            if (pack === "item") {
                if (!itemname) {
                    return interaction.editReply({ content: "Please provide an item name." });
                }

                const response = await fetch(`https://fortnite-api.com/v2/cosmetics/br/search?name=${encodeURIComponent(itemname)}`);
                const json = await response.json();

                if (json.status !== 200 || !json.data) {
                    return interaction.editReply({ content: `Could not find the item "${itemname}".` });
                }

                const itemData = json.data;
                const allItems = destr(fs.readFileSync(path.join(__dirname, "../../../Config/DefaultProfiles/allathena.json"), 'utf8'));
                const allItemKeys = Object.keys(allItems.items);

                const foundKey = allItemKeys.find(key => key.toLowerCase().includes(itemData.id.toLowerCase()));

                if (!foundKey) {
                    return interaction.editReply({ content: `Item "${itemData.name}" found on API but not in backend database.` });
                }

                const cosmetic = allItems.items[foundKey];
                const athena = profile.profiles.athena;
                const common_core = profile.profiles.common_core;

                athena.items[foundKey] = cosmetic;

                const purchaseId = uuid.v4();
                common_core.items[purchaseId] = {
                    "templateId": `GiftBox:GB_MakeGood`,
                    "attributes": {
                        "fromAccountId": `[Administrator]`,
                        "lootList": [{
                            "itemType": cosmetic.templateId,
                            "itemGuid": cosmetic.templateId,
                            "quantity": 1
                        }],
                        "params": {
                            "userMessage": `Gifted ${itemData.name} `
                        },
                        "giftedOn": new Date().toISOString()
                    },
                    "quantity": 1
                };

                common_core.rvn += 1;
                common_core.commandRevision += 1;
                athena.rvn += 1;
                athena.commandRevision += 1;

                await Profiles.updateOne(
                    { accountId: targetUser.accountId },
                    { $set: { "profiles.athena": athena, "profiles.common_core": common_core } }
                );

                const embed = new MessageEmbed()
                    .setTitle("Item Granted")
                    .setDescription(`Successfully gave **${itemData.name}** to **${selectedUser.username}** via GiftBox.`)
                    .setThumbnail(itemData.images.icon)
                    .setColor("GREEN")
                    .setFooter({ text: "Project Galaxy", iconURL: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdKhIerd0T79ANGVJjz_br9-fW2Nn7-FHNo-0chdzOQw&s" })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            if (pack === "vbucks") {
                if (!amount || amount <= 0) {
                    return interaction.editReply({ content: "Please provide a valid V-Bucks amount." });
                }

                const common_core = profile.profiles["common_core"];
                const profile0 = profile.profiles["profile0"];

                if (!common_core.items["Currency:MtxPurchased"]) {
                    common_core.items["Currency:MtxPurchased"] = { templateId: "Currency:MtxPurchased", quantity: 0, attributes: {} };
                }
                if (!profile0.items["Currency:MtxPurchased"]) {
                    profile0.items["Currency:MtxPurchased"] = { templateId: "Currency:MtxPurchased", quantity: 0, attributes: {} };
                }

                common_core.items["Currency:MtxPurchased"].quantity += amount;
                profile0.items["Currency:MtxPurchased"].quantity += amount;

                const purchaseId = uuid.v4();
                common_core.items[purchaseId] = {
                    "templateId": `GiftBox:GB_MakeGood`,
                    "attributes": {
                        "fromAccountId": `[Administrator]`,
                        "lootList": [{
                            "itemType": "Currency:MtxGiveaway",
                            "itemGuid": "Currency:MtxGiveaway",
                            "quantity": amount
                        }],
                        "params": {
                            "userMessage": `Gifted V-Bucks `
                        },
                        "giftedOn": new Date().toISOString()
                    },
                    "quantity": 1
                };

                common_core.rvn += 1;
                common_core.commandRevision += 1;
                common_core.updated = new Date().toISOString();

                await Profiles.updateOne(
                    { accountId: targetUser.accountId },
                    {
                        $set: {
                            'profiles.common_core': common_core,
                            'profiles.profile0.items.Currency:MtxPurchased.quantity': profile0.items["Currency:MtxPurchased"].quantity
                        }
                    }
                );

                const embed = new MessageEmbed()
                    .setTitle("V-Bucks Added")
                    .setDescription(`Successfully added **${amount.toLocaleString()}** V-Bucks to **${selectedUser.username}**'s account.`)
                    .setThumbnail("https://i.imgur.com/yLbihQa.png")
                    .setColor("GREEN")
                    .setFooter({
                        text: "Project Galaxy",
                        iconURL: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdKhIerd0T79ANGVJjz_br9-fW2Nn7-FHNo-0chdzOQw&s"
                    })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            const allItems = destr(fs.readFileSync(path.join(__dirname, "../../../Config/DefaultProfiles/allathena.json"), 'utf8'));
            if (!allItems) {
                return interaction.editReply({ content: "Failed to parse allathena.json" });
            }

            let itemsToGive = {};

              const common_core = profile.profiles["common_core"];
                const profile0 = profile.profiles["profile0"];

            if (pack === "full") {
                itemsToGive = allItems.items;

                let loadouts = {};
                const currentItems = profile.profiles.athena.items || {};

                for (const key in currentItems) {
                    if (key.includes("loadout") || (currentItems[key].templateId && currentItems[key].templateId.startsWith("CosmeticLocker:"))) {
                        loadouts[key] = currentItems[key];
                    }
                }

                if (Object.keys(loadouts).length === 0) {
                    try {
                        const defaultAthena = destr(fs.readFileSync(path.join(__dirname, "../../../Config/DefaultProfiles/allathena.json"), 'utf8'));
                        if (defaultAthena && defaultAthena.items) {
                            for (const key in defaultAthena.items) {
                                if (key.includes("loadout") || (defaultAthena.items[key].templateId && defaultAthena.items[key].templateId.startsWith("CosmeticLocker:"))) {
                                    loadouts[key] = defaultAthena.items[key];
                                }
                            }
                        }
                    } catch (e) {
                        log.error("Failed to read default athena.json for loadout restoration", e);
                    }
                }

                itemsToGive = { ...itemsToGive, ...loadouts };

            } else if (pack === "og") {
                const ogIds = [
                    "AthenaCharacter:CID_033_Athena_Commando_F_Medieval",
                    "AthenaDance:EID_Hype"
                ];

                const allItemKeys = Object.keys(allItems.items);
                for (const id of ogIds) {
                    const foundKey = allItemKeys.find(key => key.toLowerCase() === id.toLowerCase());
                    if (foundKey) {
                        itemsToGive[foundKey] = allItems.items[foundKey];
                    }
                }

                itemsToGive = { ...profile.profiles.athena.items, ...itemsToGive };

            } else if (pack === "founder") {
                // Objets aléatoires mais facilement reconnaissables pour le Founder Pack
                const founderIds = [
                    "AthenaCharacter:CID_033_Athena_Commando_F_Medieval", 
                    "AthenaCharacter:CID_083_Athena_Commando_F_Tactical",    
                    "AthenaDance:EID_TakeTheL",                  
                    "AthenaDance:EID_GoodVibes",                  
                    "AthenaPickaxe:Pickaxe_ID_029_Assassin",                  
                    "AthenaPicake:Pickaxe_ID_015_HolidayCandyCane",                  
                    "AthenaGlider:Umbrella_Snowflake", 
                    "AthenaGlider:Umbrella_PaperParasol", 
                    "AthenaGlider:Umbrella_Season_04",
                    "AthenaGlider:Umbrella_Season_05",
                    "AthenaGlider:Umbrella_Season_06",
                    "AthenaGlider:Umbrella_Season_07",
                    "AthenaBackpack:BID_004_BlackKnight",               
                    "AthenaBackpack:BID_120_Werewolf"              
                ];

                const allItemKeys = Object.keys(allItems.items);
                for (const id of founderIds) {
                    const foundKey = allItemKeys.find(key => key.toLowerCase() === id.toLowerCase());
                    if (foundKey) {
                        itemsToGive[foundKey] = allItems.items[foundKey];
                    }
                }

                // Fusion avec le casier existant pour ne rien écraser
                itemsToGive = { ...profile.profiles.athena.items, ...itemsToGive };

              
                common_core.rvn += 1;
                common_core.commandRevision += 1;
                common_core.updated = new Date().toISOString();
            }

            // Préparation de la mise à jour de la BDD
            let updateQuery = { "profiles.athena.items": itemsToGive };

            // Si c'est le pack founder, on ajoute les profils de monnaie à la mise à jour
            if (pack === "founder") {
                updateQuery['profiles.common_core'] = profile.profiles.common_core;
                updateQuery['profiles.profile0.items.Currency:MtxPurchased.quantity'] = profile.profiles.profile0.items["Currency:MtxPurchased"].quantity;
            }

            await Profiles.updateOne(
                { accountId: targetUser.accountId },
                { $set: updateQuery }
            );

            // Gestion dynamique du nom du pack pour l'Embed
            let displayPackName = "";
            if (pack === "full") displayPackName = "Full Locker";
            else if (pack === "og") displayPackName = "OG Pack";
            else if (pack === "founder") displayPackName = "Founder Pack";

            const embed = new MessageEmbed()
                .setTitle(`${displayPackName} Added`)
                .setDescription(`Successfully added the **${displayPackName}** to **${selectedUser.username}**'s account.`)
                .setColor("GREEN")
                .setFooter({
                    text: "Project Galaxy",
                    iconURL: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdKhIerd0T79ANGVJjz_br9-fW2Nn7-FHNo-0chdzOQw&s"
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            log.error("An error occurred:", error);
            interaction.editReply({ content: "An error occurred while processing the request." });
        }
    }
};