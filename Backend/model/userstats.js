const mongoose = require("mongoose");

const UserStatsSchema = new mongoose.Schema(
    {
        created: { type: Date, required: true },
        accountId: { type: String, required: true, unique: true },
        // ON AJOUTE CES DEUX LIGNES ICI
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        // -------------------------
        solo: { type: Object, required: true },
        duo: { type: Object, required: true },
        trio: { type: Object, required: true },
        squad: { type: Object, required: true },
        ltm: { type: Object, required: true },
    },
    {
        collection: "userstats"
    }
);

// On exporte le modèle pour qu'il soit utilisable ailleurs
module.exports = mongoose.model("UserStatsSchema", UserStatsSchema);