import { $ } from "bun";

let date = new Date("2023-08-01T00:00:00Z");
const today = new Date(Date.now() - 12 * 3600e3);
while (date < today) {
  const dateString = date.toISOString().slice(0, 10);
  console.log(`::group::Loading data for ${dateString}`);
  try {
    await $`node src/load.ts ${dateString}`;
  } catch (error) {
    console.error(error);
  }
  console.log(`::endgroup::`);
  date.setDate(date.getDate() + 1);
}
