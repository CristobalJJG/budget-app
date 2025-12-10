import express from "express";
import { Category } from "../models/Category.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ✅ GET all categories
router.get("/", authMiddleware, async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { user_id: req.user.id },
      order: [["name", "ASC"]]
    });
    res.json(categories);
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ✅ GET one category by id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category || category.user_id !== req.user.id) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("❌ Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// ✅ POST create new category
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Category name is required" });
    }

    const existing = await Category.findOne({
      where: { name, user_id: req.user.id }
    });
    if (existing) return res.status(409).json({ error: "Category already exists" });

    const newCategory = await Category.create({ name, color: color || '#cccccc', user_id: req.user.id });
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("❌ Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// ✅ PUT update category
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, color } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category || category.user_id !== req.user.id) {
      return res.status(404).json({ error: "Category not found" });
    }
    if (!name || name.trim() === "") return res.status(400).json({ error: "Category name is required" });

    category.name = name;
    if (color && typeof color === 'string') category.color = color;
    await category.save();

    res.json(category);
  } catch (error) {
    console.error("❌ Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// ✅ DELETE category
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category || category.user_id !== req.user.id) {
      return res.status(404).json({ error: "Category not found" });
    }

    await category.destroy();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
