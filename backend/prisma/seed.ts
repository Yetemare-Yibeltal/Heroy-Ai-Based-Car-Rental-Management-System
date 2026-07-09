import { PrismaClient, VehicleCategory, TransmissionType, FuelType, VehicleStatus, BookingStatus, PaymentStatus, PaymentMethod, Role, CouponType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ---------------------------------------------
  // Locations
  // ---------------------------------------------
  const downtown = await prisma.location.create({
    data: {
      name: 'HEROY Downtown',
      address: '142 Meskel Flower Rd',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      latitude: 9.0192,
      longitude: 38.7525,
      phone: '+251 11 555 0142',
    },
  });

  const airport = await prisma.location.create({
    data: {
      name: 'HEROY Bole Airport',
      address: 'Bole International Airport',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      latitude: 8.9779,
      longitude: 38.7993,
      phone: '+251 11 555 0199',
    },
  });

  // ---------------------------------------------
  // Users
  // ---------------------------------------------
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@heroy.example',
      password: passwordHash,
      firstName: 'Selam',
      lastName: 'Tesfaye',
      role: Role.SUPER_ADMIN,
      phone: '+251 91 234 5678',
      verificationStatus: 'APPROVED',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@heroy.example',
      password: passwordHash,
      firstName: 'Dawit',
      lastName: 'Bekele',
      role: Role.CUSTOMER,
      phone: '+251 92 345 6789',
      verificationStatus: 'APPROVED',
      driverLicenseNumber: 'ET-DL-2201938',
      licenseExpiry: new Date('2028-06-01'),
      loyaltyPoints: 120,
    },
  });

  // ---------------------------------------------
  // Vehicles
  // ---------------------------------------------
  const vehicleData = [
    { name: 'Aster Coupe', brand: 'Aster', category: VehicleCategory.ECONOMY, transmission: TransmissionType.AUTOMATIC, fuel: FuelType.PETROL, seats: 4, pricePerDay: 38, plate: 'HRY-AST-101', year: 2023 },
    { name: 'Ridgeline SUV', brand: 'Ridgeline', category: VehicleCategory.SUV, transmission: TransmissionType.AUTOMATIC, fuel: FuelType.DIESEL, seats: 5, pricePerDay: 72, plate: 'HRY-RDG-102', year: 2022 },
    { name: 'Solace EV', brand: 'Solace', category: VehicleCategory.ELECTRIC, transmission: TransmissionType.AUTOMATIC, fuel: FuelType.ELECTRIC, seats: 4, pricePerDay: 45, plate: 'HRY-SOL-103', year: 2024 },
    { name: 'Monarch Sedan', brand: 'Monarch', category: VehicleCategory.LUXURY, transmission: TransmissionType.AUTOMATIC, fuel: FuelType.HYBRID, seats: 5, pricePerDay: 128, plate: 'HRY-MON-104', year: 2023 },
    { name: 'Basecamp Van', brand: 'Basecamp', category: VehicleCategory.VAN, transmission: TransmissionType.MANUAL, fuel: FuelType.DIESEL, seats: 8, pricePerDay: 95, plate: 'HRY-BSC-105', year: 2021 },
    { name: 'Vantage GT', brand: 'Vantage', category: VehicleCategory.SPORTS, transmission: TransmissionType.AUTOMATIC, fuel: FuelType.PETROL, seats: 2, pricePerDay: 210, plate: 'HRY-VNT-106', year: 2024 },
    { name: 'Trailhead 4x4', brand: 'Trailhead', category: VehicleCategory.SUV, transmission: TransmissionType.MANUAL, fuel: FuelType.DIESEL, seats: 5, pricePerDay: 84, plate: 'HRY-TRL-107', year: 2022 },
    { name: 'Commuter Hatch', brand: 'Commuter', category: VehicleCategory.ECONOMY, transmission: TransmissionType.MANUAL, fuel: FuelType.PETROL, seats: 4, pricePerDay: 32, plate: 'HRY-CMT-108', year: 2021 },
  ];

  const vehicles = [];
  for (const [i, v] of vehicleData.entries()) {
    const vehicle = await prisma.vehicle.create({
      data: {
        ...v,
        status: VehicleStatus.AVAILABLE,
        mileage: 8000 + i * 1500,
        description: `The ${v.name} - a reliable ${v.category.toLowerCase()} vehicle ready for your next trip.`,
        locationId: i % 2 === 0 ? downtown.id : airport.id,
        images: {
          create: [{ url: `https://images.unsplash.com/photo-placeholder-${i}`, isPrimary: true }],
        },
      },
    });
    vehicles.push(vehicle);
  }

  // ---------------------------------------------
  // Coupon
  // ---------------------------------------------
  const coupon = await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      type: CouponType.PERCENTAGE,
      value: 10,
      maxUses: 100,
      expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    },
  });

  // ---------------------------------------------
  // Bookings
  // ---------------------------------------------
  const now = new Date();
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000);

  const completedBooking = await prisma.booking.create({
    data: {
      userId: customer.id,
      vehicleId: vehicles[0].id,
      locationId: downtown.id,
      startDate: daysFromNow(-20),
      endDate: daysFromNow(-17),
      totalPrice: vehicles[0].pricePerDay * 3,
      status: BookingStatus.COMPLETED,
      payment: {
        create: {
          amount: vehicles[0].pricePerDay * 3,
          status: PaymentStatus.PAID,
          method: PaymentMethod.CARD,
        },
      },
    },
  });

  await prisma.review.create({
    data: {
      userId: customer.id,
      vehicleId: vehicles[0].id,
      bookingId: completedBooking.id,
      rating: 5,
      comment: 'Smooth pickup, clean car, would rent again.',
    },
  });

  await prisma.booking.create({
    data: {
      userId: customer.id,
      vehicleId: vehicles[6].id,
      locationId: airport.id,
      startDate: daysFromNow(-2),
      endDate: daysFromNow(3),
      totalPrice: vehicles[6].pricePerDay * 5,
      status: BookingStatus.CONFIRMED,
      couponId: coupon.id,
      payment: {
        create: {
          amount: vehicles[6].pricePerDay * 5 * 0.9,
          status: PaymentStatus.PAID,
          method: PaymentMethod.CARD,
        },
      },
    },
  });

  await prisma.booking.create({
    data: {
      userId: customer.id,
      vehicleId: vehicles[4].id,
      locationId: downtown.id,
      startDate: daysFromNow(5),
      endDate: daysFromNow(8),
      totalPrice: vehicles[4].pricePerDay * 3,
      status: BookingStatus.PENDING,
    },
  });

  // ---------------------------------------------
  // Wishlist
  // ---------------------------------------------
  await prisma.wishlist.create({
    data: { userId: customer.id, vehicleId: vehicles[5].id },
  });

  console.log('Seed complete:');
  console.log(`  - ${vehicles.length} vehicles`);
  console.log(`  - 2 locations`);
  console.log(`  - 2 users (admin: admin@heroy.example / customer: customer@heroy.example, password: Password123!)`);
  console.log(`  - 3 bookings, 1 review, 1 coupon, 1 wishlist item`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
