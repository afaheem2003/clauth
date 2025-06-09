const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const frontImage = 'https://kwxkbtblofiuxvxdlotc.supabase.co/storage/v1/object/public/clothingitemimages/users/cmau17pku0000pvo3yzraj54p/clothing/temp_1747777005008/front.png';
const backImage = 'https://kwxkbtblofiuxvxdlotc.supabase.co/storage/v1/object/public/clothingitemimages/users/cmau17pku0000pvo3yzraj54p/clothing/temp_1747777005008/back.png';

const itemTypes = ['T-Shirt', 'Hoodie', 'Sweater', 'Tank Top', 'Long Sleeve', 'Dress', 'Jeans', 'Jacket', 'Shorts', 'Blazer'];
const colors = ['Black', 'White', 'Gray', 'Navy', 'Red', 'Blue', 'Green', 'Pink', 'Brown', 'Beige'];
const materials = ['Cotton', 'Polyester', 'Cotton Blend', 'Fleece', 'Jersey', 'Denim', 'Wool', 'Linen'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const patterns = ['Solid', 'Striped', 'Graphic', 'Color Block', 'Floral', 'Polka Dot', 'Plaid'];
const styles = ['Casual', 'Streetwear', 'Athletic', 'Modern', 'Formal', 'Business', 'Vintage'];
const fits = ['Regular', 'Slim', 'Relaxed', 'Oversized', 'Fitted'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomPrice() {
  // Return as string to be converted to Decimal
  return (Math.floor(Math.random() * (150 - 30) + 30)).toString();
}

function generateRandomCost() {
  // Generate cost that's typically 40-60% of price
  return (Math.floor(Math.random() * (60 - 20) + 20)).toString();
}

function generateRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateRandomRating() {
  // Generate rating between 3.0 and 5.0
  return Math.round((Math.random() * 2 + 3) * 10) / 10;
}

async function createDummyClothingItems() {
  try {
    // Find the user by email - update this to your email or use a different method
    const user = await prisma.user.findUnique({
      where: {
        email: 'afaheem2003@gmail.com'
      }
    });

    if (!user) {
      console.error('User not found. Please update the email in the script or create a user first.');
      return;
    }

    console.log(`Creating dummy clothing items for user: ${user.email}`);

    // Create items with CONCEPT status (just ideas, no price or quantities)
    console.log('Creating CONCEPT items...');
    for (let i = 0; i < 8; i++) {
      const itemType = getRandomElement(itemTypes);
      const color = getRandomElement(colors);
      const material = getRandomElement(materials);
      const pattern = getRandomElement(patterns);
      const style = getRandomElement(styles);
      const fit = getRandomElement(fits);
      const size = getRandomElement(sizes);

      await prisma.clothingItem.create({
        data: {
          name: `${color} ${pattern} ${itemType}`,
          itemType,
          description: `A beautiful ${fit} fit ${itemType.toLowerCase()} made with premium ${material.toLowerCase()}. Perfect for ${style.toLowerCase()} wear with a ${pattern.toLowerCase()} pattern.`,
          frontImage,
          backImage,
          imageUrl: frontImage, // Keep for backward compatibility
          material,
          size,
          color,
          pattern,
          style,
          fit,
          cost: generateRandomCost(),
          isPublished: true,
          isFeatured: Math.random() > 0.8, // 20% chance of being featured
          isDeleted: false,
          status: 'CONCEPT', // Enum value
          inStock: true,
          creator: {
            connect: {
              id: user.id
            }
          }
        }
      });
    }

    // Create items with SELECTED status (upcoming drops)
    console.log('Creating SELECTED items...');
    for (let i = 0; i < 6; i++) {
      const itemType = getRandomElement(itemTypes);
      const color = getRandomElement(colors);
      const material = getRandomElement(materials);
      const pattern = getRandomElement(patterns);
      const style = getRandomElement(styles);
      const fit = getRandomElement(fits);
      const size = getRandomElement(sizes);
      const price = generateRandomPrice();
      const cost = generateRandomCost();
      const totalQuantity = Math.floor(Math.random() * (200 - 50) + 50);
      const dropDate = generateRandomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Next 30 days
      const selectionDate = generateRandomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()); // Last 7 days

      await prisma.clothingItem.create({
        data: {
          name: `${color} ${pattern} ${itemType}`,
          itemType,
          description: `A beautiful ${fit} fit ${itemType.toLowerCase()} made with premium ${material.toLowerCase()}. Perfect for ${style.toLowerCase()} wear with a ${pattern.toLowerCase()} pattern.`,
          frontImage,
          backImage,
          imageUrl: frontImage,
          material,
          size,
          color,
          pattern,
          style,
          fit,
          price,
          cost,
          isPublished: true,
          isFeatured: Math.random() > 0.7, // 30% chance of being featured
          isDeleted: false,
          status: 'SELECTED', // Enum value
          totalQuantity,
          dropDate,
          selectionDate,
          inStock: true,
          creator: {
            connect: {
              id: user.id
            }
          }
        }
      });
    }

    // Create items with AVAILABLE status (currently for sale)
    console.log('Creating AVAILABLE items...');
    for (let i = 0; i < 10; i++) {
      const itemType = getRandomElement(itemTypes);
      const color = getRandomElement(colors);
      const material = getRandomElement(materials);
      const pattern = getRandomElement(patterns);
      const style = getRandomElement(styles);
      const fit = getRandomElement(fits);
      const size = getRandomElement(sizes);
      const price = generateRandomPrice();
      const cost = generateRandomCost();
      const totalQuantity = Math.floor(Math.random() * (200 - 50) + 50);
      const soldQuantity = Math.floor(Math.random() * Math.min(totalQuantity * 0.7, totalQuantity)); // Max 70% sold
      const batchNumber = Math.floor(Math.random() * 5) + 1;
      const inStock = soldQuantity < totalQuantity;
      const releaseDate = generateRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()); // Last 30 days
      const selectionDate = generateRandomDate(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), releaseDate); // Before release

      await prisma.clothingItem.create({
        data: {
          name: `${color} ${pattern} ${itemType}`,
          itemType,
          description: `A beautiful ${fit} fit ${itemType.toLowerCase()} made with premium ${material.toLowerCase()}. Perfect for ${style.toLowerCase()} wear with a ${pattern.toLowerCase()} pattern.`,
          frontImage,
          backImage,
          imageUrl: frontImage,
          material,
          size,
          color,
          pattern,
          style,
          fit,
          price,
          cost,
          isPublished: true,
          isFeatured: Math.random() > 0.8, // 20% chance of being featured
          isDeleted: false,
          status: 'AVAILABLE', // Enum value
          totalQuantity,
          soldQuantity,
          batchNumber,
          releaseDate,
          selectionDate,
          inStock,
          customerRating: Math.random() > 0.3 ? generateRandomRating() : null, // 70% have ratings
          creator: {
            connect: {
              id: user.id
            }
          }
        }
      });
    }

    // Create a few SOLD_OUT items
    console.log('Creating SOLD_OUT items...');
    for (let i = 0; i < 3; i++) {
      const itemType = getRandomElement(itemTypes);
      const color = getRandomElement(colors);
      const material = getRandomElement(materials);
      const pattern = getRandomElement(patterns);
      const style = getRandomElement(styles);
      const fit = getRandomElement(fits);
      const size = getRandomElement(sizes);
      const price = generateRandomPrice();
      const cost = generateRandomCost();
      const totalQuantity = Math.floor(Math.random() * (100 - 30) + 30);
      const batchNumber = Math.floor(Math.random() * 3) + 1;
      const releaseDate = generateRandomDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)); // 10-60 days ago

      await prisma.clothingItem.create({
        data: {
          name: `${color} ${pattern} ${itemType} (Sold Out)`,
          itemType,
          description: `A beautiful ${fit} fit ${itemType.toLowerCase()} made with premium ${material.toLowerCase()}. Perfect for ${style.toLowerCase()} wear with a ${pattern.toLowerCase()} pattern. This popular item sold out quickly!`,
          frontImage,
          backImage,
          imageUrl: frontImage,
          material,
          size,
          color,
          pattern,
          style,
          fit,
          price,
          cost,
          isPublished: true,
          isFeatured: false,
          isDeleted: false,
          status: 'SOLD_OUT', // Enum value
          totalQuantity,
          soldQuantity: totalQuantity, // Completely sold out
          batchNumber,
          releaseDate,
          inStock: false,
          customerRating: generateRandomRating(), // Sold out items likely have ratings
          creator: {
            connect: {
              id: user.id
            }
          }
        }
      });
    }

    const totalItems = 8 + 6 + 10 + 3; // 27 total items
    console.log(`Successfully created ${totalItems} dummy clothing items:`);
    console.log('- 8 CONCEPT items (ideas only)');
    console.log('- 6 SELECTED items (upcoming drops)');
    console.log('- 10 AVAILABLE items (currently for sale)');
    console.log('- 3 SOLD_OUT items (popular past items)');
    
  } catch (error) {
    console.error('Error creating dummy clothing items:', error);
    if (error.code === 'P2002') {
      console.error('This might be a unique constraint violation - some items might already exist');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDummyClothingItems(); 