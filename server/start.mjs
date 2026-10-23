import {startServer,configFromEnv} from './spongebot.mjs';
try {const config=configFromEnv();await startServer(config);console.log(`SpongeBot API listening on port ${config.port}; configured=${Boolean(config.token&&config.key)}`);}catch(error){console.error(error.message);process.exit(1);}
