import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import cityModel from "../models/cityModel.js";
import restaurantModel from "../models/restaurantModel.js";
import foodModel from "../models/foodModel.js";
import promotionModel from "../models/promotionModel.js";
import userModel from "../models/userModel.js";

dotenv.config();

const uri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/software_hangry";

const run = async () => {
  await mongoose.connect(uri);

  // Cities
  const hcm = await cityModel.findOneAndUpdate(
    { code: "HCM" },
    {
      name: "TP. Hồ Chí Minh",
      nameEn: "Ho Chi Minh City",
      code: "HCM",
      active: true,
    },
    { upsert: true, new: true }
  );
  const hanoi = await cityModel.findOneAndUpdate(
    { code: "HN" },
    { name: "Hà Nội", nameEn: "Hanoi", code: "HN", active: true },
    { upsert: true, new: true }
  );

  // Restaurants
  const rest1 = await restaurantModel.findOneAndUpdate(
    { slug: "pho-ngon-hcm" },
    {
      name: "Phở Ngon HCM",
      slug: "pho-ngon-hcm",
      cityId: hcm._id,
      address: "1 Lê Lợi, Q1",
      deliveryModes: ["driver", "drone"],
      minOrder: 50000,
      active: true,
    },
    { upsert: true, new: true }
  );

  const rest2 = await restaurantModel.findOneAndUpdate(
    { slug: "com-tam-sg" },
    {
      name: "Cơm Tấm Sài Gòn",
      slug: "com-tam-sg",
      cityId: hcm._id,
      address: "45 Nguyễn Trãi, Q5",
      deliveryModes: ["driver"],
      minOrder: 40000,
      active: true,
    },
    { upsert: true, new: true }
  );

  const rest3 = await restaurantModel.findOneAndUpdate(
    { slug: "banh-mi-hn" },
    {
      name: "Bánh Mì HN",
      slug: "banh-mi-hn",
      cityId: hanoi._id,
      address: "10 Tràng Tiền, Hoàn Kiếm",
      deliveryModes: ["driver"],
      minOrder: 30000,
      active: true,
    },
    { upsert: true, new: true }
  );

  const rest4 = await restaurantModel.findOneAndUpdate(
    { slug: "am-thuc-hn" },
    {
      name: "Ẩm Thực Hà Nội",
      slug: "am-thuc-hn",
      cityId: hanoi._id,
      address: "25 Phan Chu Trinh, Hoàn Kiếm",
      deliveryModes: ["driver", "drone"],
      minOrder: 50000,
      active: true,
    },
    { upsert: true, new: true }
  );

  // Foods (VI/EN)
  const foods = [
    // HCM - Phở Ngon
    {
      name: "Salad Tôm",
      nameEn: "Shrimp Salad",
      description: "Shrimp salad, refreshing",
      descriptionVi: "Salad tôm thanh mát",
      price: 55000,
      category: "Salad",
      restaurantId: rest1._id,
      cityId: hcm._id,
      image: "1727126978673food_1.png",
    },
    {
      name: "Gỏi Cuốn",
      nameEn: "Fresh Spring Rolls",
      description: "Fresh spring rolls",
      descriptionVi: "Gỏi cuốn tôm thịt",
      price: 35000,
      category: "Rolls",
      restaurantId: rest1._id,
      cityId: hcm._id,
      image: "1727127544604food_3.png",
    },
    {
      name: "Bánh Flan",
      nameEn: "Cream Caramel",
      description: "Cream caramel",
      descriptionVi: "Bánh flan mềm mịn",
      price: 30000,
      category: "Deserts",
      restaurantId: rest1._id,
      cityId: hcm._id,
      image: "1727127773554food_11.png",
    },
    {
      name: "Bánh Mì Chảo",
      nameEn: "Vietnamese Pan Bread",
      description: "Vietnamese pan bread",
      descriptionVi: "Bánh mì chảo kiểu Việt",
      price: 45000,
      category: "Sandwich",
      restaurantId: rest1._id,
      cityId: hcm._id,
      image: "1727127695985food_8.png",
    },
    {
      name: "Mì Ý Bò",
      nameEn: "Beef Pasta",
      description: "Beef pasta",
      descriptionVi: "Mì Ý bò bằm",
      price: 75000,
      category: "Pasta",
      restaurantId: rest1._id,
      cityId: hcm._id,
      image: "1727128540374food_26.png",
    },
    {
      name: "Phở Bò",
      nameEn: "Pho Beef",
      description: "Pho with beef",
      descriptionVi: "Phở bò truyền thống",
      price: 60000,
      category: "Noodles",
      restaurantId: rest1._id,
      cityId: hcm._id,
      image: "1727128122765food_19.png",
    },

    // HCM - Cơm Tấm SG
    {
      name: "Cơm Tấm Sườn",
      nameEn: "Broken Rice with Pork",
      description: "Broken rice with grilled pork",
      descriptionVi: "Cơm tấm sườn bì chả",
      price: 70000,
      category: "Pure Veg",
      restaurantId: rest2._id,
      cityId: hcm._id,
      image: "1727128584690food_25.png",
    },
    {
      name: "Cơm Gà Xối Mỡ",
      nameEn: "Fried Chicken Rice",
      description: "Fried chicken rice",
      descriptionVi: "Cơm gà xối mỡ",
      price: 65000,
      category: "Salad",
      restaurantId: rest2._id,
      cityId: hcm._id,
      image: "1727127730519food_9.png",
    },
    {
      name: "Bánh Mì Thịt",
      nameEn: "Vietnamese Baguette",
      description: "Baguette with cold cuts",
      descriptionVi: "Bánh mì thịt nguội",
      price: 35000,
      category: "Sandwich",
      restaurantId: rest2._id,
      cityId: hcm._id,
      image: "1727127750882food_10.png",
    },
    {
      name: "Bánh Bông Lan",
      nameEn: "Sponge Cake",
      description: "Sponge cake",
      descriptionVi: "Bánh bông lan mềm",
      price: 40000,
      category: "Cake",
      restaurantId: rest2._id,
      cityId: hcm._id,
      image: "1727128017975food_15.png",
    },
    {
      name: "Miến Trộn",
      nameEn: "Glass Noodle Salad",
      description: "Glass noodle salad",
      descriptionVi: "Miến trộn kiểu Việt",
      price: 55000,
      category: "Noodles",
      restaurantId: rest2._id,
      cityId: hcm._id,
      image: "1727128312994food_21.png",
    },
    {
      name: "Pasta Hải Sản",
      nameEn: "Seafood Pasta",
      description: "Seafood pasta",
      descriptionVi: "Mì Ý hải sản",
      price: 80000,
      category: "Pasta",
      restaurantId: rest2._id,
      cityId: hcm._id,
      image: "1727128445234food_24.png",
    },

    // Hà Nội - Bánh Mì HN
    {
      name: "Bánh Mì Truyền Thống",
      nameEn: "Classic Baguette",
      description: "Classic baguette",
      descriptionVi: "Bánh mì thịt truyền thống",
      price: 30000,
      category: "Sandwich",
      restaurantId: rest3._id,
      cityId: hanoi._id,
      image: "1727127794307food_12.png",
    },
    {
      name: "Bánh Mì Gà Nướng",
      nameEn: "Grilled Chicken Baguette",
      description: "Grilled chicken baguette",
      descriptionVi: "Bánh mì gà nướng",
      price: 32000,
      category: "Sandwich",
      restaurantId: rest3._id,
      cityId: hanoi._id,
      image: "1727127837323food_13.png",
    },
    {
      name: "Nem Rán",
      nameEn: "Fried Spring Rolls",
      description: "Fried spring rolls",
      descriptionVi: "Nem rán Hà Nội",
      price: 40000,
      category: "Rolls",
      restaurantId: rest3._id,
      cityId: hanoi._id,
      image: "1727127988392food_14.png",
    },
    {
      name: "Salad Gà",
      nameEn: "Chicken Salad",
      description: "Chicken salad",
      descriptionVi: "Salad gà tươi",
      price: 45000,
      category: "Salad",
      restaurantId: rest3._id,
      cityId: hanoi._id,
      image: "1727127590415food_4.png",
    },
    {
      name: "Bánh Ngọt Mix",
      nameEn: "Mixed Desserts",
      description: "Mixed desserts",
      descriptionVi: "Set bánh ngọt mix",
      price: 38000,
      category: "Cake",
      restaurantId: rest3._id,
      cityId: hanoi._id,
      image: "1727128078923food_17.png",
    },
    {
      name: "Bún Chả",
      nameEn: "Bun Cha",
      description: "Grilled pork with vermicelli",
      descriptionVi: "Bún chả Hà Nội",
      price: 65000,
      category: "Noodles",
      restaurantId: rest3._id,
      cityId: hanoi._id,
      image: "1727128045565food_16.png",
    },

    // Hà Nội - Ẩm Thực Hà Nội
    {
      name: "Bún Chả Đặc Sản",
      nameEn: "Hanoi Bun Cha",
      description: "Signature bun cha",
      descriptionVi: "Bún chả đặc sản",
      price: 65000,
      category: "Noodles",
      restaurantId: rest4._id,
      cityId: hanoi._id,
      image: "1727128102874food_18.png",
    },
    {
      name: "Chả Cá Lã Vọng",
      nameEn: "Cha Ca La Vong",
      description: "Hanoi turmeric fish",
      descriptionVi: "Chả cá Lã Vọng",
      price: 70000,
      category: "Pure Veg",
      restaurantId: rest4._id,
      cityId: hanoi._id,
      image: "1727128392133food_23.png",
    },
    {
      name: "Phở Cuốn",
      nameEn: "Pho Rolls",
      description: "Pho rolls",
      descriptionVi: "Phở cuốn Hà Nội",
      price: 50000,
      category: "Rolls",
      restaurantId: rest4._id,
      cityId: hanoi._id,
      image: "1727128219303food_20.png",
    },
    {
      name: "Miến Lươn",
      nameEn: "Eel Glass Noodles",
      description: "Glass noodles with eel",
      descriptionVi: "Miến lươn Nghệ",
      price: 60000,
      category: "Noodles",
      restaurantId: rest4._id,
      cityId: hanoi._id,
      image: "1727128347200food_22.png",
    },
    {
      name: "Bánh Trôi Tàu",
      nameEn: "Sweet Rice Balls",
      description: "Sweet glutinous rice balls",
      descriptionVi: "Bánh trôi tàu ngọt",
      price: 40000,
      category: "Deserts",
      restaurantId: rest4._id,
      cityId: hanoi._id,
      image: "1727127642374food_6.png",
    },
    {
      name: "Pasta Chay",
      nameEn: "Veggie Pasta",
      description: "Vegetarian pasta",
      descriptionVi: "Mì Ý chay rau củ",
      price: 65000,
      category: "Pasta",
      restaurantId: rest4._id,
      cityId: hanoi._id,
      image: "1727128584690food_25.png",
    },
  ];

  for (const f of foods) {
    await foodModel.findOneAndUpdate(
      { name: f.name, restaurantId: f.restaurantId },
      {
        ...f,
        image: f.image || "https://via.placeholder.com/400x300?text=Food",
      },
      { upsert: true, new: true }
    );
  }

  // Owners per restaurant
  const ownerSeeds = [
    {
      email: "owner.pho@example.com",
      password: "Pho@123",
      name: "Chủ Phở Ngon",
      restaurantIds: [rest1._id],
    },
    {
      email: "owner.comtam@example.com",
      password: "ComTam@123",
      name: "Chủ Cơm Tấm",
      restaurantIds: [rest2._id],
    },
    {
      email: "owner.banhmi@example.com",
      password: "BanhMi@123",
      name: "Chủ Bánh Mì",
      restaurantIds: [rest3._id],
    },
    {
      email: "owner.amthuc@example.com",
      password: "AmThuc@123",
      name: "Chủ Ẩm Thực",
      restaurantIds: [rest4._id],
    },
  ];

  for (const owner of ownerSeeds) {
    const hashed = await bcrypt.hash(owner.password, 10);
    await userModel.findOneAndUpdate(
      { email: owner.email },
      {
        name: owner.name,
        email: owner.email,
        password: hashed,
        role: "restaurantOwner",
        restaurantIds: owner.restaurantIds,
        active: true,
      },
      { upsert: true, new: true }
    );
  }

  // Admin account
  const adminEmail = "admin@example.com";
  const adminPassword = "Admin@123";
  const adminHash = await bcrypt.hash(adminPassword, 10);
  await userModel.findOneAndUpdate(
    { email: adminEmail },
    {
      name: "Super Admin",
      email: adminEmail,
      password: adminHash,
      role: "admin",
      active: true,
    },
    { upsert: true, new: true }
  );

  await promotionModel.findOneAndUpdate(
    { code: "WELCOME10" },
    {
      code: "WELCOME10",
      type: "percent",
      value: 10,
      maxDiscount: 30000,
      minOrder: 80000,
      active: true,
      cityId: hcm._id,
      restaurantId: rest1._id,
    },
    { upsert: true, new: true }
  );

  console.log("Seed done (VI/EN, 2 cities x 2 restaurants x 6 món mỗi quán).");
  console.log("Owners:");
  ownerSeeds.forEach((o) => console.log(`- ${o.email} / ${o.password}`));
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
