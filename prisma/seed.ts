import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = "demo-user";

  // Create 3 historical lab reports for testing
  const reports = [
    {
      userId,
      title: "CBC Panel — Cleveland Clinic",
      date: new Date("2024-01-15"),
      hospital: "Cleveland Clinic",
      doctor: "Dr. Smith",
      rawExtract: JSON.stringify({
        hospital: "Cleveland Clinic",
        doctor: "Dr. Smith",
        date: "2024-01-15",
        title: "CBC Panel",
        parameters: [
          { name: "Hemoglobin", value: 13.2, unit: "g/dL", referenceRange: "12-16" },
          { name: "White Blood Cell Count", value: 6.5, unit: "K/µL", referenceRange: "4.5-11.0" },
          { name: "Platelet Count", value: 250, unit: "K/µL", referenceRange: "150-450" },
        ],
      }),
      parameters: JSON.stringify({
        Hemoglobin: { value: 13.2, unit: "g/dL", referenceRange: "12-16" },
        "White Blood Cell Count": { value: 6.5, unit: "K/µL", referenceRange: "4.5-11.0" },
        "Platelet Count": { value: 250, unit: "K/µL", referenceRange: "150-450" },
      }),
    },
    {
      userId,
      title: "CBC Panel — Cleveland Clinic",
      date: new Date("2024-03-20"),
      hospital: "Cleveland Clinic",
      doctor: "Dr. Smith",
      rawExtract: JSON.stringify({
        hospital: "Cleveland Clinic",
        doctor: "Dr. Smith",
        date: "2024-03-20",
        title: "CBC Panel",
        parameters: [
          { name: "Hemoglobin", value: 14.1, unit: "g/dL", referenceRange: "12-16" },
          { name: "White Blood Cell Count", value: 7.2, unit: "K/µL", referenceRange: "4.5-11.0" },
          { name: "Platelet Count", value: 280, unit: "K/µL", referenceRange: "150-450" },
        ],
      }),
      parameters: JSON.stringify({
        Hemoglobin: { value: 14.1, unit: "g/dL", referenceRange: "12-16" },
        "White Blood Cell Count": { value: 7.2, unit: "K/µL", referenceRange: "4.5-11.0" },
        "Platelet Count": { value: 280, unit: "K/µL", referenceRange: "150-450" },
      }),
    },
    {
      userId,
      title: "Lipid Panel — Mayo Clinic",
      date: new Date("2024-06-10"),
      hospital: "Mayo Clinic",
      doctor: "Dr. Johnson",
      rawExtract: JSON.stringify({
        hospital: "Mayo Clinic",
        doctor: "Dr. Johnson",
        date: "2024-06-10",
        title: "Lipid Panel",
        parameters: [
          { name: "Total Cholesterol", value: 180, unit: "mg/dL", referenceRange: "<200" },
          { name: "HDL Cholesterol", value: 55, unit: "mg/dL", referenceRange: ">40" },
          { name: "LDL Cholesterol", value: 110, unit: "mg/dL", referenceRange: "<100" },
        ],
      }),
      parameters: JSON.stringify({
        "Total Cholesterol": { value: 180, unit: "mg/dL", referenceRange: "<200" },
        "HDL Cholesterol": { value: 55, unit: "mg/dL", referenceRange: ">40" },
        "LDL Cholesterol": { value: 110, unit: "mg/dL", referenceRange: "<100" },
      }),
    },
  ];

  for (const report of reports) {
    await prisma.labReport.create({
      data: report,
    });
  }

  console.log("✓ Seeded 3 lab reports");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

