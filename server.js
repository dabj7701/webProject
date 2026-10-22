require("dotenv").config();

const express = require("express");
const session = require("express-session");
const mariadb = require("mariadb");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(
  session({
    secret: "superhemlig_nyckel_här",
    resave: false,
    saveUninitialized: false,
  }),
);

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

app.get("/api/users", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  if (req.session.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Forbidden: You do not have admin rights" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const users = await conn.query("SELECT id, username, role FROM users");
    res.status(200).json(users);
  } catch (error) {
    console.log("Database error: ", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.delete("/api/users/:id", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  if (req.session.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Forbidden: You do not have admin rights" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const userIdToDelete = req.params.id;

    if (Number(userIdToDelete) === Number(req.session.userId)) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own admin account" });
    }
    const result = await conn.query("DELETE FROM users WHERE id = ?", [
      userIdToDelete,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res
      .status(200)
      .json({ message: "User and all their items deleted successfully!" });
  } catch (error) {
    console.log("Database error: ", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.get("/api/users/:id/skins", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  if (req.session.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Forbidden: You do not have admin rights" });
  }

  const targetUserId = req.params.id;
  let conn;

  try {
    conn = await pool.getConnection();
    const sqlQuery = `
            SELECT 
                skins.id,
                skins.name AS skin_name,
                skins.category_id,
                skins.condition_id,
                categories.name AS category_name,
                conditions.name AS condition_name,
                skins.price,
                skins.image_url
            FROM skins 
            JOIN categories ON skins.category_id = categories.id
            JOIN conditions ON skins.condition_id = conditions.id
            WHERE skins.user_id = ? 
            `;
    const userSkins = await conn.query(sqlQuery, [targetUserId]);
    res.status(200).json(userSkins);
  } catch (error) {
    console.log("Database error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.get("/api/skins", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const rows = await conn.query(
      `
            SELECT 
                skins.id,
                skins.name AS skin_name,
                skins.category_id,
                skins.condition_id,
                categories.name AS category_name,
                conditions.name AS condition_name,
                skins.price,
                skins.image_url
            FROM skins 
            JOIN categories ON skins.category_id = categories.id
            JOIN conditions ON skins.condition_id = conditions.id
            WHERE skins.user_id = ? 
            `,
      [req.session.userId],
    );
    res.json(rows);
  } catch (err) {
    console.log("Databasfel: ", err);
  } finally {
    if (conn) conn.release();
  }
});

app.post("/api/skins", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in!" });
  }
  let conn;
  try {
    const user_id = req.session.userId;
    const { category_id, condition_id, name, price, image_url } = req.body;
    if (!category_id || !condition_id || !name || !price) {
      return res.status(400).json({ error: "All fields must be filled in" });
    }
    conn = await pool.getConnection();
    const result = await conn.query(
      "INSERT INTO skins (user_id, category_id, condition_id, name, price, image_url) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, category_id, condition_id, name, price, image_url || null],
    );
    res
      .status(201)
      .json({
        message: "Skin added successfully",
        skinId: result.insertId.toString(),
      });
  } catch (err) {
    console.log("Database error: ", err);
    res.status(500).json({ error: "Error while trying to add skin" });
  } finally {
    if (conn) conn.release();
  }
});

app.delete("/api/skins/:id", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in!" });
  }

  let conn;
  try {
    const skinId = req.params.id;
    const userId = req.session.userId;
    const role = req.session.role;
    conn = await pool.getConnection();
    let result;
    if (role === "admin") {
      result = await conn.query("DELETE FROM skins WHERE id = ?", [skinId]);
    } else {
      result = await conn.query(
        "DELETE FROM skins WHERE id = ? AND user_id = ?",
        [skinId, userId],
      );
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Skin not found" });
    }
    res.json({ message: "Skin deleted successfully" });
  } catch (err) {
    console.log("Database error: ", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
});

app.put("/api/skins/:id", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Not logged in!" });
  }

  let conn;
  try {
    const skinId = req.params.id;
    const sessionUserId = req.session.userId;
    const role = req.session.role;
    const { category_id, condition_id, name, price, image_url } = req.body;

    if (!name || !price || !category_id || !condition_id) {
      return res
        .status(400)
        .json({ error: "All fields must be filled to update" });
    }

    conn = await pool.getConnection();
    let result;
    if (role === "admin") {
      result = await conn.query(
        "UPDATE skins SET category_id = ?, condition_id = ?, name = ?, price = ?, image_url = ? WHERE id = ?",
        [category_id, condition_id, name, price, image_url || null, skinId],
      );
    } else {
      result = await conn.query(
        "UPDATE skins SET category_id = ?, condition_id = ?, name = ?, price = ?, image_url = ? WHERE id = ? AND user_id = ?",
        [
          category_id,
          condition_id,
          name,
          price,
          image_url || null,
          skinId,
          sessionUserId,
        ],
      );
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Skin not found" });
    }
    res.json({ message: "Skin updated successfully" });
  } catch (err) {
    console.log("Database error: ", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
});

app.get("/api/categories", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT * FROM categories`);
    res.json(rows);
  } catch (err) {
    console.log("Databasfel:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/api/categories", async (req, res) => {
  if (!req.session || !req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  if (req.session.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });

  const { name } = req.body;
  if (!name)
    return res.status(400).json({ error: "Category name is required" });

  let conn;
  try {
    conn = await pool.getConnection();
    const existingCategory = await conn.query(
      "SELECT id FROM categories WHERE name = ?",
      [name],
    );
    if (existingCategory.length > 0) {
      return res
        .status(400)
        .json({ error: "A category with that name already exists!" });
    }
    const result = await conn.query(
      "INSERT INTO categories (name) VALUES (?)",
      [name],
    );
    res
      .status(201)
      .json({ message: "Category added", id: result.insertId.toString() });
  } catch (err) {
    console.log("Database error: ", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  if (!req.session || !req.session.userId)
    return res.status(401).json({ error: "Not logged in" });
  if (req.session.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });

  let conn;
  try {
    conn = await pool.getConnection();
    const categoryIdToDelete = req.params.id;

    const categoryRows = await conn.query(
      "SELECT id FROM categories WHERE name = ?",
      ["Uncategorized"],
    );
    const fallbackId = categoryRows[0].id;

    if (Number(categoryIdToDelete) === Number(fallbackId)) {
      return res
        .status(400)
        .json({ error: "You cannot delete the default fallback category!" });
    }
    await conn.query("UPDATE skins SET category_id = ? WHERE category_id = ?", [
      fallbackId,
      categoryIdToDelete,
    ]);
    const result = await conn.query("DELETE FROM categories WHERE id = ?", [
      categoryIdToDelete,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json({
      message: "Category deleted and items safely moved to Uncategorized!",
    });
  } catch (err) {
    console.log("Database error: ", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
});

app.get("/api/conditions", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT * FROM conditions`);
    res.json(rows);
  } catch (err) {
    console.log("Database error: ", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/api/register", async (req, res) => {
  const { username, password, role } = req.body;
  let conn;

  try {
    conn = await pool.getConnection();
    const existingUsers = await conn.query(
      "SELECT id FROM users WHERE username = ?",
      [username],
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await conn.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, role || "User"],
    );

    res.status(201).json({ message: "User has been created" });
  } catch (err) {
    console.log("Database error", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const users = await conn.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (users.length > 0) {
      const user = users[0];
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        res.json({
          message: "Logged in successfully! ",
          username: user.username,
          role: user.role,
        });
      } else {
        res.status(401).json({ error: "Wrong password" });
      }
    } else {
      res.status(401).json({ error: "Wrong username" });
    }
  } catch (err) {
    console.log("Database error: ", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Could not log out! Please try again" });
    } else {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out succsesfully!" });
    }
  });
});

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`The server is listening to port ${PORT}`);
  console.log(`http://localhost:${PORT}/`);
});
