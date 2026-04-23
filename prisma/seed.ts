import bcrypt from "bcryptjs";
import { PrismaClient, Role, LeadStatus, PropertyStatus, ActivityType, CommissionStatus, MessageChannel, MessageDirection } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { slug: "horizon-realty" },
    update: {},
    create: {
      name: "Horizon Realty",
      slug: "horizon-realty",
      settings: {
        brandColor: "#0f766e",
        locale: "en-US",
        currency: "USD",
      },
    },
  });

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const [admin, manager, agent] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@horizonrealty.com" },
      update: { companyId: company.id },
      create: {
        companyId: company.id,
        name: "Ava Collins",
        email: "admin@horizonrealty.com",
        passwordHash,
        role: Role.ADMIN,
        phone: "+15550000001",
      },
    }),
    prisma.user.upsert({
      where: { email: "manager@horizonrealty.com" },
      update: { companyId: company.id },
      create: {
        companyId: company.id,
        name: "Noah Bennett",
        email: "manager@horizonrealty.com",
        passwordHash,
        role: Role.MANAGER,
        phone: "+15550000002",
      },
    }),
    prisma.user.upsert({
      where: { email: "agent@horizonrealty.com" },
      update: { companyId: company.id },
      create: {
        companyId: company.id,
        name: "Mia Parker",
        email: "agent@horizonrealty.com",
        passwordHash,
        role: Role.AGENT,
        phone: "+15550000003",
      },
    }),
  ]);

  const property = await prisma.property.upsert({
    where: { referenceCode: "HZ-APT-001" },
    update: {},
    create: {
      companyId: company.id,
      listedById: agent.id,
      title: "Downtown Skyline Apartment",
      description: "Modern 3-bedroom apartment with skyline views and concierge service.",
      propertyType: "Apartment",
      location: "Downtown",
      address: "120 Market Street, Suite 14A",
      price: 420000,
      bedrooms: 3,
      bathrooms: 2,
      areaSqm: 148,
      status: PropertyStatus.ACTIVE,
      referenceCode: "HZ-APT-001",
      imageUrls: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
      ],
    },
  });

  const lead = await prisma.lead.upsert({
    where: { id: "cm9samplelead0000000000001" },
    update: {},
    create: {
      id: "cm9samplelead0000000000001",
      companyId: company.id,
      assignedToId: agent.id,
      propertyId: property.id,
      fullName: "Liam Carter",
      email: "liam.carter@example.com",
      phone: "+15551112222",
      source: "Website",
      status: LeadStatus.QUALIFIED,
      budget: 450000,
      location: "Downtown",
      propertyType: "Apartment",
      intent: "buy",
      notes: "Interested in moving within 30 days.",
      aiScore: 82,
      aiClassification: "hot",
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        companyId: company.id,
        leadId: lead.id,
        userId: agent.id,
        type: ActivityType.CALL,
        note: "Initial qualification call completed.",
      },
      {
        companyId: company.id,
        leadId: lead.id,
        userId: manager.id,
        type: ActivityType.STATUS_CHANGE,
        note: "Lead moved to QUALIFIED.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.commission.create({
    data: {
      companyId: company.id,
      userId: agent.id,
      leadId: lead.id,
      amount: 7500,
      status: CommissionStatus.PENDING,
    },
  }).catch(() => undefined);

  await prisma.message.create({
    data: {
      companyId: company.id,
      leadId: lead.id,
      userId: agent.id,
      channel: MessageChannel.EMAIL,
      direction: MessageDirection.OUTBOUND,
      content: "Sending property brochure and scheduling an in-person visit.",
      metadata: {
        subject: "Property brochure",
      },
    },
  }).catch(() => undefined);

  console.log("Seed completed");
  console.log({
    company: company.slug,
    credentials: [
      { role: "ADMIN", email: admin.email, password: "Password123!" },
      { role: "MANAGER", email: manager.email, password: "Password123!" },
      { role: "AGENT", email: agent.email, password: "Password123!" },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

