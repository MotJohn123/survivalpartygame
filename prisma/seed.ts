import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const ember = await prisma.team.upsert({ where: { name: "Ohnivci" }, update: {}, create: { name: "Ohnivci", color: "#df633d" } });
  const leaf = await prisma.team.upsert({ where: { name: "Listy" }, update: {}, create: { name: "Listy", color: "#6d9c58" } });
  await prisma.team.upsert({ where: { name: "Příboj" }, update: {}, create: { name: "Příboj", color: "#5b8f9c" } });

  await prisma.player.upsert({ where: { name: "Test Ohnivec" }, update: { teamId: ember.id }, create: { name: "Test Ohnivec", teamId: ember.id } });
  await prisma.player.upsert({ where: { name: "Test List" }, update: { teamId: leaf.id }, create: { name: "Test List", teamId: leaf.id } });

  await prisma.task.upsert({ where: { taskCode: "OHEN" }, update: {}, create: { taskCode: "OHEN", taskText: "Najdi místo, kde se dnes večer potká celý kmen.", taskPoints: 10 } });
  await prisma.task.upsert({ where: { taskCode: "STOPA" }, update: {}, create: { taskCode: "STOPA", taskText: "Vyfoť stopu své výpravy a ukaž ji správci.", taskPoints: 15, repeatability: "MULTIPLE", maxCompletions: 2 } });
  await prisma.task.upsert({ where: { taskCode: "DAR" }, update: {}, create: { taskCode: "DAR", taskText: "Udělej někomu z kmene malou radost.", taskPoints: 20, isPublicQuest: true } });
}

main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
