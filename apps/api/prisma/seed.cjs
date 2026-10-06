const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("node:crypto");

const prisma = new PrismaClient();

function createPasswordHash(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

const adminPermissions = [
  ["dashboard.read", "View dashboard", "Dashboard"],
  ["products.manage", "Manage products", "Products"],
  ["products.bulk-status", "Bulk update product status", "Products"],
  ["categories.manage", "Manage categories", "Categories"],
  ["orders.manage", "Manage orders", "Orders"],
  ["inventory.manage", "Manage inventory", "Inventory"],
  ["suppliers.manage", "Manage suppliers", "Suppliers"],
  ["delivery.manage", "Manage delivery", "Delivery"],
  ["delivery.complete", "Complete deliveries", "Delivery"],
  ["support.manage", "Manage support", "Support"],
  ["customers.manage", "Manage customers", "Customers"],
  ["coupons.manage", "Manage coupons", "Coupons"],
  ["promotions.manage", "Manage promotions", "Promotions"],
  ["refunds.manage", "Manage refunds and returns", "Refunds"],
  ["refunds.approve", "Approve refund requests", "Refunds"],
  ["refunds.process", "Process refund payouts", "Refunds"],
  ["finance.manage", "Manage finance", "Finance"],
  ["finance.reconcile", "Reconcile payments", "Finance"],
  ["audit.read", "Read audit logs", "Audit Logs"],
  ["content.manage", "Manage content", "Content"],
  ["reviews.manage", "Manage reviews", "Reviews"],
  ["loyalty.manage", "Manage loyalty and wallet", "Loyalty"],
  ["branches.manage", "Manage branches", "Branches"],
  ["integrations.manage", "Manage integrations", "Integrations"],
  ["legal.manage", "Manage legal pages", "Legal"],
  ["notifications.manage", "Manage notifications", "Notifications"],
  ["staff.manage", "Manage staff and permissions", "Staff"],
  ["staff.roles.manage", "Manage staff roles and permissions", "Staff"],
  ["reports.read", "Read reports", "Reports"],
  ["settings.manage", "Manage settings", "Settings"]
];

async function main() {
  const ownerRole = await prisma.adminRole.upsert({
    where: { name: "Owner" },
    update: {
      description: "Full platform access across client, operations, finance, staff, and system modules."
    },
    create: {
      name: "Owner",
      description: "Full platform access across client, operations, finance, staff, and system modules."
    }
  });

  for (const [key, label, module] of adminPermissions) {
    const permission = await prisma.adminPermission.upsert({
      where: { key },
      update: { label, module },
      create: { key, label, module }
    });

    await prisma.adminRolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: permission.id }
    });
  }

  const owner = await prisma.adminUser.upsert({
    where: { email: "owner@freshcart.local" },
    update: {
      name: "FreshCart Owner",
      status: "ACTIVE",
      twoFactorEnabled: true
    },
    create: {
      email: "owner@freshcart.local",
      name: "FreshCart Owner",
      passwordHash: createPasswordHash(process.env.SEED_ADMIN_PASSWORD || "Freshcart@12345"),
      status: "ACTIVE",
      twoFactorEnabled: true
    }
  });

  await prisma.adminUserRole.upsert({
    where: { adminUserId_roleId: { adminUserId: owner.id, roleId: ownerRole.id } },
    update: {},
    create: { adminUserId: owner.id, roleId: ownerRole.id }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
