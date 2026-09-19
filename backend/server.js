const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase connection
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// ===============================
// Test server
// ===============================

app.get("/", (req, res) => {
    res.send("SaveSense Backend is running!");
});


// ===============================
// Test Supabase connection
// ===============================

app.get("/api/db-test", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("transactions")
            .select("id")
            .limit(1);

        if (error) {
            throw error;
        }

        res.json({
            message: "Supabase connected successfully!",
            data
        });

    } catch (error) {
        console.error("Supabase error:", error.message);

        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});


// ===============================
// Get all transactions
// ===============================

app.get("/api/transactions", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .order("transaction_date", { ascending: false })
            .order("id", { ascending: false });

        if (error) {
            throw error;
        }

        res.json(data);

    } catch (error) {
        console.error("Fetch transactions error:", error.message);

        res.status(500).json({
            message: "Could not fetch transactions",
            error: error.message
        });
    }
});


// ===============================
// Add a transaction
// ===============================

app.post("/api/transactions", async (req, res) => {
    try {
        const {
            title,
            amount,
            type,
            category,
            transaction_date,
            notes
        } = req.body;

        // Validation
        if (
            !title ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            !["income", "expense"].includes(type) ||
            !category ||
            !transaction_date
        ) {
            return res.status(400).json({
                message: "Please provide valid transaction details"
            });
        }

        const { data, error } = await supabase
            .from("transactions")
            .insert([
                {
                    title,
                    amount: Number(amount),
                    type,
                    category,
                    transaction_date,
                    notes: notes || null
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            message: "Transaction added successfully",
            transaction: data
        });

    } catch (error) {
        console.error("Add transaction error:", error.message);

        res.status(500).json({
            message: "Could not add transaction",
            error: error.message
        });
    }
});


// ===============================
// Update a transaction
// ===============================

app.put("/api/transactions/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            amount,
            type,
            category,
            transaction_date,
            notes
        } = req.body;

        // Validation
        if (
            !title ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            !["income", "expense"].includes(type) ||
            !category ||
            !transaction_date
        ) {
            return res.status(400).json({
                message: "Please provide valid transaction details"
            });
        }

        const { data, error } = await supabase
            .from("transactions")
            .update({
                title,
                amount: Number(amount),
                type,
                category,
                transaction_date,
                notes: notes || null
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        res.json({
            message: "Transaction updated successfully",
            transaction: data
        });

    } catch (error) {
        console.error("Update transaction error:", error.message);

        res.status(500).json({
            message: "Could not update transaction",
            error: error.message
        });
    }
});


// ===============================
// Delete a transaction
// ===============================

app.delete("/api/transactions/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", id)
            .select();

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        res.json({
            message: "Transaction deleted successfully"
        });

    } catch (error) {
        console.error("Delete transaction error:", error.message);

        res.status(500).json({
            message: "Could not delete transaction",
            error: error.message
        });
    }
});


// ===============================
// Get dashboard totals
// ===============================

app.get("/api/dashboard", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("transactions")
            .select("amount, type");

        if (error) {
            throw error;
        }

        let totalIncome = 0;
        let totalExpenses = 0;

        data.forEach((transaction) => {
            const amount = Number(transaction.amount);

            if (transaction.type === "income") {
                totalIncome += amount;
            }

            if (transaction.type === "expense") {
                totalExpenses += amount;
            }
        });

        res.json({
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses
        });

    } catch (error) {
        console.error("Dashboard error:", error.message);

        res.status(500).json({
            message: "Could not fetch dashboard data",
            error: error.message
        });
    }
});


// ===============================
// Start server
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`SaveSense server running at http://localhost:${PORT}`);
});