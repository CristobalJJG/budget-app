import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import { Op } from "sequelize";
import { sequelize } from "../db.js";
import { Transaction } from "../models/Transaction.js";
import { Category } from "../models/Category.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Configurar multer para almacenar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// ✅ GET all transactions
router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Category, attributes: ["name", "color"] }],
      order: [["date", "ASC"]],
    });
    res.json(transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ✅ POST import transactions from Excel (debe ir antes de /:id)
router.post("/import", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Leer el archivo Excel
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: "Excel file is empty" });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Función auxiliar para obtener o crear categoría
    const getOrCreateCategory = async (categoryName) => {
      if (!categoryName || categoryName.trim() === "") {
        return null;
      }

      let category = await Category.findOne({
        where: {
          name: categoryName.trim(),
          user_id: req.user.id,
        },
      });

      if (!category) {
        category = await Category.create({
          name: categoryName.trim(),
          user_id: req.user.id,
          color: "#cccccc",
        });
      }

      return category.id;
    };

    // Función auxiliar para normalizar nombres de columnas
    const normalizeColumnName = (name) => {
      if (!name) return "";
      const normalized = name.toString().toLowerCase().trim();
      // Mapeo de posibles nombres de columnas
      const columnMap = {
        fecha: "date",              //Original
        date: "date",
        nombre: "name",             //Original
        name: "name",
        concepto: "name",
        amount: "amount",
        importe: "amount",
        cantidad: "quantity",       //Original
        categoría: "category",      //Original
        categoria: "category",
        category: "category",
        descripción: "description", //Original
        descripcion: "description",
        description: "description",
        "total": "balance_after",   //Original
      };
      return columnMap[normalized] || normalized;
    };

    // Función auxiliar para convertir fecha de Excel
    const convertExcelDate = (excelDate) => {
      if (excelDate instanceof Date) {
        return excelDate.toISOString().split("T")[0];
      }
      
      if (typeof excelDate === "number") {
        // Excel almacena fechas como números (días desde 1900-01-01)
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
        return date.toISOString().split("T")[0];
      }
      
      // Si es string, intentar parsearlo
      const dateStr = excelDate.toString().trim();
      // Intentar diferentes formatos de fecha
      const dateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/) || 
                       dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/) ||
                       dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
      
      if (dateMatch) {
        if (dateMatch[0].includes("/") || dateMatch[0].includes("-")) {
          // Formato DD/MM/YYYY o DD-MM-YYYY
          const day = dateMatch[1];
          const month = dateMatch[2];
          const year = dateMatch[3];
          return `${year}-${month}-${day}`;
        }
        return dateMatch[0];
      }
      
      return dateStr;
    };

    // Procesar cada fila del Excel
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 porque la fila 1 es el encabezado y empezamos desde 0

      try {
        // Normalizar las columnas del Excel
        const normalizedRow = {};
        Object.keys(row).forEach((key) => {
          const normalizedKey = normalizeColumnName(key);
          normalizedRow[normalizedKey] = row[key];
        });

        // Extraer y validar campos requeridos
        const date = normalizedRow.date;
        const name = normalizedRow.name;
        const amount = normalizedRow.quantity;
        const categoryName = normalizedRow.category;
        const description = normalizedRow.description || null;
        const balanceAfter = normalizedRow.balance_after || null;

        // Validar campos requeridos
        if (!date || !name || amount === undefined || amount === null || !categoryName) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: "Missing required fields: date, name, amount, or category",
            data: row,
          });
          continue;
        }

        // Convertir fecha
        const transactionDate = convertExcelDate(date);

        // Convertir amount a número
        const transactionAmount = parseFloat(amount);
        if (isNaN(transactionAmount)) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: "Invalid amount format",
            data: row,
          });
          continue;
        }

        // Obtener o crear categoría
        const categoryId = await getOrCreateCategory(categoryName);
        if (!categoryId) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: "Could not create or find category",
            data: row,
          });
          continue;
        }

        // Convertir balance_after si existe
        let transactionBalanceAfter = null;
        if (balanceAfter !== null && balanceAfter !== undefined && balanceAfter !== "") {
          transactionBalanceAfter = parseFloat(balanceAfter);
          if (isNaN(transactionBalanceAfter)) {
            transactionBalanceAfter = null;
          }
        }

        // Crear la transacción
        await Transaction.create({
          date: transactionDate,
          name: name.toString().trim(),
          amount: transactionAmount,
          description: description ? description.toString().trim() : null,
          category_id: categoryId,
          balance_after: transactionBalanceAfter,
          user_id: req.user.id,
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          error: error.message,
          data: row,
        });
        console.log(`❌ Error processing row ${rowNum}:`, error);
      }
    }

    res.json({
      message: `Import completed: ${results.success} successful, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error("❌ Error importing transactions:", error);
    res.status(500).json({ error: "Failed to import transactions", details: error.message });
  }
});

// ✅ GET one transaction
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ["name"] }],
    });
    if (!transaction || transaction.user_id !== req.user.id) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  } catch (error) {
    console.error("❌ Error fetching transaction:", error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

// ✅ POST create transaction
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { date, name, amount, category_id, description, balance_after } = req.body;

    if (!date || !name || amount === undefined || !category_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const category = await Category.findByPk(category_id);
    if (!category || category.user_id !== req.user.id) {
      return res.status(400).json({ error: "Invalid category_id" });
    }

    const newTrans = await Transaction.create({
      date,
      name,
      amount,
      description,
      category_id,
      balance_after,
      user_id: req.user.id,
    });

    res.status(201).json(newTrans);
  } catch (error) {
    console.error("❌ Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// ✅ PUT update transaction
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction || transaction.user_id !== req.user.id) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const { date, name, amount, category_id, description, balance_after } = req.body;

    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category || category.user_id !== req.user.id) {
        return res.status(400).json({ error: "Invalid category_id" });
      }
    }

    // Guardar la fecha original para determinar el mes/año
    const originalDate = new Date(transaction.date);
    const newDate = date ? new Date(date) : originalDate;
    
    // Obtener mes y año de la fecha (original o nueva)
    const month = newDate.getMonth() + 1; // getMonth() devuelve 0-11
    const year = newDate.getFullYear();

    // Guardar valores actualizados para usar en el recálculo
    const updatedAmount = amount !== undefined ? parseFloat(amount) : parseFloat(transaction.amount);
    const updatedBalanceAfter = balance_after !== undefined && balance_after !== null 
      ? parseFloat(balance_after) 
      : null;

    // Actualizar la transacción
    Object.assign(transaction, { date, name, amount, category_id, description, balance_after });
    await transaction.save();

    // Obtener todas las transacciones del usuario del mismo mes y año
    const allTransactions = await Transaction.findAll({
      where: {
        user_id: req.user.id,
        [Op.and]: [
          sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), year),
          sequelize.where(sequelize.fn('MONTH', sequelize.col('date')), month)
        ]
      },
      order: [["date", "ASC"], ["id", "ASC"]],
    });

    // Encontrar el índice de la transacción actualizada
    const currentIndex = allTransactions.findIndex(t => t.id === transaction.id);

    if (currentIndex !== -1 && currentIndex < allTransactions.length - 1) {
      // Obtener el balance anterior (de la transacción previa en el mismo mes/año)
      let previousBalance = 0;
      if (currentIndex > 0) {
        // Si hay una transacción anterior, usar su balance_after
        previousBalance = parseFloat(allTransactions[currentIndex - 1].balance_after || 0);
        console.log(`📌 Balance anterior de transacción previa: ${previousBalance}`);
      } else {
        // Si es la primera transacción del mes, buscar el último balance del mes anterior
        const previousMonth = month === 1 ? 12 : month - 1;
        const previousYear = month === 1 ? year - 1 : year;
        
        const lastTransactionOfPreviousMonth = await Transaction.findOne({
          where: {
            user_id: req.user.id,
            [Op.and]: [
              sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), previousYear),
              sequelize.where(sequelize.fn('MONTH', sequelize.col('date')), previousMonth)
            ]
          },
          order: [["date", "DESC"], ["id", "DESC"]],
        });
        
        if (lastTransactionOfPreviousMonth && lastTransactionOfPreviousMonth.balance_after !== null) {
          previousBalance = parseFloat(lastTransactionOfPreviousMonth.balance_after);
          console.log(`📌 Balance del mes anterior: ${previousBalance}`);
        } else {
          console.log(`📌 No hay balance del mes anterior, usando 0`);
        }
      }

      // Determinar el balance de la transacción actualizada
      let currentBalance = updatedBalanceAfter;
      if (currentBalance === null || currentBalance === undefined) {
        // Si no se proporcionó balance_after, calcularlo
        currentBalance = previousBalance + updatedAmount;
        transaction.balance_after = parseFloat(currentBalance.toFixed(2));
        await transaction.save();
        console.log(`💰 Balance calculado para transacción ${transaction.id}: ${previousBalance} + ${updatedAmount} = ${currentBalance}`);
      } else {
        console.log(`💰 Balance proporcionado para transacción ${transaction.id}: ${currentBalance}`);
      }

      // Recalcular balances desde la siguiente transacción en adelante
      let runningBalance = currentBalance;
      let updatedCount = 0;
      
      for (let i = currentIndex + 1; i < allTransactions.length; i++) {
        const nextTrans = allTransactions[i];
        const nextAmount = parseFloat(nextTrans.amount);
        const calculatedBalance = runningBalance + nextAmount;
        const newBalance = parseFloat(calculatedBalance.toFixed(2));
        
        console.log(`  💰 Actualizando transacción ${nextTrans.id}: ${runningBalance} + ${nextAmount} = ${newBalance}`);
        
        nextTrans.balance_after = newBalance;
        await nextTrans.save();
        runningBalance = calculatedBalance;
        updatedCount++;
      }
      
      console.log(`✅ Recalculación completada. Se actualizaron ${updatedCount} transacciones posteriores`);
    } else if (currentIndex === -1) {
      console.log(`⚠️ No se encontró la transacción en el array de transacciones del mes`);
    } else {
      console.log(`ℹ️ Es la última transacción del mes, no hay transacciones posteriores para recalcular`);
    }

    // Obtener la transacción actualizada con sus relaciones
    const updatedTransaction = await Transaction.findByPk(transaction.id, {
      include: [{ model: Category, attributes: ["name", "color"] }],
    });

    res.json(updatedTransaction);
  } catch (error) {
    console.error("❌ Error updating transaction:", error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// ✅ DELETE transaction
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction || transaction.user_id !== req.user.id) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await transaction.destroy();
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting transaction:", error);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
