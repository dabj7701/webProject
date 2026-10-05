require('dotenv').config();

const express = require('express');
const mariadb = require('mariadb'); 

const app = express();
app.use(express.json()); 

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
}); 

app.get('/api/skins', async (req, res) => {
    let conn; 
    try {
        conn = await pool.getConnection(); 

        const rows = await conn.query(`
            SELECT 
                skins.id,
                skins.name AS skin_name,
                categories.name AS category_name,
                conditions.name AS condition_name,
                skins.price
            FROM skins 
            JOIN categories ON skins.category_id = categories.id
            JOIN conditions ON skins.condition_id = conditions.id
            `);
            res.json(rows);
    } catch (err) {
        console.log('Databasfel: ', err);
    } finally {
        if(conn) conn.release(); 
    }
});

app.post('/api/skins', async (req, res) => {
    let conn; 
    try{
        const { user_id, category_id, condition_id, name, price } = req.body;
        if(!user_id || !category_id || !condition_id || !name || !price){
            return res.status(400).json({ error: 'All fields must be filled in' });
        }
        conn = await pool.getConnection();
        const result = await conn.query(
            'INSERT INTO skins (user_id, category_id, condition_id, name, price) VALUES (?, ?, ?, ?, ?)',
            [user_id, category_id, condition_id, name, price]
        );
        res.status(201).json({ message: 'Skin added successfully', skinId: result.insertId });
    }catch(err){
        console.log('Database error: ', err); 
    }finally{
        if(conn) conn.release();
    }
})

app.delete('/api/skins/:id', async (req,res) => {
    let conn; 
    try{
        const skinId = req.params.id; 
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM skins WHERE id = ?', [skinId])
        if(result.affectedRows === 0){
            return res.status(404).json({ error: 'Skin not found'}); 
        }
    }catch(err){
        console.log('Database error: ', err);
    }finally{
        if(conn) conn.release(); 
    }
})

app.put('/api/skins/:id', async (req, res) => {
    let conn;
    try{
        const skinId = req.params.id; 
        const { user_id, category_id, condition_id, name, price } = req.body;
        if(!user_id || !category_id || !condition_id || !name || !price){
            return res.status(400).json({ error: 'All fields must be filled to update'});
        }

        conn = await pool.getConnection(); 
        const result = await conn.query(
            'UPDATE skins SET user_id = ?, category_id = ?, condition_id = ?, name = ?, price = ? WHERE id = ?',
            [user_id, category_id, condition_id, name, price, skinId]
        ); 

        if(result.affectedRows === 0){
            return res.status(404).json({ error: 'Skin not found'}); 
        }
        res.json({ message: 'Skin updated successfully' });
    }catch(err){
        console.log('Database error: ', err);
    }finally{
        if(conn) conn.release();
    }
})

app.get('/api/categories', async (req, res) => {
    let conn;
    try{
        conn = await pool.getConnection();
        const rows = await conn.query(`SELECT * FROM categories`);
        res.json(rows);
    }catch(err){
        console.log('Databasfel:', err);
    }finally{
        if(conn) conn.release();
    }
});

app.get('/api/conditions', async (req, res) => {
    let conn; 
    try{
        conn = await pool.getConnection(); 
        const rows = await conn.query(`SELECT * FROM conditions`);
        res.json(rows); 
    }catch(err){
        console.log('Databasfel: ', err);
    }finally{
        if(conn) conn.release();
    }
})

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`The server is listening to port ${PORT}`);
    console.log(`http://localhost:${PORT}/api/skins`)
})