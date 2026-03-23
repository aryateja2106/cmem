/**
 * worker command — manage the memory worker background process.
 * cmem worker status | start | stop | restart | branch
 */

import type { Command } from 'commander';
import { loadConfig } from '../config.js';
import { createMemoryClient } from '../client-factory.js';
import { detectOutputMode, outputJSON, outputError, outputSuccess } from '../output.js';
import { CLIError, ExitCode } from '../errors.js';

interface WorkerOpts {
  json?: boolean;
}

export function registerWorkerCommand(program: Command): void {
  const workerCmd = program
    .command('worker')
    .description('Manage the memory worker background process');

  workerCmd
    .command('status')
    .description('Check if the worker is running')
    .option('--json', 'output as JSON for agent use')
    .action(async (opts: WorkerOpts) => {
      const mode = detectOutputMode({ json: opts.json });
      try {
        const config = loadConfig();
        const client = createMemoryClient(config);
        const healthy = await client.isHealthy();

        if (mode === 'agent') {
          outputJSON({ running: healthy, url: config.baseUrl });
        } else {
          if (healthy) {
            process.stdout.write(`Worker running at ${config.baseUrl}\n`);
          } else {
            process.stdout.write(`Worker not running at ${config.baseUrl}\n`);
            process.stdout.write(`  Hint: install and start the memory worker to use cmem\n`);
          }
        }
      } catch (err) {
        const cliErr = err instanceof CLIError
          ? err
          : new CLIError((err as Error).message, ExitCode.INTERNAL_ERROR);
        outputError(cliErr, mode);
        process.exit(cliErr.code);
      }
    });

  workerCmd
    .command('branch')
    .description('Show the current worker branch status')
    .option('--json', 'output as JSON for agent use')
    .action(async (opts: WorkerOpts) => {
      const mode = detectOutputMode({ json: opts.json });
      try {
        const client = createMemoryClient(loadConfig());
        const branch = await client.getBranchStatus();

        if (mode === 'agent') {
          outputJSON(branch);
        } else {
          process.stdout.write(`Branch: ${branch.branch}`);
          if (branch.isDefault) process.stdout.write(' (default)');
          process.stdout.write('\n');
        }
      } catch (err) {
        const cliErr = err instanceof CLIError
          ? err
          : new CLIError((err as Error).message, ExitCode.INTERNAL_ERROR);
        outputError(cliErr, mode);
        process.exit(cliErr.code);
      }
    });

  workerCmd
    .command('start')
    .description('Show how to start the memory worker')
    .action(() => {
      process.stdout.write(`cmem does not manage the worker process directly.\n\n`);
      process.stdout.write(`If you use claude-mem, the worker starts automatically when you open a Claude Code session.\n`);
      process.stdout.write(`You can also start it manually:\n\n`);
      process.stdout.write(`  cd ~/.claude/plugins/marketplaces/thedotmack\n`);
      process.stdout.write(`  node plugin/scripts/worker-service.cjs start\n\n`);
      process.stdout.write(`Check status with: cmem worker status\n`);
    });

  workerCmd
    .command('stop')
    .description('Show how to stop the memory worker')
    .action(() => {
      process.stdout.write(`cmem does not manage the worker process directly.\n\n`);
      process.stdout.write(`If you use claude-mem:\n\n`);
      process.stdout.write(`  cd ~/.claude/plugins/marketplaces/thedotmack\n`);
      process.stdout.write(`  node plugin/scripts/worker-service.cjs stop\n\n`);
      process.stdout.write(`Or find and kill the process:\n\n`);
      process.stdout.write(`  lsof -i :37777\n`);
    });
}
