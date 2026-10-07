require('dotenv').config();

const express = require('express');
const mariadb = require('mariadb'); 
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json()); 
app.use(express.static('public'));

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
            WHERE skins.user_id = ? 
            `, [req.session.userId]);
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

app.post('/api/register', async (req, res) => {
    const {username, password, role} = req.body;
    let conn; 

    try{
        conn = await pool.getConnection();
        const existingUsers = await conn.query('SELECT id FROM users WHERE = ?', [username]);
        if(existingUsers.length > 0){
            return res.status(400).json({error: 'Username is already taken'})
        }

        const hashedPassword = await bcrypt.hash(password, 10); 
        await conn.query('INSERT INTO users (username, password, role)', [username, hashedPassword, role || 'User']); 

        res.status(201).json({message: 'User has been created'})
    }catch(err){
        console.log('Database error', err);
    }finally{
        if(conn) conn.release(); 
    }
})

app.post('/api/login', async (req, res) => {
    const {username, password} = req.body; 
    let conn; 
    try{
        conn = await pool.getConnection();
        const users = await conn.query('SELECT * FROM users WHERE username = ?', [username]); 

        if(users.length > 0){
            const user = user[0]; 
            const match = await bcrypt.compare(password, user.password); 

            if(match){
                req.session.userId = user.id; 
                req.session.username = user.username; 
                res.json({ message: 'Logged in successfully! ', username: user.username})
            } else {
                res.status(401).json({error: 'Wrong password'});
            }
        } else {
            res.status(401).json({error: 'Wrong username'}); 
        }
    } catch (err){
        console.log('Database error: ', err);
        res.status(500).json({error: 'Server error'})
    } finally{
        if(conn) conn.release(); 
    }
})

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`The server is listening to port ${PORT}`);
    console.log(`http://localhost:${PORT}/api/skins`)
})