/**
 * Manual test harness for the Jobgether scraper.
 *
 * Usage:
 *   npx tsx scripts/scrape-jobgether-test.ts
 *   npx tsx scripts/scrape-jobgether-test.ts "https://jobgether.com/offer/<id>-<slug>"
 *
 * Prints the scraped JobgetherJobData (including the recovered apply URL,
 * if any) as JSON to stdout.
 */
import { scrapeJobgetherJob } from "./jobgether-scraper";

const DEFAULT_URL =
  "https://jobgether.com/offer/69feb8788444a8266553aefa-product-manager";

async function main() {
  const url = process.argv[2] ?? DEFAULT_URL;
  console.error(`[test] scraping ${url}`);
  const data = await scrapeJobgetherJob(url);
  console.log(JSON.stringify(data, null, 2));
  if (!data) process.exit(1);
}

main().catch((err) => {
  console.error("[test] failed:", err);
  process.exit(1);
});
