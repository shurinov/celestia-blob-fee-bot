import { startBot as startFeeBot } from './bot.js';
import { startBot as startSizeBot } from './botBlobSize.js';
import indexerService from './services/indexerService.js';
import { runMigrations } from './scripts/runMigrations.js';


await runMigrations();

startFeeBot();
startSizeBot();

indexerService.startIndexing();
