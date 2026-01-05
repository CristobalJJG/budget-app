import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Secret para los tokens (idealmente usa variable de entorno)
const JWT_SECRET = "super_secret_key_change_this";

// ✅ Registro
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, theme = "light" } = req.body;

        if (!username || !email || !password)
            return res.status(400).json({ error: "Username, email and password are required" });

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) return res.status(409).json({ error: "Username already exists" });

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) return res.status(409).json({ error: "Email already exists" });

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashed, theme });

        res.status(201).json({
            message: "User created successfully",
            user: { id: user.id, username: user.username, email: user.email, theme: user.theme },
        });
    } catch (error) {
        console.error("❌ Error registering user:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// ✅ Login
router.post("/login", async (req, res) => {
    try {
        // Soporta login por email o por username automáticamente
        const { email, username, password } = req.body;

        if ((!email && !username) || !password)
            return res.status(400).json({ error: "Email/username and password are required" });

        // Determinar criterio de búsqueda: si se proporcionó email con '@' usar email, si no usar username
        const searchValue = email || username;
        const whereClause = (searchValue && searchValue.includes && searchValue.includes('@'))
            ? { email: searchValue }
            : { username: searchValue };

        // Intentar encontrar el usuario
        const user = await User.findOne({ where: whereClause });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, theme: user.theme || "light" },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, username: user.username, email: user.email, theme: user.theme || "light" },
        });
    } catch (error) {
        console.error("❌ Error logging in:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});

// ✅ Actualizar tema
router.put("/theme", authMiddleware, async (req, res) => {
    try {
        const { theme } = req.body;

        const allowedThemes = [
            // Claros
            "light","cupcake","bumblebee","emerald","corporate","retro","cyberpunk","valentine","garden","lofi","pastel",
            "fantasy","wireframe","cmyk","autumn","acid","lemonade","winter","nord","caramellatte","silk",
            // Oscuros
            "dark","synthwave","forest","halloween","aqua","black","luxury","dracula","business","night","coffee","dim","sunset","abyss"
        ];
        if (!theme || !allowedThemes.includes(theme)) {
            return res.status(400).json({ error: "Invalid theme" });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.theme = theme;
        await user.save();

        // Emitir nuevo token con el tema actualizado
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, theme: user.theme },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            message: "Theme updated successfully",
            token,
            user: { id: user.id, username: user.username, email: user.email, theme: user.theme },
        });
    } catch (error) {
        console.error("❌ Error updating theme:", error);
        res.status(500).json({ error: "Failed to update theme" });
    }
});

export default router;
