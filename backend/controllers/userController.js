import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import validator from "validator"
import restaurantModel from "../models/restaurantModel.js"

// login user
const loginUser = async (req,res) => {
    const {email,password} = req.body;
    try {
        const user = await userModel.findOne({email})

        if (!user){
            return res.json({success:false,message:"User doesn't exist."})
        }

        if (user.active === false) {
            return res.json({success:false,message:"Account is inactive"})
        }

        const isMatch = await bcrypt.compare(password,user.password);

        if (!isMatch) {
            return res.json({success:false,message:"Invalid credentials"})
        }

        const token = createToken(user);
        res.json({
          success: true,
          token,
          role: user.role,
          restaurantIds: user.restaurantIds || [],
          name: user.name || "",
          message: "Login success",
        })
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const createToken = (user) => {
    return jwt.sign(
      {
        id: user._id,
        role: user.role || "user",
        restaurantIds: user.restaurantIds || [],
      },
      process.env.JWT_SECRET
    );
}

// register user
const registerUser = async (req,res) => {
    const {name,password,email} = req.body;
    try {
        //checking if user already exists
        const exists = await userModel.findOne({email});
        if (exists){
            return res.json({success:false,message:"User already exists."})
        }

        // validating email format & strong password
        if (!validator.isEmail(email)){
            return res.json({success:false,message:"Please enter a valid email."})
        }


        if (password.length<8){
            return res.json({success:false,message:"Please enter a strong password."})
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = new userModel({
            name:name,
            email:email,
            password:hashedPassword
        })

        const user = await newUser.save()
        const token = createToken(user)
        res.json({
          success: true,
          token,
          role: user.role,
          restaurantIds: user.restaurantIds || [],
          name: user.name || "",
        });
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export {loginUser,registerUser}

// ---- Admin user management (simple) ----
export const listUsers = async (req, res) => {
  try {
    const { q, active, role } = req.query;
    const filter = {};
    if (typeof active !== "undefined") filter.active = active === "true";
    if (role) filter.role = role;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }
    const users = await userModel
      .find(filter, { password: 0 })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId, role, active } = req.body;
    const update = {};
    const willChangeActive = typeof active === "boolean";
    if (role) update.role = role;
    if (willChangeActive) update.active = active;

    const user = await userModel.findByIdAndUpdate(userId, update, { new: true });

    // Cascade toggle restaurants if owner
    if (user && user.role === "restaurantOwner" && willChangeActive) {
      const ids = user.restaurantIds || [];
      if (ids.length) {
        await restaurantModel.updateMany({ _id: { $in: ids } }, { active });
      }
    }

    res.json({ success: true, message: "Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export const removeUser = async (req, res) => {
  try {
    const { userId } = req.body;
    await userModel.findByIdAndDelete(userId);
    res.json({ success: true, message: "Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};
