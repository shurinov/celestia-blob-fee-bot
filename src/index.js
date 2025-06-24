import { startBot } from './bot.js';
import indexerService from './services/indexerService.js';
import { runMigrations } from './scripts/runMigrations.js';


await runMigrations();

//startBot();

indexerService.startIndexing();
