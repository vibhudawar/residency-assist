import { resetDemo } from "@/lib/demo/reset";

/** The live demo shares this database: leave it as judges should find it, with the seven demo cases. */
export default async function teardown() {
  await resetDemo();
}
