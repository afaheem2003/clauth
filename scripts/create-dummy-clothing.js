const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const frontImage = 'https://kwxkbtblofiuxvxdlotc.supabase.co/storage/v1/object/public/clothingitemimages/users/cmau17pku0000pvo3yzraj54p/clothing/temp_1747777005008/front.png';
const backImage = 'https://kwxkbtblofiuxvxdlotc.supabase.co/storage/v1/object/public/clothingitemimages/users/cmau17pku0000pvo3yzraj54p/clothing/temp_1747777005008/back.png';

const itemTypes = ['T-Shirt', 'Hoodie', 'Sweater', 'Tank Top', 'Long Sleeve'];
const colors = ['Black', 'White', 'Gray', 'Navy', 'Red'];
const materials = ['Cotton', 'Polyester', 'Cotton Blend', 'Fleece', 'Jersey'];
const sizes = ['S', 'M', 'L', 'XL'];
const patterns = ['Solid', 'Striped', 'Graphic', 'Color Block'];
const styles = ['Casual', 'Streetwear', 'Athletic', 'Modern'];
const fits = ['Regular', 'Slim', 'Relaxed', 'Oversized'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomPrice() {
  return Math.floor(Math.random() * (8000 - 2000) + 2000) / 100; // Random price between $20 and $80
}

async function createDummyClothingItems() {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: {
        email: 'afaheem2003@gmail.com'
      }
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    // Create 10 dummy clothing items
    for (let i = 0; i < 10; i++) {
      const itemType = getRandomElement(itemTypes);
      const color = getRandomElement(colors);
      const material = getRandomElement(materials);
      const size = getRandomElement(sizes);
      const pattern = getRandomElement(patterns);
      const style = getRandomElement(styles);
      const fit = getRandomElement(fits);
      const price = generateRandomPrice();

      const clothingItem = await prisma.clothingItem.create({
        data: {
          name: `${color} ${pattern} ${itemType}`,
          itemType,
          description: `A beautiful ${fit} fit ${itemType.toLowerCase()} made with premium ${material.toLowerCase()}. Perfect for ${style.toLowerCase()} wear.`,
          frontImage,
          backImage,
          imageUrl: frontImage, // For backward compatibility
          material,
          size,
          color,
          pattern,
          style,
          fit,
          price,
          cost: price * 0.6, // 60% of price as cost
          isPublished: true,
          isDeleted: false,
          goal: 100,
          minimumGoal: 25,
          pledged: Math.floor(Math.random() * 50), // Random number of pledges
          status: 'PENDING',
          creator: {
            connect: {
              id: user.id
            }
          }
        }
      });

      console.log(`Created clothing item: ${clothingItem.name}`);
    }

    console.log('Successfully created dummy clothing items');
  } catch (error) {
    console.error('Error creating dummy clothing items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDummyClothingItems(); 