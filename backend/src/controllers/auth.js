import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { signinSchema, signupSchema } from "../schemas/auth.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
    try {
        const { error } = signupSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map((err) => err.message);
            return res.status(400).json({
                message: errors,
            });
        }
        // Kiểm tra xem user đã đk chưa?
        const userExist = await User.findOne({ email: req.body.email });
        if (userExist) {
            return res.status(400).json({
                message: "Email đã tồn tại",
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });

        // Tạo token
        const token = jwt.sign({ id: user._id }, "123456", { expiresIn: "1d" });
        // không trả về password
        user.password = undefined;

        return res.status(201).json({
            message: "Tạo tài khoản thành công",
            accessToken: token,
            user,
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { error } = signinSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                message: error.details.map((err) => err.message),
            });
        }
        // Kiểm tra xem user đã đk chưa?
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Email không tồn tại",
            });
        }

        // So sánh mật khẩu

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Mật khẩu không đúng",
            });
        }

        const token = jwt.sign({ id: user._id }, "123456", { expiresIn: "1d" });

        user.password = undefined;

        return res.status(200).json({
            message: "Đăng nhập thành công",
            accessToken: token,
            user,
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
};
