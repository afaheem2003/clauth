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
  return Math.floor(Math.random() * (150 - 30) + 30);
}

function generateRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
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

    // Create items with CONCEPT status (just ideas, no price or quantities)
    for (let i = 0; i < 5; i++) {
      const itemType = getRandomElement(itemTypes);
      const color = getRandomElement(colors);
      const material = getRandomElement(materials);
      const pattern = getRandomElement(patterns);
      const style = getRandomElement(styles);
      const fit = getRandomElement(fits);

      await prisma.clothingItem.create({
        data: {
          name: `${color} ${pattern} ${itemType}`,
          itemType,
          description: `A beautiful ${fit} fit ${itemType.toLowerCase()} made with premium ${material.toLowerCase()}. Perfect for ${style.toLowerCase()} wear.`,
          frontImage,
          backImage,
          imageUrl: frontImage,
          material,
          color,
          pattern,
          style,
          fit,
          isPublished: true,
          isDeleted: false,
          status: 'CONCEPT',
          creator: {
            connect: {
              id: user.id
            }
          }
        }
      });
    }

    // Create items with SELECTED status (upcoming drops)
    for (let i = 0; i < 5; i++) {
      const itemType = getRandomElement(itemTypes);
      const color = getRandomElement(colors);
      const material = getRandomElement(materials);
      const pattern = getRandomElement(patterns);
      const style = getRandomElement(styles);
      const fit = getRandomElement(fits);
      const price = generateRandomPrice();
      const totalQuantity = Math.floor(Math.random() * (200 - 50) + 50);
      const dropDate = generateRandomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Next 30 days

      await prisma.clothingItem.create({
        data: {
          name: `${color} ${pattern} ${itemType}`,
          itemType,
          description: `A beautiful ${fit} fit ${itemType.toLowerCase()} made with premium ${material.toLowerCase()}. Perfect for ${style.toLowerCase()} wear.`,
          frontImage,
          backImage,
          imageUrl: frontImage,
          material,
          color,
          pattern,
          style,
          fit,
          price,
          isPublished: true,
          isDeleted: false,
          status: 'SELECTED',
          totalQuantity,
          dropDate,
          creator: {
            connect: {
              id: user.id
            }
          }
        }
      });
    }

    // Create items with AVAILABLE status (currently for sale)
    for (let i = 0; i < 5; i++) {
      const itemType = getRandomElement(itemTypes);
      const color = getRandomElement(colors);
      const material = getRandomElement(materials);
      const pattern = getRandomElement(patterns);
      const style = getRandomElement(styles);
      const fit = getRandomElement(fits);
      const price = generateRandomPrice();
      const totalQuantity = Math.floor(Math.random() * (200 - 50) + 50);
      const soldQuantity = Math.floor(Math.random() * totalQuantity);
      const batchNumber = Math.floor(Math.random() * 5) + 1;

      await prisma.clothingItem.create({
        data: {
          name: `${color} ${pattern} ${itemType}`,
          itemType,
          description: `A beautiful ${fit} fit ${itemType.toLowerCase()} made with premium ${material.toLowerCase()}. Perfect for ${style.toLowerCase()} wear.`,
          frontImage,
          backImage,
          imageUrl: frontImage,
          material,
          color,
          pattern,
          style,
          fit,
          price,
          isPublished: true,
          isDeleted: false,
          status: 'AVAILABLE',
          totalQuantity,
          soldQuantity,
          batchNumber,
          creator: {
            connect: {
              id: user.id
            }
          }
        }
      });
    }

    console.log('Successfully created dummy clothing items');
  } catch (error) {
    console.error('Error creating dummy clothing items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDummyClothingItems(); 