const express = require('express');
const router = express.Router();
const Profiles = require('../model/profiles');

const GS_SECRET          = 'celestia_secret_key';
const XP_PAR_PARTIE      = 7725;
const ETOILES_PAR_NIVEAU = 5;

// Formule XP exacte de la saison
function getXpCap(lvl) {
    if (lvl === 1) return 40000;
    if (lvl === 2) return 50000;
    if (lvl === 3) return 60000;
    if (lvl === 4) return 70000;
    if (lvl >= 5 && lvl < 100) return 80000;
    return 80000 + ((lvl - 100) * 250);
}

router.post('/gameserver/profile/update', async (req, res) => {
    try {
        if (req.headers['x-gs-secret'] !== GS_SECRET)
            return res.status(403).json({ error: 'Forbidden' });

        const { accountId } = req.body;
        if (!accountId) return res.status(400).json({ error: 'Missing accountId' });

        const doc = await Profiles.findOne({ accountId });
        if (!doc) return res.status(404).json({ error: 'Profile not found' });

        const athena = doc.profiles['athena'];
        if (!athena) return res.status(404).json({ error: 'Athena profile not found' });

        if (!athena.stats) athena.stats = { attributes: {} };
        if (!athena.stats.attributes) athena.stats.attributes = {};

        // XP résiduel : repart à 0 à chaque niveau
        let xp  = athena.stats.attributes.xp    || 0;
        let lvl = athena.stats.attributes.level  || 1;
        let levelsGained = 0;

        xp += XP_PAR_PARTIE;

        while (xp >= getXpCap(lvl)) {
            xp -= getXpCap(lvl);
            lvl++;
            levelsGained++;
        }

        athena.stats.attributes.xp           = xp;
        athena.stats.attributes.book_xp      = xp;
        athena.stats.attributes.level        = lvl;
        athena.stats.attributes.accountLevel = lvl;

        // Étoiles de combat = item AthenaSeasonToken:athenabattlestar
        let starsGained = 0;
        if (levelsGained > 0) {
            starsGained = ETOILES_PAR_NIVEAU * levelsGained;
            const starTemplateId = "AthenaSeasonToken:athenabattlestar";

            let starItemId = null;
            for (const [id, item] of Object.entries(athena.items || {})) {
                if (item.templateId && item.templateId.toLowerCase() === starTemplateId.toLowerCase()) {
                    starItemId = id;
                    break;
                }
            }

            if (starItemId) {
                athena.items[starItemId].quantity = (athena.items[starItemId].quantity || 0) + starsGained;
            } else {
                athena.items[starTemplateId] = {
                    templateId: starTemplateId,
                    attributes: { max_level_bonus: 0, level: 1, item_seen: true, xp: 0, favorite: false },
                    quantity: starsGained,
                };
            }
        }

        athena.rvn             = (athena.rvn || 0) + 1;
        athena.commandRevision = (athena.commandRevision || 0) + 1;
        athena.updated         = new Date().toISOString();

        doc.markModified('profiles');
        await doc.save();

        console.log(`[GS] ${accountId} | +${XP_PAR_PARTIE} XP → xp:${xp} NIV.${lvl} | +${starsGained} étoiles`);

        return res.json({
            status: 'ok',
            xpGained: XP_PAR_PARTIE,
            newXP: xp,
            newLevel: lvl,
            starsGained,
        });

    } catch (err) {
        console.error('[GS] Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;