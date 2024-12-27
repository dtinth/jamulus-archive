import { $ } from "bun";

let date = new Date(Date.now() - 60 * 24 * 3600e3);
date.setUTCHours(0, 0, 0, 0);

const today = new Date(Date.now() - 12 * 3600e3);
while (date < today) {
  const dateString = date.toISOString().slice(0, 10);
  console.log(`::group::Loading data for ${dateString}`);
  try {
    await $`bun src/load.ts ${dateString}`;
  } catch (error) {
    console.error(error);
  }
  console.log(`::endgroup::`);
  date.setDate(date.getDate() + 1);
}
