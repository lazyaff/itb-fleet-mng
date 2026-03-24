import { PrismaClient } from "@prisma/client";

export async function inspectionItemSeeder(prisma: PrismaClient) {
  const sectionData = [
    {
      id: "8c1e2f4a-6b73-4d9a-8f2c-1a7e5d3b9c60",
      title: "Eksterior & Body",
      order: 1,
      icon: "inspection-section/icon-1.png",
    },
    {
      id: "f3a9d2c7-5b18-4e6f-9c4a-2d7b1e8f3a90",
      title: "Mekanis & Keamanan",
      order: 2,
      icon: "inspection-section/icon-2.png",
    },
    {
      id: "1d7c9a5e-4b62-4f3a-8e1d-6c2b9f7a3e40",
      title: "Interior & Elektronik",
      order: 3,
      icon: "inspection-section/icon-3.png",
    },
  ];

  const questionData = [
    // section 1
    {
      id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      section_id: "8c1e2f4a-6b73-4d9a-8f2c-1a7e5d3b9c60",
      title: "Kondisi Body & Cat (Penyok, Baret, Korosi)",
      order: 1,
    },
    {
      id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      section_id: "8c1e2f4a-6b73-4d9a-8f2c-1a7e5d3b9c60",
      title: "Kaca & Spion (Kaca Depan, Samping, Belakang)",
      order: 2,
    },
    {
      id: "d9b4e1c7-3a62-4f8d-9e5a-1c7b2d6f8a20",
      section_id: "8c1e2f4a-6b73-4d9a-8f2c-1a7e5d3b9c60",
      title: "Sistem Lampu (Utama, Sein, Rem, Mundur)",
      order: 3,
    },
    // section 2
    {
      id: "1f4e8c7a-7b1a-4b90-9b3f-0b8f8b3e0a11",
      section_id: "f3a9d2c7-5b18-4e6f-9c4a-2d7b1e8f3a90",
      title: "Kondisi Ban (Kedalaman Alur & Dinding Ban)",
      order: 1,
    },
    {
      id: "0c9c48c2-7f7d-4f09-9a7e-7a76f4c21c01",
      section_id: "f3a9d2c7-5b18-4e6f-9c4a-2d7b1e8f3a90",
      title: "Performa Pengereman (Pedal & Minyak Rem)",
      order: 2,
    },
    {
      id: "8b7df4a5-12a3-4c64-9d2c-cc20b0df8c88",
      section_id: "f3a9d2c7-5b18-4e6f-9c4a-2d7b1e8f3a90",
      title: "Mesin & Transmisi (Kebocoran, Suara, Indikator)",
      order: 3,
    },
    // section 3
    {
      id: "e5b4a94a-2f77-4b60-9d27-3e64c4f7a2a1",
      section_id: "1d7c9a5e-4b62-4f3a-8e1d-6c2b9f7a3e40",
      title: "AC & Sistem Pendingin Kabin",
      order: 1,
    },
  ];

  const optionData = [
    // 1.1
    {
      question_id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      label: "None",
      description: "Kondisi mulus sempurna.",
      value: 0,
      order: 1,
    },
    {
      question_id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      label: "Low",
      description: "Baret halus/halus (< 5cm) yang tidak terlalu terlihat.",
      value: 1,
      order: 2,
    },
    {
      question_id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      label: "Medium",
      description: "Ada penyok atau baret dalam yang memerlukan perbaikan cat.",
      value: 2,
      order: 3,
    },
    {
      question_id: "b5e3a7d9-2c61-4a8f-9b4e-7d1c6f2a8e50",
      label: "High",
      description:
        "Kerusakan struktural, bumper kendur, atau ada bagian tajam yang membahayakan.",
      value: 3,
      order: 4,
    },
    // 1.2
    {
      question_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      label: "None",
      description: "Jernih, tidak ada retak atau gompal.",
      value: 0,
      order: 1,
    },
    {
      question_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      label: "Low",
      description: "Baret halus/halus (< 5cm) yang tidak terlalu terlihat.",
      value: 1,
      order: 2,
    },
    {
      question_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      label: "Medium",
      description:
        "Ada retakan kecil (< 5cm) atau motor spion elektrik lambat.",
      value: 2,
      order: 3,
    },
    {
      question_id: "6a2f1c9e-8b47-4d3a-a6e1-5c9d2b7f4a30",
      label: "High",
      description:
        "Kaca retak besar, pecah, atau spion hilang/tidak bisa diatur.",
      value: 3,
      order: 4,
    },
    // 1.3
    {
      question_id: "d9b4e1c7-3a62-4f8d-9e5a-1c7b2d6f8a20",
      label: "None",
      description: "Semua lampu berfungsi normal dan terang.",
      value: 0,
      order: 1,
    },
    {
      question_id: "d9b4e1c7-3a62-4f8d-9e5a-1c7b2d6f8a20",
      label: "Low",
      description:
        "Mika lampu sedikit kusam/menguning tapi lampu tetap terang.",
      value: 1,
      order: 2,
    },
    {
      question_id: "d9b4e1c7-3a62-4f8d-9e5a-1c7b2d6f8a20",
      label: "Medium",
      description:
        "Ada satu lampu sekunder mati (misal: lampu plat nomor atau fog lamp).",
      value: 2,
      order: 3,
    },
    {
      question_id: "d9b4e1c7-3a62-4f8d-9e5a-1c7b2d6f8a20",
      label: "High",
      description:
        "Lampu utama, lampu sein, atau lampu rem mati. Bahaya Keselamatan.",
      value: 3,
      order: 4,
    },
    // 2.1
    {
      question_id: "1f4e8c7a-7b1a-4b90-9b3f-0b8f8b3e0a11",
      label: "None",
      description: "Ban baru atau alur sangat tebal.",
      value: 0,
      order: 1,
    },
    {
      question_id: "1f4e8c7a-7b1a-4b90-9b3f-0b8f8b3e0a11",
      label: "Low",
      description: "Aus merata, kedalaman alur sekitar 4mm-5mm.",
      value: 1,
      order: 2,
    },
    {
      question_id: "1f4e8c7a-7b1a-4b90-9b3f-0b8f8b3e0a11",
      label: "Medium",
      description:
        "Ban mulai tipis (3mm); perlu ganti dalam 1.000 km ke depan.",
      value: 2,
      order: 3,
    },
    {
      question_id: "1f4e8c7a-7b1a-4b90-9b3f-0b8f8b3e0a11",
      label: "High",
      description: "Ban botak (< 2mm), ada benjolan, atau kawat ban terlihat.",
      value: 3,
      order: 4,
    },
    // 2.2
    {
      question_id: "0c9c48c2-7f7d-4f09-9a7e-7a76f4c21c01",
      label: "None",
      description: "Pedal terasa padat, pengereman halus tanpa suara.",
      value: 0,
      order: 1,
    },
    {
      question_id: "0c9c48c2-7f7d-4f09-9a7e-7a76f4c21c01",
      label: "Low",
      description: "Ada sedikit debu rem atau bunyi mencit tipis saat pelan.",
      value: 1,
      order: 2,
    },
    {
      question_id: "0c9c48c2-7f7d-4f09-9a7e-7a76f4c21c01",
      label: "Medium",
      description:
        "Jarak injak pedal lebih dalam atau terdengar bunyi gesekan logam.",
      value: 2,
      order: 3,
    },
    {
      question_id: "0c9c48c2-7f7d-4f09-9a7e-7a76f4c21c01",
      label: "High",
      description:
        "Pedal rem 'ngempos', indikator minyak rem menyala, atau getar parah.",
      value: 3,
      order: 4,
    },
    // 2.3
    {
      question_id: "8b7df4a5-12a3-4c64-9d2c-cc20b0df8c88",
      label: "None",
      description:
        "Suara stasioner halus, tidak ada lampu peringatan di dashboard.",
      value: 0,
      order: 1,
    },
    {
      question_id: "8b7df4a5-12a3-4c64-9d2c-cc20b0df8c88",
      label: "Low",
      description: "Ada rembesan oli tipis (berkeringat) tapi tidak menetes.",
      value: 1,
      order: 2,
    },
    {
      question_id: "8b7df4a5-12a3-4c64-9d2c-cc20b0df8c88",
      label: "Medium",
      description: "Suara fan belt berdecit atau ada indikator 'Service Soon'.",
      value: 2,
      order: 3,
    },
    {
      question_id: "8b7df4a5-12a3-4c64-9d2c-cc20b0df8c88",
      label: "High",
      description:
        "Ada kebocoran oli aktif (menetes), lampu Check Engine menyala, atau mesin pincang.",
      value: 3,
      order: 4,
    },
    // 3.1
    {
      question_id: "e5b4a94a-2f77-4b60-9d27-3e64c4f7a2a1",
      label: "None",
      description: "AC sangat dingin dan hembusan kuat di semua kisi.",
      value: 0,
      order: 1,
    },
    {
      question_id: "e5b4a94a-2f77-4b60-9d27-3e64c4f7a2a1",
      label: "Low",
      description: "Ada sedikit bau kurang sedap atau hembusan agak berdebu.",
      value: 1,
      order: 2,
    },
    {
      question_id: "e5b4a94a-2f77-4b60-9d27-3e64c4f7a2a1",
      label: "Medium",
      description:
        "AC butuh waktu lama untuk dingin; filter kabin kemungkinan kotor.",
      value: 2,
      order: 3,
    },
    {
      question_id: "e5b4a94a-2f77-4b60-9d27-3e64c4f7a2a1",
      label: "High",
      description: "AC tidak dingin sama sekali atau kompresor bunyi kasar.",
      value: 3,
      order: 4,
    },
  ];

  console.log("Seeding inspection section...");
  await prisma.inspection_section.createMany({
    data: sectionData,
  });

  console.log("Seeding inspection question...");
  await prisma.inspection_question.createMany({
    data: questionData,
  });

  console.log("Seeding inspection option...");
  await prisma.inspection_option.createMany({
    data: optionData,
  });
}
