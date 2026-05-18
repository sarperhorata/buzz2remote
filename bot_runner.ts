import { runWellfoundBot } from './lib/wellfound/runner';

async function main() {
  const stats = await runWellfoundBot();
  console.log(JSON.stringify(stats, null, 2));
}

main().catch(console.error);
