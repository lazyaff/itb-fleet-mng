import prisma from "@/lib/prisma";
import { sendMail } from "@/utils/mailer";

/**
 * Email all active inspectors that the given vehicle parts have just gone
 * overdue. Called right after new `vehicle_alert` rows are created, so it
 * inherits the "fire exactly once per (vehicle, part) until reset" semantics
 * of the alert table (alerts are only created when none is active).
 *
 * Fully defensive: never throws and never blocks the caller's response on a
 * real failure — if SMTP isn't configured the underlying sendMail is a no-op.
 */
export async function notifyInspectorsOfOverdueParts(
  partIds: string[],
): Promise<void> {
  try {
    if (partIds.length === 0) return;

    const parts = await prisma.vehicle_part.findMany({
      where: { id: { in: partIds } },
      select: {
        name: true,
        vehicle: { select: { plate_number: true } },
      },
    });
    if (parts.length === 0) return;

    const inspectors = await prisma.user.findMany({
      where: { role_id: "INSP", active: true, deleted_at: null },
      select: { email: true },
    });

    const recipients = inspectors
      .map((i) => i.email)
      .filter((email): email is string => !!email);
    if (recipients.length === 0) return;

    for (const part of parts) {
      const plate = part.vehicle?.plate_number ?? "-";
      const line = `Vehicle ${plate} — ${part.name} service overdue`;
      await sendMail({
        to: recipients,
        subject: `Critical Alert: ${line}`,
        text: line,
      });
    }
  } catch (error) {
    console.error(
      "[alert] failed to notify inspectors of overdue parts:",
      error,
    );
  }
}
