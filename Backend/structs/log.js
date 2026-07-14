const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./Config/config.json").toString());
const tui = require("./tui.js");

function getTimestamp() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US');
    const time = now.toLocaleTimeString();
    
    return `${date} ${time}`; 
}

function formatLog(prefixColor, prefix, ...args) {
    let msg = args.join(" ");
    let formattedMessage = `${prefixColor}[${getTimestamp()}] ${prefix}\x1b[0m: ${msg}`;
    tui.addLog(formattedMessage);
}

function backend(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[32m", "Backend Log", ...args);
    } else {
        tui.addLog(`\x1b[32mBackend Log\x1b[0m: ${msg}`);
    }
}

function bot(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[33m", "Discord Bot Log", ...args);
    } else {
        tui.addLog(`\x1b[33mDiscord Bot Log\x1b[0m: ${msg}`);
    }
}

function xmpp(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[34m", "Xmpp Log", ...args);
    } else {
        tui.addLog(`\x1b[34mXmpp Log\x1b[0m: ${msg}`);
    }
}

function error(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[31m", "Error Log", ...args);
    } else {
        tui.addLog(`\x1b[31mError Log\x1b[0m: ${msg}`);
    }
}

function debug(...args) {
    if (config.bEnableDebugLogs) {
        let msg = args.join(" ");
        if (config.bEnableFormattedLogs) {
            formatLog("\x1b[35m", "Debug Log", ...args);
        } else {
            tui.addLog(`\x1b[35mDebug Log\x1b[0m: ${msg}`);
        }
    }
}

function website(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[36m", "Website Log", ...args);
    } else {
        tui.addLog(`\x1b[36mWebsite Log\x1b[0m: ${msg}`);
    }
}

function AutoRotation(...args) {
    if (config.bEnableAutoRotateDebugLogs) {
        let msg = args.join(" ");
        if (config.bEnableFormattedLogs) {
            formatLog("\x1b[36m", "Item Shop Log", ...args);
        } else {
            tui.addLog(`\x1b[36mItem Shop Log\x1b[0m: ${msg}`);
        }
    }
}

function checkforupdate(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[33m", "Update Log", ...args);
    } else {
        tui.addLog(`\x1b[33mUpdate Log\x1b[0m: ${msg}`);
    }
}

function autobackendrestart(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[92m", "Auto Backend Restart Log", ...args);
    } else {
        tui.addLog(`\x1b[92mAuto Backend Restart\x1b[0m: ${msg}`);
    }
}

function calderaservice(...args) {
    let msg = args.join(" ");
    if (config.bEnableFormattedLogs) {
        formatLog("\x1b[91m", "Caldera Service Log", ...args);
    } else {
        tui.addLog(`\x1b[91mCaldera Service\x1b[0m: ${msg}`);
    }
}

module.exports = {
    backend,
    bot,
    xmpp,
    error,
    debug,
    website,
    AutoRotation,
    checkforupdate,
    autobackendrestart,
    calderaservice
};