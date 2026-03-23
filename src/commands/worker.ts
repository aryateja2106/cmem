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

  // start/stop/restart are pass-through notes — the worker is managed externally, not by cmem
  workerCmd
    .command('start')
    .description('Start the memory worker (if installed)')
    .action(() => {
      outputSuccess(
        'To start the worker, run: cmem worker start (refer to your memory worker docs)',
        'human',
      );
    });

  workerCmd
    .command('stop')
    .description('Stop the memory worker')
    .action(() => {
      outputSuccess(
        'To stop the worker, refer to your memory worker documentation.',
        'human',
      );
    });
}
