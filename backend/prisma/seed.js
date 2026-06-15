const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Dhruv', 'Kabir', 'Rishi', 'Ananya', 'Diya', 'Aditi', 'Priya', 'Riya', 'Aisha', 'Kavya', 'Neha', 'Sneha', 'Pooja', 'John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Jessica', 'Robert', 'Emma', 'William', 'Olivia', 'Joseph', 'Sophia', 'Charles', 'Isabella'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Das', 'Bose', 'Nair', 'Reddy', 'Rao', 'Yadav', 'Jain', 'Shah', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'New York', 'London', 'Toronto', 'Sydney'];
const tagsList = ['VIP', 'ChurnRisk', 'Frequent', 'DiscountSeeker', 'New', 'Loyal'];
const channels = ['Web', 'App', 'In-store'];
const items = ['Espresso', 'Latte', 'Cappuccino', 'Americano', 'Mocha', 'Macchiato', 'Flat White', 'Cold Brew', 'Frappuccino', 'Muffin', 'Croissant', 'Cookie', 'Sandwich'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('Seeding database with 1000 BrewCo customers...');

  await prisma.communicationLog.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  const customersData = [];
  for (let i = 0; i < 1000; i++) {
    const fName = randomElement(firstNames);
    const lName = randomElement(lastNames);
    const orderCount = randomInt(0, 50);
    const spend = orderCount === 0 ? 0 : randomInt(50, 1000) * orderCount;
    
    const lastOrderAt = orderCount > 0 ? randomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date()) : null;
    
    const numTags = randomInt(0, 2);
    let customerTags = [];
    for(let j=0; j<numTags; j++) {
      let t = randomElement(tagsList);
      if(!customerTags.includes(t)) customerTags.push(t);
    }

    customersData.push({
      name: `${fName} ${lName}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}.${randomInt(1, 9999)}@example.com`,
      phone: `+9198${randomInt(10000000, 99999999)}`,
      city: randomElement(cities),
      total_spend: spend,
      order_count: orderCount,
      last_order_at: lastOrderAt,
      tags: customerTags.join(','),
      created_at: randomDate(new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), lastOrderAt || new Date())
    });
  }

  const createdCustomers = await prisma.customer.createManyAndReturn({
    data: customersData
  });

  console.log(`Created ${createdCustomers.length} customers.`);

  console.log('Generating orders for customers...');
  const ordersData = [];
  
  for (const customer of createdCustomers) {
    for (let i = 0; i < customer.order_count; i++) {
      const numItems = randomInt(1, 4);
      let orderItems = [];
      for(let j=0; j<numItems; j++) orderItems.push(randomElement(items));
      
      const orderDate = randomDate(customer.created_at, customer.last_order_at);
      
      ordersData.push({
        customer_id: customer.id,
        amount: customer.total_spend / customer.order_count,
        items_json: JSON.stringify(orderItems),
        channel: randomElement(channels),
        created_at: orderDate
      });
    }
  }

  const chunkSize = 5000;
  for (let i = 0; i < ordersData.length; i += chunkSize) {
    const chunk = ordersData.slice(i, i + chunkSize);
    await prisma.order.createMany({
      data: chunk
    });
  }

  console.log(`Created ${ordersData.length} orders.`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
