import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

export async function liveTrackSeeder(prisma: PrismaClient) {
  console.log("Seeding live tracks...");

  const vehicles = await prisma.vehicle.findMany({
    where: {
      deleted_at: null,
    },
    include: {
      gps_tracker: true,
    },
  });

  const allTracks: any[] = [];

  for (const [vehicleIdx, vehicle] of vehicles.entries()) {
    if (!vehicle.gps_tracker_id || !vehicle.gps_tracker) continue;

    // 2 vehicle terakhir = status akhir stopped
    const finalStopped = vehicleIdx >= vehicles.length - 2;

    // 2 vehicle awal = status akhir moving
    const finalMoving = vehicleIdx < 2;

    // base area
    const baseLat = -6.9005 + Math.random() * 0.01;
    const baseLng = 107.608 + Math.random() * 0.01;

    let currentLat = baseLat;
    let currentLng = baseLng;

    let mileage = vehicle.current_mileage;

    // arah awal random
    let direction = Math.random() * 360;

    // bikin 80 titik biar playback lebih hidup
    for (let i = 0; i < 80; i++) {
      let moving = i % 10 !== 0;

      // KHUSUS DATA TERAKHIR
      if (i === 79) {
        if (finalStopped) {
          moving = false;
        }

        if (finalMoving) {
          moving = true;
        }
      }

      if (moving) {
        // kadang belok dikit
        const randomTurn = Math.random();

        if (randomTurn > 0.7) {
          direction += Math.random() > 0.5 ? 15 : -15;
        }

        // kadang belok agak besar
        if (randomTurn > 0.93) {
          direction += Math.random() > 0.5 ? 35 : -35;
        }

        // normalize
        if (direction >= 360) direction -= 360;
        if (direction < 0) direction += 360;

        const rad = (direction * Math.PI) / 180;

        // pergerakan lebih kerasa
        // tapi masih realistis
        const distance = 0.0002 + Math.random() * 0.00015;

        currentLat += Math.cos(rad) * distance;
        currentLng += Math.sin(rad) * distance;

        mileage += Math.floor(Math.random() * 120 + 40);
      }

      const speed = moving ? Math.floor(Math.random() * 50 + 25) : 0;

      const createdAt = new Date(Date.now() - (80 - i) * 60 * 1000);

      allTracks.push({
        id: randomUUID(),
        vehicle_id: vehicle.id,
        gps_tracker_id: vehicle.gps_tracker_id,

        speed,
        battery_voltage: 12,

        lat: Number(currentLat.toFixed(6)),
        long: Number(currentLng.toFixed(6)),

        angle: Math.round(direction),

        ignition: moving,
        movement: moving,

        gsm_signal_strength: Math.floor(Math.random() * 5 + 1),

        total_mileage: mileage,

        created_at: createdAt,
        updated_at: createdAt,

        deleted_at: null,
      });
    }
  }

  await prisma.live_track_history.createMany({
    data: allTracks,
  });
}
